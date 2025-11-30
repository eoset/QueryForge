import {
  isValidProjectId,
  validateConnectionConfig,
} from '../../../src/shared/utils/connection-validation';
import type { ConnectionConfig } from '../../../src/shared/types/connection';

describe('connection-validation', () => {
  describe('isValidProjectId', () => {
    it('should return true for valid project IDs', () => {
      expect(isValidProjectId('my-project')).toBe(true);
      expect(isValidProjectId('my-project-123')).toBe(true);
      expect(isValidProjectId('project123')).toBe(true);
      expect(isValidProjectId('a12345')).toBe(true); // minimum 6 chars
      expect(isValidProjectId('abcdef012345678901234567890')).toBe(true); // 27 chars
      expect(isValidProjectId('my-gcp-project-id')).toBe(true);
    });

    it('should return false for project IDs starting with numbers', () => {
      expect(isValidProjectId('123project')).toBe(false);
      expect(isValidProjectId('1my-project')).toBe(false);
    });

    it('should return false for project IDs starting with hyphens', () => {
      expect(isValidProjectId('-my-project')).toBe(false);
    });

    it('should return false for project IDs that are too short', () => {
      expect(isValidProjectId('abc')).toBe(false);
      expect(isValidProjectId('abcde')).toBe(false); // 5 chars - too short
    });

    it('should return false for project IDs that are too long', () => {
      expect(isValidProjectId('a'.repeat(31))).toBe(false); // 31 chars - too long
    });

    it('should return false for project IDs with uppercase letters', () => {
      expect(isValidProjectId('My-Project')).toBe(false);
      expect(isValidProjectId('MYPROJECT')).toBe(false);
    });

    it('should return false for project IDs with invalid characters', () => {
      expect(isValidProjectId('my_project')).toBe(false); // underscore
      expect(isValidProjectId('my.project')).toBe(false); // dot
      expect(isValidProjectId('my project')).toBe(false); // space
      expect(isValidProjectId('my@project')).toBe(false); // @
    });

    it('should return false for empty strings', () => {
      expect(isValidProjectId('')).toBe(false);
    });
  });

  describe('validateConnectionConfig', () => {
    describe('Project ID validation', () => {
      it('should return error for missing project ID', () => {
        const config: ConnectionConfig = {
          projectId: '',
          authType: 'application-default',
        };
        const result = validateConnectionConfig(config);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Project ID is required');
      });

      it('should return error for whitespace-only project ID', () => {
        const config: ConnectionConfig = {
          projectId: '   ',
          authType: 'application-default',
        };
        const result = validateConnectionConfig(config);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Project ID is required');
      });

      it('should return error for invalid project ID format', () => {
        const config: ConnectionConfig = {
          projectId: 'Invalid-Project',
          authType: 'application-default',
        };
        const result = validateConnectionConfig(config);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid project ID format');
      });
    });

    describe('Application default authentication', () => {
      it('should validate config with application-default auth', () => {
        const config: ConnectionConfig = {
          projectId: 'valid-project-id',
          authType: 'application-default',
        };
        const result = validateConnectionConfig(config);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should validate config with location', () => {
        const config: ConnectionConfig = {
          projectId: 'valid-project-id',
          authType: 'application-default',
          location: 'US',
        };
        const result = validateConnectionConfig(config);
        expect(result.valid).toBe(true);
      });
    });

    describe('Service account authentication', () => {
      it('should return error when no key path or key content provided', () => {
        const config: ConnectionConfig = {
          projectId: 'valid-project-id',
          authType: 'service-account',
        };
        const result = validateConnectionConfig(config);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Service account key path or key content is required');
      });

      it('should validate config with service account key path', () => {
        const config: ConnectionConfig = {
          projectId: 'valid-project-id',
          authType: 'service-account',
          serviceAccountKeyPath: '/path/to/key.json',
        };
        const result = validateConnectionConfig(config);
        expect(result.valid).toBe(true);
      });

      it('should validate config with valid service account key JSON', () => {
        const config: ConnectionConfig = {
          projectId: 'valid-project-id',
          authType: 'service-account',
          serviceAccountKey: JSON.stringify({
            type: 'service_account',
            project_id: 'test-project',
            private_key_id: 'key-id',
          }),
        };
        const result = validateConnectionConfig(config);
        expect(result.valid).toBe(true);
      });

      it('should return error for invalid service account key JSON', () => {
        const config: ConnectionConfig = {
          projectId: 'valid-project-id',
          authType: 'service-account',
          serviceAccountKey: 'invalid-json',
        };
        const result = validateConnectionConfig(config);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Service account key must be valid JSON');
      });

      it('should return error for malformed JSON in service account key', () => {
        const config: ConnectionConfig = {
          projectId: 'valid-project-id',
          authType: 'service-account',
          serviceAccountKey: '{ "type": "service_account"', // Missing closing brace
        };
        const result = validateConnectionConfig(config);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Service account key must be valid JSON');
      });
    });

    describe('Optional fields', () => {
      it('should validate config with dbt support enabled', () => {
        const config: ConnectionConfig = {
          projectId: 'valid-project-id',
          authType: 'application-default',
          enableDbtSupport: true,
        };
        const result = validateConnectionConfig(config);
        expect(result.valid).toBe(true);
      });

      it('should validate config with all optional fields', () => {
        const config: ConnectionConfig = {
          projectId: 'valid-project-id',
          authType: 'service-account',
          serviceAccountKeyPath: '/path/to/key.json',
          location: 'EU',
          enableDbtSupport: false,
        };
        const result = validateConnectionConfig(config);
        expect(result.valid).toBe(true);
      });
    });
  });
});
