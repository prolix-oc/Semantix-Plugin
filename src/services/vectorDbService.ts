// src/services/vectorDbService.ts

import { Chalk } from 'chalk';
import { 
    CreateCollectionRequest, 
    UpsertRequest, 
    SearchRequest, 
    SearchResponse, 
    SearchResult, // Import SearchResult
    DeleteRecordsRequest, 
    DeleteCollectionRequest,
    VectorPoint
} from '../types/vectorDb';
import { PluginConfig } from '../types/config';

const chalk = new Chalk();
const MODULE_NAME = '[VectorDbService]';

/**
 * A generic service to interact with various vector databases.
 * This service will handle CRUD operations and other essential interactions.
 * NOTE: This is a simplified version focusing on the concept. A full implementation
 * would require specific logic for each database type (Milvus, Qdrant, etc.).
 */
class VectorDbService {
    private config: PluginConfig;
    private dbType: string; // e.g., 'qdrant', 'milvus', 'chromadb', 'weaviate'
    private baseUrl: string;
    private apiKey?: string;
    private headers: Record<string, string>;

    constructor(config: PluginConfig) {
        this.config = config;
        // For now, we'll assume a single, default vector database configuration
        // This could be made more dynamic in the future
        this.dbType = 'qdrant'; // Default to Qdrant, for example
        this.baseUrl = 'http://localhost:6333'; // Default Qdrant URL
        this.apiKey = undefined; // No API key by default
        this.headers = {
            'Content-Type': 'application/json',
            // Add API key header if needed
        };
    }

    /**
     * Creates a new collection in the vector database.
     * @param request The request object containing collection details.
     */
    async createCollection(request: CreateCollectionRequest): Promise<void> {
        console.log(chalk.blue(MODULE_NAME), `Creating collection '${request.name}' in ${this.dbType} at ${this.baseUrl}`);
        
        // This is a simplified example for Qdrant
        if (this.dbType === 'qdrant') {
            const url = `${this.baseUrl}/collections/${request.name}`;
            const payload = {
                vectors: {
                    size: request.vectorDimension,
                    distance: request.distanceMetric
                }
            };

            try {
                const response = await fetch(url, {
                    method: 'PUT',
                    headers: this.headers,
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to create collection: ${response.status} ${errorText}`);
                }

                console.log(chalk.green(MODULE_NAME), `Collection '${request.name}' created successfully.`);
            } catch (error) {
                console.error(chalk.red(MODULE_NAME), 'Error creating collection:', error);
                throw error;
            }
        } else {
            // Implement logic for other database types (Milvus, ChromaDB, Weaviate)
            throw new Error(`createCollection not implemented for database type: ${this.dbType}`);
        }
    }

    /**
     * Upserts (inserts or updates) points in a collection.
     * @param request The request object containing points to upsert.
     */
    async upsert(request: UpsertRequest): Promise<void> {
        console.log(chalk.blue(MODULE_NAME), `Upserting ${request.points.length} points into collection '${request.collectionName}'`);

        // This is a simplified example for Qdrant
        if (this.dbType === 'qdrant') {
            const url = `${this.baseUrl}/collections/${request.collectionName}/points?wait=true`;
            const payload = {
                points: request.points
            };

            try {
                const response = await fetch(url, {
                    method: 'PUT',
                    headers: this.headers,
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to upsert points: ${response.status} ${errorText}`);
                }

                console.log(chalk.green(MODULE_NAME), `Points upserted successfully into '${request.collectionName}'.`);
            } catch (error) {
                console.error(chalk.red(MODULE_NAME), 'Error upserting points:', error);
                throw error;
            }
        } else {
            // Implement logic for other database types
            throw new Error(`upsert not implemented for database type: ${this.dbType}`);
        }
    }

    /**
     * Performs a similarity search in a collection.
     * @param request The request object containing search parameters.
     * @returns A promise that resolves to the search results.
     */
    async search(request: SearchRequest): Promise<SearchResponse> {
        console.log(chalk.blue(MODULE_NAME), `Performing search in collection '${request.collectionName}'`);

        // This is a simplified example for Qdrant
        if (this.dbType === 'qdrant') {
            const url = `${this.baseUrl}/collections/${request.collectionName}/points/search`;
            // Qdrant specific payload
            const payload = {
                vector: request.queryVector,
                limit: request.limit,
                with_payload: request.outputFields && request.outputFields.length > 0 ? true : undefined,
                // Add filter, etc. if needed
            };

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: this.headers,
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to perform search: ${response.status} ${errorText}`);
                }

                const data = await response.json();
                // Map Qdrant response to our generic SearchResponse
                const results: SearchResult[] = data.result.map((item: any) => ({
                    id: item.id,
                    vector: item.vector,
                    payload: item.payload,
                    score: item.score
                }));

                console.log(chalk.green(MODULE_NAME), `Search returned ${results.length} results.`);
                return { results };

            } catch (error) {
                console.error(chalk.red(MODULE_NAME), 'Error performing search:', error);
                throw error;
            }
        } else {
            // Implement logic for other database types
            throw new Error(`search not implemented for database type: ${this.dbType}`);
        }
    }

    /**
     * Deletes specific records (points) from a collection.
     * @param request The request object containing IDs to delete.
     */
    async deleteRecords(request: DeleteRecordsRequest): Promise<void> {
        console.log(chalk.blue(MODULE_NAME), `Deleting records from collection '${request.collectionName}'`);

        // This is a simplified example for Qdrant
        if (this.dbType === 'qdrant') {
            const url = `${this.baseUrl}/collections/${request.collectionName}/points/delete`;
            const payload = {
                points: request.ids
            };

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: this.headers,
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to delete records: ${response.status} ${errorText}`);
                }

                console.log(chalk.green(MODULE_NAME), `Records deleted successfully from '${request.collectionName}'.`);
            } catch (error) {
                console.error(chalk.red(MODULE_NAME), 'Error deleting records:', error);
                throw error;
            }
        } else {
            // Implement logic for other database types
            throw new Error(`deleteRecords not implemented for database type: ${this.dbType}`);
        }
    }

    /**
     * Deletes an entire collection.
     * @param request The request object containing the collection name.
     */
    async deleteCollection(request: DeleteCollectionRequest): Promise<void> {
        console.log(chalk.blue(MODULE_NAME), `Deleting collection '${request.name}'`);

        // This is a simplified example for Qdrant
        if (this.dbType === 'qdrant') {
            const url = `${this.baseUrl}/collections/${request.name}`;

            try {
                const response = await fetch(url, {
                    method: 'DELETE',
                    headers: this.headers
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to delete collection: ${response.status} ${errorText}`);
                }

                console.log(chalk.green(MODULE_NAME), `Collection '${request.name}' deleted successfully.`);
            } catch (error) {
                console.error(chalk.red(MODULE_NAME), 'Error deleting collection:', error);
                throw error;
            }
        } else {
            // Implement logic for other database types
            throw new Error(`deleteCollection not implemented for database type: ${this.dbType}`);
        }
    }
}

export default VectorDbService;