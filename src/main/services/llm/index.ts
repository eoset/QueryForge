/**
 * LLM Service - Main entry point for LLM operations
 * Manages providers and handles chat operations
 */

import type {
  LLMProvider,
  LLMConfig,
  LLMSettings,
  ChatMessage,
  ChatResponse,
  ChatStreamChunk,
  SchemaContext,
  OpenAIConfig,
  AzureOpenAIConfig,
  GeminiConfig,
  DEFAULT_SYSTEM_PROMPT,
} from '../../../shared/types/llm';
import { ILLMProvider } from './base-provider';
import { OpenAIProvider } from './openai-provider';
import { AzureOpenAIProvider } from './azure-provider';
import { GeminiProvider } from './gemini-provider';

/**
 * LLM Service singleton that manages all LLM providers
 */
class LLMService {
  private providers: Map<LLMProvider, ILLMProvider> = new Map();
  private activeProvider: LLMProvider | null = null;
  private systemPrompt: string = '';

  constructor() {
    // Initialize providers
    this.providers.set('openai', new OpenAIProvider());
    this.providers.set('azure', new AzureOpenAIProvider());
    this.providers.set('gemini', new GeminiProvider());
  }

  /**
   * Configure a specific provider
   */
  configureProvider(config: LLMConfig): void {
    const provider = this.providers.get(config.provider);
    if (!provider) {
      throw new Error(`Unknown provider: ${config.provider}`);
    }

    switch (config.provider) {
      case 'openai':
        (provider as OpenAIProvider).setConfig(config as OpenAIConfig);
        break;
      case 'azure':
        (provider as AzureOpenAIProvider).setConfig(config as AzureOpenAIConfig);
        break;
      case 'gemini':
        (provider as GeminiProvider).setConfig(config as GeminiConfig);
        break;
    }
  }

  /**
   * Set the active provider
   */
  setActiveProvider(provider: LLMProvider | null): void {
    if (provider && !this.providers.has(provider)) {
      throw new Error(`Unknown provider: ${provider}`);
    }
    this.activeProvider = provider;
  }

  /**
   * Get the active provider
   */
  getActiveProvider(): ILLMProvider | null {
    if (!this.activeProvider) {
      return null;
    }
    return this.providers.get(this.activeProvider) || null;
  }

  /**
   * Get the active provider name
   */
  getActiveProviderName(): LLMProvider | null {
    return this.activeProvider;
  }

  /**
   * Set the system prompt
   */
  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
  }

  /**
   * Get the system prompt
   */
  getSystemPrompt(): string {
    return this.systemPrompt;
  }

  /**
   * Check if any provider is configured and active
   */
  isConfigured(): boolean {
    const provider = this.getActiveProvider();
    return provider?.isConfigured() ?? false;
  }

  /**
   * Test connection for the active provider
   */
  async testConnection(): Promise<boolean> {
    const provider = this.getActiveProvider();
    if (!provider) {
      return false;
    }
    return provider.testConnection();
  }

  /**
   * Test connection for a specific provider
   */
  async testProviderConnection(providerName: LLMProvider): Promise<boolean> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      return false;
    }
    return provider.testConnection();
  }

  /**
   * Send a chat message and get a response
   */
  async chat(
    messages: ChatMessage[],
    schemaContext?: SchemaContext
  ): Promise<ChatResponse> {
    const provider = this.getActiveProvider();
    if (!provider) {
      throw new Error('No active LLM provider configured');
    }

    if (!provider.isConfigured()) {
      throw new Error(`Provider ${this.activeProvider} is not properly configured`);
    }

    return provider.chat(messages, schemaContext, this.systemPrompt);
  }

  /**
   * Send a chat message and stream the response
   */
  async *chatStream(
    messages: ChatMessage[],
    schemaContext?: SchemaContext
  ): AsyncGenerator<ChatStreamChunk, void, unknown> {
    const provider = this.getActiveProvider();
    if (!provider) {
      throw new Error('No active LLM provider configured');
    }

    if (!provider.isConfigured()) {
      throw new Error(`Provider ${this.activeProvider} is not properly configured`);
    }

    yield* provider.chatStream(messages, schemaContext, this.systemPrompt);
  }

  /**
   * Get the current model for the active provider
   */
  getCurrentModel(): string | null {
    const provider = this.getActiveProvider();
    return provider?.getModel() ?? null;
  }

  /**
   * Check if a specific provider is configured
   */
  isProviderConfigured(providerName: LLMProvider): boolean {
    const provider = this.providers.get(providerName);
    return provider?.isConfigured() ?? false;
  }
}

// Export singleton instance
export const llmService = new LLMService();

// Export types and classes for testing
export { OpenAIProvider, AzureOpenAIProvider, GeminiProvider };
export type { ILLMProvider };
