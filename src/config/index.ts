// src/config/index.ts

/**
 * Configuration for external embedding services.
 * This allows easy switching between different providers.
 */

// Currently supported providers
export type EmbeddingProvider = 'ollama' | 'llamacpp' | 'openai' | 'bananabread' | 'custom';

// Configuration for a single provider
export interface ProviderConfig {
    /**
     * The base URL of the embedding service.
     * e.g., 'http://localhost:11434' for Ollama,
     * 'http://localhost:8080' for llama.cpp,
     * 'https://api.openai.com/v1' for OpenAI,
     * 'http://localhost:8008' for BananaBread.
     */
    baseUrl: string;

    /**
     * The specific endpoint path for generating embeddings.
     * This can vary between providers.
     * e.g., '/api/embeddings' for Ollama,
     * '/embedding' for llama.cpp/BananaBread,
     * '/v1/embeddings' for OpenAI.
     */
    embeddingEndpoint: string;

    /**
     * Optional API key for the service.
     * Required for OpenAI and some configurations of other services.
     */
    apiKey?: string;

    /**
     * The name of the model to use for embedding.
     * e.g., 'mxbai-embed-large-v1' for BananaBread/OpenAI/Ollama/llama.cpp
     */
    modelName: string;

    /**
     * Optional additional headers to include in requests.
     */
    headers?: Record<string, string>;

    /**
     * Optional default parameters for embedding requests.
     * These can be provider-specific.
     */
    defaultParams?: Record<string, any>;
}

// A map of provider configurations
export interface EmbeddingConfig {
    [providerName: string]: ProviderConfig;
}

// Example configuration (to be customized by the user/admin)
// This would typically be loaded from a file or environment variables
export const DEFAULT_EMBEDDING_CONFIG: EmbeddingConfig = {
    // Example for Ollama
    ollama: {
        baseUrl: 'http://localhost:11434',
        embeddingEndpoint: '/api/embeddings',
        modelName: 'mxbai-embed-large-v1', // Or whatever model is available in Ollama
        headers: {},
        defaultParams: {}
    },
    // Example for llama.cpp
    llamacpp: {
        baseUrl: 'http://localhost:8080',
        embeddingEndpoint: '/embedding',
        modelName: 'mixedbread-ai/mxbai-embed-large-v1', // Model name expected by llama.cpp server
        headers: {
            // 'Authorization': 'Bearer YOUR_LLAMACPP_API_KEY' // If required
        },
        defaultParams: {
            normalize: true,
            truncate: true
        }
    },
    // Example for OpenAI
    openai: {
        baseUrl: 'https://api.openai.com/v1',
        embeddingEndpoint: '/embeddings',
        apiKey: 'YOUR_OPENAI_API_KEY', // Must be set by user
        modelName: 'text-embedding-ada-002', // Or a newer model
        headers: {},
        defaultParams: {}
    },
    // Example for BananaBread
    bananabread: {
        baseUrl: 'http://localhost:8008',
        embeddingEndpoint: '/embedding', // Or '/v1/embeddings/llamacpp'
        modelName: 'mixedbread-ai/mxbai-embed-large-v1',
        headers: {},
        defaultParams: {
            normalize: true,
            truncate: true
        }
    },
    // Example for a custom endpoint
    custom: {
        baseUrl: 'http://your-custom-endpoint.com',
        embeddingEndpoint: '/your-embedding-path',
        apiKey: 'YOUR_CUSTOM_API_KEY', // If required
        modelName: 'your-model-name',
        headers: {},
        defaultParams: {}
    }
};