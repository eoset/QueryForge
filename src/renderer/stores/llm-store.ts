/**
 * Zustand store for LLM/AI chat state management
 */

import { create } from 'zustand';
import type {
  LLMProvider,
  LLMSettings,
  ChatMessage,
  ChatConversation,
  SchemaContext,
} from '../../shared/types/llm';

interface LLMState {
  // Settings
  settings: LLMSettings | null;
  activeProvider: LLMProvider | null;
  isConfigured: boolean;
  
  // Current conversation
  currentConversation: ChatConversation | null;
  conversations: ChatConversation[];
  
  // UI state
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  streamingContent: string;
  streamingMessageId: string | null;
  
  // Sidebar visibility
  sidebarVisible: boolean;
  
  // Actions - Settings
  loadSettings: () => Promise<void>;
  setActiveProvider: (provider: LLMProvider | null) => Promise<void>;
  checkIsConfigured: () => Promise<boolean>;
  
  // Actions - Conversations
  loadConversations: () => Promise<void>;
  createConversation: (title?: string, tabId?: string) => Promise<ChatConversation>;
  selectConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  clearCurrentConversation: () => void;
  
  // Actions - Messages
  sendMessage: (content: string, schemaContext?: SchemaContext) => Promise<void>;
  
  // Actions - Streaming
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (content: string) => void;
  clearStreamingContent: () => void;
  
  // Actions - UI
  setError: (error: string | null) => void;
  toggleSidebar: () => void;
  setSidebarVisible: (visible: boolean) => void;
}

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export const useLLMStore = create<LLMState>((set, get) => ({
  // Initial state
  settings: null,
  activeProvider: null,
  isConfigured: false,
  currentConversation: null,
  conversations: [],
  isLoading: false,
  isSending: false,
  error: null,
  streamingContent: '',
  streamingMessageId: null,
  sidebarVisible: false,

  // Load settings from storage
  loadSettings: async () => {
    if (!window.electronAPI?.llm) return;
    
    try {
      const settings = await window.electronAPI.llm.getSettings();
      const activeProvider = await window.electronAPI.llm.getActiveProvider();
      const isConfigured = await window.electronAPI.llm.isConfigured();
      
      set({ settings, activeProvider, isConfigured });
    } catch (error) {
      console.error('Failed to load LLM settings:', error);
    }
  },

  // Set active provider
  setActiveProvider: async (provider) => {
    if (!window.electronAPI?.llm) return;
    
    try {
      await window.electronAPI.llm.setActiveProvider(provider);
      const isConfigured = await window.electronAPI.llm.isConfigured();
      set({ activeProvider: provider, isConfigured });
    } catch (error) {
      console.error('Failed to set active provider:', error);
    }
  },

  // Check if LLM is configured
  checkIsConfigured: async () => {
    if (!window.electronAPI?.llm) return false;
    
    try {
      const isConfigured = await window.electronAPI.llm.isConfigured();
      set({ isConfigured });
      return isConfigured;
    } catch (error) {
      console.error('Failed to check if LLM is configured:', error);
      return false;
    }
  },

  // Load conversations list
  loadConversations: async () => {
    if (!window.electronAPI?.llm) return;
    
    set({ isLoading: true });
    
    try {
      const conversations = await window.electronAPI.llm.listConversations(50);
      set({ conversations, isLoading: false });
    } catch (error) {
      console.error('Failed to load conversations:', error);
      set({ isLoading: false });
    }
  },

  // Create new conversation
  createConversation: async (title, tabId) => {
    if (!window.electronAPI?.llm) {
      throw new Error('LLM API not available');
    }
    
    const conversation = await window.electronAPI.llm.createConversation(title, tabId);
    
    set((state) => ({
      currentConversation: conversation,
      conversations: [conversation, ...state.conversations],
    }));
    
    return conversation;
  },

  // Select a conversation
  selectConversation: async (id) => {
    if (!window.electronAPI?.llm) return;
    
    set({ isLoading: true });
    
    try {
      const conversation = await window.electronAPI.llm.getConversation(id);
      set({ currentConversation: conversation, isLoading: false });
    } catch (error) {
      console.error('Failed to load conversation:', error);
      set({ isLoading: false });
    }
  },

  // Delete a conversation
  deleteConversation: async (id) => {
    if (!window.electronAPI?.llm) return;
    
    try {
      await window.electronAPI.llm.deleteConversation(id);
      
      set((state) => {
        const conversations = state.conversations.filter((c) => c.id !== id);
        const currentConversation = state.currentConversation?.id === id 
          ? null 
          : state.currentConversation;
        
        return { conversations, currentConversation };
      });
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  },

  // Clear current conversation
  clearCurrentConversation: () => {
    set({ currentConversation: null, streamingContent: '', streamingMessageId: null });
  },

  // Send a message (with streaming)
  sendMessage: async (content, schemaContext) => {
    if (!window.electronAPI?.llm) {
      set({ error: 'LLM API not available' });
      return;
    }
    
    const { currentConversation, isConfigured } = get();
    
    if (!isConfigured) {
      set({ error: 'LLM provider not configured. Please configure a provider in settings.' });
      return;
    }
    
    set({ isSending: true, error: null, streamingContent: '' });
    
    try {
      // Create conversation if needed
      let conversation = currentConversation;
      if (!conversation) {
        conversation = await get().createConversation();
      }
      
      // Create user message
      const userMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };
      
      // Add user message to conversation
      const updatedConversation = await window.electronAPI.llm.addMessage(
        conversation.id,
        userMessage
      );
      
      if (updatedConversation) {
        set({ currentConversation: updatedConversation });
      }
      
      // Get all messages for the API call
      const messages = updatedConversation?.messages || [userMessage];
      
      // Start streaming chat
      const { messageId } = await window.electronAPI.llm.chatStream(
        conversation.id,
        messages,
        schemaContext
      );
      
      set({ streamingMessageId: messageId });
      
    } catch (error: any) {
      console.error('Failed to send message:', error);
      set({ 
        error: error.message || 'Failed to send message',
        isSending: false,
      });
    }
  },

  // Streaming content management
  setStreamingContent: (content) => {
    set({ streamingContent: content });
  },

  appendStreamingContent: (content) => {
    set((state) => ({ streamingContent: state.streamingContent + content }));
  },

  clearStreamingContent: () => {
    set({ streamingContent: '', streamingMessageId: null });
  },

  // Error management
  setError: (error) => {
    set({ error });
  },

  // Sidebar visibility
  toggleSidebar: () => {
    set((state) => ({ sidebarVisible: !state.sidebarVisible }));
  },

  setSidebarVisible: (visible) => {
    set({ sidebarVisible: visible });
  },
}));

