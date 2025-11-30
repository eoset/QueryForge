import { act, renderHook } from '@testing-library/react';
import { useConnectionStore } from '../../../../src/renderer/stores/connection-store';
import type { ConnectionConfiguration } from '../../../../src/shared/types/connection';

describe('connection-store', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useConnectionStore.getState().clearConnection();
    });
  });

  describe('initial state', () => {
    it('should have null connection', () => {
      const { result } = renderHook(() => useConnectionStore());
      expect(result.current.connection).toBeNull();
    });

    it('should not be connecting', () => {
      const { result } = renderHook(() => useConnectionStore());
      expect(result.current.isConnecting).toBe(false);
    });

    it('should have no connection error', () => {
      const { result } = renderHook(() => useConnectionStore());
      expect(result.current.connectionError).toBeNull();
    });
  });

  describe('setConnection', () => {
    it('should set the connection', () => {
      const { result } = renderHook(() => useConnectionStore());
      
      const connection: ConnectionConfiguration = {
        projectId: 'test-project',
        authType: 'application-default',
        location: 'EU',
        isActive: true,
        lastConnected: '2024-01-01T00:00:00Z',
      };

      act(() => {
        result.current.setConnection(connection);
      });

      expect(result.current.connection).toEqual(connection);
    });

    it('should clear connection error when setting connection', () => {
      const { result } = renderHook(() => useConnectionStore());
      
      act(() => {
        result.current.setConnectionError('Previous error');
      });

      const connection: ConnectionConfiguration = {
        projectId: 'test-project',
        authType: 'application-default',
        location: 'EU',
        isActive: true,
      };

      act(() => {
        result.current.setConnection(connection);
      });

      expect(result.current.connectionError).toBeNull();
    });

    it('should set isConnecting to false when setting connection', () => {
      const { result } = renderHook(() => useConnectionStore());
      
      act(() => {
        result.current.setConnecting(true);
      });

      const connection: ConnectionConfiguration = {
        projectId: 'test-project',
        authType: 'application-default',
        location: 'EU',
        isActive: true,
      };

      act(() => {
        result.current.setConnection(connection);
      });

      expect(result.current.isConnecting).toBe(false);
    });
  });

  describe('clearConnection', () => {
    it('should clear the connection', () => {
      const { result } = renderHook(() => useConnectionStore());
      
      const connection: ConnectionConfiguration = {
        projectId: 'test-project',
        authType: 'application-default',
        location: 'EU',
        isActive: true,
      };

      act(() => {
        result.current.setConnection(connection);
      });

      act(() => {
        result.current.clearConnection();
      });

      expect(result.current.connection).toBeNull();
    });

    it('should clear connection error', () => {
      const { result } = renderHook(() => useConnectionStore());
      
      act(() => {
        result.current.setConnectionError('Some error');
      });

      act(() => {
        result.current.clearConnection();
      });

      expect(result.current.connectionError).toBeNull();
    });

    it('should set isConnecting to false', () => {
      const { result } = renderHook(() => useConnectionStore());
      
      act(() => {
        result.current.setConnecting(true);
      });

      act(() => {
        result.current.clearConnection();
      });

      expect(result.current.isConnecting).toBe(false);
    });
  });

  describe('setConnecting', () => {
    it('should set isConnecting to true', () => {
      const { result } = renderHook(() => useConnectionStore());
      
      act(() => {
        result.current.setConnecting(true);
      });

      expect(result.current.isConnecting).toBe(true);
    });

    it('should set isConnecting to false', () => {
      const { result } = renderHook(() => useConnectionStore());
      
      act(() => {
        result.current.setConnecting(true);
      });

      act(() => {
        result.current.setConnecting(false);
      });

      expect(result.current.isConnecting).toBe(false);
    });
  });

  describe('setConnectionError', () => {
    it('should set connection error', () => {
      const { result } = renderHook(() => useConnectionStore());
      
      act(() => {
        result.current.setConnectionError('Connection failed');
      });

      expect(result.current.connectionError).toBe('Connection failed');
    });

    it('should set isConnecting to false when error is set', () => {
      const { result } = renderHook(() => useConnectionStore());
      
      act(() => {
        result.current.setConnecting(true);
      });

      act(() => {
        result.current.setConnectionError('Connection failed');
      });

      expect(result.current.isConnecting).toBe(false);
    });

    it('should clear connection error when null is passed', () => {
      const { result } = renderHook(() => useConnectionStore());
      
      act(() => {
        result.current.setConnectionError('Some error');
      });

      act(() => {
        result.current.setConnectionError(null);
      });

      expect(result.current.connectionError).toBeNull();
    });
  });

  describe('state persistence across hooks', () => {
    it('should share state between multiple hooks', () => {
      const { result: hook1 } = renderHook(() => useConnectionStore());
      const { result: hook2 } = renderHook(() => useConnectionStore());

      const connection: ConnectionConfiguration = {
        projectId: 'test-project',
        authType: 'application-default',
        location: 'EU',
        isActive: true,
      };

      act(() => {
        hook1.current.setConnection(connection);
      });

      expect(hook2.current.connection).toEqual(connection);
    });
  });
});
