# BigQuery Query Syntax Rules Framework

> A comprehensive rules framework for writing valid BigQuery queries based on GoogleSQL syntax documentation.

## SQL Syntax Notation Rules

The following notation conventions are used throughout BigQuery SQL syntax:

| Notation | Example | Description |
|----------|---------|-------------|
| `[ ]` | `[optional]` | Optional clauses |
| `( )` | `(required)` | Literal parentheses |
| `\|` | `a \| b` | Logical XOR (exclusive OR) - select one option |
| `{ }` | `{ a \| b \| c }` | A set of options - select one option |
| `...` | `item ...` | The preceding item can repeat |
| `,` | `,` | Literal comma |
| `, ...` | `item, ...` | The preceding item can repeat in a comma-separated list |
| `item [, ...]` | | One or more items |
| `[item, ...]` | | Zero or more items |
| `""` | `"{"..."}"` | The enclosed syntax characters are literal and required |
| `<>` | `<table_name>` | Literal angle brackets |

## Query Structure Rules

### Basic Query Syntax

```
query_statement:
  query_expr

query_expr:
  [ WITH [ RECURSIVE ] { non_recursive_cte | recursive_cte }[, ...] ]
  { select | ( query_expr ) | set_operation }
  [ ORDER BY expression [{ ASC | DESC }] [, ...] ]
  [ LIMIT count [ OFFSET skip_rows ] ]
```

**Rules:**
- A query statement consists of a query expression (`query_expr`)
- Optional `WITH` clause can precede the main query
- Main query can be a `SELECT`, parenthesized query expression, or set operation
- `ORDER BY` and `LIMIT` clauses are optional and come after the main query

### SELECT Statement Rules

```
SELECT
  [ WITH differential_privacy_clause ]
  [ { ALL | DISTINCT } ]
  [ AS { STRUCT | VALUE } ]
  select_list
```

**Rules:**
- `SELECT` keyword is required
- `ALL` (default) or `DISTINCT` can be specified
- `AS STRUCT` or `AS VALUE` can be used for value tables
- `select_list` must contain at least one item

### SELECT List Rules

```
select_list:
  { select_all | select_expression } [, ...]

select_all:
  [ expression. ]*
  [ EXCEPT ( column_name [, ...] ) ]
  [ REPLACE ( expression AS column_name [, ...] ) ]

select_expression:
  expression [ [ AS ] alias ]
```

**Rules:**
- Each item in SELECT list can be:
  - `*` (select all columns)
  - `expression` (a single expression)
  - `expression.*` (all fields from an expression)
- `SELECT * EXCEPT` excludes specified columns
- `SELECT * REPLACE` replaces specified columns
- Expressions can have optional aliases using `AS` keyword

### FROM Clause Rules

```
FROM from_clause[, ...]

from_clause:
  from_item
  [ { pivot_operator | unpivot_operator | match_recognize_clause } ]
  [ tablesample_operator ]

from_item:
  {
    table_name [ as_alias ] [ FOR SYSTEM_TIME AS OF timestamp_expression ]
    | { join_operation | ( join_operation ) }
    | ( query_expr ) [ as_alias ]
    | field_path
    | unnest_operator
    | cte_name [ as_alias ]
  }
```

**Rules:**
- `FROM` clause specifies one or more data sources
- Multiple `from_clause` items can be specified (comma-separated)
- Each `from_item` can be:
  - A table name (optionally qualified: `project.dataset.table`)
  - A join operation
  - A subquery
  - A field path (for nested structures)
  - An `UNNEST` operation
  - A CTE name
- Table aliases are optional but recommended for clarity

### WHERE Clause Rules

```
WHERE bool_expression
```

**Rules:**
- `WHERE` clause is optional
- Must contain a boolean expression
- Filters rows before grouping (if `GROUP BY` is used)
- Cannot reference window functions or aggregate functions (use `HAVING` for aggregates)

### GROUP BY Rules

```
GROUP BY group_by_specification
```

**Rules:**
- `GROUP BY` is optional
- When used, all non-aggregated columns in `SELECT` must appear in `GROUP BY`
- Aggregated columns (using functions like `SUM`, `COUNT`, etc.) are allowed without being in `GROUP BY`
- Can use column names, expressions, or positional references (1, 2, 3, etc.)

### HAVING Clause Rules

```
HAVING bool_expression
```

