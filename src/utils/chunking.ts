// src/utils/chunking.ts

import { WorldBook, WorldBookEntry, ProcessedChunk } from '../types';

/**
 * Chunks text into overlapping segments.
 * @param text The text to chunk.
 * @param chunkSize The desired size of each chunk in characters.
 * @param overlapSize The number of characters to overlap between chunks.
 * @returns An array of text chunks.
 */
export function chunkText(text: string, chunkSize: number = 450, overlapSize: number = 50): string[] {
    if (chunkSize <= overlapSize) {
        throw new Error("Chunk size must be greater than overlap size.");
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push(text.substring(start, end));

        // If this is the last chunk, break
        if (end === text.length) {
            break;
        }

        // Move the start position by (chunkSize - overlapSize) for the next chunk
        start += (chunkSize - overlapSize);
    }

    return chunks;
}

/**
 * Processes a world book by chunking its entries.
 * This is a simplified version based on the Eldoria.json structure.
 * Note: This function uses default chunking parameters. For custom parameters,
 * use the logic directly in the /vectorize endpoint or modify this function.
 * @param worldBook The world book object.
 * @param chunkSize The desired size of each chunk in characters (default: 450).
 * @param overlapSize The number of characters to overlap between chunks (default: 50).
 * @returns An array of processed entries with chunks.
 */
export async function processWorldBook(worldBook: WorldBook, chunkSize: number = 450, overlapSize: number = 50): Promise<ProcessedChunk[]> {
    const processedEntries: ProcessedChunk[] = [];
    const entries = worldBook.entries;

    for (const key in entries) {
        if (entries.hasOwnProperty(key)) {
            const entry: WorldBookEntry = entries[key];
            const content = entry.content || '';
            const comment = entry.comment || '';

            // Only process if content or comment exists
            if (content || comment) {
                // Chunk the content and comment with provided parameters
                const contentChunks = chunkText(content, chunkSize, overlapSize);
                const commentChunks = chunkText(comment, chunkSize, overlapSize);

                // Store chunks with metadata
                contentChunks.forEach(chunk => {
                    processedEntries.push({
                        uid: entry.uid,
                        key: entry.key,
                        keysecondary: entry.keysecondary,
                        comment: comment, // Keep original comment as metadata
                        content: chunk,
                        // Include other relevant fields if needed
                        constant: entry.constant,
                        selective: entry.selective,
                        order: entry.order,
                        position: entry.position,
                        disable: entry.disable,
                        displayIndex: entry.displayIndex,
                        vectorized: entry.vectorized,
                        selectiveLogic: entry.selectiveLogic,
                        addMemo: entry.addMemo,
                        ignoreBudget: entry.ignoreBudget,
                        excludeRecursion: entry.excludeRecursion,
                        preventRecursion: entry.preventRecursion,
                        matchPersonaDescription: entry.matchPersonaDescription,
                        matchCharacterDescription: entry.matchCharacterDescription,
                        matchCharacterPersonality: entry.matchCharacterPersonality,
                        // Add a type indicator
                        chunkType: 'content'
                    });
                });

                commentChunks.forEach(chunk => {
                    processedEntries.push({
                        uid: entry.uid,
                        key: entry.key,
                        keysecondary: entry.keysecondary,
                        comment: chunk, // Chunked comment
                        content: '', // No content for comment chunks
                        // Include other relevant fields if needed
                        constant: entry.constant,
                        selective: entry.selective,
                        order: entry.order,
                        position: entry.position,
                        disable: entry.disable,
                        displayIndex: entry.displayIndex,
                        vectorized: entry.vectorized,
                        selectiveLogic: entry.selectiveLogic,
                        addMemo: entry.addMemo,
                        ignoreBudget: entry.ignoreBudget,
                        excludeRecursion: entry.excludeRecursion,
                        preventRecursion: entry.preventRecursion,
                        matchPersonaDescription: entry.matchPersonaDescription,
                        matchCharacterDescription: entry.matchCharacterDescription,
                        matchCharacterPersonality: entry.matchCharacterPersonality,
                        // Add a type indicator
                        chunkType: 'comment'
                    });
                });
            }
        }
    }

    return processedEntries;
}