/**
 * Dataset and Table types for BigQuery
 */

export interface Dataset {
  id: string;
  name: string;
  location: string;
}

export interface Table {
  id: string;
  name: string;
  type: 'TABLE' | 'VIEW' | 'MATERIALIZED_VIEW' | 'EXTERNAL';
}

