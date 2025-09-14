import bodyParser from 'body-parser';
import { Router } from 'express';
import { Chalk } from 'chalk';

// Import types
import { PluginInfo, Plugin, WorldBook } from './types';
import { ProcessedChunk } from './types';
import { PluginConfig } from './types/config';
import { VectorPoint } from './types/vectorDb';

// Import services
import EmbeddingService from './services/embeddingService';
import RerankService from './services/rerankService';
import VectorDbService from './services/vectorDbService';

// Import utils
import { processWorldBook } from './utils/chunking';
import { loadConfig, saveConfig } from './utils/configManager';
import { chunkText } from './utils/chunking'; // Import chunkText for custom chunking

const chalk = new Chalk();
const MODULE_NAME = '[SillyTavern-WorldInfo-Vectorizer-Backend]';

let currentConfig: PluginConfig;

/**
 * Initialize the plugin.
 * @param router Express Router
 */
export async function init(router: Router): Promise<void> {
    const jsonParser = bodyParser.json({ limit: '10mb' }); // Increase limit for large world books

    // Load configuration
    try {
        currentConfig = await loadConfig();
        console.log(chalk.green(MODULE_NAME), 'Configuration loaded.');
    } catch (error) {
        console.error(chalk.red(MODULE_NAME), 'Failed to load configuration:', error);
        // If config fails to load, the plugin might not function correctly.
        // Depending on requirements, you might want to halt initialization or use defaults.
        // For now, we'll proceed with defaults loaded inside loadConfig.
    }

    // Used to check if the server plugin is running
    router.post('/probe', (_req, res) => {
        return res.sendStatus(204);
    });

    // Endpoint to get the current configuration
    router.get('/config', (_req, res) => {
        try {
            return res.json(currentConfig);
        } catch (error: any) {
            console.error(chalk.red(MODULE_NAME), 'Error getting config:', error);
            return res.status(500).json({ error: `Internal server error: ${error.message}` });
        }
    });

    // Endpoint to update the configuration
    router.post('/config', jsonParser, async (req, res) => {
        try {
            const newConfig: PluginConfig = req.body;

            // Basic validation could be added here
            // For now, we'll assume the frontend sends a valid config structure

            await saveConfig(newConfig);
            currentConfig = newConfig; // Update in-memory config
            console.log(chalk.green(MODULE_NAME), 'Configuration updated successfully.');
            return res.json({ message: 'Configuration updated successfully.' });
        } catch (error: any) {
            console.error(chalk.red(MODULE_NAME), 'Error updating config:', error);
            return res.status(500).json({ error: `Internal server error: ${error.message}` });
        }
    });

    // Endpoint to receive and process a world book, then store in vector DB
    router.post('/vectorize-and-store', jsonParser, async (req, res) => {
        try {
            // 1. Validate input
            const worldBook: WorldBook = req.body;
            const collectionName: string = req.query.collectionName as string || `worldbook_${Date.now()}`; // Default name

            // Get provider and chunking parameters from query or use defaults from config
            const providerName: string = (req.query.provider as string) || currentConfig.defaultProvider;
            const chunkSize: number = req.query.chunkSize ? parseInt(req.query.chunkSize as string, 10) : currentConfig.defaultChunkSize;
            const overlapSize: number = req.query.overlapSize ? parseInt(req.query.overlapSize as string, 10) : currentConfig.defaultOverlapSize;

            if (!worldBook || !worldBook.entries) {
                console.error(chalk.red(MODULE_NAME), 'Invalid world book data received.');
                return res.status(400).json({ error: 'Invalid world book data. Missing entries.' });
            }

            console.log(chalk.blue(MODULE_NAME), `Processing world book for collection '${collectionName}' using provider: ${providerName}`);

            // 2. Process the world book (chunking)
            const processedChunks: ProcessedChunk[] = await processWorldBook(worldBook, chunkSize, overlapSize);
            console.log(chalk.blue(MODULE_NAME), `Processed world book into ${processedChunks.length} chunks.`);

            // 3. Initialize Embedding Service and generate embeddings
            const embeddingService = new EmbeddingService(currentConfig.embeddingProviders);
            const embeddings: number[][] = await embeddingService.generateEmbeddings(processedChunks, providerName);
            
            // 4. Combine chunks with their embeddings
            const chunksWithEmbeddings = processedChunks.map((chunk, index) => ({
                ...chunk,
                embedding: embeddings[index]
            }));

            // 5. Prepare data for vector database
            // Assume a fixed vector dimension for now (e.g., 1024 for mxbai-embed-large-v1)
            // In a real scenario, this should be dynamically determined or configured.
            const vectorDimension = 1024; 
            const distanceMetric = 'Cosine'; // Common default

            // 6. Initialize Vector DB Service and store data
            const vectorDbService = new VectorDbService(currentConfig);
            
            // 6a. Create collection
            await vectorDbService.createCollection({
                name: collectionName,
                vectorDimension: vectorDimension,
                distanceMetric: distanceMetric
            });

            // 6b. Prepare points for upsert
            const pointsToUpsert: VectorPoint[] = chunksWithEmbeddings.map((chunk, index) => {
                 // Create a unique ID, perhaps based on original UID and chunk index
                const pointId = `${chunk.uid}_${index}`;
                if (!chunk.embedding || chunk.embedding.length === 0) {
                    console.warn(chalk.yellow(MODULE_NAME), `Chunk ${pointId} has no embedding. Skipping.`);
                    return null; // Filter out later
                }
                return {
                    id: pointId,
                    vector: chunk.embedding,
                    payload: {
                        uid: chunk.uid,
                        key: chunk.key,
                        keysecondary: chunk.keysecondary,
                        comment: chunk.comment,
                        content: chunk.content,
                        chunkType: chunk.chunkType,
                        // Add other metadata as needed
                    }
                };
            }).filter(p => p !== null) as VectorPoint[]; // Filter out nulls and assert type

            // 6c. Upsert points
            if (pointsToUpsert.length > 0) {
                await vectorDbService.upsert({
                    collectionName: collectionName,
                    points: pointsToUpsert
                });
            }

            console.log(chalk.green(MODULE_NAME), `World book processed, embedded, and stored in collection '${collectionName}'.`);
            
            return res.json({
                message: 'World book processed and stored successfully.',
                collectionName: collectionName,
                chunksProcessed: chunksWithEmbeddings.length,
                pointsStored: pointsToUpsert.length
            });

        } catch (error: any) {
            console.error(chalk.red(MODULE_NAME), 'Error processing and storing world book:', error);
            return res.status(500).json({ error: `Internal server error: ${error.message}` });
        }
    });

    // Endpoint to perform a search and optional rerank
    router.post('/search', jsonParser, async (req, res) => {
        try {
            const { queryText, collectionName, limit = 10, rerank = false } = req.body;
            
            if (!queryText || !collectionName) {
                return res.status(400).json({ error: 'Missing queryText or collectionName in request body.' });
            }

            console.log(chalk.blue(MODULE_NAME), `Performing search in collection '${collectionName}' for query: "${queryText}"`);

            // 1. Generate embedding for the query
            const embeddingService = new EmbeddingService(currentConfig.embeddingProviders);
            // Use the default provider for querying
            const queryEmbedding = await embeddingService.getEmbedding(queryText, currentConfig.defaultProvider);

            // 2. Search in vector database
            const vectorDbService = new VectorDbService(currentConfig);
            const searchResults = await vectorDbService.search({
                collectionName: collectionName,
                queryVector: queryEmbedding,
                limit: limit * 2 // Get more results for potential reranking
            });

            let finalResults = searchResults.results;

            // 3. Optional Reranking
            if (rerank && finalResults.length > 0) {
                console.log(chalk.blue(MODULE_NAME), 'Reranking results...');
                
                // Get the text content of the retrieved chunks
                const documentsToRerank = finalResults.map(r => 
                    `${r.payload?.comment || ''} ${r.payload?.content || ''}`.trim()
                ).filter(doc => doc.length > 0);

                if (documentsToRerank.length > 0) {
                    // Initialize Rerank Service (using the same provider config for now, 
                    // but this could be a separate rerank provider config)
                    const rerankProviderConfig = currentConfig.embeddingProviders[currentConfig.defaultProvider];
                    const rerankService = new RerankService(rerankProviderConfig);
                    
                    const rerankResponse = await rerankService.rerank(queryText, documentsToRerank, limit);
                    
                    // Map reranked results back to original search results using index
                    finalResults = rerankResponse.results.map(rerankResult => {
                        const originalResult = searchResults.results[rerankResult.index];
                        return {
                            ...originalResult,
                            rerank_score: rerankResult.relevance_score
                        };
                    }).sort((a, b) => (b.rerank_score || 0) - (a.rerank_score || 0)); // Sort by rerank score
                }
            }

            // Return top 'limit' results
            finalResults = finalResults.slice(0, limit);

            console.log(chalk.green(MODULE_NAME), `Search (and rerank) completed. Returning ${finalResults.length} results.`);
            return res.json({
                message: 'Search completed successfully.',
                results: finalResults
            });

        } catch (error: any) {
            console.error(chalk.red(MODULE_NAME), 'Error during search:', error);
            return res.status(500).json({ error: `Internal server error: ${error.message}` });
        }
    });

    // --- Additional Endpoints from VECTOR_ADDINS.md ---

    // Endpoint to delete specific records from a collection
    router.post('/delete-records', jsonParser, async (req, res) => {
        try {
            const { collectionName, ids } = req.body;

            if (!collectionName || !ids || !Array.isArray(ids)) {
                return res.status(400).json({ error: 'Missing collectionName or ids array in request body.' });
            }

            console.log(chalk.blue(MODULE_NAME), `Deleting ${ids.length} records from collection '${collectionName}'`);

            const vectorDbService = new VectorDbService(currentConfig);
            await vectorDbService.deleteRecords({
                collectionName: collectionName,
                ids: ids
            });

            console.log(chalk.green(MODULE_NAME), 'Records deleted successfully.');
            return res.json({ message: 'Records deleted successfully.' });

        } catch (error: any) {
            console.error(chalk.red(MODULE_NAME), 'Error deleting records:', error);
            return res.status(500).json({ error: `Internal server error: ${error.message}` });
        }
    });

    // Endpoint to delete an entire collection
    router.post('/delete-collection', jsonParser, async (req, res) => {
        try {
            const { name } = req.body;

            if (!name) {
                return res.status(400).json({ error: 'Missing collection name in request body.' });
            }

            console.log(chalk.blue(MODULE_NAME), `Deleting collection '${name}'`);

            const vectorDbService = new VectorDbService(currentConfig);
            await vectorDbService.deleteCollection({
                name: name
            });

            console.log(chalk.green(MODULE_NAME), 'Collection deleted successfully.');
            return res.json({ message: 'Collection deleted successfully.' });

        } catch (error: any) {
            console.error(chalk.red(MODULE_NAME), 'Error deleting collection:', error);
            return res.status(500).json({ error: `Internal server error: ${error.message}` });
        }
    });

    console.log(chalk.green(MODULE_NAME), 'Plugin loaded with vector database and reranking capabilities!');
}

export async function exit(): Promise<void> {
    console.log(chalk.yellow(MODULE_NAME), 'Plugin exited');
}

export const info: PluginInfo = {
    id: 'semantix_backend',
    name: 'Semantix Vector DB Backend',
    description: 'Backend plugin for the SillyTavern Semantix extension. Handles world book processing, vectorization, storage, search, and reranking.',
};

const plugin: Plugin = {
    init,
    exit,
    info,
};

export default plugin;