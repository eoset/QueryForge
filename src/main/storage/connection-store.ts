import Store from 'electron-store';
import { safeStorage } from 'electron';
import type { ConnectionConfiguration, ConnectionConfig } from '../../shared/types/connection';

interface ConnectionStoreData {
  connection: ConnectionConfiguration | null;
  encryptedServiceAccountKey?: string; // Base64 encoded encrypted service account key
}

const store = new Store<ConnectionStoreData>({
  name: 'connection',
  defaults: {
    connection: null,
  },
}) as Store<ConnectionStoreData> & {
  get(key: 'connection'): ConnectionConfiguration | null;
  set(key: 'connection', value: ConnectionConfiguration | null): void;
  get(key: 'encryptedServiceAccountKey'): string | undefined;
  set(key: 'encryptedServiceAccountKey', value: string | undefined): void;
  delete(key: string): void;
};

export function getSavedConnection(): ConnectionConfiguration | null {
  return store.get('connection') || null;
}

export function saveConnection(
  config: ConnectionConfig,
  connectionConfig: ConnectionConfiguration
): ConnectionConfiguration {
  // If service account key content is provided, encrypt and store it
  if (config.serviceAccountKey && safeStorage.isEncryptionAvailable()) {
    try {
      const encryptedKey = safeStorage.encryptString(config.serviceAccountKey);
      // Convert Buffer to base64 string for storage
      const base64Key = encryptedKey.toString('base64');
      store.set('encryptedServiceAccountKey', base64Key);
    } catch (error) {
      console.error('Failed to encrypt service account key:', error);
      // Continue without storing the key - user will need to re-enter it
      store.delete('encryptedServiceAccountKey');
    }
  } else {
    // Clear encrypted key if not provided
    store.delete('encryptedServiceAccountKey');
  }

  // Store connection configuration (without sensitive key content)
  store.set('connection', connectionConfig);

  return connectionConfig;
}

export function getDecryptedServiceAccountKey(): string | null {
  const base64Key = store.get('encryptedServiceAccountKey');
  if (!base64Key) {
    return null;
  }

  if (!safeStorage.isEncryptionAvailable()) {
    console.warn('Encryption not available, cannot decrypt service account key');
    return null;
  }

  try {
    // Convert base64 string back to Buffer
    const encryptedKey = Buffer.from(base64Key, 'base64');
    return safeStorage.decryptString(encryptedKey);
  } catch (error) {
    console.error('Failed to decrypt service account key:', error);
    // If decryption fails (e.g., due to app name change), clear the old encrypted data
    // This can happen when the app name changes and the encryption key changes
    console.warn('Clearing old encrypted service account key due to decryption failure');
    store.delete('encryptedServiceAccountKey');
    return null;
  }
}

export function clearConnection(): void {
  store.set('connection', null);
  store.delete('encryptedServiceAccountKey');
}

