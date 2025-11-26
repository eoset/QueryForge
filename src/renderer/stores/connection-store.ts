import { create } from 'zustand';
import type { ConnectionConfiguration } from '../../shared/types/connection';

interface ConnectionState {
  connection: ConnectionConfiguration | null;
  isConnecting: boolean;
  connectionError: string | null;
  setConnection: (config: ConnectionConfiguration) => void;
  clearConnection: () => void;
  setConnecting: (isConnecting: boolean) => void;
  setConnectionError: (error: string | null) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  connection: null,
  isConnecting: false,
  connectionError: null,
  setConnection: (config) =>
    set({ connection: config, connectionError: null, isConnecting: false }),
  clearConnection: () =>
    set({ connection: null, connectionError: null, isConnecting: false }),
  setConnecting: (isConnecting) => set({ isConnecting }),
  setConnectionError: (error) => set({ connectionError: error, isConnecting: false }),
}));