/**
 * Initialize LLM store and set up streaming listeners
 */
export function initializeLLMStore(): () => void {
  const store = useLLMStore.getState();
  
  // Load initial settings
  store.loadSettings();
  store.loadConversations();
  
  // Set up streaming listeners
  if (!window.electronAPI?.llm) {
    return () => {};
  }
  
  const cleanupChunk = window.electronAPI.llm.onStreamChunk((data) => {
    const state = useLLMStore.getState();
    
    if (data.conversationId === state.currentConversation?.id) {
      state.appendStreamingContent(data.content);
    }
  });
  
  const cleanupComplete = window.electronAPI.llm.onStreamComplete(async (data) => {
    const state = useLLMStore.getState();
    
    if (data.conversationId === state.currentConversation?.id) {
      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: data.messageId,
        role: 'assistant',
        content: data.fullContent,
        timestamp: Date.now(),
        containsQuery: data.containsQuery,
        sqlQuery: data.sqlQuery,
      };
      
      // Add to conversation
      if (window.electronAPI?.llm) {
        const updated = await window.electronAPI.llm.addMessage(
          data.conversationId,
          assistantMessage
        );
        
        if (updated) {
          // Update title if it's the first response
          if (updated.messages.length <= 2 && updated.title === 'New Chat') {
            // Generate a title from the first user message
            const firstUserMsg = updated.messages.find((m) => m.role === 'user');
            if (firstUserMsg) {
              const title = firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '');
              await window.electronAPI.llm.updateConversation(data.conversationId, { title });
              updated.title = title;
            }
          }
          
          useLLMStore.setState({ 
            currentConversation: updated,
            isSending: false,
            streamingContent: '',
            streamingMessageId: null,
          });
          
          // Refresh conversations list
          state.loadConversations();
        }
      }
    }
  });
  
  const cleanupError = window.electronAPI.llm.onStreamError((data) => {
    const state = useLLMStore.getState();
    
    if (data.conversationId === state.currentConversation?.id) {
      useLLMStore.setState({
        error: data.error,
        isSending: false,
        streamingContent: '',
        streamingMessageId: null,
      });
    }
  });
  
  // Return cleanup function
  return () => {
    cleanupChunk();
    cleanupComplete();
    cleanupError();
  };
}
