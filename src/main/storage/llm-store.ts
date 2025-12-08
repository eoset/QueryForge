/**
 * SQLite-based storage for LLM settings and API keys
 * Uses secure electron-store for API keys and SQLite for other settings
 */

import Database from 'better-sqlite3';
import path from 'path';
import { app, safeStorage } from 'electron';
import Store from 'electron-store';
import type {
  LLMProvider,
  LLMSettings,
  LLMConfig,
  OpenAIConfig,
  AzureOpenAIConfig,
  GeminiConfig,
} from '../../shared/types/llm';

// Database file location
const DB_NAME = 'llm-settings.db';

// Store interface for API keys
interface LLMSecretsStore {
  'apiKey.openai'?: string;
  'apiKey.azure'?: string;
  'apiKey.gemini'?: string;
}

// Secure store for API keys (encrypted)
const secureStore = new Store<LLMSecretsStore>({
  name: 'llm-secrets',
}) as Store<LLMSecretsStore> & {
  get(key: keyof LLMSecretsStore): string | undefined;
  set(key: keyof LLMSecretsStore, value: string): void;
  delete(key: keyof LLMSecretsStore): void;
};

let db: Database.Database | null = null;

/**
 * Initialize the database connection
 */
function getDatabase(): Database.Database {
  if (db) return db;
  
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, DB_NAME);
  
  db = new Database(dbPath);
  
  // Enable WAL mode for better concurrent read/write performance
  db.pragma('journal_mode = WAL');
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS llm_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS chat_conversations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      messages TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      tab_id TEXT
    );
    
    CREATE INDEX IF NOT EXISTS idx_conversations_updated ON chat_conversations(updated_at DESC);
  `);
  
  return db;
}

/**
 * Get a setting value
 */
function getSetting(key: string): string | null {
  const database = getDatabase();
  const stmt = database.prepare('SELECT value FROM llm_settings WHERE key = ?');
  const row = stmt.get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

/**
 * Set a setting value
 */
function setSetting(key: string, value: string): void {
  const database = getDatabase();
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO llm_settings (key, value) VALUES (?, ?)
  `);
  stmt.run(key, value);
}

/**
 * Save API key securely using Electron's safeStorage
 */
export function saveApiKey(provider: LLMProvider, apiKey: string): void {
  const key = `apiKey.${provider}` as keyof LLMSecretsStore;
  
  if (safeStorage.isEncryptionAvailable()) {
    try {
      const encrypted = safeStorage.encryptString(apiKey);
      const base64Encrypted = encrypted.toString('base64');
      secureStore.set(key, `encrypted:${base64Encrypted}`);
      console.log(`Saved encrypted API key for ${provider}`);
    } catch (error) {
      console.error('Failed to encrypt API key:', error);
      // Fall back to storing unencrypted (not ideal but functional)
      secureStore.set(key, `plain:${apiKey}`);
    }
  } else {
    // Fall back to storing unencrypted
    console.log(`Encryption not available, saving plain API key for ${provider}`);
    secureStore.set(key, `plain:${apiKey}`);
  }
}

/**
 * Get API key securely
 */
export function getApiKey(provider: LLMProvider): string | null {
  const key = `apiKey.${provider}` as keyof LLMSecretsStore;
  const stored = secureStore.get(key);
  
  if (!stored) {
    console.log(`No stored API key found for ${provider}`);
    return null;
  }
  
  // Handle prefixed storage format
  if (stored.startsWith('encrypted:')) {
    const base64Data = stored.substring('encrypted:'.length);
    if (safeStorage.isEncryptionAvailable()) {
      try {
        const encrypted = Buffer.from(base64Data, 'base64');
        const decrypted = safeStorage.decryptString(encrypted);
        console.log(`Retrieved encrypted API key for ${provider}`);
        return decrypted;
      } catch (error) {
        console.error(`Failed to decrypt API key for ${provider}:`, error);
        return null;
      }
    } else {
      console.error(`Cannot decrypt API key for ${provider}: encryption not available`);
      return null;
    }
  } else if (stored.startsWith('plain:')) {
    const plainKey = stored.substring('plain:'.length);
    console.log(`Retrieved plain API key for ${provider}`);
    return plainKey;
  }
  
  // Legacy format without prefix - try to decrypt, fall back to plain
  if (safeStorage.isEncryptionAvailable()) {
    try {
      const encrypted = Buffer.from(stored, 'base64');
      return safeStorage.decryptString(encrypted);
    } catch {
      // Might be stored unencrypted, return as-is
      return stored;
    }
  }
  
  return stored;
}

/**
 * Delete API key
 */
export function deleteApiKey(provider: LLMProvider): void {
  const key = `apiKey.${provider}` as keyof LLMSecretsStore;
  secureStore.delete(key);
}

/**
 * Check if API key exists for a provider
 */
export function hasApiKey(provider: LLMProvider): boolean {
  return !!getApiKey(provider);
}

/**
 * Save LLM settings (excluding API keys)
 */
export function saveLLMSettings(settings: LLMSettings): void {
  setSetting('llm_settings', JSON.stringify(settings));
}

