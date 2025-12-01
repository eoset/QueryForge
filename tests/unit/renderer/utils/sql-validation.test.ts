import { Parser } from 'node-sql-parser';
import {
  collectColumnRefsFromExpression,
  collectColumnRefsForSelect,
  buildTableAliasMapFromSelect,
  collectSubqueries,
  validateColumnReferences,
  ColumnRefInfo,
} from '../../../../src/renderer/utils/sql-validation';

describe('SQL Validation Utilities', () => {
  let parser: Parser;

  beforeAll(() => {
    parser = new Parser();
  });

  const parseSQL = (sql: string): any => {
    const ast = parser.astify(sql, { database: 'bigquery' });
    return Array.isArray(ast) ? ast[0] : ast;
  };

  describe('collectColumnRefsFromExpression', () => {
    it('should collect simple column references', () => {
      const ast = parseSQL('SELECT col1, col2 FROM table1');
      const refs: ColumnRefInfo[] = [];
      
      for (const col of ast.columns) {
        collectColumnRefsFromExpression(col.expr ?? col, refs);
      }
      
      expect(refs).toHaveLength(2);
      expect(refs[0].column).toBe('col1');
      expect(refs[0].alias).toBeNull();
      expect(refs[1].column).toBe('col2');
    });

    it('should collect aliased column references', () => {
      const ast = parseSQL('SELECT t.col1, t.col2 FROM table1 AS t');
      const refs: ColumnRefInfo[] = [];
      
      for (const col of ast.columns) {
        collectColumnRefsFromExpression(col.expr ?? col, refs);
      }
      
      expect(refs).toHaveLength(2);
      expect(refs[0].column).toBe('col1');
      expect(refs[0].alias).toBe('t');
      expect(refs[1].column).toBe('col2');
      expect(refs[1].alias).toBe('t');
    });

    it('should NOT collect column refs from subqueries', () => {
      // This is the key test for the fix - subquery columns should not be collected
      const ast = parseSQL(`
        SELECT col1 FROM table1
        WHERE col2 IN (SELECT sub_col FROM subtable)
      `);
      const refs: ColumnRefInfo[] = [];
      
      // Collect from WHERE clause
      collectColumnRefsFromExpression(ast.where, refs);
      
      // Should only have col2 from the outer query, NOT sub_col from the subquery
      expect(refs).toHaveLength(1);
      expect(refs[0].column).toBe('col2');
    });

    it('should NOT collect column refs from NOT EXISTS subqueries', () => {
      const ast = parseSQL(`
        SELECT * FROM outer_table o
        WHERE NOT EXISTS (
          SELECT 1 FROM inner_table i
          WHERE i.id = o.id
        )
      `);
      const refs: ColumnRefInfo[] = [];
      
      // Collect from WHERE clause
      collectColumnRefsFromExpression(ast.where, refs);
      
      // Should NOT collect i.id or o.id from the subquery - they have their own scope
      expect(refs).toHaveLength(0);
    });
  });

  describe('collectColumnRefsForSelect', () => {
    it('should collect refs from SELECT, WHERE, and JOIN ON clauses', () => {
      const ast = parseSQL(`
        SELECT a.col1, b.col2
        FROM table1 a
        JOIN table2 b ON a.id = b.id
        WHERE a.col3 > 10
      `);
      
      const refs = collectColumnRefsForSelect(ast);
      
      // col1, col2 from SELECT, id (x2) from ON, col3 from WHERE
      const columns = refs.map(r => r.column);
      expect(columns).toContain('col1');
      expect(columns).toContain('col2');
      expect(columns).toContain('id');
      expect(columns).toContain('col3');
    });

    it('should NOT include subquery column refs in the main scope', () => {
      const ast = parseSQL(`
        SELECT dp.ProdKey
        FROM dataset.dim_product dp
        WHERE NOT EXISTS (
          SELECT NULL FROM dataset.dim_agreement da
          WHERE da.ProdKey = dp.ProdKey
        )
      `);
      
      const refs = collectColumnRefsForSelect(ast);
      
      // Should only have dp.ProdKey from the outer SELECT
      // The subquery refs (da.ProdKey, dp.ProdKey in WHERE) should NOT be collected
      expect(refs).toHaveLength(1);
      expect(refs[0].alias).toBe('dp');
      expect(refs[0].column).toBe('ProdKey');
    });
  });

  describe('buildTableAliasMapFromSelect', () => {
    it('should build alias map for simple query', () => {
      const ast = parseSQL('SELECT * FROM dataset.table1 AS t1');
      
      const { aliasMap, uniqueTables } = buildTableAliasMapFromSelect(ast);
      
      expect(aliasMap.has('t1')).toBe(true);
      expect(aliasMap.get('t1')?.tableId).toBe('table1');
      expect(uniqueTables.size).toBe(1);
    });

    it('should build alias map for JOIN query', () => {
      const ast = parseSQL(`
        SELECT * FROM dataset.table1 t1
        JOIN dataset.table2 t2 ON t1.id = t2.id
      `);
      
      const { aliasMap } = buildTableAliasMapFromSelect(ast);
      
      expect(aliasMap.has('t1')).toBe(true);
      expect(aliasMap.has('t2')).toBe(true);
    });

    it('should register CTE names as valid aliases', () => {
      const ast = parseSQL(`
        WITH cte_data AS (
          SELECT id, value FROM dataset.source_table
        )
        SELECT * FROM cte_data
      `);
      
      const { aliasMap } = buildTableAliasMapFromSelect(ast);
      
      expect(aliasMap.has('cte_data')).toBe(true);
      // CTE alias should not have datasetId/tableId since it's a virtual table
      expect(aliasMap.get('cte_data')?.datasetId).toBeUndefined();
    });
  });

  describe('collectSubqueries', () => {
    it('should collect subqueries from WHERE clause', () => {
      const ast = parseSQL(`
        SELECT * FROM table1
        WHERE id IN (SELECT id FROM table2)
      `);
      
      const subqueries: any[] = [];
      collectSubqueries(ast.where, subqueries);
      
      expect(subqueries).toHaveLength(1);
      expect(subqueries[0].type).toBe('select');
    });

    it('should collect NOT EXISTS subqueries', () => {
      const ast = parseSQL(`
        SELECT * FROM table1 t1
        WHERE NOT EXISTS (
          SELECT 1 FROM table2 t2
          WHERE t2.id = t1.id
        )
      `);
      
      const subqueries: any[] = [];
      collectSubqueries(ast.where, subqueries);
      
      expect(subqueries).toHaveLength(1);
    });

    it('should collect multiple subqueries', () => {
      const ast = parseSQL(`
        SELECT * FROM table1
        WHERE id IN (SELECT id FROM table2)
          AND name IN (SELECT name FROM table3)
      `);
      
      const subqueries: any[] = [];
      collectSubqueries(ast.where, subqueries);
      
      expect(subqueries).toHaveLength(2);
    });

    it('should collect nested subqueries at top level only', () => {
      const ast = parseSQL(`
        SELECT * FROM table1
        WHERE id IN (
          SELECT id FROM table2
          WHERE value IN (SELECT value FROM table3)
        )
      `);
      
      const subqueries: any[] = [];
      collectSubqueries(ast.where, subqueries);
      
      // Should only collect the first level subquery, not the nested one
      // (nested ones are collected when processing that subquery separately)
      expect(subqueries).toHaveLength(1);
    });
  });

  describe('validateColumnReferences', () => {
    // Mock getTableFields function
    const mockGetTableFields = jest.fn();

    beforeEach(() => {
      mockGetTableFields.mockReset();
    });

    it('should not report error for valid alias in subquery', async () => {
      const ast = parseSQL(`
        SELECT * FROM dataset.dim_product dp
        WHERE NOT EXISTS (
          SELECT NULL FROM dataset.dim_agreement da
          WHERE da.ProdKey = dp.ProdKey
        )
      `);
      
      // Mock schema lookups
      mockGetTableFields.mockImplementation((datasetId: string, tableId: string) => {
        if (tableId === 'dim_product') return Promise.resolve(['ProdKey', 'Name']);
        if (tableId === 'dim_agreement') return Promise.resolve(['ProdKey', 'AgreementId']);
        return Promise.resolve(null);
      });
      
      const issues = await validateColumnReferences(ast, mockGetTableFields, '', true);
      
      // Should have no issues - both dp and da are valid in their respective scopes
      // and dp is valid in the subquery due to correlated subquery support
      const aliasErrors = issues.filter(i => i.message.includes('Unknown table or alias'));
      expect(aliasErrors).toHaveLength(0);
    });

    it('should report error for unknown alias in outer query', async () => {
      const ast = parseSQL(`
        SELECT * FROM dataset.table1 t1
        WHERE unknown_alias.col = 1
      `);
      
      mockGetTableFields.mockResolvedValue(['col', 'id']);
      
      const issues = await validateColumnReferences(ast, mockGetTableFields, '', true);
      
      expect(issues.some(i => i.message.includes('Unknown table or alias "unknown_alias"'))).toBe(true);
    });

    it('should report error for unknown alias in subquery', async () => {
      const ast = parseSQL(`
        SELECT * FROM dataset.table1 t1
        WHERE EXISTS (
          SELECT 1 FROM dataset.table2 t2
          WHERE unknown.col = t2.col
        )
      `);
      
      mockGetTableFields.mockResolvedValue(['col', 'id']);
      
      const issues = await validateColumnReferences(ast, mockGetTableFields, '', true);
      
      expect(issues.some(i => i.message.includes('Unknown table or alias "unknown"'))).toBe(true);
    });

    it('should allow outer table alias in correlated subquery', async () => {
      // This is the key test case from the bug report
      const ast = parseSQL(`
        SELECT * FROM dataset.dim_product dp
        WHERE NOT EXISTS (
          SELECT NULL FROM dataset.dim_agreement da
          WHERE da.ProdKey = dp.ProdKey
        )
      `);
      
      mockGetTableFields.mockImplementation((datasetId: string, tableId: string) => {
        if (tableId === 'dim_product') return Promise.resolve(['ProdKey', 'ProductName']);
        if (tableId === 'dim_agreement') return Promise.resolve(['ProdKey', 'AgreementId']);
        return Promise.resolve(null);
      });
      
      const issues = await validateColumnReferences(ast, mockGetTableFields, '', true);
      
      // dp.ProdKey should be valid in the subquery (correlated reference)
      const dpError = issues.find(i => i.message.includes('"dp"'));
      expect(dpError).toBeUndefined();
    });

    it('should validate columns in deeply nested subqueries', async () => {
      const ast = parseSQL(`
        SELECT * FROM dataset.table1 t1
        WHERE id IN (
          SELECT id FROM dataset.table2 t2
          WHERE value IN (
            SELECT value FROM dataset.table3 t3
            WHERE t3.ref = t1.id
          )
        )
      `);
      
      mockGetTableFields.mockImplementation((datasetId: string, tableId: string) => {
        if (tableId === 'table1') return Promise.resolve(['id', 'name']);
        if (tableId === 'table2') return Promise.resolve(['id', 'value']);
        if (tableId === 'table3') return Promise.resolve(['value', 'ref']);
        return Promise.resolve(null);
      });
      
      const issues = await validateColumnReferences(ast, mockGetTableFields, '', true);
      
      // t1.id should be valid even in the deeply nested subquery (correlated reference)
      const t1Error = issues.find(i => i.message.includes('"t1"'));
      expect(t1Error).toBeUndefined();
    });

    it('should validate CTE body columns separately', async () => {
      const ast = parseSQL(`
        WITH stage AS (
          SELECT id, name FROM dataset.source s
          WHERE s.active = true
        )
        SELECT * FROM stage
      `);
      
      mockGetTableFields.mockImplementation((datasetId: string, tableId: string) => {
        if (tableId === 'source') return Promise.resolve(['id', 'name', 'active']);
        return Promise.resolve(null);
      });
      
      const issues = await validateColumnReferences(ast, mockGetTableFields, '', true);
      
      // s should be valid within the CTE body
      const sError = issues.find(i => i.message.includes('"s"'));
      expect(sError).toBeUndefined();
    });

    it('should handle complex query with CTE and correlated subquery', async () => {
      // This simulates the original bug report query pattern
      const ast = parseSQL(`
        WITH Stage AS (
          SELECT actr.AcNo, actr.VoNo
          FROM dataset.AcTr actr
          WHERE NOT EXISTS (
            SELECT *
            FROM dataset.fact_table fir
            WHERE fir.InvoiceNo = actr.VoNo
          )
        )
        SELECT * FROM Stage s
        JOIN dataset.dim_table d ON s.AcNo = d.AcNo
      `);
      
      mockGetTableFields.mockImplementation((datasetId: string, tableId: string) => {
        if (tableId === 'AcTr') return Promise.resolve(['AcNo', 'VoNo', 'Amount']);
        if (tableId === 'fact_table') return Promise.resolve(['InvoiceNo', 'Amount']);
        if (tableId === 'dim_table') return Promise.resolve(['AcNo', 'Name']);
        return Promise.resolve(null);
      });
      
      const issues = await validateColumnReferences(ast, mockGetTableFields, '', true);
      
      // fir should be valid within the subquery
      const firError = issues.find(i => i.message.includes('"fir"'));
      expect(firError).toBeUndefined();
      
      // actr should be valid in the correlated subquery (parent scope)
      const actrError = issues.find(i => i.message.includes('"actr"'));
      expect(actrError).toBeUndefined();
    });
  });
});
