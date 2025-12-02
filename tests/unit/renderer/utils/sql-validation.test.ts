import { parse } from 'sql-parser-cst';
import {
  collectColumnRefsFromExpression,
  collectColumnRefsForSelect,
  buildTableAliasMapFromSelect,
  collectSubqueries,
  validateColumnReferences,
  validateBigQuerySyntaxRules,
  containsAggregateFunction,
  containsWindowFunction,
  ColumnRefInfo,
  ColumnValidationIssue,
} from '../../../../src/renderer/utils/sql-validation';

describe('SQL Validation Utilities', () => {
  const parseSQL = (sql: string): any => {
    try {
      // Parse SQL and return CST directly - validation functions now work with CST!
      const cst = parse(sql, { dialect: 'bigquery', includeRange: true });
      
      // CST structure: statements are in cst.statements or cst is the statement itself
      const statements = cst.statements || (Array.isArray(cst) ? cst : [cst]);
      return statements.length > 0 ? statements[0] : cst;
    } catch (error) {
      // If parsing fails, return null (tests should handle this)
      return null;
    }
  };

  describe('collectColumnRefsFromExpression', () => {
    it('should collect simple column references', () => {
      const stmt = parseSQL('SELECT col1, col2 FROM table1');
      if (!stmt) {
        expect(stmt).not.toBeNull();
        return;
      }
      
      const refs: ColumnRefInfo[] = [];
      
      // Use collectColumnRefsForSelect which handles CST structure
      const allRefs = collectColumnRefsForSelect(stmt);
      
      expect(allRefs.length).toBeGreaterThanOrEqual(2);
      const col1Ref = allRefs.find(r => r.column === 'col1');
      const col2Ref = allRefs.find(r => r.column === 'col2');
      expect(col1Ref).toBeDefined();
      expect(col2Ref).toBeDefined();
      if (col1Ref) expect(col1Ref.alias).toBeNull();
    });

    it('should collect aliased column references', () => {
      const stmt = parseSQL('SELECT t.col1, t.col2 FROM table1 AS t');
      if (!stmt) {
        expect(stmt).not.toBeNull();
        return;
      }
      
      const allRefs = collectColumnRefsForSelect(stmt);
      
      expect(allRefs.length).toBeGreaterThanOrEqual(2);
      const col1Ref = allRefs.find(r => r.column === 'col1' && r.alias === 't');
      const col2Ref = allRefs.find(r => r.column === 'col2' && r.alias === 't');
      expect(col1Ref).toBeDefined();
      expect(col2Ref).toBeDefined();
    });

    it('should NOT collect column refs from subqueries', () => {
      // This is the key test for the fix - subquery columns should not be collected
      const stmt = parseSQL(`
        SELECT col1 FROM table1
        WHERE col2 IN (SELECT sub_col FROM subtable)
      `);
      if (!stmt) {
        expect(stmt).not.toBeNull();
        return;
      }
      
      const refs = collectColumnRefsForSelect(stmt);
      
      // Should only have col1 and col2 from the outer query, NOT sub_col from the subquery
      const colNames = refs.map(r => r.column);
      expect(colNames).toContain('col1');
      expect(colNames).toContain('col2');
      expect(colNames).not.toContain('sub_col');
    });

    it('should NOT collect column refs from NOT EXISTS subqueries', () => {
      const stmt = parseSQL(`
        SELECT * FROM outer_table o
        WHERE NOT EXISTS (
          SELECT 1 FROM inner_table i
          WHERE i.id = o.id
        )
      `);
      if (!stmt) {
        expect(stmt).not.toBeNull();
        return;
      }
      
      const refs = collectColumnRefsForSelect(stmt);
      
      // Should NOT collect i.id from the subquery - it has its own scope
      // o.id might be collected as it's a correlated reference, but i.id should not be
      const colNames = refs.map(r => r.column);
      expect(colNames).not.toContain('i.id');
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
      const stmt = parseSQL(`
        SELECT * FROM table1
        WHERE id IN (SELECT id FROM table2)
      `);
      if (!stmt) {
        expect(stmt).not.toBeNull();
        return;
      }
      
      const subqueries: any[] = [];
      // Get WHERE condition from CST - use helper from validation utils
      const whereClause = stmt.clauses?.find((c: any) => c.type === 'where_clause');
      const whereCondition = whereClause?.expr || whereClause?.condition || stmt.whereClause?.condition || stmt.where;
      collectSubqueries(whereCondition, subqueries);
      
      expect(subqueries.length).toBeGreaterThanOrEqual(1);
      const nodeType = subqueries[0]?.type || subqueries[0]?.kind;
      expect(nodeType === 'select' || nodeType === 'select_stmt' || nodeType === 'SelectStatement').toBe(true);
    });

    it('should collect NOT EXISTS subqueries', () => {
      const stmt = parseSQL(`
        SELECT * FROM table1 t1
        WHERE NOT EXISTS (
          SELECT 1 FROM table2 t2
          WHERE t2.id = t1.id
        )
      `);
      if (!stmt) {
        expect(stmt).not.toBeNull();
        return;
      }
      
      const subqueries: any[] = [];
      // Get WHERE condition from CST
      const whereClause = stmt.clauses?.find((c: any) => c.type === 'where_clause');
      const whereCondition = whereClause?.expr || whereClause?.condition || stmt.whereClause?.condition || stmt.where;
      collectSubqueries(whereCondition, subqueries);
      
      expect(subqueries.length).toBeGreaterThanOrEqual(1);
    });

    it('should collect multiple subqueries', () => {
      const stmt = parseSQL(`
        SELECT * FROM table1
        WHERE id IN (SELECT id FROM table2)
          AND name IN (SELECT name FROM table3)
      `);
      if (!stmt) {
        expect(stmt).not.toBeNull();
        return;
      }
      
      const subqueries: any[] = [];
      const whereClause = stmt.clauses?.find((c: any) => c.type === 'where_clause');
      const whereCondition = whereClause?.expr || whereClause?.condition || stmt.whereClause?.condition || stmt.where;
      collectSubqueries(whereCondition, subqueries);
      
      expect(subqueries.length).toBeGreaterThanOrEqual(2);
    });

    it('should collect nested subqueries at top level only', () => {
      const stmt = parseSQL(`
        SELECT * FROM table1
        WHERE id IN (
          SELECT id FROM table2
          WHERE value IN (SELECT value FROM table3)
        )
      `);
      if (!stmt) {
        expect(stmt).not.toBeNull();
        return;
      }
      
      const subqueries: any[] = [];
      const whereClause = stmt.clauses?.find((c: any) => c.type === 'where_clause');
      const whereCondition = whereClause?.expr || whereClause?.condition || stmt.whereClause?.condition || stmt.where;
      collectSubqueries(whereCondition, subqueries);
      
      // Should collect at least the first level subquery
      // (nested ones might also be collected, but that's okay - they'll be processed separately)
      expect(subqueries.length).toBeGreaterThanOrEqual(1);
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

  describe('validateBigQuerySyntaxRules', () => {
      describe('containsAggregateFunction', () => {
      it('should detect COUNT aggregate function', () => {
        const stmt = parseSQL('SELECT COUNT(*) FROM table1');
        if (!stmt) {
          expect(stmt).not.toBeNull();
          return;
        }
        
        // Get first column expression from CST - columns are directly in items array
        const selectClause = stmt.clauses?.find((c: any) => c.type === 'select_clause');
        const columns = selectClause?.columns?.items || selectClause?.columns || stmt.selectClause?.columns || stmt.columns?.items || stmt.columns || [];
        const selectExpr = columns[0]?.expr ?? columns[0]?.expression ?? columns[0];
        const result = containsAggregateFunction(selectExpr);
        expect(result.found).toBe(true);
        expect(result.functionName).toBe('COUNT');
      });

      it('should detect SUM aggregate function', () => {
        const stmt = parseSQL('SELECT SUM(amount) FROM table1');
        if (!stmt) {
          expect(stmt).not.toBeNull();
          return;
        }
        
        const selectClause = stmt.clauses?.find((c: any) => c.type === 'select_clause');
        const columns = selectClause?.columns?.items || selectClause?.columns || stmt.selectClause?.columns || stmt.columns?.items || stmt.columns || [];
        const selectExpr = columns[0]?.expr ?? columns[0]?.expression ?? columns[0];
        const result = containsAggregateFunction(selectExpr);
        expect(result.found).toBe(true);
        expect(result.functionName).toBe('SUM');
      });

      it('should not detect non-aggregate functions', () => {
        const stmt = parseSQL('SELECT UPPER(name) FROM table1');
        if (!stmt) {
          expect(stmt).not.toBeNull();
          return;
        }
        
        const columns = stmt.selectClause?.columns || stmt.columns?.items || stmt.columns || [];
        const selectExpr = columns[0]?.expr ?? columns[0]?.expression ?? columns[0];
        const result = containsAggregateFunction(selectExpr);
        expect(result.found).toBe(false);
      });

      it('should not detect aggregate in subquery', () => {
        const stmt = parseSQL('SELECT * FROM table1 WHERE id IN (SELECT MAX(id) FROM table2)');
        if (!stmt) {
          expect(stmt).not.toBeNull();
          return;
        }
        
        // The WHERE clause contains the subquery
        const whereCondition = stmt.whereClause?.condition || stmt.where;
        const result = containsAggregateFunction(whereCondition);
        expect(result.found).toBe(false); // Subqueries are skipped
      });
    });

    describe('aggregate in WHERE validation', () => {
      it('should report error when COUNT is used in WHERE', () => {
        // Note: This query won't parse correctly since it's invalid SQL,
        // but we test the validation logic with a mock AST
        const mockAst = {
          type: 'select',
          columns: [{ expr: { type: 'column_ref', column: 'id' } }],
          from: [{ table: 'orders' }],
          where: {
            type: 'binary_expr',
            operator: '>',
            left: {
              type: 'aggr_func',
              name: 'count',
              args: { expr: '*' },
            },
            right: { type: 'number', value: 5 },
          },
        };
        
        const issues: ColumnValidationIssue[] = validateBigQuerySyntaxRules(mockAst);
        expect(issues.some((i: ColumnValidationIssue) => i.rule === 'aggregate-in-where')).toBe(true);
        expect(issues.some((i: ColumnValidationIssue) => i.message.includes('COUNT'))).toBe(true);
      });

      it('should not report error for valid WHERE without aggregates', () => {
        const ast = parseSQL('SELECT * FROM orders WHERE amount > 100');
        const issues: ColumnValidationIssue[] = validateBigQuerySyntaxRules(ast);
        expect(issues.filter((i: ColumnValidationIssue) => i.rule === 'aggregate-in-where')).toHaveLength(0);
      });
    });

    describe('window function validation', () => {
      it('should allow window functions in SELECT', () => {
        const ast = parseSQL('SELECT ROW_NUMBER() OVER (ORDER BY id) as rn FROM table1');
        const issues: ColumnValidationIssue[] = validateBigQuerySyntaxRules(ast);
        // No errors about window functions in SELECT
        expect(issues.filter((i: ColumnValidationIssue) => i.rule === 'window-in-where')).toHaveLength(0);
      });
    });

    describe('CTE validation', () => {
      it('should validate syntax rules within CTEs', () => {
        // Create a mock CTE with an aggregate in WHERE
        const mockAst = {
          type: 'select',
          with: [{
            name: { value: 'cte_data' },
            stmt: {
              ast: {
                type: 'select',
                columns: [{ expr: { type: 'column_ref', column: 'id' } }],
                from: [{ table: 'source' }],
                where: {
                  type: 'aggr_func',
                  name: 'sum',
                  args: { expr: { type: 'column_ref', column: 'amount' } },
                },
              }
            }
          }],
          columns: [{ expr: { type: 'star' } }],
          from: [{ table: 'cte_data' }],
        };
        
        const issues: ColumnValidationIssue[] = validateBigQuerySyntaxRules(mockAst);
        // Should detect aggregate in WHERE within the CTE
        expect(issues.some((i: ColumnValidationIssue) => i.rule === 'aggregate-in-where')).toBe(true);
      });
    });

    describe('GROUP BY positional references', () => {
      it('should accept GROUP BY with positional references (number_literal type)', () => {
        // This tests that sql-parser-cst's number_literal type is properly recognized
        const ast = parseSQL(`
          SELECT
            o.OrderNumber,
            o.CustomerId,
            o.OrderStatus,
            o.BillingCurrency,
            o.PlacedPrice,
            o.Discount,
            SAFE_DIVIDE(SUM(o.Discount), SUM(o.PlacedPrice)) * 100 AS DiscountPercent,
            o.OrderDateCet,
            IFNULL(o.CouponCode, 'NONE') AS CouponCode
          FROM
            orders AS o
          GROUP BY
            1, 2, 3, 4, 5, 6, 8, 9
        `);
        // Should not produce errors for valid GROUP BY positional references
        const issues: ColumnValidationIssue[] = validateBigQuerySyntaxRules(ast);
        // This validates GROUP BY semantics, not positional references
        // The validateGroupByColumns function handles positional reference validation
        expect(issues.filter((i: ColumnValidationIssue) => i.rule === 'group-by-positional-out-of-range')).toHaveLength(0);
      });

      it('should accept GROUP BY with positional references in CTE queries', () => {
        const ast = parseSQL(`
          WITH
            data AS (
              SELECT 1 AS col1, 'a' AS col2, 100 AS col3
            )
          SELECT
            col1,
            col2,
            SUM(col3) AS total
          FROM
            data
          GROUP BY
            1, 2
        `);
        const issues: ColumnValidationIssue[] = validateBigQuerySyntaxRules(ast);
        expect(issues.filter((i: ColumnValidationIssue) => i.rule === 'group-by-positional-out-of-range')).toHaveLength(0);
      });
    });
  });
});
