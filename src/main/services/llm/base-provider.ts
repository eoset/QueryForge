/**
 * Base LLM provider interface and abstract class
 */

import type {
  ChatMessage,
  ChatResponse,
  ChatStreamChunk,
  SchemaContext,
  LLMConfig,
  DEFAULT_SYSTEM_PROMPT,
} from '../../../shared/types/llm';

/**
 * Interface that all LLM providers must implement
 */
export interface ILLMProvider {
  /**
   * Provider name/identifier
   */
  readonly name: string;

  /**
   * Check if the provider is properly configured
   */
  isConfigured(): boolean;

  /**
   * Send a chat message and get a response
   */
  chat(
    messages: ChatMessage[],
    schemaContext?: SchemaContext,
    systemPrompt?: string
  ): Promise<ChatResponse>;

  /**
   * Send a chat message and stream the response
   * Returns an async generator that yields chunks
   */
  chatStream(
    messages: ChatMessage[],
    schemaContext?: SchemaContext,
    systemPrompt?: string
  ): AsyncGenerator<ChatStreamChunk, void, unknown>;

  /**
   * Test the connection with current configuration
   */
  testConnection(): Promise<boolean>;

  /**
   * Get the current model being used
   */
  getModel(): string;

  /**
   * Update the configuration
   */
  updateConfig(config: Partial<LLMConfig>): void;
}

/**
 * Format schema context into a readable string for the LLM
 */
export function formatSchemaContext(context: SchemaContext): string {
  if (!context.datasets || context.datasets.length === 0) {
    return '';
  }

  const lines: string[] = [
    `\n\n--- Available BigQuery Schemas (Project: ${context.projectId}) ---\n`,
  ];

  for (const dataset of context.datasets) {
    lines.push(`\nDataset: ${dataset.datasetId}`);
    
    for (const table of dataset.tables) {
      lines.push(`  Table: ${context.projectId}.${dataset.datasetId}.${table.tableId}`);
      lines.push('  Columns:');
      
      for (const column of table.columns) {
        const desc = column.description ? ` -- ${column.description}` : '';
        lines.push(`    - ${column.name} (${column.type})${desc}`);
      }
    }
  }

  lines.push('\n--- End of Schema Context ---\n');
  
  return lines.join('\n');
}

/**
 * Build the system message with optional schema context
 */
export function buildSystemMessage(
  systemPrompt: string,
  schemaContext?: SchemaContext
): string {
  let message = systemPrompt;
  
  if (schemaContext) {
    message += formatSchemaContext(schemaContext);
  }
  
  return message;
}

/**
 * Generate a unique message ID
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
