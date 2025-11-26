import { ipcMain, safeStorage } from 'electron';
import { BigQuery } from '@google-cloud/bigquery';
import { validateConnectionConfig } from '../../shared/utils/connection-validation';
import type { ConnectionConfig, ConnectionConfiguration } from '../../shared/types/connection';
import { BigQueryErrorCode } from '../../shared/types/bigquery';
import {
  saveConnection,
  getSavedConnection,
  getDecryptedServiceAccountKey,
  clearConnection,
} from '../storage/connection-store';

let bigqueryClient: BigQuery | null = null;
let activeConnection: ConnectionConfiguration | null = null;

function createBigQueryClient(config: ConnectionConfig): BigQuery {
  const options: { projectId: string; keyFilename?: string; credentials?: any } = {
    projectId: config.projectId,
  };

  if (config.authType === 'service-account') {
    if (config.serviceAccountKeyPath) {
      options.keyFilename = config.serviceAccountKeyPath;
    } else if (config.serviceAccountKey) {
      try {
        options.credentials = JSON.parse(config.serviceAccountKey);
      } catch (e) {
        throw new Error('Invalid service account key JSON');
      }
    }
  }

  return new BigQuery(options);
}

export function registerConnectionHandlers(): void {
  ipcMain.handle('connection:configure', async (_event, config: ConnectionConfig) => {
    try {
      // Validate configuration
      const validation = validateConnectionConfig(config);
      if (!validation.valid) {
        throw {
          code: BigQueryErrorCode.INVALID_PROJECT_ID,
          message: validation.error || 'Invalid configuration',
        };
      }

      // Create BigQuery client
      bigqueryClient = createBigQueryClient(config);

      // Test connection by listing datasets
      await bigqueryClient.getDatasets({ maxResults: 1 });

      // Store connection configuration (encrypt sensitive data)
      const connectionConfig: ConnectionConfiguration = {
        projectId: config.projectId,
        authType: config.authType,
        serviceAccountKeyPath: config.serviceAccountKeyPath,
        location: config.location || 'EU', // Default to EU if not specified
        lastConnected: new Date().toISOString(),
        isActive: true,
      };

      // Save connection to persistent storage
      saveConnection(config, connectionConfig);

      activeConnection = connectionConfig;

      return;
    } catch (error: any) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw {
          code: BigQueryErrorCode.NETWORK_ERROR,
          message: 'Network error: Unable to connect to BigQuery',
          details: error.message,
        };
      }
      if (error.code === 403 || error.code === 401) {
        throw {
          code: BigQueryErrorCode.AUTH_ERROR,
          message: 'Authentication failed: Invalid credentials',
          details: error.message,
        };
      }
      throw {
        code: BigQueryErrorCode.CONNECTION_FAILED,
        message: 'Failed to establish connection',
        details: error.message,
      };
    }
  });

  ipcMain.handle('connection:getActive', async () => {
    return activeConnection;
  });

  ipcMain.handle('connection:test', async (_event, config: ConnectionConfig) => {
    try {
      const validation = validateConnectionConfig(config);
      if (!validation.valid) {
        return false;
      }

      const testClient = createBigQueryClient(config);
      await testClient.getDatasets({ maxResults: 1 });
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  });

  ipcMain.handle('connection:disconnect', async () => {
    bigqueryClient = null;
    activeConnection = null;
    // Don't clear saved connection - user can restore it later
  });

  ipcMain.handle('connection:getSaved', async () => {
    return getSavedConnection();
  });

  ipcMain.handle('connection:restore', async () => {
    try {
      const saved = getSavedConnection();
      if (!saved) {
        return null;
      }

      // Reconstruct ConnectionConfig from saved connection
      const config: ConnectionConfig = {
        projectId: saved.projectId,
        authType: saved.authType,
        serviceAccountKeyPath: saved.serviceAccountKeyPath,
        location: saved.location || 'EU',
      };

      // If using service account key content (not file path), decrypt it
      if (saved.authType === 'service-account' && !saved.serviceAccountKeyPath) {
        const decryptedKey = getDecryptedServiceAccountKey();
        if (decryptedKey) {
          config.serviceAccountKey = decryptedKey;
        } else {
          // Can't restore - key is missing or can't be decrypted
          // This can happen if the app name changed (which changes the encryption key)
          // Clear the saved connection so user can reconfigure
          clearConnection();
          throw new Error('Saved service account key cannot be decrypted (possibly due to app update). Please reconfigure your connection.');
        }
      }

      // Validate and test the connection
      const validation = validateConnectionConfig(config);
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid saved configuration');
      }

      // Create BigQuery client
      bigqueryClient = createBigQueryClient(config);

      // Test connection
      await bigqueryClient.getDatasets({ maxResults: 1 });

      // Update last connected timestamp
      const connectionConfig: ConnectionConfiguration = {
        ...saved,
        lastConnected: new Date().toISOString(),
        isActive: true,
      };

      // Update storage with new timestamp
      saveConnection(config, connectionConfig);

      activeConnection = connectionConfig;

      return connectionConfig;
    } catch (error: any) {
      // Clear invalid saved connection
      clearConnection();
      throw {
        code: BigQueryErrorCode.CONNECTION_FAILED,
        message: error.message || 'Failed to restore saved connection',
        details: error,
      };
    }
  });
}

export function getBigQueryClient(): BigQuery | null {
  return bigqueryClient;
}

export function getActiveConnection(): ConnectionConfiguration | null {
  return activeConnection;
}
