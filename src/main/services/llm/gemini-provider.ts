/**
 * Google Gemini LLM Provider implementation
 */

import type {
  ChatMessage,
  ChatResponse,
  ChatStreamChunk,
  SchemaContext,
  GeminiConfig,
  LLMConfig,
} from '../../../shared/types/llm';
import {
  ILLMProvider,
  buildSystemMessage,
  generateMessageId,
} from './base-provider';

/**
 * Gemini provider implementation using native fetch
 */
export class GeminiProvider implements ILLMProvider {
  readonly name = 'gemini';
  private config: GeminiConfig | null = null;

  constructor(config?: GeminiConfig) {
    if (config) {
      this.config = config;
    }
  }

  isConfigured(): boolean {
    return !!(this.config?.apiKey);
  }

  updateConfig(config: Partial<LLMConfig>): void {
    if (config.provider === 'gemini') {
      this.config = { ...this.config, ...config } as GeminiConfig;
    }
  }

  getModel(): string {
    return this.config?.model || 'gemini-2.0-flash';
  }

  setConfig(config: GeminiConfig): void {
    this.config = config;
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const model = this.config!.model || 'gemini-2.0-flash';
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}?key=${this.config!.apiKey}`,
        { method: 'GET' }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  private getUrl(stream: boolean = false): string {
    const model = this.config!.model || 'gemini-2.0-flash';
    const action = stream ? 'streamGenerateContent' : 'generateContent';
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:${action}?key=${this.config!.apiKey}`;
  }

  private formatMessages(
    messages: ChatMessage[],
    schemaContext?: SchemaContext,
    systemPrompt?: string
  ): { contents: Array<{ role: string; parts: Array<{ text: string }> }>; systemInstruction?: { parts: Array<{ text: string }> } } {
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // Build system instruction
    const systemContent = buildSystemMessage(
      systemPrompt || '',
      schemaContext
    );

    // Add conversation messages
    for (const msg of messages) {
      if (msg.role !== 'system') {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    const result: { contents: typeof contents; systemInstruction?: { parts: Array<{ text: string }> } } = {
      contents,
    };

    if (systemContent) {
      result.systemInstruction = {
        parts: [{ text: systemContent }],
      };
    }

    return result;
  }

  async chat(
    messages: ChatMessage[],
    schemaContext?: SchemaContext,
    systemPrompt?: string
  ): Promise<ChatResponse> {
    if (!this.isConfigured()) {
      throw new Error('Gemini provider is not configured');
    }

    const { contents, systemInstruction } = this.formatMessages(messages, schemaContext, systemPrompt);

    const requestBody: any = {
      contents,
      generationConfig: {
        temperature: this.config!.temperature ?? 0.7,
        maxOutputTokens: this.config!.maxTokens ?? 4096,
      },
    };

    if (systemInstruction) {
      requestBody.systemInstruction = systemInstruction;
    }

    const response = await fetch(this.getUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(error.error?.message || `Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const content = candidate?.content?.parts?.[0]?.text || '';

    if (!content) {
      throw new Error('No response from Gemini');
    }

    const messageId = generateMessageId();

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
      usage: data.usageMetadata ? {
        promptTokens: data.usageMetadata.promptTokenCount || 0,
        completionTokens: data.usageMetadata.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata.totalTokenCount || 0,
      } : undefined,
    };
  }

  async *chatStream(
    messages: ChatMessage[],
    schemaContext?: SchemaContext,
    systemPrompt?: string
  ): AsyncGenerator<ChatStreamChunk, void, unknown> {
    if (!this.isConfigured()) {
      throw new Error('Gemini provider is not configured');
    }

    const { contents, systemInstruction } = this.formatMessages(messages, schemaContext, systemPrompt);
    const messageId = generateMessageId();

    const requestBody: any = {
      contents,
      generationConfig: {
        temperature: this.config!.temperature ?? 0.7,
        maxOutputTokens: this.config!.maxTokens ?? 4096,
      },
    };

    if (systemInstruction) {
      requestBody.systemInstruction = systemInstruction;
    }

    const response = await fetch(this.getUrl(true) + '&alt=sse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(error.error?.message || `Gemini API error: ${response.status}`);
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
          if (!trimmed) continue;
          
          if (trimmed.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (text) {
                yield { content: text, isComplete: false, messageId };
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
