/**
 * OpenAI LLM Provider implementation
 */

import type {
  ChatMessage,
  ChatResponse,
  ChatStreamChunk,
  SchemaContext,
  OpenAIConfig,
  LLMConfig,
  DEFAULT_SYSTEM_PROMPT,
} from '../../../shared/types/llm';
import {
  ILLMProvider,
  buildSystemMessage,
  generateMessageId,
} from './base-provider';

/**
 * OpenAI provider implementation using native fetch
 */
export class OpenAIProvider implements ILLMProvider {
  readonly name = 'openai';
  private config: OpenAIConfig | null = null;

  constructor(config?: OpenAIConfig) {
    if (config) {
      this.config = config;
    }
  }

  isConfigured(): boolean {
    return !!(this.config?.apiKey);
  }

  updateConfig(config: Partial<LLMConfig>): void {
    if (config.provider === 'openai') {
      this.config = { ...this.config, ...config } as OpenAIConfig;
    }
  }

  getModel(): string {
    return this.config?.model || 'gpt-4o';
  }

  setConfig(config: OpenAIConfig): void {
    this.config = config;
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const response = await fetch(`${this.getBaseUrl()}/models`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  private getBaseUrl(): string {
    return this.config?.baseUrl || 'https://api.openai.com/v1';
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config?.apiKey}`,
    };

    if (this.config?.organization) {
      headers['OpenAI-Organization'] = this.config.organization;
    }

    return headers;
  }

  private formatMessages(
    messages: ChatMessage[],
    schemaContext?: SchemaContext,
    systemPrompt?: string
  ): Array<{ role: string; content: string }> {
    const formattedMessages: Array<{ role: string; content: string }> = [];

    // Add system message with schema context
    const systemContent = buildSystemMessage(
      systemPrompt || '',
      schemaContext
    );
    
    if (systemContent) {
      formattedMessages.push({
        role: 'system',
        content: systemContent,
      });
    }

    // Add conversation messages
    for (const msg of messages) {
      if (msg.role !== 'system') {
        formattedMessages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    return formattedMessages;
  }

  async chat(
    messages: ChatMessage[],
    schemaContext?: SchemaContext,
    systemPrompt?: string
  ): Promise<ChatResponse> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI provider is not configured');
    }

    const formattedMessages = this.formatMessages(messages, schemaContext, systemPrompt);

    const response = await fetch(`${this.getBaseUrl()}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: this.config!.model || 'gpt-4o',
        messages: formattedMessages,
        temperature: this.config!.temperature ?? 0.7,
        max_tokens: this.config!.maxTokens ?? 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message;

    if (!assistantMessage) {
      throw new Error('No response from OpenAI');
    }

    const messageId = generateMessageId();
    const content = assistantMessage.content || '';

    // Check if the response contains SQL
    const sqlMatch = content.match(/```sql\n([\s\S]*?)```/);
    const sqlQuery = sqlMatch ? sqlMatch[1].trim() : undefined;

    return {
      message: {
        id: messageId,
        role: 'assistant',
        content,
        timestamp: Date.now(),
        containsQuery: !!sqlQuery,
        sqlQuery,
      },
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  }

  async *chatStream(
    messages: ChatMessage[],
    schemaContext?: SchemaContext,
    systemPrompt?: string
  ): AsyncGenerator<ChatStreamChunk, void, unknown> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI provider is not configured');
    }

    const formattedMessages = this.formatMessages(messages, schemaContext, systemPrompt);
    const messageId = generateMessageId();

    const response = await fetch(`${this.getBaseUrl()}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: this.config!.model || 'gpt-4o',
        messages: formattedMessages,
        temperature: this.config!.temperature ?? 0.7,
        max_tokens: this.config!.maxTokens ?? 4096,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          yield { content: '', isComplete: true, messageId };
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          
          if (trimmed.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              const content = json.choices?.[0]?.delta?.content || '';
              if (content) {
                yield { content, isComplete: false, messageId };
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
