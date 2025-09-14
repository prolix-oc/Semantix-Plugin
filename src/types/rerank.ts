// src/types/rerank.ts

/**
 * Represents a request to an external reranking service.
 * This interface is generic enough to be adapted to various providers
 * like BananaBread, Cohere, or custom endpoints.
 */
export interface RerankRequest {
    /**
     * The query text against which documents will be reranked.
     * In the context of our plugin, this would typically be the user's chat message.
     */
    query: string;

    /**
     * An array of document texts or objects to be reranked.
     * In our case, these would be the text chunks from the world book entries
     * that were found to be initially relevant by the vector search.
     * Providers like Cohere expect strings, while others might accept objects.
     */
    documents: (string | object)[];

    /**
     * The name of the model to use for reranking, if the service requires it.
     */
    model?: string;

    /**
     * The maximum number of top results to return after reranking.
     * If not provided, the service might return all documents in reranked order.
     */
    top_n?: number;

    /**
     * Additional parameters specific to the reranking provider.
     * This allows for flexibility in configuring different services.
     */
    [key: string]: any; // Index signature for additional provider-specific options
}

/**
 * Represents a single result from a reranking operation.
 */
export interface RerankResult {
    /**
     * The index of the document in the original `documents` array from the request.
     */
    index: number;

    /**
     * The relevance score assigned by the reranker. Higher scores indicate higher relevance.
     */
    relevance_score: number;

    /**
     * The document itself. This might be included depending on the provider and request parameters.
     * We will primarily use the `index` to correlate back to our original data.
     */
    document?: string | object;
}

/**
 * Represents a response from an external reranking service.
 */
export interface RerankResponse {
    /**
     * An array of reranked results, typically sorted by relevance score in descending order.
     */
    results: RerankResult[];

    /**
     * The model used for reranking, if provided by the service.
     */
    model?: string;

    /**
     * An optional usage object reporting token counts, if provided by the service.
     */
    usage?: {
        total_tokens?: number;
    };

    /**
     * An error object if the request failed.
     */
    error?: {
        message: string;
        type?: string;
        param?: string;
        code?: string | number;
    };
}