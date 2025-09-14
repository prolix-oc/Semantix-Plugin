// src/services/embeddingService.ts

import { EmbeddingRequest, EmbeddingResponse, ProcessedChunk } from '../types';
import { EmbeddingConfig, ProviderConfig, EmbeddingProvider } from '../config';
import { Chalk } from 'chalk';

const chalk = new Chalk();
const MODULE_NAME = '[EmbeddingService]';

/**
 * A service to handle interactions with external embedding providers.
 */
class EmbeddingService {
    private config: EmbeddingConfig;

    constructor(config: EmbeddingConfig) {
        this.config = config;
    }

    /**
     * Generates embeddings for an array of text chunks using a specified provider.
     * @param chunks An array of ProcessedChunk objects containing the text to embed.
     * @param providerName The name of the embedding provider to use.
     * @returns A promise that resolves to an array of embeddings.
     */
    async generateEmbeddings(chunks: ProcessedChunk[], providerName: string): Promise<number[][]> {
        const providerConfig = this.config[providerName];
        if (!providerConfig) {
            throw new Error(`Provider configuration for '${providerName}' not found.`);
        }

        const embeddings: number[][] = [];
        const errors: string[] = [];

        console.log(chalk.blue(MODULE_NAME), `Generating embeddings for ${chunks.length} chunks using provider: ${providerName}`);

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const textToEmbed = `${chunk.comment} ${chunk.content}`.trim();

            if (!textToEmbed) {
                console.warn(chalk.yellow(MODULE_NAME), `Skipping empty chunk (UID: ${chunk.uid}, Type: ${chunk.chunkType})`);
                embeddings.push([]); // Push an empty array or a zero vector?
                continue;
            }

            try {
                const embedding = await this.getEmbedding(textToEmbed, providerConfig);
                embeddings.push(embedding);
                // Simple progress indicator
                if ((i + 1) % 10 === 0 || i === chunks.length - 1) {
                    console.log(chalk.blue(MODULE_NAME), `Processed ${i + 1}/${chunks.length} chunks...`);
                }
            } catch (error: any) {
                const errorMsg = `Failed to embed chunk ${i + 1} (UID: ${chunk.uid}): ${error.message}`;
                console.error(chalk.red(MODULE_NAME), errorMsg);
                errors.push(errorMsg);
                // Depending on requirements, you might want to push a placeholder vector or re-throw
                embeddings.push([]); // Push an empty array for failed embedding
            }
        }

        if (errors.length > 0) {
            // Log all errors but don't necessarily stop the process
            console.error(chalk.red(MODULE_NAME), `Encountered ${errors.length} errors during embedding generation.`);
            // Optionally, throw an error if too many failures?
            // if (errors.length > chunks.length * 0.5) { // e.g., if more than 50% fail
            //     throw new Error(`Too many embedding failures. Errors: ${errors.join('; ')}`);
            // }
        }

        console.log(chalk.green(MODULE_NAME), `Successfully generated embeddings for ${chunks.length - errors.length}/${chunks.length} chunks.`);
        return embeddings;
    }

    /**
     * Gets a single embedding for a given text from the specified provider.
     * This method is made public so it can be used directly by other services (e.g., for query embedding).
     * @param text The text to embed.
     * @param providerName The name of the provider to use, or the provider config object itself.
     * @returns A promise that resolves to the embedding vector.
     */
    async getEmbedding(text: string, providerName: string): Promise<number[]>;
    async getEmbedding(text: string, providerConfig: ProviderConfig): Promise<number[]>;
    async getEmbedding(text: string, providerParam: string | ProviderConfig): Promise<number[]> {
        let providerConfig: ProviderConfig;

        if (typeof providerParam === 'string') {
            const config = this.config[providerParam];
            if (!config) {
                throw new Error(`Provider configuration for '${providerParam}' not found.`);
            }
            providerConfig = config;
        } else {
            providerConfig = providerParam;
        }

        const { baseUrl, embeddingEndpoint, apiKey, modelName, headers = {}, defaultParams = {} } = providerConfig;
        const url = `${baseUrl.replace(/\/$/, '')}${embeddingEndpoint}`; // Ensure no double slashes

        // Prepare the request payload based on the provider
        let payload: EmbeddingRequest = { text, model: modelName, ...defaultParams };

        // Prepare headers
        const requestHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            ...headers
        };

        // Add API key if provided
        if (apiKey) {
            // The header name can vary, common ones are 'Authorization' or 'X-API-KEY'
            // For OpenAI, it's usually 'Authorization: Bearer <key>'
            // Let's assume 'Authorization' for now, but this could be made configurable
            requestHeaders['Authorization'] = `Bearer ${apiKey}`;
        }

        // Specific adjustments for known providers based on their API specs
        // This is where we map our generic payload to provider-specific formats

        // For Ollama: uses 'prompt' or 'input'
        if (url.includes('ollama')) {
            payload = {
                prompt: text,
                model: modelName,
                ...defaultParams
            };
        }
        // For OpenAI: uses 'input' (can be string or array of strings)
        else if (url.includes('openai')) {
            payload = {
                input: text,
                model: modelName,
                ...defaultParams
            };
        }
        // For llama.cpp/BananaBread: uses 'content'
        else if (url.includes('llamacpp') || url.includes('localhost:8008')) {
            payload = {
                content: text,
                model: modelName,
                ...defaultParams
                // normalize and truncate are part of defaultParams for these providers
            };
        }
        // For a generic/custom endpoint, we'll try to use the most common fields
        // Our generic payload uses 'text', so we might need to map it
        // This part is tricky without knowing the exact API, so we'll keep it generic
        // and rely on defaultParams and headers to be correctly configured.

        console.debug(chalk.gray(MODULE_NAME), `Sending embedding request to ${url} for text (length: ${text.length})`);

        const response = await fetch(url, {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data: EmbeddingResponse = await response.json();

        // Handle different response formats
        if (data.error) {
            throw new Error(`Embedding API error: ${data.error.message}`);
        }

        // OpenAI format
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
            return data.data[0].embedding;
        }
        // Ollama/llama.cpp/BananaBread format
        else if (data.embedding && Array.isArray(data.embedding)) {
            return data.embedding;
        } else {
            throw new Error('Unexpected embedding response format');
        }
    }
}

export default EmbeddingService;