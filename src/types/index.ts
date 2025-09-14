// src/types/index.ts

import { Router } from 'express'; // Import Router here

/**
 * Represents a single chunk of processed world book content.
 */
export interface ProcessedChunk {
    uid: number | string;
    key: string[];
    keysecondary: string[];
    comment: string; // Can be the original comment or a chunk of it
    content: string; // Can be the original content or a chunk of it
    constant: boolean;
    selective: boolean;
    order: number;
    position: number;
    disable: boolean;
    displayIndex: number;
    vectorized: boolean;
    selectiveLogic: number;
    addMemo: boolean;
    ignoreBudget: boolean;
    excludeRecursion: boolean;
    preventRecursion: boolean;
    matchPersonaDescription: boolean;
    matchCharacterDescription: boolean;
    matchCharacterPersonality: boolean;
    chunkType: 'content' | 'comment'; // Indicates if this chunk is from content or comment
    embedding?: number[]; // The embedding vector for this chunk (added after processing)
}

/**
 * Represents an embedding request to an external service.
 */
export interface EmbeddingRequest {
    // Common fields across providers
    text?: string; // The text to embed
    model?: string; // The model to use (optional, service might have a default)
    
    // Specific to OpenAI/Ollama style
    input?: string | string[]; // Alternative field name for some providers
    prompt?: string; // Alternative field name for some providers
    
    // Specific to llama.cpp/BananaBread style
    content?: string; // Alternative field name for some providers
    normalize?: boolean; // Whether to normalize the embedding
    truncate?: boolean; // Whether to truncate input text if needed
}

/**
 * Represents a response from an embedding service.
 */
export interface EmbeddingResponse {
    // Common fields
    embedding?: number[]; // The generated embedding vector
    model?: string; // The model used (optional)
    
    // OpenAI specific structure (simplified)
    data?: Array<{ embedding: number[] }>; // For batch responses
    
    // Error field (common in many APIs)
    error?: {
        message: string;
        type?: string;
        param?: string;
        code?: string | number;
    };
}

/**
 * Represents the structure of a world book entry as received from SillyTavern.
 */
export interface WorldBookEntry {
    uid: number | string;
    key: string[];
    keysecondary: string[];
    comment: string;
    content: string;
    constant: boolean;
    selective: boolean;
    order: number;
    position: number;
    disable: boolean;
    displayIndex: number;
    vectorized: boolean;
    selectiveLogic: number;
    addMemo: boolean;
    ignoreBudget: boolean;
    excludeRecursion: boolean;
    preventRecursion: boolean;
    matchPersonaDescription: boolean;
    matchCharacterDescription: boolean;
    matchCharacterPersonality: boolean;
    // ... other potential fields
}

/**
 * Represents the structure of a world book as received from SillyTavern.
 */
export interface WorldBook {
    entries: { [key: string]: WorldBookEntry };
    // ... other potential fields like name, description, etc.
}

/**
 * Represents the structure of the plugin.
 */
export interface PluginInfo {
    id: string;
    name: string;
    description: string;
}

export interface Plugin {
    init: (router: Router) => Promise<void>;
    exit: () => Promise<void>;
    info: PluginInfo;
}