// src/types/vectorDb.ts

/**
 * Represents a generic request to create a collection in a vector database.
 */
export interface CreateCollectionRequest {
    /**
     * The unique name for the collection.
     */
    name: string;

    /**
     * The dimensionality of the vector embeddings.
     */
    vectorDimension: number;

    /**
     * The distance metric to use (e.g., 'Cosine', 'L2', 'IP').
     */
    distanceMetric: string;

    /**
     * Additional provider-specific options for collection creation.
     */
    [key: string]: any;
}

/**
 * Represents a generic request to upsert (insert or update) records in a vector database.
 */
export interface UpsertRequest {
    /**
     * The name of the target collection.
     */
    collectionName: string;

    /**
     * An array of points/objects to upsert.
     */
    points: VectorPoint[];
}

/**
 * Represents a single point or object to be stored in the vector database.
 */
export interface VectorPoint {
    /**
     * A unique identifier for the point.
     * Can be a string (UUID) or number, depending on the database.
     */
    id: string | number;

    /**
     * The vector embedding.
     */
    vector: number[];

    /**
     * A JSON object containing any additional data (metadata).
     */
    payload?: Record<string, any>;
}

/**
 * Represents a generic request to perform a similarity search in a vector database.
 */
export interface SearchRequest {
    /**
     * The name of the collection to search.
     */
    collectionName: string;

    /**
     * The query vector.
     */
    queryVector: number[];

    /**
     * The number of top results to return.
     */
    limit: number;

    /**
     * A list of fields to include in the results.
     */
    outputFields?: string[];

    /**
     * Additional provider-specific options for the search.
     */
    [key: string]: any;
}

/**
 * Represents a single result from a vector database search.
 */
export interface SearchResult {
    /**
     * The unique identifier of the point.
     */
    id: string | number;

    /**
     * The vector embedding (if included in the response).
     */
    vector?: number[];

    /**
     * The payload/metadata associated with the point.
     */
    payload?: Record<string, any>;

    /**
     * The distance or similarity score.
     */
    score: number;
}

/**
 * Represents a generic response from a vector database search.
 */
export interface SearchResponse {
    /**
     * An array of search results.
     */
    results: SearchResult[];
}

/**
 * Represents a generic request to delete specific records from a vector database.
 */
export interface DeleteRecordsRequest {
    /**
     * The name of the collection.
     */
    collectionName: string;

    /**
     * An array of point IDs to delete.
     */
    ids: (string | number)[];
}

/**
 * Represents a generic request to delete an entire collection.
 */
export interface DeleteCollectionRequest {
    /**
     * The name of the collection to delete.
     */
    name: string;
}