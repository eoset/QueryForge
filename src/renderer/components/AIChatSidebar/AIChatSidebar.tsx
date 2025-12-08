/**
 * AI Chat Sidebar Component
 * Provides a chat interface for interacting with LLMs to help write BigQuery queries
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLLMStore, initializeLLMStore } from '../../stores/llm-store';
import { useSchemaCacheStore } from '../../stores/schema-cache-store';
import { useConnectionStore } from '../../stores/connection-store';
import { useTabsStore } from '../../stores/tabs-store';
import type { ChatMessage, SchemaContext } from '../../../shared/types/llm';
import './AIChatSidebar.css';

interface AIChatSidebarProps {
  onClose: () => void;
  onOpenSettings: () => void;
  onInsertQuery?: (query: string) => void;
}

export const AIChatSidebar: React.FC<AIChatSidebarProps> = ({
  onClose,
  onOpenSettings,
  onInsertQuery,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    currentConversation,
    conversations,
    isConfigured,
    isSending,
    error,
    streamingContent,
    sendMessage,
    createConversation,
    selectConversation,
    deleteConversation,
    clearCurrentConversation,
    loadConversations,
    setError,
  } = useLLMStore();
  
  const connection = useConnectionStore((state) => state.connection);
  const schemas = useSchemaCacheStore((state) => state.schemas);
  const setSchema = useSchemaCacheStore((state) => state.setSchema);
  const { activeTabId } = useTabsStore();
  const [schemaLoadAttempted, setSchemaLoadAttempted] = useState(false);

  // Initialize store on mount
  useEffect(() => {
    const cleanup = initializeLLMStore();
    return cleanup;
  }, []);

  // Load cached schemas from SQLite when sidebar opens (if not already in memory)
  useEffect(() => {
    const loadCachedSchemas = async () => {
      if (!window.electronAPI?.schemaCache || !connection || schemaLoadAttempted) {
        return;
      }
      
      if (schemas.size > 0) {
        // Already have schemas in memory
        setSchemaLoadAttempted(true);
        return;
      }

      try {
        // Load all cached schemas for this project from SQLite
        const cachedSchemas = await window.electronAPI.schemaCache.getForProject(connection.projectId);
        
        // Populate in-memory store with cached schemas
        for (const schema of cachedSchemas) {
          setSchema(schema.datasetId, schema.tableId, schema.fields);
        }
        
        console.log(`AI Chat: Loaded ${cachedSchemas.length} schemas from cache`);
      } catch (err) {
        console.warn('AI Chat: Failed to load cached schemas:', err);
      }
      
      setSchemaLoadAttempted(true);
    };

    loadCachedSchemas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection, schemaLoadAttempted]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages, streamingContent]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Refocus input when sending completes (isSending goes from true to false)
  const prevIsSendingRef = useRef(isSending);
  useEffect(() => {
    if (prevIsSendingRef.current && !isSending) {
      // isSending just became false, refocus the input
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
    prevIsSendingRef.current = isSending;
  }, [isSending]);

  // Build schema context from cached schemas
  const buildSchemaContext = useCallback((): SchemaContext | undefined => {
    if (!connection?.projectId || schemas.size === 0) {
      return undefined;
    }

    const datasetMap = new Map<string, Array<{
      tableId: string;
      columns: Array<{ name: string; type: string; description?: string }>;
    }>>();

    for (const [, schema] of schemas) {
      const existing = datasetMap.get(schema.datasetId) || [];
      existing.push({
        tableId: schema.tableId,
        columns: schema.fields.map((f) => ({
          name: f.name,
          type: f.type,
        })),
      });
      datasetMap.set(schema.datasetId, existing);
    }

    const datasets = Array.from(datasetMap.entries()).map(([datasetId, tables]) => ({
      datasetId,
      tables,
    }));

    // Limit context to avoid overwhelming the LLM
    const MAX_DATASETS = 50;
    const MAX_TABLES_PER_DATASET = 100;
    const MAX_COLUMNS_PER_TABLE = 100;
    
    const limitedDatasets = datasets.slice(0, MAX_DATASETS);
    for (const dataset of limitedDatasets) {
      dataset.tables = dataset.tables.slice(0, MAX_TABLES_PER_DATASET);
      for (const table of dataset.tables) {
        table.columns = table.columns.slice(0, MAX_COLUMNS_PER_TABLE);
      }
    }

    return {
      projectId: connection.projectId,
      datasets: limitedDatasets,
    };
  }, [connection?.projectId, schemas]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;

    const message = inputValue.trim();
    setInputValue('');
    setError(null);

    const schemaContext = buildSchemaContext();
    await sendMessage(message, schemaContext);
    
    // Refocus the input after sending
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = async () => {
    setError(null);
    await createConversation('New Chat', activeTabId || undefined);
  };

  const handleInsertQuery = (query: string) => {
    if (onInsertQuery) {
      onInsertQuery(query);
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message: ChatMessage, isStreaming = false) => {
    const content = isStreaming ? streamingContent : message.content;
    
    // Parse content for SQL code blocks
    const parts = content.split(/(```sql\n[\s\S]*?```)/g);
    
    return (
      <div key={message.id} className={`chat-message chat-message-${message.role}`}>
        <div className="chat-message-header">
          <span className="chat-message-role">
            {message.role === 'user' ? 'You' : 'AI Assistant'}
          </span>
          <span className="chat-message-time">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
        <div className="chat-message-content">
          {parts.map((part, index) => {
            if (part.startsWith('```sql\n') && part.endsWith('```')) {
              const sql = part.slice(7, -3).trim();
              return (
                <div key={index} className="chat-code-block">
                  <div className="chat-code-header">
                    <span>SQL</span>
                    <button
                      className="chat-code-insert-btn"
                      onClick={() => handleInsertQuery(sql)}
                      title="Insert into editor"
                    >
                      Insert Query
                    </button>
                  </div>
                  <pre><code>{sql}</code></pre>
                </div>
              );
            }
            return <span key={index}>{part}</span>;
          })}
          {isStreaming && <span className="chat-cursor">▋</span>}
        </div>
      </div>
    );
  };

  const renderConversationsList = () => {
    if (conversations.length === 0) {
      return (
        <div className="chat-history-empty">
          No previous conversations
        </div>
      );
    }

    return (
      <div className="chat-history-list">
        {conversations.slice(0, 10).map((conv) => (
          <div
            key={conv.id}
            className={`chat-history-item ${currentConversation?.id === conv.id ? 'active' : ''}`}
            onClick={() => selectConversation(conv.id)}
          >
            <span className="chat-history-title">{conv.title}</span>
            <button
              className="chat-history-delete"
              onClick={(e) => {
                e.stopPropagation();
                deleteConversation(conv.id);
              }}
              title="Delete conversation"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="ai-chat-sidebar">
      <div className="ai-chat-header">
        <div className="ai-chat-title">
          <span className="ai-chat-icon">✨</span>
          <span>AI Assistant</span>
        </div>
        <div className="ai-chat-header-actions">
          <button
            className="ai-chat-btn"
            onClick={handleNewChat}
            title="New conversation"
          >
            +
          </button>
          <button
            className="ai-chat-btn"
            onClick={onOpenSettings}
            title="Settings"
          >
            ⚙
          </button>
          <button
            className="ai-chat-btn ai-chat-close"
            onClick={onClose}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {!isConfigured && (
        <div className="ai-chat-setup-banner">
          <p>Configure an AI provider to start chatting</p>
          <button onClick={onOpenSettings}>Configure Settings</button>
        </div>
      )}

      <div className="ai-chat-history">
        <div className="ai-chat-history-header">
          <span>Recent Chats</span>
          <button
            className="ai-chat-btn-text"
            onClick={loadConversations}
            title="Refresh"
          >
            ↻
          </button>
        </div>
        {renderConversationsList()}
      </div>

      <div className="ai-chat-messages">
        {currentConversation?.messages.map((msg) => renderMessage(msg))}
        {isSending && streamingContent && renderMessage({
          id: 'streaming',
          role: 'assistant',
          content: streamingContent,
          timestamp: Date.now(),
        }, true)}
        {isSending && !streamingContent && (
          <div className="chat-message chat-message-assistant">
            <div className="chat-message-content chat-typing">
              <span>●</span><span>●</span><span>●</span>
            </div>
          </div>
        )}
        {error && (
          <div className="chat-error">
            <span className="chat-error-icon">⚠</span>
            <span>{error}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="ai-chat-input-container">
        <textarea
          ref={inputRef}
          className="ai-chat-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isConfigured ? "Ask about your data or request a query..." : "Configure an AI provider first..."}
          disabled={!isConfigured || isSending}
          rows={3}
        />
        <button
          className="ai-chat-send-btn"
          onClick={handleSend}
          disabled={!isConfigured || !inputValue.trim() || isSending}
          title="Send message"
        >
          {isSending ? '...' : '→'}
        </button>
      </div>

      <div className="ai-chat-footer">
        <span className="ai-chat-schema-status">
          {!schemaLoadAttempted && connection
            ? 'Loading schemas...'
            : schemas.size > 0 
              ? `${schemas.size} tables available for context`
              : connection 
                ? 'No cached schemas. Use ⌘P to load schemas.'
                : 'Connect to BigQuery first'}
        </span>
      </div>
    </div>
  );
};
