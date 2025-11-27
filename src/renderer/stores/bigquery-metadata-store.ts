import { create } from 'zustand';
import type { Dataset, Table } from '../../shared/types/dataset';

interface DatasetWithTables extends Dataset {
  tables?: Table[];
  tablesLoaded?: boolean;
}

interface BigQueryMetadataState {
  datasets: DatasetWithTables[];
  isLoading: boolean;
  error: string | null;
  setDatasets: (datasets: DatasetWithTables[]) => void;
  setDatasetTables: (datasetId: string, tables: Table[]) => void;
  getDatasetTables: (datasetId: string) => Table[] | undefined;
  getAllTables: () => Array<{ dataset: string; table: Table }>;
  clear: () => void;
}

export const useBigQueryMetadataStore = create<BigQueryMetadataState>((set, get) => ({
  datasets: [],
  isLoading: false,
  error: null,
  
  setDatasets: (datasets) => set({ datasets }),
  
  setDatasetTables: (datasetId: string, tables: Table[]) =>
    set((state) => ({
      datasets: state.datasets.map((ds) =>
        ds.id === datasetId ? { ...ds, tables, tablesLoaded: true } : ds
      ),
    })),
  
  getDatasetTables: (datasetId: string) => {
    const state = get();
    const dataset = state.datasets.find((ds) => ds.id === datasetId);
    return dataset?.tables;
  },
  
  getAllTables: () => {
    const state = get();
    const allTables: Array<{ dataset: string; table: Table }> = [];
    state.datasets.forEach((dataset) => {
      if (dataset.tables) {
        dataset.tables.forEach((table) => {
          allTables.push({ dataset: dataset.id, table });
        });
      }
    });
    return allTables;
  },
  
  clear: () => set({ datasets: [], isLoading: false, error: null }),
}));

