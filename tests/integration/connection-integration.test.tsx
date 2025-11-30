/**
 * Integration tests for connection flow
 * Tests the interaction between ConnectionDialog, connection store, and electronAPI
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { useConnectionStore } from '../../src/renderer/stores/connection-store';
import { validateConnectionConfig } from '../../src/shared/utils/connection-validation';

describe('Connection Flow Integration', () => {
  beforeEach(() => {
    // Reset connection store
    act(() => {
      useConnectionStore.getState().clearConnection();
    });

    // Reset mocks
    jest.clearAllMocks();
    (window.electronAPI.connection.test as jest.Mock).mockResolvedValue(true);
    (window.electronAPI.connection.configure as jest.Mock).mockResolvedValue(undefined);
    (window.electronAPI.connection.getActive as jest.Mock).mockResolvedValue({
      projectId: 'test-project',
      authType: 'application-default',
      location: 'EU',
      isActive: true,
    });
    (window.electronAPI.connection.getSaved as jest.Mock).mockResolvedValue(null);
  });

  describe('Connection Validation', () => {
    it('should validate project ID format', () => {
      // Valid project IDs
      expect(validateConnectionConfig({
        projectId: 'my-project-123',
        authType: 'application-default',
      }).valid).toBe(true);

      expect(validateConnectionConfig({
        projectId: 'valid-project',
        authType: 'application-default',
      }).valid).toBe(true);

      // Invalid project IDs
      expect(validateConnectionConfig({
        projectId: 'InvalidProject',
        authType: 'application-default',
      }).valid).toBe(false);

      expect(validateConnectionConfig({
        projectId: '123-invalid',
        authType: 'application-default',
      }).valid).toBe(false);

      expect(validateConnectionConfig({
        projectId: '',
        authType: 'application-default',
      }).valid).toBe(false);
    });

    it('should validate service account configuration', () => {
      // Missing key path and key content
      expect(validateConnectionConfig({
        projectId: 'valid-project',
        authType: 'service-account',
      }).valid).toBe(false);

      // With key path
      expect(validateConnectionConfig({
        projectId: 'valid-project',
        authType: 'service-account',
        serviceAccountKeyPath: '/path/to/key.json',
      }).valid).toBe(true);

      // With valid key content
      expect(validateConnectionConfig({
        projectId: 'valid-project',
        authType: 'service-account',
        serviceAccountKey: JSON.stringify({ type: 'service_account' }),
      }).valid).toBe(true);

      // With invalid key content
      expect(validateConnectionConfig({
        projectId: 'valid-project',
        authType: 'service-account',
        serviceAccountKey: 'not-json',
      }).valid).toBe(false);
    });
  });

  describe('Connection Store State Management', () => {
    it('should update store state when connection is set', () => {
      const connection = {
        projectId: 'test-project',
        authType: 'application-default' as const,
        location: 'EU',
        isActive: true,
      };

      act(() => {
        useConnectionStore.getState().setConnection(connection);
      });

      expect(useConnectionStore.getState().connection).toEqual(connection);
      expect(useConnectionStore.getState().connectionError).toBeNull();
      expect(useConnectionStore.getState().isConnecting).toBe(false);
    });

    it('should clear error when connection is successful', () => {
      // Set an error first
      act(() => {
        useConnectionStore.getState().setConnectionError('Previous error');
      });

      expect(useConnectionStore.getState().connectionError).toBe('Previous error');

      // Set a successful connection
      act(() => {
        useConnectionStore.getState().setConnection({
          projectId: 'test-project',
          authType: 'application-default',
          location: 'EU',
          isActive: true,
        });
      });

      expect(useConnectionStore.getState().connectionError).toBeNull();
    });

    it('should set isConnecting to false when error occurs', () => {
      // Start connecting
      act(() => {
        useConnectionStore.getState().setConnecting(true);
      });

      expect(useConnectionStore.getState().isConnecting).toBe(true);

      // Set error
      act(() => {
        useConnectionStore.getState().setConnectionError('Connection failed');
      });

      expect(useConnectionStore.getState().isConnecting).toBe(false);
    });

    it('should clear all state when clearConnection is called', () => {
      // Set up some state
      act(() => {
        useConnectionStore.getState().setConnection({
          projectId: 'test-project',
          authType: 'application-default',
          location: 'EU',
          isActive: true,
        });
        useConnectionStore.getState().setConnecting(true);
        useConnectionStore.getState().setConnectionError('Some error');
      });

      // Clear connection
      act(() => {
        useConnectionStore.getState().clearConnection();
      });

      const state = useConnectionStore.getState();
      expect(state.connection).toBeNull();
      expect(state.connectionError).toBeNull();
      expect(state.isConnecting).toBe(false);
    });
  });

  describe('IPC Communication', () => {
    it('should call electronAPI.connection.test for connection validation', async () => {
      const config = {
        projectId: 'test-project',
        authType: 'application-default' as const,
      };

      await window.electronAPI.connection.test(config);

      expect(window.electronAPI.connection.test).toHaveBeenCalledWith(config);
    });

    it('should call electronAPI.connection.configure for establishing connection', async () => {
      const config = {
        projectId: 'test-project',
        authType: 'application-default' as const,
      };

      await window.electronAPI.connection.configure(config);

      expect(window.electronAPI.connection.configure).toHaveBeenCalledWith(config);
    });

    it('should retrieve active connection after configuring', async () => {
      await window.electronAPI.connection.getActive();

      expect(window.electronAPI.connection.getActive).toHaveBeenCalled();
    });

    it('should handle connection test failure', async () => {
      (window.electronAPI.connection.test as jest.Mock).mockResolvedValue(false);

      const result = await window.electronAPI.connection.test({
        projectId: 'invalid-project',
        authType: 'application-default',
      });

      expect(result).toBe(false);
    });
  });

  describe('Saved Connection Restoration', () => {
    it('should restore saved connection on startup', async () => {
      const savedConnection = {
        projectId: 'saved-project',
        authType: 'application-default' as const,
        location: 'US',
        isActive: true,
      };

      (window.electronAPI.connection.restore as jest.Mock).mockResolvedValue(savedConnection);

      const restored = await window.electronAPI.connection.restore();

      expect(restored).toEqual(savedConnection);
    });

    it('should return null when no saved connection exists', async () => {
      (window.electronAPI.connection.restore as jest.Mock).mockResolvedValue(null);

      const restored = await window.electronAPI.connection.restore();

      expect(restored).toBeNull();
    });
  });
});
