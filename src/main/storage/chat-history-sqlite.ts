/**
 * SQLite-based storage for chat conversations
 */

import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import type { ChatConversation, ChatMessage } from '../../shared/types/llm';

// Database file location
const DB_NAME = 'chat-history.db';

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
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      messages TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      tab_id TEXT
    );
    
    CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_conversations_tab ON conversations(tab_id);
  `);
  
  return db;
}

/**
 * Generate a unique conversation ID
 */
export function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new conversation
 */
export function createConversation(
  title: string = 'New Chat',
  tabId?: string
): ChatConversation {
  const database = getDatabase();
  const now = Date.now();
  
  const conversation: ChatConversation = {
    id: generateConversationId(),
    title,
    messages: [],
    createdAt: now,
    updatedAt: now,
    tabId,
  };
  
  const stmt = database.prepare(`
    INSERT INTO conversations (id, title, messages, created_at, updated_at, tab_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    conversation.id,
    conversation.title,
    JSON.stringify(conversation.messages),
    conversation.createdAt,
    conversation.updatedAt,
    conversation.tabId || null
  );
  
  return conversation;
}

/**
 * Get a conversation by ID
 */
export function getConversation(id: string): ChatConversation | null {
  const database = getDatabase();
  
  const stmt = database.prepare(`
    SELECT id, title, messages, created_at, updated_at, tab_id
    FROM conversations
    WHERE id = ?
  `);
  
  const row = stmt.get(id) as {
    id: string;
    title: string;
    messages: string;
    created_at: number;
    updated_at: number;
    tab_id: string | null;
  } | undefined;
  
  if (!row) return null;
  
  return {
    id: row.id,
    title: row.title,
    messages: JSON.parse(row.messages),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tabId: row.tab_id || undefined,
  };
}

/**
 * List all conversations (most recent first)
 */
export function listConversations(limit: number = 50, offset: number = 0): ChatConversation[] {
  const database = getDatabase();
  
  const stmt = database.prepare(`
    SELECT id, title, messages, created_at, updated_at, tab_id
    FROM conversations
    ORDER BY updated_at DESC
    LIMIT ? OFFSET ?
  `);
  
  const rows = stmt.all(limit, offset) as Array<{
    id: string;
    title: string;
    messages: string;
    created_at: number;
    updated_at: number;
    tab_id: string | null;
  }>;
  
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    messages: JSON.parse(row.messages),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tabId: row.tab_id || undefined,
  }));
}

/**
 * Update conversation (messages, title, etc.)
 */
export function updateConversation(
  id: string,
  updates: Partial<Pick<ChatConversation, 'title' | 'messages' | 'tabId'>>
): ChatConversation | null {
  const database = getDatabase();
  const existing = getConversation(id);
  
  if (!existing) return null;
  
  const updated: ChatConversation = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };
  
  const stmt = database.prepare(`
    UPDATE conversations
    SET title = ?, messages = ?, updated_at = ?, tab_id = ?
    WHERE id = ?
  `);
  
  stmt.run(
    updated.title,
    JSON.stringify(updated.messages),
    updated.updatedAt,
    updated.tabId || null,
    id
  );
  
  return updated;
}

/**
 * Add a message to a conversation
 */
export function addMessageToConversation(
  conversationId: string,
  message: ChatMessage
): ChatConversation | null {
  const conversation = getConversation(conversationId);
  if (!conversation) return null;
  
  const messages = [...conversation.messages, message];
  return updateConversation(conversationId, { messages });
}

/**
 * Update the last message in a conversation (useful for streaming)
 */
export function updateLastMessage(
  conversationId: string,
  content: string,
  additionalProps?: Partial<ChatMessage>
): ChatConversation | null {
  const conversation = getConversation(conversationId);
  if (!conversation || conversation.messages.length === 0) return null;
  
  const messages = [...conversation.messages];
  const lastIndex = messages.length - 1;
  messages[lastIndex] = {
    ...messages[lastIndex],
    content,
    ...additionalProps,
  };
  
  return updateConversation(conversationId, { messages });
}

/**
 * Delete a conversation
 */
export function deleteConversation(id: string): void {
  const database = getDatabase();
  const stmt = database.prepare('DELETE FROM conversations WHERE id = ?');
  stmt.run(id);
}

/**
 * Delete all conversations
 */
export function clearAllConversations(): void {
  const database = getDatabase();
  database.exec('DELETE FROM conversations');
}

/**
 * Get conversation count
 */
export function getConversationCount(): number {
  const database = getDatabase();
  const stmt = database.prepare('SELECT COUNT(*) as count FROM conversations');
  const row = stmt.get() as { count: number };
  return row.count;
}

/**
 * Search conversations by title or message content
 */
export function searchConversations(query: string, limit: number = 20): ChatConversation[] {
  const database = getDatabase();
  const searchPattern = `%${query}%`;
  
  const stmt = database.prepare(`
    SELECT id, title, messages, created_at, updated_at, tab_id
    FROM conversations
    WHERE title LIKE ? OR messages LIKE ?
    ORDER BY updated_at DESC
    LIMIT ?
  `);
  
  const rows = stmt.all(searchPattern, searchPattern, limit) as Array<{
    id: string;
    title: string;
    messages: string;
    created_at: number;
    updated_at: number;
    tab_id: string | null;
  }>;
  
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    messages: JSON.parse(row.messages),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tabId: row.tab_id || undefined,
  }));
}

/**
 * Get or create conversation for a tab
 */
export function getOrCreateTabConversation(tabId: string): ChatConversation {
  const database = getDatabase();
  
  // Try to find existing conversation for this tab
  const stmt = database.prepare(`
    SELECT id, title, messages, created_at, updated_at, tab_id
    FROM conversations
    WHERE tab_id = ?
    ORDER BY updated_at DESC
    LIMIT 1
  `);
  
  const row = stmt.get(tabId) as {
    id: string;
    title: string;
    messages: string;
    created_at: number;
    updated_at: number;
    tab_id: string;
  } | undefined;
  
  if (row) {
    return {
      id: row.id,
      title: row.title,
      messages: JSON.parse(row.messages),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      tabId: row.tab_id,
    };
  }
  
  // Create new conversation for this tab
  return createConversation('New Chat', tabId);
}

/**
 * Close the database connection
 */
export function closeChatHistoryDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
