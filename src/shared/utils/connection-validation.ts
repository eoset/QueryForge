import type { ConnectionConfig } from '../types/connection';

/**
 * Validates GCP project ID format
 */
export function isValidProjectId(projectId: string): boolean {
  // GCP project IDs: 6-30 characters, lowercase letters, numbers, hyphens
  // Must start with a lowercase letter
  const projectIdRegex = /^[a-z][a-z0-9-]{5,29}$/;
  return projectIdRegex.test(projectId);
}

/**
 * Validates connection configuration
 */
export function validateConnectionConfig(config: ConnectionConfig): {
  valid: boolean;
  error?: string;
} {
  if (!config.projectId || config.projectId.trim() === '') {
    return { valid: false, error: 'Project ID is required' };
  }

  if (!isValidProjectId(config.projectId)) {
    return {
      valid: false,
      error: 'Invalid project ID format. Project IDs must be 6-30 characters, start with a lowercase letter, and contain only lowercase letters, numbers, and hyphens.',
    };
  }

  if (config.authType === 'service-account') {
    if (!config.serviceAccountKeyPath && !config.serviceAccountKey) {
      return {
        valid: false,
        error: 'Service account key path or key content is required for service account authentication',
      };
    }

    if (config.serviceAccountKey) {
      try {
        JSON.parse(config.serviceAccountKey);
      } catch (e) {
        return {
          valid: false,
          error: 'Service account key must be valid JSON',
        };
      }
    }
  }

  return { valid: true };
}

