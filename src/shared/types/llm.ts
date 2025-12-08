/**
 * LLM-related types for AI chat functionality
 */

/**
 * Supported LLM providers
 */
export type LLMProvider = 'openai' | 'azure' | 'gemini';

/**
 * Base configuration for all providers
 */
export interface BaseLLMConfig {
  provider: LLMProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * OpenAI-specific configuration
 */
export interface OpenAIConfig extends BaseLLMConfig {
  provider: 'openai';
  apiKey: string;
  organization?: string;
  baseUrl?: string; // For custom endpoints
}

/**
 * Azure OpenAI-specific configuration
 */
export interface AzureOpenAIConfig extends BaseLLMConfig {
  provider: 'azure';
  apiKey: string;
  endpoint: string; // Azure resource endpoint
  deploymentName: string; // The deployment name in Azure
  apiVersion?: string; // API version, defaults to latest stable
}

/**
 * Google Gemini-specific configuration
 */
export interface GeminiConfig extends BaseLLMConfig {
  provider: 'gemini';
  apiKey: string;
}

/**
 * Union type for all provider configurations
 */
export type LLMConfig = OpenAIConfig | AzureOpenAIConfig | GeminiConfig;

/**
 * Stored LLM settings (persisted to disk)
 * API keys are stored separately in secure storage
 */
export interface LLMSettings {
  activeProvider: LLMProvider | null;
  providers: {
    openai?: Omit<OpenAIConfig, 'apiKey'> & { hasApiKey: boolean };
    azure?: Omit<AzureOpenAIConfig, 'apiKey'> & { hasApiKey: boolean };
    gemini?: Omit<GeminiConfig, 'apiKey'> & { hasApiKey: boolean };
  };
  defaultTemperature: number;
  defaultMaxTokens: number;
  systemPrompt?: string;
}

/**
 * Default models for each provider
 */
export const DEFAULT_MODELS: Record<LLMProvider, string> = {
  openai: 'gpt-4o',
  azure: 'gpt-4o',
  gemini: 'gemini-2.0-flash',
};

/**
 * Available models per provider
 */
export const AVAILABLE_MODELS: Record<LLMProvider, string[]> = {
  openai: [
    'gpt-5.1-chat',
    'gpt-5.1-mini',
    'gpt-5.1-nano',
    'gpt-5.0-chat',
    'gpt-5.0',
    'gpt-5.0-mini',
    'o3-mini',
    'o1',
    'o1-mini',
    'o1-preview',
    'gpt-4.1',
    'gpt-4.1-mini',
    'gpt-4.1-nano',
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo',
  ],
  azure: [
    'gpt-5.1-chat',
    'gpt-5.1-mini',
    'gpt-5.1-nano',
    'gpt-5.1-codex-mini',
    'gpt-5.0-chat',
    'gpt-5.0',
    'gpt-5.0-mini',
    'o3-mini',
    'o1',
    'o1-mini',
    'o1-preview',
    'gpt-4.1',
    'gpt-4.1-mini',
    'gpt-4.1-nano',
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-35-turbo',
  ],
  gemini: [
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
  ],
};

/**
 * Chat message role
 */
export type MessageRole = 'system' | 'user' | 'assistant';

/**
 * Individual chat message
 */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  // For assistant messages, track if it contains a query
  containsQuery?: boolean;
  // Extracted SQL query if any
  sqlQuery?: string;
}

/**
 * Chat conversation/session
 */
export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  // Optional: link to a specific tab/query context
  tabId?: string;
}

/**
 * Schema context for LLM queries
 * Formatted summary of available schemas
 */
export interface SchemaContext {
  projectId: string;
  datasets: Array<{
    datasetId: string;
    tables: Array<{
      tableId: string;
      columns: Array<{
        name: string;
        type: string;
        description?: string;
      }>;
    }>;
  }>;
}

/**
 * LLM chat request
 */
export interface ChatRequest {
  messages: ChatMessage[];
  schemaContext?: SchemaContext;
  config?: Partial<LLMConfig>;
}

/**
 * LLM chat response
 */
export interface ChatResponse {
  message: ChatMessage;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Streaming chat response chunk
 */
export interface ChatStreamChunk {
  content: string;
  isComplete: boolean;
  messageId: string;
}

/**
 * Error codes for LLM operations
 */
export enum LLMErrorCode {
  PROVIDER_NOT_CONFIGURED = 'PROVIDER_NOT_CONFIGURED',
  INVALID_API_KEY = 'INVALID_API_KEY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  MODEL_NOT_AVAILABLE = 'MODEL_NOT_AVAILABLE',
  CONTEXT_TOO_LONG = 'CONTEXT_TOO_LONG',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * LLM operation error
 */
export interface LLMError {
  code: LLMErrorCode;
  message: string;
  details?: any;
}

/**
 * System prompt template for BigQuery assistant
 */
export const DEFAULT_SYSTEM_PROMPT = `You are a BigQuery SQL expert assistant. Your role is to help users write, understand, and optimize BigQuery SQL queries.

When helping users:
1. Write clear, efficient BigQuery SQL queries based on their requirements
2. Explain query logic when asked
3. Suggest optimizations and best practices
4. Use the provided schema context to write accurate queries with correct table and column names

When writing SQL queries:
- Always use fully qualified table names (project.dataset.table)
- Use appropriate BigQuery functions and syntax
- Consider partitioning and clustering when relevant
- Wrap SQL code in markdown code blocks with \`\`\`sql

If the user's request is unclear, ask clarifying questions before writing the query.`;
