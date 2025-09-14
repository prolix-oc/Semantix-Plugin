// src/services/rerankService.ts

import { RerankRequest, RerankResponse } from '../types/rerank';
import { ProviderConfig } from '../config';
import { Chalk } from 'chalk';

const chalk = new Chalk();
const MODULE_NAME = '[RerankService]';

/**
 * A service to handle interactions with external reranking providers.
 * This service is designed to be flexible and work with various APIs
 * that follow similar patterns, including BananaBread's rerank endpoint.
 */
class RerankService {
    private providerConfig: ProviderConfig;

    constructor(providerConfig: ProviderConfig) {
        this.providerConfig = providerConfig;
    }

    /**
     * Reranks a list of documents based on their relevance to a query.
     * @param query The query string.
     * @param documents An array of documents (strings) to rerank.
     * @param topN The number of top results to return (optional).
     * @returns A promise that resolves to the reranked results.
     */
    async rerank(query: string, documents: string[], topN?: number): Promise<RerankResponse> {
        const { baseUrl, embeddingEndpoint, apiKey, modelName, headers = {}, defaultParams = {} } = this.providerConfig;
        
        // Assume the rerank endpoint is the same as the embedding endpoint for BananaBread
        // but this could be made configurable if needed.
        // BananaBread's rerank endpoint is typically `/rerank`
        const rerankEndpoint = '/rerank'; // Standard for BananaBread
        const url = `${baseUrl.replace(/\/$/, '')}${rerankEndpoint}`;

        console.log(chalk.blue(MODULE_NAME), `Sending rerank request to ${url}`);

        // Prepare the request payload
        const payload: RerankRequest = {
            query: query,
            documents: documents,
            model: modelName,
            top_n: topN,
            ...defaultParams
        };

        // Prepare headers
        const requestHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            ...headers
        };

        // Add API key if provided (BananaBread doesn't require it by default, but others might)
        if (apiKey) {
            requestHeaders['Authorization'] = `Bearer ${apiKey}`;
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: requestHeaders,
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data: RerankResponse = await response.json();

            if (data.error) {
                throw new Error(`Rerank API error: ${data.error.message}`);
            }

            console.log(chalk.green(MODULE_NAME), `Received ${data.results?.length || 0} reranked results.`);
            return data;

        } catch (error) {
            console.error(chalk.red(MODULE_NAME), 'Error during rerank request:', error);
            throw error;
        }
    }
}

export default RerankService;