**Rules:**
- `HAVING` is optional
- Used to filter groups after `GROUP BY`
- Can reference aggregate functions
- Must come after `GROUP BY` clause
- Cannot reference window functions

### QUALIFY Clause Rules

```
QUALIFY bool_expression
```

**Rules:**
- `QUALIFY` is optional
- Used to filter results of window functions
- Must come after `WINDOW` clause (if present)
- Can only reference window functions, not regular columns

### ORDER BY Rules

```
ORDER BY expression [{ ASC | DESC }] [, ...]
```

**Rules:**
- `ORDER BY` is optional
- Can specify multiple expressions
- Default sort order is `ASC` (ascending)
- `DESC` specifies descending order
- Can use column names, expressions, or positional references

### LIMIT and OFFSET Rules

```
LIMIT count [ OFFSET skip_rows ]
```

**Rules:**
- `LIMIT` is optional
- `count` specifies maximum number of rows to return
- `OFFSET` specifies number of rows to skip before returning results
- `OFFSET` can only be used with `LIMIT`

## SELECT Statement Variants

### SELECT * Rules
- Produces one output column for each column visible after executing the full query
- Includes all columns from all tables/CTEs in the query

### SELECT expression Rules
- Each expression evaluates to a single value
- Produces one output column per expression
- Can have explicit alias using `AS` keyword
- If no alias, receives implicit alias if possible, otherwise anonymous

### SELECT expression.* Rules
- Produces one output column for each column or top-level field of the expression
- Expression must be a table alias or evaluate to a STRUCT type
- Useful for expanding STRUCT fields into separate columns

### SELECT * EXCEPT Rules
- Excludes specified columns from the result
- All matching column names are omitted
- Does not exclude columns without names
- Syntax: `SELECT * EXCEPT (column1, column2)`

### SELECT * REPLACE Rules
- Replaces specified columns with new expressions
- Does not change column names or order
- Can change value and value type
- Syntax: `SELECT * REPLACE (expression AS column_name)`
- Does not replace columns without names

### SELECT DISTINCT Rules
- Discards duplicate rows
- Returns only unique rows
- Cannot return columns of certain types (arrays, structs with arrays, etc.)
- More restrictive than `SELECT ALL`

### SELECT ALL Rules
- Returns all rows, including duplicates
- This is the default behavior
- Explicitly specifying `ALL` is optional

### SELECT AS STRUCT Rules
- Produces a value table with a STRUCT row type
- STRUCT field names and types match column names and types in SELECT list
- Useful in scalar or array subqueries to return multiple values as a single STRUCT

### SELECT AS VALUE Rules
- Produces a value table from a SELECT list with exactly one column
- Output row type is the value type of the single column
- Any column alias is discarded

## FROM Clause Component Rules

### Table Name Rules
- Can be unqualified: `table_name`
- Can be dataset-qualified: `dataset.table_name`
- Can be fully-qualified: `project.dataset.table_name`
- Table aliases are optional: `table_name [AS] alias`

### FOR SYSTEM_TIME AS OF Rules
- References historical versions of tables
- `timestamp_expression` must be a constant expression
- Cannot contain:
  - Subqueries
  - Correlated references
  - User-defined functions (UDFs)
- Timestamp must be:
  - Not in the future
  - Not more than 7 days before current timestamp
- Cannot reference same table at multiple points in time in a single query
- Default time zone is `America/Los_Angeles` (not UTC)

### Join Operation Rules

#### Join Types
- `INNER JOIN` or `JOIN`: Returns matching rows from both tables
- `LEFT [OUTER] JOIN`: Returns all rows from left table, NULLs for non-matching right rows
- `RIGHT [OUTER] JOIN`: Returns all rows from right table, NULLs for non-matching left rows
- `FULL [OUTER] JOIN`: Returns all rows from both tables, NULLs for non-matching rows
- `CROSS JOIN`: Returns Cartesian product (all combinations)
- Comma (`,`): Implicit cross join

#### Join Condition Rules
- `ON bool_expression`: Boolean expression specifying join condition
- `USING (column_list)`: Equality join on specified columns that exist in both tables
- `ON` clause: NULL evaluation is equivalent to FALSE
- `USING` clause: Column names must not be qualified by table name

### UNNEST Operator Rules

```
UNNEST( array ) [ as_alias ] [ WITH OFFSET [ as_alias ] ]
```

