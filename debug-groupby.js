const { parse } = require('sql-parser-cst');

// Helper functions
const getNodeType = (node) => {
  if (!node || typeof node !== 'object') return undefined;
  return node.type || node.kind;
};

const getSelectColumns = (stmt) => {
  if (!stmt) return [];
  if (stmt.clauses && Array.isArray(stmt.clauses)) {
    const selectClause = stmt.clauses.find((c) => c.type === 'select_clause');
    if (selectClause) {
      if (selectClause.columns?.items) {
        return selectClause.columns.items;
      }
    }
  }
  return [];
};

const getGroupByExpressions = (stmt) => {
  if (!stmt) return [];
  
  if (stmt.clauses && Array.isArray(stmt.clauses)) {
    const groupByClause = stmt.clauses.find((c) => c.type === 'group_by_clause');
    if (groupByClause) {
      if (groupByClause.columns?.items) {
        return groupByClause.columns.items;
      }
      if (groupByClause.columns) {
        return Array.isArray(groupByClause.columns) ? groupByClause.columns : [groupByClause.columns];
      }
    }
  }
  return [];
};

// Query with position 2 missing from GROUP BY (1, 3, 4, 5, 6, 8, 9, 10)
const sql = `
WITH
  one AS (
    SELECT 1 AS OrderNumber, 'cust1' AS CustomerId, 'active' AS OrderStatus, 'USD' AS BillingCurrency, 100 AS PlacedPrice, 10 AS Discount, CURRENT_DATETIME() AS OrderDateCet, 'CODE1' AS CouponCode, 'Product A' AS DisplayName
  ),
  two AS (
    SELECT 1 AS OrderNumber, 'Product B' AS DisplayName
  )
SELECT
  o.OrderNumber,
  o.CustomerId,
  o.OrderStatus,
  o.BillingCurrency,
  o.PlacedPrice,
  o.Discount,
  SAFE_DIVIDE(SUM(o.Discount), SUM(o.PlacedPrice)) * 100 AS DiscountPercent,
  o.OrderDateCet,
  IFNULL(o.CouponCode, 'NONE') AS CouponCode,
  CASE
    WHEN t.DisplayName NOT IN (
      'Deklaration & Årsbokslut',
      'Deklaration & Årsredovisning'
    ) THEN CONCAT(o.DisplayName, ' + ', t.DisplayName)
    ELSE o.DisplayName
  END AS DisplayName
FROM
  one AS o
  JOIN two AS t ON t.OrderNumber = o.OrderNumber
GROUP BY
  1,
  
  3,
  4,
  5,
  6,
  8,
  9,
  10
ORDER BY
  OrderDateCet DESC
`;

const cst = parse(sql, { dialect: 'bigquery', includeRange: true });
const stmt = cst.statements[0];

const selectColumns = getSelectColumns(stmt);
const groupByExprs = getGroupByExpressions(stmt);

console.log('SELECT columns count:', selectColumns.length);
console.log('GROUP BY expressions count:', groupByExprs.length);

// Collect positional references
const groupByPositions = new Set();
for (const groupExpr of groupByExprs) {
  const nodeType = getNodeType(groupExpr);
  
  if (nodeType === 'number' || nodeType === 'NumberLiteral' || nodeType === 'int' || nodeType === 'integer' ||
      nodeType === 'bigint' || nodeType === 'BigIntLiteral' || nodeType === 'number_literal') {
    let colNum = null;
    if (typeof groupExpr.value === 'number') {
      colNum = groupExpr.value;
    }
    if (colNum !== null) {
      groupByPositions.add(colNum);
    }
  }
}

console.log('Positional references found:', [...groupByPositions].sort((a, b) => a - b));
console.log('Missing position 2?', !groupByPositions.has(2));

// Simulate the validation
const BIGQUERY_AGGREGATE_FUNCTIONS = new Set(['count', 'sum', 'avg', 'min', 'max', 'array_agg', 'string_agg', 'any_value', 'countif']);

const isFunctionCall = (node) => {
  if (!node) return false;
  const type = getNodeType(node);
  return type === 'function' || type === 'FunctionCall' || type === 'function_call' || type === 'func_call' || type === 'aggr_func' || type === 'call_expr';
};

const extractFunctionName = (node) => {
  if (!node) return '';
  if (node.name?.name) return node.name.name.toLowerCase();
  if (typeof node.name === 'string') return node.name.toLowerCase();
  return '';
};

const containsAggregateFunction = (node) => {
  if (!node) return { found: false };
  if (Array.isArray(node)) {
    for (const child of node) {
      const result = containsAggregateFunction(child);
      if (result.found) return result;
    }
    return { found: false };
  }
  if (typeof node !== 'object') return { found: false };
  const nodeType = getNodeType(node);
  if (nodeType === 'select_stmt' || nodeType === 'select') return { found: false };
  const isFunc = isFunctionCall(node) || nodeType === 'func_call';
  if (isFunc) {
    const funcName = extractFunctionName(node);
    if (funcName && BIGQUERY_AGGREGATE_FUNCTIONS.has(funcName)) {
      return { found: true, functionName: funcName };
    }
  }
  for (const key of Object.keys(node)) {
    if (key === 'location' || key === 'loc' || key === 'range') continue;
    const result = containsAggregateFunction(node[key]);
    if (result.found) return result;
  }
  return { found: false };
};

console.log('\n--- Checking each SELECT column ---');
for (let i = 0; i < selectColumns.length; i++) {
  const position = i + 1;
  const col = selectColumns[i];
  const expr = col?.expr ?? col?.expression ?? col;
  const nodeType = getNodeType(expr);
  
  const aggResult = containsAggregateFunction(expr);
  const isCaseExpr = nodeType === 'case_expr';
  const isCovered = groupByPositions.has(position);
  
  let status;
  if (aggResult.found) {
    status = `AGGREGATE (${aggResult.functionName})`;
  } else if (isCaseExpr) {
    status = 'CASE EXPR';
  } else if (isCovered) {
    status = 'COVERED by GROUP BY';
  } else {
    status = '*** NOT COVERED - ERROR ***';
  }
  
  console.log(`  Position ${position} (${nodeType}): ${status}`);
}
