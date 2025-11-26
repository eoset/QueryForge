/**
 * Connection configuration types for BigQuery
 */

export interface ConnectionConfig {
  projectId: string;
  authType: 'service-account' | 'application-default';
  serviceAccountKeyPath?: string;
  serviceAccountKey?: string; // JSON string content
  location?: string; // BigQuery location (defaults to 'EU')
}

export interface ConnectionConfiguration {
  projectId: string;
  authType: 'service-account' | 'application-default';
  serviceAccountKeyPath?: string;
  location?: string; // BigQuery location (defaults to 'EU')
  lastConnected?: string; // ISO timestamp
  isActive: boolean;
}

