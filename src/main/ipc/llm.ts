/**
 * IPC handlers for LLM operations
 */

import { ipcMain, BrowserWindow } from 'electron';
import { llmService } from '../services/llm';
import {
  getLLMSettings,
  saveLLMSettings,
  saveProviderConfig,
  updateProviderConfig,
  getProviderConfig,
  deleteProviderConfig,
  setActiveProvider,
  getActiveProvider,
  saveSystemPrompt,
  getSystemPrompt,
  hasApiKey,
  closeLLMDatabase,
} from '../storage/llm-store';
import {
  createConversation,
  getConversation,
  listConversations,
  updateConversation,
  addMessageToConversation,
  updateLastMessage,
  deleteConversation,
  clearAllConversations,
  searchConversations,
  getOrCreateTabConversation,
  closeChatHistoryDatabase,
} from '../storage/chat-history-sqlite';
import type {
  LLMProvider,
  LLMConfig,
  LLMSettings,
  ChatMessage,
  ChatConversation,
  SchemaContext,
  ChatResponse,
  LLMErrorCode,
  DEFAULT_SYSTEM_PROMPT,
} from '../../shared/types/llm';
import { DEFAULT_SYSTEM_PROMPT as defaultSystemPrompt } from '../../shared/types/llm';

/**
 * Initialize the LLM service with stored settings
 */
function initializeLLMService(): void {
  const settings = getLLMSettings();
  
  // Configure providers from stored settings
  for (const provider of ['openai', 'azure', 'gemini'] as LLMProvider[]) {
    const config = getProviderConfig(provider);
    if (config) {
      llmService.configureProvider(config);
    }
  }
  
  // Set active provider
  if (settings.activeProvider) {
    llmService.setActiveProvider(settings.activeProvider);
  }
  
  // Set system prompt
  const systemPrompt = getSystemPrompt() || defaultSystemPrompt;
  llmService.setSystemPrompt(systemPrompt);
}