**Rules:**
- Takes an array and returns a table with one row per array element
- Returns a value table (one column)
- `WITH OFFSET` adds a column with array element indexes (starting at 0)
- Can be explicit (`UNNEST(array)`) or implicit (using `array_path`)
- `NULL` and empty arrays produce zero rows
- Arrays containing `NULL` values produce rows with `NULL` values
- For STRUCT arrays, returns separate columns for each struct field

### PIVOT Operator Rules

```
PIVOT(
  aggregate_function_call [as_alias][, ...]
  FOR input_column
  IN ( pivot_column [as_alias][, ...] )
) [AS alias]
```

**Rules:**
- Rotates rows into columns using aggregation
- `from_item` must not produce a value table
- `from_item` must not be a subquery using `SELECT AS STRUCT`
- `aggregate_function_call`:
  - Must be an aggregate function
  - Can reference columns from input table and correlated columns
  - Cannot access columns defined by PIVOT clause itself
  - Must take one argument (except COUNT can use `*`)
  - Must ignore NULL inputs (except COUNT)
- `input_column`:
  - Must access columns from input table or correlated columns
  - Evaluated against each row (no aggregates/window functions)
  - Type must be groupable
- `pivot_column`:
  - Must be a constant (not variables or query parameters)
  - If no alias, default column name is constructed based on value type

### UNPIVOT Operator Rules

```
UNPIVOT [ { INCLUDE NULLS | EXCLUDE NULLS } ] (
  { single_column_unpivot | multi_column_unpivot }
) [unpivot_alias]
```

**Rules:**
- Rotates columns into rows
- `from_item` must not produce a value table
- Duplicate columns in `from_item` cannot be referenced
- `INCLUDE NULLS`: Adds rows with NULL values
- `EXCLUDE NULLS`: Excludes rows with NULL values (default)
- `values_column`: Cannot be same name as `name_column` or `unpivot_column`
- `name_column`: Cannot be same name as `values_column` or `unpivot_column`
- `unpivot_column`: Must be column name from `from_item`
- All columns in a column set must have equivalent data types

### TABLESAMPLE Operator Rules

```
TABLESAMPLE SYSTEM ( percent PERCENT )
```

**Rules:**
- Selects a random sample of a dataset
- `percent` must be between 0 and 100
- Can be a literal value or query parameter (not a variable)
- Each execution may return different results
- Results are not cached

### MATCH_RECOGNIZE Clause Rules

```
MATCH_RECOGNIZE (
  [ PARTITION BY partition_expr [, ...] ]
  ORDER BY order_expr [{ ASC | DESC }] [{ NULLS FIRST | NULLS LAST }] [, ...]
  MEASURES { measures_expr [AS] alias } [, ...]
  [ AFTER MATCH SKIP { PAST LAST ROW | TO NEXT ROW } ]
  PATTERN (pattern)
  DEFINE symbol AS boolean_expr [, ...]
  [ OPTIONS ( [ use_longest_match = { TRUE | FALSE } ] ) ]
)
```

**Rules:**
- Used to filter and aggregate based on pattern matches
- `PARTITION BY`: Partitions input rows (optional)
- `ORDER BY`: Orders rows before matching (required)
- `MEASURES`: Aggregate expressions evaluated per match
  - Must provide alias for each expression
  - Must aggregate columns except PARTITION BY columns
  - Can use `symbol.column_name` syntax to aggregate only rows matching a symbol
- `PATTERN`: Sequence of symbols and pattern elements
- `DEFINE`: Boolean expressions for each symbol
- `AFTER MATCH SKIP`: Controls overlapping matches
  - `PAST LAST ROW`: No overlapping (default)
  - `TO NEXT ROW`: Allows overlapping

## WITH Clause Rules (CTEs)

```
WITH [ RECURSIVE ] { non_recursive_cte | recursive_cte }[, ...]

non_recursive_cte:
  cte_name [ ( column_name [, ...] ) ] AS ( query_expr )

recursive_cte:
  cte_name [ ( column_name [, ...] ) ] AS (
    base_query_expr
    UNION ALL
    recursive_query_expr
  )
```

**Rules:**
- `WITH` clause defines Common Table Expressions (CTEs)
- CTEs act like temporary tables for the duration of the query
- Can reference CTEs in `FROM` clause by name
- `RECURSIVE` keyword enables recursive CTEs
- CTEs hide permanent tables with the same name (unless fully qualified)
- Multiple CTEs can be defined, separated by commas

