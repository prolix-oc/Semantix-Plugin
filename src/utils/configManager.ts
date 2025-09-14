// src/utils/configManager.ts

import * as fs from 'fs';
import * as path from 'path';
import { PluginConfig } from '../types/config';
import { DEFAULT_EMBEDDING_CONFIG } from '../config';

// Define the path to the config file
const CONFIG_FILE_PATH = path.join(__dirname, '../../plugin_config.json');

/**
 * Default plugin configuration.
 */
const DEFAULT_PLUGIN_CONFIG: PluginConfig = {
    defaultProvider: 'bananabread',
    defaultChunkSize: 450,
    defaultOverlapSize: 50,
    embeddingProviders: DEFAULT_EMBEDDING_CONFIG
};

/**
 * Loads the plugin configuration from the file.
 * If the file doesn't exist, it creates it with default values.
 * @returns The loaded or default configuration.
 */
export async function loadConfig(): Promise<PluginConfig> {
    try {
        if (fs.existsSync(CONFIG_FILE_PATH)) {
            const configFileData = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
            const config: PluginConfig = JSON.parse(configFileData);
            // Merge with defaults to ensure all keys are present
            return { ...DEFAULT_PLUGIN_CONFIG, ...config };
        } else {
            console.warn('Config file not found. Creating a new one with default values.');
            await saveConfig(DEFAULT_PLUGIN_CONFIG);
            return DEFAULT_PLUGIN_CONFIG;
        }
    } catch (error) {
        console.error('Error loading config:', error);
        // Return defaults if there's an error loading the file
        return DEFAULT_PLUGIN_CONFIG;
    }
}

/**
 * Saves the plugin configuration to the file.
 * @param config The configuration to save.
 */
export async function saveConfig(config: PluginConfig): Promise<void> {
    try {
        // Ensure the directory exists
        const dir = path.dirname(CONFIG_FILE_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Write the config to the file
        fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 4), 'utf-8');
        console.log('Configuration saved successfully.');
    } catch (error) {
        console.error('Error saving config:', error);
        throw error; // Re-throw to let the caller handle it
    }
}