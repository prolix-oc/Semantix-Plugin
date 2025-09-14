// src/types/config.ts

import { EmbeddingConfig } from '../config';

/**
 * Main configuration structure for the World Info Vectorizer backend plugin.
 */
export interface PluginConfig {
    /**
     * The default embedding provider to use if none is specified in the /vectorize request.
     */
    defaultProvider: string;

    /**
     * Default chunk size in characters.
     */
    defaultChunkSize: number;

    /**
     * Default overlap size in characters.
     */
    defaultOverlapSize: number;

    /**
     * Map of configurations for different embedding providers.
     */
    embeddingProviders: EmbeddingConfig;
}