## Set Operation Rules

Set operations combine results from multiple queries:
- `UNION [ALL]`: Combines results, removes duplicates (unless ALL)
- `INTERSECT [ALL]`: Returns rows that appear in both queries
- `EXCEPT [ALL]`: Returns rows from first query not in second query

**Rules:**
- All queries must have the same number of columns
- Corresponding columns must have compatible types
- Column names come from the first query
- `ALL` preserves duplicates, without `ALL` removes duplicates

## Window Function Rules

```
WINDOW window_clause

window_clause:
  window_name AS ( window_spec )
  | window_spec
```

**Rules:**
- Window functions compute values over a set of rows
- `WINDOW` clause defines window specifications
- Can be referenced in `SELECT` and `ORDER BY` clauses
- Window specifications include:
  - `PARTITION BY`: Groups rows into partitions
  - `ORDER BY`: Orders rows within partitions
  - `ROWS` or `RANGE`: Defines window frame

## General Syntax Rules

### Identifier Rules
- Identifiers (table names, column names, etc.) can be:
  - Unquoted: Must start with letter or underscore, contain letters, digits, underscores
  - Quoted: Can contain any characters, case-sensitive
- Backticks (`` ` ``) are used for quoted identifiers in BigQuery

### Expression Rules
- Expressions can be:
  - Column references
  - Literals (strings, numbers, dates, etc.)
  - Function calls
  - Operators
  - Subqueries
  - CASE expressions

### Alias Rules
- Aliases can be specified using `AS` keyword or implicitly
- `AS` keyword is optional in most contexts
- Aliases can be used in `ORDER BY` and `GROUP BY` clauses

### NULL Handling Rules
- `NULL` represents missing or unknown values
- Comparisons with `NULL` return `NULL` (not TRUE or FALSE)
- Use `IS NULL` or `IS NOT NULL` to check for NULL values
- Aggregate functions typically ignore NULL values (except COUNT)

### Type Coercion Rules
- BigQuery performs automatic type coercion in many contexts
- Explicit casting can be done with `CAST(expression AS type)` or `SAFE_CAST`
- Some coercions may result in errors or data loss

## Query Execution Order

Understanding the logical order of query execution helps write valid queries:

1. **FROM**: Identify and join tables
2. **WHERE**: Filter rows
3. **GROUP BY**: Group rows
4. **HAVING**: Filter groups
5. **WINDOW**: Compute window functions
6. **QUALIFY**: Filter window function results
7. **SELECT**: Select columns and expressions
8. **DISTINCT**: Remove duplicates
9. **ORDER BY**: Sort results
10. **LIMIT/OFFSET**: Limit and paginate results

**Important:** This is the logical order, not necessarily the physical execution order. The query optimizer may reorder operations for efficiency.

## Common Syntax Errors to Avoid

1. **Using aggregate functions in WHERE clause**: Use `HAVING` instead
2. **Referencing window functions in WHERE clause**: Use `QUALIFY` instead
3. **Missing GROUP BY columns**: All non-aggregated columns must be in GROUP BY
4. **Using column aliases in WHERE clause**: Aliases are not available until SELECT
5. **Mixing aggregate and non-aggregate columns**: All columns must be aggregated or in GROUP BY
6. **Invalid join conditions**: Join conditions must reference columns from joined tables
7. **Using DISTINCT with incompatible types**: Some types cannot be used with DISTINCT
8. **Invalid LIMIT/OFFSET**: OFFSET can only be used with LIMIT
9. **Circular CTE references**: Recursive CTEs must have proper base case
10. **Invalid table references**: Tables must exist and be accessible

## Best Practices

1. **Always use table aliases** for clarity, especially in joins
2. **Qualify column names** when multiple tables have columns with the same name
3. **Use explicit JOIN syntax** instead of comma joins for better readability
4. **Specify column lists** instead of `SELECT *` in production queries
5. **Use appropriate data types** and avoid unnecessary type coercion
6. **Filter early** using WHERE clause to reduce data processed
7. **Use LIMIT** during development to test queries on smaller datasets
8. **Document complex queries** with comments explaining logic
9. **Test with sample data** before running on large datasets
10. **Validate query syntax** before executing expensive operations

---

*This rules framework is based on the official BigQuery GoogleSQL query syntax documentation. For the most up-to-date information, refer to: https://docs.cloud.google.com/bigquery/docs/reference/standard-sql/query-syntax*