/**
 * Get LLM settings
 */
export function getLLMSettings(): LLMSettings {
  const stored = getSetting('llm_settings');
  
  if (stored) {
    try {
      const settings = JSON.parse(stored) as LLMSettings;
      // Update hasApiKey flags
      if (settings.providers.openai) {
        settings.providers.openai.hasApiKey = hasApiKey('openai');
      }
      if (settings.providers.azure) {
        settings.providers.azure.hasApiKey = hasApiKey('azure');
      }
      if (settings.providers.gemini) {
        settings.providers.gemini.hasApiKey = hasApiKey('gemini');
      }
      return settings;
    } catch {
      // Return default settings if parsing fails
    }
  }
  
  // Default settings
  return {
    activeProvider: null,
    providers: {},
    defaultTemperature: 0.7,
    defaultMaxTokens: 4096,
  };
}

/**
 * Save provider configuration (including API key)
 */
export function saveProviderConfig(config: LLMConfig): void {
  const settings = getLLMSettings();
  
  switch (config.provider) {
    case 'openai': {
      const openaiConfig = config as OpenAIConfig;
      saveApiKey('openai', openaiConfig.apiKey);
      settings.providers.openai = {
        provider: 'openai',
        model: openaiConfig.model,
        temperature: openaiConfig.temperature,
        maxTokens: openaiConfig.maxTokens,
        organization: openaiConfig.organization,
        baseUrl: openaiConfig.baseUrl,
        hasApiKey: true,
      };
      break;
    }
    case 'azure': {
      const azureConfig = config as AzureOpenAIConfig;
      saveApiKey('azure', azureConfig.apiKey);
      settings.providers.azure = {
        provider: 'azure',
        model: azureConfig.model,
        temperature: azureConfig.temperature,
        maxTokens: azureConfig.maxTokens,
        endpoint: azureConfig.endpoint,
        deploymentName: azureConfig.deploymentName,
        apiVersion: azureConfig.apiVersion,
        hasApiKey: true,
      };
      break;
    }
    case 'gemini': {
      const geminiConfig = config as GeminiConfig;
      saveApiKey('gemini', geminiConfig.apiKey);
      settings.providers.gemini = {
        provider: 'gemini',
        model: geminiConfig.model,
        temperature: geminiConfig.temperature,
        maxTokens: geminiConfig.maxTokens,
        hasApiKey: true,
      };
      break;
    }
  }
  
  saveLLMSettings(settings);
}

/**
 * Get provider configuration with API key
 */
export function getProviderConfig(provider: LLMProvider): LLMConfig | null {
  const settings = getLLMSettings();
  const apiKey = getApiKey(provider);
  
  switch (provider) {
    case 'openai': {
      const config = settings.providers.openai;
      if (!config || !apiKey) return null;
      return {
        ...config,
        apiKey,
      } as OpenAIConfig;
    }
    case 'azure': {
      const config = settings.providers.azure;
      if (!config || !apiKey) return null;
      return {
        ...config,
        apiKey,
      } as AzureOpenAIConfig;
    }
    case 'gemini': {
      const config = settings.providers.gemini;
      if (!config || !apiKey) return null;
      return {
        ...config,
        apiKey,
      } as GeminiConfig;
    }
  }
  
  return null;
}

/**
 * Set active provider
 */
export function setActiveProvider(provider: LLMProvider | null): void {
  const settings = getLLMSettings();
  settings.activeProvider = provider;
  saveLLMSettings(settings);
}

/**
 * Get active provider
 */
export function getActiveProvider(): LLMProvider | null {
  const settings = getLLMSettings();
  return settings.activeProvider;
}

/**
 * Save system prompt
 */
export function saveSystemPrompt(prompt: string): void {
  const settings = getLLMSettings();
  settings.systemPrompt = prompt;
  saveLLMSettings(settings);
}

/**
 * Get system prompt
 */
export function getSystemPrompt(): string | undefined {
  const settings = getLLMSettings();
  return settings.systemPrompt;
}

/**
 * Update provider configuration without changing the API key
 * Used when user wants to change model or other settings but keep existing key
 */
export function updateProviderConfig(provider: LLMProvider, updates: Partial<Omit<LLMConfig, 'apiKey' | 'provider'>>): void {
  const settings = getLLMSettings();
  const existingConfig = settings.providers[provider];
  
  if (!existingConfig) {
    throw new Error(`No existing configuration for provider ${provider}`);
  }
  
  // Merge updates with existing config
  (settings.providers as any)[provider] = {
    ...existingConfig,
    ...updates,
  };
  
  saveLLMSettings(settings);
}

/**
 * Delete provider configuration
 */
export function deleteProviderConfig(provider: LLMProvider): void {
  deleteApiKey(provider);
  const settings = getLLMSettings();
  delete settings.providers[provider];
  
  // If this was the active provider, clear it
  if (settings.activeProvider === provider) {
    settings.activeProvider = null;
  }
  
  saveLLMSettings(settings);
}

/**
 * Close the database connection
 */
export function closeLLMDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