export function registerLLMHandlers(): void {
  // Initialize service on registration
  initializeLLMService();

  // === Settings Management ===
  
  // Get LLM settings (without API keys)
  ipcMain.handle('llm:getSettings', async (): Promise<LLMSettings> => {
    return getLLMSettings();
  });

  // Save LLM settings
  ipcMain.handle('llm:saveSettings', async (_event, settings: LLMSettings): Promise<void> => {
    saveLLMSettings(settings);
  });

  // Configure a provider (with API key)
  ipcMain.handle('llm:configureProvider', async (_event, config: LLMConfig): Promise<void> => {
    saveProviderConfig(config);
    llmService.configureProvider(config);
  });

  // Get provider config (without API key for security)
  ipcMain.handle('llm:getProviderConfig', async (_event, provider: LLMProvider): Promise<Omit<LLMConfig, 'apiKey'> | null> => {
    const config = getProviderConfig(provider);
    if (!config) return null;
    
    // Remove API key before sending to renderer
    const { apiKey, ...safeConfig } = config as any;
    return safeConfig;
  });

  // Update provider config without changing API key
  ipcMain.handle('llm:updateProviderConfig', async (_event, provider: LLMProvider, updates: Partial<Omit<LLMConfig, 'apiKey' | 'provider'>>): Promise<void> => {
    updateProviderConfig(provider, updates);
    // Reload the provider config in the service
    const config = getProviderConfig(provider);
    if (config) {
      llmService.configureProvider(config);
    }
  });

  // Check if provider has API key
  ipcMain.handle('llm:hasApiKey', async (_event, provider: LLMProvider): Promise<boolean> => {
    return hasApiKey(provider);
  });

  // Delete provider config
  ipcMain.handle('llm:deleteProviderConfig', async (_event, provider: LLMProvider): Promise<void> => {
    deleteProviderConfig(provider);
    // Reconfigure service
    if (getActiveProvider() === provider) {
      setActiveProvider(null);
      llmService.setActiveProvider(null);
    }
  });

  // Set active provider
  ipcMain.handle('llm:setActiveProvider', async (_event, provider: LLMProvider | null): Promise<void> => {
    setActiveProvider(provider);
    llmService.setActiveProvider(provider);
    
    // Reload provider config if needed
    if (provider) {
      const config = getProviderConfig(provider);
      if (config) {
        llmService.configureProvider(config);
      }
    }
  });

  // Get active provider
  ipcMain.handle('llm:getActiveProvider', async (): Promise<LLMProvider | null> => {
    return getActiveProvider();
  });

  // Save system prompt
  ipcMain.handle('llm:saveSystemPrompt', async (_event, prompt: string): Promise<void> => {
    saveSystemPrompt(prompt);
    llmService.setSystemPrompt(prompt);
  });

  // Get system prompt
  ipcMain.handle('llm:getSystemPrompt', async (): Promise<string> => {
    return getSystemPrompt() || defaultSystemPrompt;
  });

  // Test provider connection
  ipcMain.handle('llm:testConnection', async (_event, provider?: LLMProvider): Promise<{ success: boolean; error?: string }> => {
    try {
      let result: boolean;
      if (provider) {
        result = await llmService.testProviderConnection(provider);
      } else {
        result = await llmService.testConnection();
      }
      
      if (!result) {
        return { 
          success: false, 
          error: 'Connection test failed. Check the console for details (View > Toggle Developer Tools).' 
        };
      }
      return { success: true };
    } catch (error: any) {
      console.error('LLM connection test error:', error);
      return { 
        success: false, 
        error: error.message || 'Unknown error during connection test' 
      };
    }
  });

  // Check if LLM is configured
  ipcMain.handle('llm:isConfigured', async (): Promise<boolean> => {
    return llmService.isConfigured();
  });

  // === Chat Operations ===

  // Send chat message (non-streaming)
  ipcMain.handle(
    'llm:chat',
    async (
      _event,
      messages: ChatMessage[],
      schemaContext?: SchemaContext
    ): Promise<ChatResponse> => {
      if (!llmService.isConfigured()) {
        throw {
          code: 'PROVIDER_NOT_CONFIGURED' as LLMErrorCode,
          message: 'No LLM provider is configured. Please configure a provider in settings.',
        };
      }

      try {
        return await llmService.chat(messages, schemaContext);
      } catch (error: any) {
        throw {
          code: 'UNKNOWN_ERROR' as LLMErrorCode,
          message: error.message || 'Failed to get chat response',
          details: error,
        };
      }
    }
  );

  // Send chat message (streaming) - sends chunks via IPC events
  ipcMain.handle(
    'llm:chatStream',
    async (
      event,
      conversationId: string,
      messages: ChatMessage[],
      schemaContext?: SchemaContext
    ): Promise<{ messageId: string }> => {
      if (!llmService.isConfigured()) {
        throw {
          code: 'PROVIDER_NOT_CONFIGURED' as LLMErrorCode,
          message: 'No LLM provider is configured. Please configure a provider in settings.',
        };
      }

      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Could not find window');
      }

      let messageId = '';
      let fullContent = '';

      try {
        const stream = llmService.chatStream(messages, schemaContext);
        
        for await (const chunk of stream) {
          messageId = chunk.messageId;
          fullContent += chunk.content;
          
          // Send chunk to renderer
          window.webContents.send('llm:streamChunk', {
            conversationId,
            messageId: chunk.messageId,
            content: chunk.content,
            isComplete: chunk.isComplete,
          });
        }

        // Check if the response contains SQL
        const sqlMatch = fullContent.match(/```sql\n([\s\S]*?)```/);
        const sqlQuery = sqlMatch ? sqlMatch[1].trim() : undefined;

        // Send final message info
        window.webContents.send('llm:streamComplete', {
          conversationId,
          messageId,
          fullContent,
          containsQuery: !!sqlQuery,
          sqlQuery,
        });

        return { messageId };
      } catch (error: any) {
        window.webContents.send('llm:streamError', {
          conversationId,
          error: error.message || 'Streaming failed',
        });
        
        throw {
          code: 'UNKNOWN_ERROR' as LLMErrorCode,
          message: error.message || 'Failed to stream chat response',
          details: error,
        };
      }
    }
  );

  // === Conversation Management ===

  // Create conversation
  ipcMain.handle(
    'llm:createConversation',
    async (_event, title?: string, tabId?: string): Promise<ChatConversation> => {
      return createConversation(title, tabId);
    }
  );

  // Get conversation
  ipcMain.handle(
    'llm:getConversation',
    async (_event, id: string): Promise<ChatConversation | null> => {
      return getConversation(id);
    }
  );

  // List conversations
  ipcMain.handle(
    'llm:listConversations',
    async (_event, limit?: number, offset?: number): Promise<ChatConversation[]> => {
      return listConversations(limit, offset);
    }
  );

  // Update conversation
  ipcMain.handle(
    'llm:updateConversation',
    async (
      _event,
      id: string,
      updates: Partial<Pick<ChatConversation, 'title' | 'messages' | 'tabId'>>
    ): Promise<ChatConversation | null> => {
      return updateConversation(id, updates);
    }
  );

  // Add message to conversation
  ipcMain.handle(
    'llm:addMessage',
    async (_event, conversationId: string, message: ChatMessage): Promise<ChatConversation | null> => {
      return addMessageToConversation(conversationId, message);
    }
  );

  // Delete conversation
  ipcMain.handle('llm:deleteConversation', async (_event, id: string): Promise<void> => {
    deleteConversation(id);
  });

  // Clear all conversations
  ipcMain.handle('llm:clearConversations', async (): Promise<void> => {
    clearAllConversations();
  });

  // Search conversations
  ipcMain.handle(
    'llm:searchConversations',
    async (_event, query: string, limit?: number): Promise<ChatConversation[]> => {
      return searchConversations(query, limit);
    }
  );

  // Get or create tab conversation
  ipcMain.handle(
    'llm:getTabConversation',
    async (_event, tabId: string): Promise<ChatConversation> => {
      return getOrCreateTabConversation(tabId);
    }
  );
}

/**
 * Close LLM databases
 */
export function closeLLMDatabases(): void {
  closeLLMDatabase();
  closeChatHistoryDatabase();
}
