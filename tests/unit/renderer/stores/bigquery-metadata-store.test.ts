import { act, renderHook } from '@testing-library/react';
import { useBigQueryMetadataStore } from '../../../../src/renderer/stores/bigquery-metadata-store';
import type { Dataset, Table } from '../../../../src/shared/types/dataset';

interface DatasetWithTables extends Dataset {
  tables?: Table[];
  tablesLoaded?: boolean;
}

describe('bigquery-metadata-store', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useBigQueryMetadataStore.getState().clear();
    });
  });

  describe('initial state', () => {
    it('should have empty datasets', () => {
      const { result } = renderHook(() => useBigQueryMetadataStore());
      expect(result.current.datasets).toEqual([]);
    });

    it('should not be loading', () => {
      const { result } = renderHook(() => useBigQueryMetadataStore());
      expect(result.current.isLoading).toBe(false);
    });

    it('should have no error', () => {
      const { result } = renderHook(() => useBigQueryMetadataStore());
      expect(result.current.error).toBeNull();
    });
  });

  describe('setDatasets', () => {
    it('should set datasets', () => {
      const { result } = renderHook(() => useBigQueryMetadataStore());
      
      const datasets: DatasetWithTables[] = [
        { id: 'dataset1', name: 'Dataset 1', location: 'EU' },
        { id: 'dataset2', name: 'Dataset 2', location: 'US' },
      ];

      act(() => {
        result.current.setDatasets(datasets);
      });

      expect(result.current.datasets).toEqual(datasets);
    });

    it('should replace existing datasets', () => {
      const { result } = renderHook(() => useBigQueryMetadataStore());
      
      const initialDatasets: DatasetWithTables[] = [
        { id: 'dataset1', name: 'Dataset 1', location: 'EU' },
      ];

      act(() => {
        result.current.setDatasets(initialDatasets);
      });

      const newDatasets: DatasetWithTables[] = [
        { id: 'dataset2', name: 'Dataset 2', location: 'US' },
      ];

      act(() => {
        result.current.setDatasets(newDatasets);
      });

      expect(result.current.datasets).toEqual(newDatasets);
    });
  });

  describe('setDatasetTables', () => {
    it('should set tables for a dataset', () => {
      const { result } = renderHook(() => useBigQueryMetadataStore());
      
      const datasets: DatasetWithTables[] = [
        { id: 'dataset1', name: 'Dataset 1', location: 'EU' },
      ];

      const tables: Table[] = [
        { id: 'table1', name: 'Table 1', type: 'TABLE' },
        { id: 'table2', name: 'Table 2', type: 'VIEW' },
      ];

      act(() => {
        result.current.setDatasets(datasets);
      });

      act(() => {
        result.current.setDatasetTables('dataset1', tables);
      });

      expect(result.current.datasets[0].tables).toEqual(tables);
      expect(result.current.datasets[0].tablesLoaded).toBe(true);
    });

    it('should not affect other datasets', () => {
      const { result } = renderHook(() => useBigQueryMetadataStore());
      
      const datasets: DatasetWithTables[] = [
        { id: 'dataset1', name: 'Dataset 1', location: 'EU' },
        { id: 'dataset2', name: 'Dataset 2', location: 'US' },
      ];

      const tables: Table[] = [
        { id: 'table1', name: 'Table 1', type: 'TABLE' },
      ];

      act(() => {
        result.current.setDatasets(datasets);
      });

      act(() => {
        result.current.setDatasetTables('dataset1', tables);
      });

      expect(result.current.datasets[1].tables).toBeUndefined();
      expect(result.current.datasets[1].tablesLoaded).toBeUndefined();
    });
  });

  describe('getDatasetTables', () => {
    it('should return tables for a dataset', () => {
      const { result } = renderHook(() => useBigQueryMetadataStore());
      
      const tables: Table[] = [
        { id: 'table1', name: 'Table 1', type: 'TABLE' },
      ];

      const datasets: DatasetWithTables[] = [
        { id: 'dataset1', name: 'Dataset 1', location: 'EU', tables },
      ];

      act(() => {
        result.current.setDatasets(datasets);
      });

      const result2 = result.current.getDatasetTables('dataset1');
      expect(result2).toEqual(tables);
    });

    it('should return undefined for non-existent dataset', () => {
      const { result } = renderHook(() => useBigQueryMetadataStore());
      
      const datasets: DatasetWithTables[] = [
        { id: 'dataset1', name: 'Dataset 1', location: 'EU' },
      ];

      act(() => {
        result.current.setDatasets(datasets);
      });

      const tables = result.current.getDatasetTables('non-existent');
      expect(tables).toBeUndefined();
    });

    it('should return undefined when tables not loaded', () => {
      const { result } = renderHook(() => useBigQueryMetadataStore());
      
      const datasets: DatasetWithTables[] = [
        { id: 'dataset1', name: 'Dataset 1', location: 'EU' },
      ];

      act(() => {
        result.current.setDatasets(datasets);
      });

      const tables = result.current.getDatasetTables('dataset1');
      expect(tables).toBeUndefined();
    });
  });

  describe('getAllTables', () => {
    it('should return all tables from all datasets', () => {
      const { result } = renderHook(() => useBigQueryMetadataStore());
      
      const table1: Table = { id: 'table1', name: 'Table 1', type: 'TABLE' };
      const table2: Table = { id: 'table2', name: 'Table 2', type: 'VIEW' };
      const table3: Table = { id: 'table3', name: 'Table 3', type: 'TABLE' };

      const datasets: DatasetWithTables[] = [
        { id: 'dataset1', name: 'Dataset 1', location: 'EU', tables: [table1, table2] },
        { id: 'dataset2', name: 'Dataset 2', location: 'US', tables: [table3] },
      ];

      act(() => {
        result.current.setDatasets(datasets);
      });

      const allTables = result.current.getAllTables();
      
      expect(allTables).toHaveLength(3);
      expect(allTables).toContainEqual({ dataset: 'dataset1', table: table1 });
      expect(allTables).toContainEqual({ dataset: 'dataset1', table: table2 });
      expect(allTables).toContainEqual({ dataset: 'dataset2', table: table3 });
    });

    it('should return empty array when no tables loaded', () => {
      const { result } = renderHook(() => useBigQueryMetadataStore());
      
      const datasets: DatasetWithTables[] = [
        { id: 'dataset1', name: 'Dataset 1', location: 'EU' },
      ];

      act(() => {
        result.current.setDatasets(datasets);
      });

      const allTables = result.current.getAllTables();
      expect(allTables).toEqual([]);
    });

    it('should return empty array when no datasets', () => {
      const { result } = renderHook(() => useBigQueryMetadataStore());
      
      const allTables = result.current.getAllTables();
      expect(allTables).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should clear all state', () => {
      const { result } = renderHook(() => useBigQueryMetadataStore());
      
      const datasets: DatasetWithTables[] = [
        { id: 'dataset1', name: 'Dataset 1', location: 'EU' },
      ];

      act(() => {
        result.current.setDatasets(datasets);
      });

      act(() => {
        result.current.clear();
      });

      expect(result.current.datasets).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('state persistence across hooks', () => {
    it('should share state between multiple hooks', () => {
      const { result: hook1 } = renderHook(() => useBigQueryMetadataStore());
      const { result: hook2 } = renderHook(() => useBigQueryMetadataStore());

      const datasets: DatasetWithTables[] = [
        { id: 'dataset1', name: 'Dataset 1', location: 'EU' },
      ];

      act(() => {
        hook1.current.setDatasets(datasets);
      });

      expect(hook2.current.datasets).toEqual(datasets);
    });
  });
});
