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

**Field path rules:**
- `field_path` is any path that resolves to a field within a data type
- Can go arbitrarily deep into a nested data structure
- Field paths in `FROM` clause must end in an array field
- Field paths can't contain arrays before the end of the path
- If a path has only one name, it's interpreted as a table (wrap with `UNNEST` or use fully-qualified path to work around)
- If a path has more than one name and matches a field name, it's interpreted as a field name (wrap path using backticks to force table name interpretation)

### WHERE Clause Rules

```
WHERE bool_expression
```

**Rules:**
- `WHERE` clause is optional
- Must contain a boolean expression
- Filters the results of the `FROM` clause
- Only rows whose `bool_expression` evaluates to `TRUE` are included
- Rows whose `bool_expression` evaluates to `NULL` or `FALSE` are discarded
- Filters rows before grouping (if `GROUP BY` is used)
- Cannot reference window functions or aggregate functions (use `HAVING` for aggregates)
- Evaluation order: `FROM` → `WHERE` → `GROUP BY` and aggregation → `HAVING` → `WINDOW` → `QUALIFY` → `DISTINCT` → `ORDER BY` → `LIMIT`
- Evaluation order doesn't always match syntax order
- Only references columns available via the `FROM` clause; can't reference `SELECT` list aliases
- Expressions in an `INNER JOIN` have an equivalent expression in the `WHERE` clause

### GROUP BY Rules

```
GROUP BY group_by_specification

group_by_specification:
  {
    groupable_items
    | ALL
    | grouping_sets_specification
    | rollup_specification
    | cube_specification
    | ()
  }
```

**Rules:**
- `GROUP BY` is optional
- When used, all non-aggregated columns in `SELECT` must appear in `GROUP BY`
- Aggregated columns (using functions like `SUM`, `COUNT`, etc.) are allowed without being in `GROUP BY`
- Can use column names, expressions, or positional references (1, 2, 3, etc.)
- `GROUP BY ()` groups all rows and produces a grand total (equivalent to no group_by_specification)

#### Group rows by groupable items

```
GROUP BY groupable_item[, ...]

groupable_item:
  {
    value
    | value_alias
    | column_ordinal
  }
```

**Rules:**
- `value`: An expression that represents a non-distinct, groupable value
- `value_alias`: An alias for `value`
- `column_ordinal`: An `INT64` value representing the ordinal assigned to a groupable expression in the `SELECT` list
- Can group by arrays (if same length and group type)
- Can group by structs (if same group types)

#### Group rows by ALL

```
GROUP BY ALL
```

**Rules:**
- Automatically groups rows by inferring grouping keys from `SELECT` items
- Excludes from grouping:
  - Expressions that include aggregate functions
  - Expressions that include window functions
  - Expressions that don't reference a name from the `FROM` clause (constants, query parameters, correlated column references)
  - Expressions that only reference `GROUP BY` keys inferred from other `SELECT` items
- If inferred grouping keys set is empty, all input rows are considered a single group (equivalent to `GROUP BY ()`)

**Limitations and Best Practices:**

`GROUP BY ALL` works well when:
- There are no aggregate functions in the query (though it's unnecessary in this case)
- All non-aggregated columns are simple column references from the `FROM` clause
- Expressions are straightforward and directly reference columns from the main table or CTE

`GROUP BY ALL` may fail or produce unexpected results when:
- **Complex expressions referencing joined tables**: When using `GROUP BY ALL` with aggregate functions, complex expressions (like `CASE` statements) that reference columns from joined tables may not be properly inferred as grouping keys
- **Mixed aggregates and non-aggregates**: When you have both aggregate functions and complex non-aggregated expressions, especially those referencing columns from multiple joined tables, `GROUP BY ALL` may not correctly infer all required grouping keys
- **Expressions not directly referencing FROM clause columns**: If expressions reference columns through aliases or complex paths from joined tables, inference may fail

**Recommendation:**
- Use explicit `GROUP BY` with a column list when:
  - You have aggregate functions AND complex expressions (especially `CASE` statements)
  - You're joining multiple tables and referencing columns from different tables in expressions
  - You want explicit control over grouping behavior
- Use `GROUP BY ALL` when:
  - You have simple column references and aggregate functions
  - You want automatic inference for straightforward queries
  - All expressions are simple and directly reference columns from the main data source

**Example of when to use explicit GROUP BY instead:**

```sql
-- This may fail with GROUP BY ALL:
SELECT 
    o.OrderNumber,
    SUM(o.Discount) AS TotalDiscount,
    CASE WHEN t.DisplayName NOT IN ('A', 'B') 
         THEN CONCAT(o.DisplayName, ' + ', t.DisplayName) 
         ELSE o.DisplayName 
    END AS DisplayName
FROM one AS o
JOIN two AS t ON t.OrderNumber = o.OrderNumber
GROUP BY ALL  -- May fail: CASE expression references joined table column

-- Use explicit GROUP BY instead:
GROUP BY 
    o.OrderNumber,
    o.DisplayName,
    t.DisplayName  -- Must explicitly include joined table column
```

#### Group rows by GROUPING SETS

```
GROUP BY GROUPING SETS ( grouping_list )

grouping_list:
  {
    rollup_specification
    | cube_specification
    | groupable_item
    | groupable_item_set
  }[, ...]

groupable_item_set:
  ( [ groupable_item[, ...] ] )
```

**Rules:**
- Produces aggregated data for one or more grouping sets
- A grouping set is a group of columns by which rows can be grouped together
- Roughly equivalent to `GROUP BY x UNION ALL GROUP BY y`
- Anonymous STRUCT values aren't allowed
- Allows up to 4096 groupable items
- When evaluating results for a grouping set, expressions not in the grouping set are aggregated and produce a `NULL` placeholder

#### Group rows by ROLLUP

```
GROUP BY ROLLUP ( grouping_list )

grouping_list:
  { groupable_item | groupable_item_set }[, ...]
```

**Rules:**
- Produces aggregated data for rolled up grouping sets
- Generates grouping sets from prefixes in the grouping list
- Includes an empty grouping set (grand total)
- For `GROUP BY ROLLUP (a, b, c)`, generates: `(a, b, c)`, `(a, b)`, `(a)`, `()`
- Anonymous STRUCT values aren't allowed
- Allows up to 4095 groupable items (equivalent to 4096 grouping sets)
- When evaluating results for a grouping set, expressions not in the grouping set are aggregated and produce a `NULL` placeholder

#### Group rows by CUBE

```
GROUP BY CUBE ( grouping_list )

grouping_list:
  { groupable_item | groupable_item_set }[, ...]
```

**Rules:**
- Produces aggregated data for all grouping set permutations
- Generates grouping sets from all permutations in the grouping list
- Includes an empty grouping set (grand total)
- For `GROUP BY CUBE (a, b, c)`, generates: `(a, b, c)`, `(a, b)`, `(a, c)`, `(a)`, `(b, c)`, `(b)`, `(c)`, `()`
- Anonymous STRUCT values aren't allowed
- Allows up to 12 groupable items (equivalent to 4096 grouping sets)
- When evaluating results for a grouping set, expressions not in the grouping set are aggregated and produce a `NULL` placeholder

### HAVING Clause Rules

```
HAVING bool_expression
```

**Rules:**
- `HAVING` is optional
- Used to filter groups after `GROUP BY` or aggregation
- `GROUP BY` or aggregation must be present in the query
- Can reference aggregate functions
- Can reference columns available via the `FROM` clause and `SELECT` list aliases
- Expressions referenced must either appear in the `GROUP BY` clause or be the result of an aggregate function
- Must come after `GROUP BY` clause
- Cannot reference window functions
- Evaluation order: `FROM` → `WHERE` → `GROUP BY` and aggregation → `HAVING` → `WINDOW` → `QUALIFY` → `DISTINCT` → `ORDER BY` → `LIMIT`

#### Mandatory Aggregation

Aggregation doesn't have to be present in the `HAVING` clause itself, but aggregation must be present in at least one of the following forms:
- Aggregation function in the `SELECT` list
- Aggregation function in the `HAVING` clause
- Aggregation in both the `SELECT` list and `HAVING` clause (can be different functions)

### QUALIFY Clause Rules

```
QUALIFY bool_expression
```

**Rules:**
- `QUALIFY` is optional
- Used to filter results of window functions
- A window function is required to be present in the `QUALIFY` clause or the `SELECT` list
- Only rows whose `bool_expression` evaluates to `TRUE` are included
- Rows whose `bool_expression` evaluates to `NULL` or `FALSE` are discarded
- Evaluation order: `FROM` → `WHERE` → `GROUP BY` and aggregation → `HAVING` → `WINDOW` → `QUALIFY` → `DISTINCT` → `ORDER BY` → `LIMIT`
- You don't have to include a window function in the `SELECT` list to use `QUALIFY`

### Differential Privacy Clause

```
SELECT
  WITH DIFFERENTIAL_PRIVACY
    OPTIONS(
      epsilon = expression,
      delta = expression,
      [ max_groups_contributed = expression ],
      privacy_unit_column = column_name
    )
  select_list
```

**Rules:**
- Transforms query results with differentially private aggregations
- Must be added after the `SELECT` keyword
- Requires one or more differentially private aggregate functions in the `SELECT` list
- `epsilon`: Controls amount of noise added (higher epsilon = less noise). Must be a literal returning `FLOAT64`
- `delta`: Probability that any row fails to be epsilon-differentially private. Must be a literal returning `FLOAT64`
- `max_groups_contributed`: Positive integer limiting number of groups an entity can contribute to. Default is 1. Must be a literal returning `INT64`
- `privacy_unit_column`: Column representing the privacy unit column (path expression)
- GoogleSQL splits `epsilon` between differentially private aggregates in the query
- If `max_groups_contributed` is unspecified, results might not be differentially private

### AGGREGATION_THRESHOLD Clause

**Syntax for query:**
```
WITH AGGREGATION_THRESHOLD OPTIONS (
  threshold = threshold_amount,
  privacy_unit_column = column_name
)
```

**Syntax for view:**
```
WITH AGGREGATION_THRESHOLD [ OPTIONS (
  [ threshold = threshold_amount ],
  [ privacy_unit_column = column_name ]
) ]
```

**Rules:**
- Enforces an aggregation threshold
- Counts number of distinct privacy units for each group
- Only outputs groups where distinct privacy unit count satisfies the aggregation threshold
- `threshold`: Minimum number of distinct privacy units (positive `INT64` value)
- `privacy_unit_column`: Column representing the privacy unit column (path expression)
- When querying a privacy-enforced view, `OPTIONS` clause is not needed
- Query threshold must be equal to or greater than view threshold
- Query `privacy_unit_column` must match view `privacy_unit_column`
- Supported aggregate functions: `APPROX_COUNT_DISTINCT`, `AVG`, `COUNT`, `COUNTIF`, `LOGICAL_AND`, `LOGICAL_OR`, `SUM`, `COVAR_POP`, `COVAR_SAMP`, `STDDEV_POP`, `STDDEV_SAMP`, `VAR_POP`, `VAR_SAMP`

### ORDER BY Rules

```
ORDER BY expression [{ ASC | DESC }] [{ NULLS FIRST | NULLS LAST }] [, ...]
```

**Rules:**
- `ORDER BY` is optional
- Can specify multiple expressions
- Default sort order is `ASC` (ascending)
- `DESC` specifies descending order
- `NULLS FIRST`: Sort null values before non-null values
- `NULLS LAST`: Sort null values after non-null values
- Default null ordering:
  - `NULLS FIRST` is applied by default if sort order is ascending
  - `NULLS LAST` is applied by default if sort order is descending
- Can use column names, expressions, or positional references (integer literals)
- When used with set operators, `ORDER BY` applies to the entire result set, not just the closest `SELECT` statement

### LIMIT and OFFSET Rules

```
LIMIT count [ OFFSET skip_rows ]
```

**Rules:**
- `LIMIT` is optional
- `count` is an `INT64` constant expression representing the non-negative, non-`NULL` limit
- No more than `count` rows are produced
- `LIMIT 0` returns 0 rows
- `OFFSET`: Skips a specific number of rows before applying `LIMIT`
- `skip_rows` is an `INT64` constant expression representing the non-negative, non-`NULL` number of rows to skip
- `OFFSET` can only be used with `LIMIT`
- Rows returned by `LIMIT` and `OFFSET` have undefined order unless used after `ORDER BY`
- A constant expression can be represented by a general expression, literal, or parameter value
- **Important:** Although `LIMIT` clause limits rows that a query produces, it doesn't limit the amount of data processed by that query
- If there is a set operation, `LIMIT` is applied after the set operation is evaluated

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

```
join_operation:
  { cross_join_operation | condition_join_operation }

cross_join_operation:
  from_item cross_join_operator from_item

condition_join_operation:
  from_item condition_join_operator from_item join_condition

cross_join_operator:
  { CROSS JOIN | , }

condition_join_operator:
  {
    [INNER] JOIN
    | FULL [OUTER] JOIN
    | LEFT [OUTER] JOIN
    | RIGHT [OUTER] JOIN
  }

join_condition:
  { on_clause | using_clause }

on_clause:
  ON bool_expression

using_clause:
  USING ( column_list )
```

#### Join Types

- `INNER JOIN` or `JOIN`: Returns matching rows from both tables (effectively calculates Cartesian product and discards rows that don't meet join condition)
- `LEFT [OUTER] JOIN`: Returns all rows from left table, NULLs for non-matching right rows
- `RIGHT [OUTER] JOIN`: Returns all rows from right table, NULLs for non-matching left rows
- `FULL [OUTER] JOIN`: Returns all rows from both tables, NULLs for non-matching rows
- `CROSS JOIN`: Returns Cartesian product (all combinations of rows)
- Comma (`,`): Implicit cross join (comma cross join)

#### Join Condition Rules

**ON clause:**
- `ON bool_expression`: Boolean expression specifying join condition
- Given a row from each table, if `ON` clause evaluates to `TRUE`, generates a consolidated row
- `NULL` join condition evaluation is equivalent to `FALSE`
- Produces a column once for each column in each input table
- If column-order sensitive operation is used, resulting table contains all columns from left input in order, then all columns from right input in order

**USING clause:**
- `USING (column_list)`: Performs equality comparison on specified columns
- Each column name in `column_list` must appear in both input tables
- `NULL` join condition evaluation is equivalent to `FALSE`
- Column name in `USING` clause must not be qualified by table name
- Resulting table column order:
  - Columns from `column_list` in order they appear in `USING` clause
  - All other columns of left input in order
  - All other columns of right input in order
- Output columns populated from:
  - `INNER JOIN` or `LEFT OUTER JOIN`: values in first table
  - `RIGHT OUTER JOIN`: values in second table
  - `FULL OUTER JOIN`: coalesced values from left and right tables

#### Join Operations in a Sequence

**Rules:**
- `FROM` clause can contain multiple `JOIN` operations in a sequence
- `JOIN`s are bound from left to right
- Parentheses can be used to group `JOIN`s and control binding order
- If clause contains comma cross joins, must use parentheses
- Can't have `RIGHT JOIN` or `FULL JOIN` after a comma cross join unless parenthesized
- Comma cross joins group from left to right like other `JOIN` types

#### Correlated Join Operation

A join operation is correlated when the right `from_item` contains a reference to at least one range variable or column name introduced by the left `from_item`.

**Rules:**
- Rows from the right `from_item` are determined by a row from the left `from_item`
- `RIGHT OUTER` and `FULL OUTER` joins can't be correlated
- All correlated join operations must reference an array in the right `from_item`
- `UNNEST` operator can be explicit or implicit in correlated joins
- Right `from_item` is re-evaluated against each distinct row from the left `from_item`
- In correlated `LEFT JOIN`, when input table on right side is empty for some row from left side, row with `NULL` values for all columns on right side is generated
- In correlated `CROSS JOIN`, when input table on right side is empty for some row from left side, row is dropped from results

### UNNEST Operator Rules

```
unnest_operator:
  {
    UNNEST( array ) [ as_alias ]
    | array_path [ as_alias ]
  }
  [ WITH OFFSET [ as_alias ] ]

array:
  { array_expression | array_path }

as_alias:
  [AS] alias
```

**Rules:**
- Takes an array and returns a table with one row per array element
- Returns a value table (one column)
- For `ARRAY` element types that are `STRUCT`, `SELECT *` against the value table column returns multiple columns
- `array_expression`: An expression that produces an array and that's not an array path
- `array_path`: The path to an `ARRAY` type
- `as_alias`: If specified, defines explicit name of value table column containing array element values
- `WITH OFFSET`: Returns additional column with array element indexes (offsets), starting at zero for each row produced by `UNNEST` operation
- Default column name for offset is `offset` if alias isn't used
- Can also use `UNNEST` outside of `FROM` clause with the `IN` operator

**UNNEST and structs:**
- For input array of structs, `UNNEST` returns a row for each struct, with separate column for each field in the struct
- Alias for each column is the name of the corresponding struct field
- If you reference the range variable in `SELECT` list, query returns a struct containing all fields of the original struct

**Explicit unnesting:**
- `UNNEST` keyword is required
- Example: `SELECT results FROM Coordinates, UNNEST(Coordinates.position) AS results`

**Implicit unnesting:**
- `UNNEST` keyword isn't used
- When using `array_path` with implicit `UNNEST`, `array_path` must be prepended with the table
- Example: `SELECT results FROM Coordinates, Coordinates.position AS results`

**UNNEST and NULL values:**
- `NULL` and empty arrays produce zero rows
- An array containing `NULL` values produces rows containing `NULL` values

### PIVOT Operator Rules

```
FROM from_item[, ...] pivot_operator

pivot_operator:
  PIVOT(
    aggregate_function_call [as_alias][, ...]
    FOR input_column
    IN ( pivot_column [as_alias][, ...] )
  ) [AS alias]

as_alias:
  [AS] alias
```

**Rules:**
- Rotates rows into columns using aggregation
- `PIVOT` is part of the `FROM` clause
- Can be used to modify any table expression
- Combining `PIVOT` with `FOR SYSTEM_TIME AS OF` isn't allowed (but can use `PIVOT` against subquery that uses `FOR SYSTEM_TIME AS OF`)
- `WITH OFFSET` clause immediately preceding `PIVOT` operator isn't allowed

**Rules for `from_item` passed to `PIVOT`:**
- May consist of any table, subquery, or table-valued function (TVF) result
- May not produce a value table
- May not be a subquery using `SELECT AS STRUCT`

**Rules for `aggregate_function_call`:**
- Must be an aggregate function (e.g., `SUM`)
- May reference columns in a table passed to `PIVOT`, as well as correlated columns
- May not access columns defined by the `PIVOT` clause itself
- Table passed to `PIVOT` may be accessed through its alias if one is provided
- Can only use an aggregate function that takes one argument
- Except for `COUNT`, can only use aggregate functions that ignore `NULL` inputs
- If using `COUNT`, can use `*` as an argument

**Rules for `input_column`:**
- May access columns from the input table, as well as correlated columns, not columns defined by `PIVOT` clause itself
- Evaluated against each row in the input table; aggregate and window function calls are prohibited
- Non-determinism is okay
- Type must be groupable
- Input table may be accessed through its alias if one is provided

**Rules for `pivot_column`:**
- Must be a constant
- Named constants (such as variables) aren't supported
- Query parameters aren't supported
- If a name is desired for a named constant or query parameter, specify it explicitly with an alias
- Corner cases exist where distinct `pivot_column`s can end up with the same default column names
- If `pivot_column` doesn't specify an alias, a column name is constructed based on value type (NULL, INT64/NUMERIC/BIGNUMERIC, BOOL, STRING, DATE, ENUM, STRUCT, or other types require alias)

### UNPIVOT Operator Rules

```
FROM from_item[, ...] unpivot_operator

unpivot_operator:
  UNPIVOT [ { INCLUDE NULLS | EXCLUDE NULLS } ] (
    { single_column_unpivot | multi_column_unpivot }
  ) [unpivot_alias]

single_column_unpivot:
  values_column
  FOR name_column
  IN (columns_to_unpivot)

multi_column_unpivot:
  values_column_set
  FOR name_column
  IN (column_sets_to_unpivot)

values_column_set:
  (values_column[, ...])

columns_to_unpivot:
  unpivot_column [row_value_alias][, ...]

column_sets_to_unpivot:
  (unpivot_column [row_value_alias][, ...])

unpivot_alias and row_value_alias:
  [AS] alias
```

**Rules:**
- Rotates columns into rows
- `UNPIVOT` is part of the `FROM` clause
- Can be used to modify any table expression
- Combining `UNPIVOT` with `FOR SYSTEM_TIME AS OF` isn't allowed (but can use `UNPIVOT` against subquery that uses `FOR SYSTEM_TIME AS OF`)
- `WITH OFFSET` clause immediately preceding `UNPIVOT` operator isn't allowed
- `PIVOT` aggregations can't be reversed with `UNPIVOT`

**Rules for `from_item` passed to `UNPIVOT`:**
- May consist of any table, subquery, or table-valued function (TVF) result
- May not produce a value table
- Duplicate columns in `from_item` can't be referenced in the `UNPIVOT` clause

**Rules for `unpivot_operator`:**
- Expressions aren't permitted
- Qualified names aren't permitted (e.g., `mytable.mycolumn` isn't allowed)
- In case where `UNPIVOT` result has duplicate column names:
  - `SELECT *` is allowed
  - `SELECT values_column` causes ambiguity

**Rules for `values_column`:**
- Can't be a name used for a `name_column` or an `unpivot_column`
- Can be the same name as a column from the `from_item`

**Rules for `name_column`:**
- Can't be a name used for a `values_column` or an `unpivot_column`
- Can be the same name as a column from the `from_item`

**Rules for `unpivot_column`:**
- Must be a column name from the `from_item`
- Can't reference duplicate `from_item` column names
- All columns in a column set must have equivalent data types
  - Data types can't be coerced to a common supertype
  - If data types are exact matches (e.g., struct with different field names), data type of first input is the data type of the output
- Can't have the same name in the same column set
- Can have the same name in different column sets

**Rules for `row_value_alias`:**
- Can be a string or an `INT64` literal
- Data type for all `row_value_alias` clauses must be the same
- If value is an `INT64`, `row_value_alias` for each `unpivot_column` must be specified

**Single-column unpivot:**
- Rotates columns into one `values_column` and one `name_column`

**Multi-column unpivot:**
- Rotates columns into multiple `values_column`s and one `name_column`

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
- A match is an ordered sequence of rows that match a pattern
- Matching rows works similarly to matching with regular expressions, but across rows in a table

**PARTITION BY clause:**
- Partitions input rows for pattern matching (optional)
- Each partition is sorted according to `ORDER BY` clause
- Matches must be entirely contained within a partition
- If omitted, entire input table belongs to a single partition
- Expression can't contain floating point types, non-groupable types, constants, or window functions
- Can't introduce an alias for a partition expression

**ORDER BY clause:**
- Orders rows of input for pattern matching (required)
- Follows same rules as standard `ORDER BY` clause
- Data type of each expression must be orderable
- If all expressions are tied, rows may be ordered arbitrarily

**MEASURES clause:**
- Lists aggregate expressions to compute for each match
- Must provide alias for each aggregate expression
- Aggregate expressions must aggregate any columns they reference, except columns in `PARTITION BY` clause
- To aggregate only rows matching a particular symbol, use `symbol_name.column_name` syntax
- Can't use a symbol without a column reference
- Can't reference multiple symbols within the same aggregation function
- A single row can match at most one symbol within a pattern
- Order-sensitive aggregate functions (like `ARRAY_AGG`, `STRING_AGG`) are ordered according to `ORDER BY` clause unless they include `DISTINCT` or explicit ordering
- Special functions: `FIRST(x)`, `LAST(x)`, `MATCH_NUMBER()`, `MATCH_ROW_NUMBER()`, `CLASSIFIER()`

**PATTERN clause:**
- Specifies a pattern to match
- A pattern is a sequence of symbols and operators
- Adjacent symbols must be separated by a space or grouped separately using parentheses
- Pattern matches computed based on order specified in `ORDER BY` clause
- Each pattern match must appear entirely within a partition

**Pattern Elements (in order of precedence):**
- `(<pattern>)`: Matches `<pattern>` (grouping)
- `<symbol>`: Matches a single row where associated expression in `DEFINE` clause evaluates to `TRUE`
- `()`: Matches an empty row sequence unconditionally
- `^`: Matches empty row sequence only before first row of input
- `$`: Matches empty row sequence only after last row of input
- `<pattern>?`: Matches zero or one times; prefer once
- `<pattern>??`: Matches zero or one times; prefer zero
- `<pattern>*`: Matches zero or more times; prefer more
- `<pattern>*?`: Matches zero or more times; prefer fewer
- `<pattern>+`: Matches one or more times; prefer more
- `<pattern>+?`: Matches one or more times; prefer fewer
- `<pattern>{n}`: Matches exactly n times
- `<pattern>{m,}`: Matches at least m times; prefer more
- `<pattern>{m,}?`: Matches at least m times; prefer fewer
- `<pattern>{,n}`: Matches at most n times; prefer more
- `<pattern>{,n}?`: Matches at most n times; prefer fewer
- `<pattern>{m,n}`: Matches between m and n times, inclusive; prefer more
- `<pattern>{m,n}?`: Matches between m and n times, inclusive; prefer fewer
- `<pattern1> <pattern2>`: Matches `<pattern1>` followed by `<pattern2>`
- `<pattern1> | <pattern2>`: Matches either `<pattern1>` or `<pattern2>`; prefer `<pattern1>`
- Values of `m` and `n` must be non-null integer literals or query parameters between 0 and 10,000

**DEFINE clause:**
- Lists all symbols used in the pattern
- Each symbol defined by a boolean expression
- Symbol can match a row if expression evaluates to `TRUE` for that row
- Every symbol must appear at least once in `PATTERN` clause
- A single row can match at most one symbol within a match
- Multiple matches can't start at the same row
- Special functions: `PREV(column_name [, num_rows])`, `NEXT(column_name [, num_rows])`
- Can't use navigation functions like `LEAD` or `LAG`

**AFTER MATCH SKIP:**
- `PAST LAST ROW`: Don't allow overlapping matches (default)
- `TO NEXT ROW`: Allow overlapping matches

**OPTIONS:**
- `use_longest_match`: If `TRUE`, chosen match starting from any given row includes the most rows (default is `FALSE`)

**Match Disambiguation:**
1. Longest match mode (if `use_longest_match` is `TRUE`)
2. Operator preference:
   - `|` operator gives preference to left operand
   - Greedy quantifiers (`?`, `*`, `+`, `{m,}`, `{,n}`, `{m,n}`) prefer more repetitions
   - Reluctant quantifiers (`??`, `*?`, `{m,}?`, `{,n}?`, `{m,n}?`) prefer fewer repetitions
3. Preferences occurring earlier in match take priority over those occurring later

## WITH Clause Rules (CTEs)

```
WITH [ RECURSIVE ] { non_recursive_cte | recursive_cte }[, ...]

non_recursive_cte:
  cte_name AS ( query_expr )

recursive_cte:
  cte_name AS ( recursive_union_operation )

recursive_union_operation:
  base_term union_operator recursive_term

base_term:
  query_expr

recursive_term:
  query_expr

union_operator:
  UNION ALL
```

**Rules:**
- `WITH` clause defines Common Table Expressions (CTEs)
- CTEs act like temporary tables for the duration of the query
- Can reference CTEs in `FROM` clause by name
- `RECURSIVE` keyword enables recursive CTEs
- CTEs hide permanent tables with the same name (unless fully qualified)
- Multiple CTEs can be defined, separated by commas
- GoogleSQL only materializes results of recursive CTEs, not non-recursive CTEs
- If a non-recursive CTE is referenced in multiple places, it's executed once for each reference

### RECURSIVE Keyword

**Rules:**
- Enables recursion in the `WITH` clause
- If present, you can use both recursive and non-recursive CTEs
- Changes visibility of CTEs: a CTE is visible to all CTEs in the `WITH` clause where it was defined
- Without `RECURSIVE`, a CTE is only visible to CTEs defined after it

### Non-Recursive CTEs

**Rules:**
- A non-recursive CTE can't reference itself
- Can be referenced by the query expression that contains the `WITH` clause
- Useful for readability and breaking up complex queries

### Recursive CTEs

**Rules:**
- A recursive CTE references itself
- Must include `RECURSIVE` keyword when defined
- Defined by a recursive union operation with:
  - `base_term`: Runs the first iteration (must be non-recursive)
  - `union_operator`: `UNION ALL` operator
  - `recursive_term`: Runs remaining iterations (must include exactly one self-reference)
- Recursion terminates when a recursive term iteration produces no new rows
- Query fails after reaching 500 iterations if recursion doesn't terminate
- Base term determines names and types of all table columns
- Recursive term must contain same number of columns as base term, with compatible types

#### Base Term Rules
- Must be non-recursive
- Determines names and types of all table columns

#### Recursive Term Rules
- Must include exactly one reference to the recursively-defined table
- Must contain same number of columns as base term, with compatible types
- Recursive table reference can't be used as:
  - Operand to a `FULL JOIN`
  - Right operand to a `LEFT JOIN`
  - Left operand to a `RIGHT JOIN`
  - Operand to `TABLESAMPLE` operator
  - Operand to a table-valued function (TVF)
- `[NOT] IN` and `[NOT] EXISTS` aren't allowed in the `SELECT` clause
- `NOT IN` isn't allowed in the `WHERE` clause
- Subquery with recursive table reference:
  - Must be a `SELECT` expression, not a set operation
  - Can't contain recursive table reference outside of its `FROM` clause
  - Can't contain `ORDER BY` or `LIMIT` clause
  - Can't invoke aggregate functions
  - Can't invoke window functions
  - Can't contain `DISTINCT` keyword or `GROUP BY` clause

### CTE Visibility

**With RECURSIVE keyword:**
- References between CTEs can go backwards and forwards
- Cycles aren't allowed

**Without RECURSIVE keyword:**
- References between CTEs can go backwards but not forward
- Cycles aren't allowed

## Set Operation Rules

```
query_expr
[ { INNER | [ { FULL | LEFT } [ OUTER ] ] } ]
{
  UNION { ALL | DISTINCT } |
  INTERSECT DISTINCT |
  EXCEPT DISTINCT
}
[ { BY NAME [ ON (column_list) ] | [ STRICT ] CORRESPONDING [ BY (column_list) ] } ]
query_expr
```

Set operations combine results from multiple queries:
- `UNION [ALL | DISTINCT]`: Combines results, removes duplicates (unless ALL)
- `INTERSECT DISTINCT`: Returns rows that appear in both queries
- `EXCEPT DISTINCT`: Returns rows from first query not in second query

### Positional Column Matching (Default)

**Rules:**
- Columns from input queries are matched by their position in the queries
- The first column in the first input query is paired with the first column in the second input query, and so on
- Input queries on each side of the operator must return the same number of columns
- For set operations other than `UNION ALL`, all column types must support equality comparison
- Results always use column names from the first input query
- Results always use supertypes of input types in corresponding columns

### Name-Based Column Matching

Use the `BY NAME` or `CORRESPONDING` modifier to match columns by name instead of position.

#### BY NAME Modifier

```
UNION { ALL | DISTINCT } BY NAME [ ON (column_list) ]
```

**Rules:**
- Matches columns by name instead of by position
- Both input queries must have the same set of column names (but column order can be different)
- If a column in one input query doesn't appear in the other query, an error is raised (unless using mode prefixes)
- Input queries can't contain duplicate columns
- Input queries that produce value tables aren't supported
- `BY NAME` is equivalent to `STRICT CORRESPONDING` (but `BY NAME` is recommended)

#### Mode Prefixes for BY NAME

- `INNER`: Includes only columns that appear in both input queries
- `FULL [OUTER]`: Includes all columns from both input queries, with `NULL` values for missing columns
- `LEFT [OUTER]`: Includes all columns from the left input query, with `NULL` values for missing columns in the right query
- `ON (column_list)`: Specifies a comma-separated list of column names and the column order to return

#### CORRESPONDING Modifier

```
UNION { ALL | DISTINCT } [ STRICT ] CORRESPONDING [ BY (column_list) ]
```

**Rules:**
- Equivalent to `INNER...BY NAME` (default behavior)
- `STRICT CORRESPONDING`: Equivalent to default `BY NAME` modifier
- Supports `FULL | LEFT [OUTER]` modes the same way as `BY NAME` modifier
- Supports `INNER` mode, but this mode has no effect (it's the default)

### Parenthesized Set Operators

**Rules:**
- Parentheses must be used to separate different set operations
- Set operations like `UNION ALL` and `UNION DISTINCT` are considered different
- Parentheses are used to group set operations and control order of operations
- In `EXCEPT` set operations, query results can vary depending on operation grouping

### Set Operator Behavior with Duplicate Rows

Consider a row `R` that appears exactly `m` times in the first input query and `n` times in the second input query:
- `UNION ALL`: Row `R` appears exactly `m + n` times in the result
- `UNION DISTINCT`: Row `R` appears exactly once
- `INTERSECT DISTINCT`: Row `R` appears once if `m > 0` and `n > 0`
- `EXCEPT DISTINCT`: Row `R` appears once if `m > 0` and `n = 0`

## Window Function Rules

```
WINDOW named_window_expression [, ...]

named_window_expression:
  named_window AS { named_window | ( [ window_specification ] ) }
```

**Rules:**
- Window functions compute values over a set of rows
- `WINDOW` clause defines a list of named windows
- A named window represents a group of rows in a table upon which to use a window function
- A named window can be defined with a window specification or reference another named window
- If another named window is referenced, the definition of the referenced window must precede the referencing window
- Can be referenced in `SELECT` and `ORDER BY` clauses
- Window specifications include:
  - `PARTITION BY`: Groups rows into partitions
  - `ORDER BY`: Orders rows within partitions
  - `ROWS` or `RANGE`: Defines window frame

## Range Variables

In GoogleSQL, a range variable is a table expression alias in the `FROM` clause (also known as a table alias).

**Rules:**
- A range variable lets you reference rows being scanned from a table expression
- A table expression represents an item in the `FROM` clause that returns a table
- Common items include: tables, value tables, subqueries, table-valued functions (TVFs), joins, and parenthesized joins
- A range variable provides a reference to the rows of a table expression
- Can be used to qualify a column reference: `range_variable.column_1`
- When referencing a range variable without a column suffix:
  - Value tables: result type is the value table's row type
  - Other tables: result type is a dynamically defined struct including all columns in the table

**Examples:**
- `SELECT Coordinate.x FROM Grid AS Coordinate` - selects column `x` from range variable
- `SELECT Coordinate.* FROM Grid AS Coordinate` - selects all columns from range variable
- `SELECT Coordinate FROM Grid AS Coordinate` - selects the range variable itself (struct type)

## Value Tables

In addition to standard SQL tables, GoogleSQL supports value tables. In a value table, each row is a single value of type `STRUCT`, and there are no column names.

**Rules:**
- Value tables can occur as output of `UNNEST` operator or a subquery
- `WITH` clause introduces a value table if the subquery produces a value table
- Can return query results as a value table using:
  - `SELECT AS STRUCT`: Produces a value table with a STRUCT row type
  - `SELECT AS VALUE`: Produces a value table from a SELECT list with exactly one column
- Value tables aren't supported as top-level queries in `CREATE TABLE` statement, but can be included in subqueries and `UNNEST` operations
- Can't combine tables and value tables in a `SET` operation
- In contexts where a query with exactly one column is expected, a value table query can be used instead

## Table Function Calls

**Rules:**
- To call a Table-Valued Function (TVF), use the function call in place of the table name in a `FROM` clause
- TVFs return tables that can be used like regular tables in queries

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

An alias is a temporary name given to a table, column, or expression present in a query.

#### Explicit Aliases

**Rules:**
- Can be introduced in `FROM` clause using `[AS] alias` (AS keyword is optional)
- Can be introduced in `SELECT` list using `[AS] alias` (AS keyword is optional)
- Explicit aliases override implicit aliases

#### Implicit Aliases

**In SELECT list:**
- For identifiers: alias is the identifier (e.g., `SELECT abc` implies `AS abc`)
- For path expressions: alias is the last identifier (e.g., `SELECT abc.def.ghi` implies `AS ghi`)
- For field access: alias is the field name (e.g., `SELECT (struct_function()).fname` implies `AS fname`)
- In all other cases, there is no implicit alias (column is anonymous)

**In FROM clause:**
- For identifiers: alias is the identifier (e.g., `FROM abc` implies `AS abc`)
- For path expressions: alias is the last identifier (e.g., `FROM abc.def.ghi` implies `AS ghi`)
- Column produced using `WITH OFFSET` has implicit alias `offset`
- Table subqueries don't have implicit aliases
- `FROM UNNEST(x)` doesn't have an implicit alias

#### Alias Visibility

**Visibility in FROM clause:**
- Aliases are processed from left to right
- Aliases are visible only to subsequent path expressions in a `FROM` clause
- `FROM` clause aliases are NOT visible to subqueries in the same `FROM` clause
- If `FROM` clause contains explicit alias, must use explicit alias for remainder of query

**Visibility in SELECT list:**
- Aliases are visible only to: `GROUP BY`, `ORDER BY`, and `HAVING` clauses
- Aliases are NOT visible to `WHERE` clause

**Visibility in GROUP BY, ORDER BY, and HAVING clauses:**
- Can refer to: tables in `FROM` clause and their columns, aliases from `SELECT` list
- `GROUP BY` and `ORDER BY` can also refer to integer literals (positional references)

#### Duplicate Aliases

**Rules:**
- `SELECT` list or subquery can contain multiple explicit or implicit aliases of the same name
- Allowed as long as alias name isn't referenced elsewhere in the query (would be ambiguous)
- When top-level `SELECT` list contains duplicate column names and no destination table is specified, all duplicate columns except the first are automatically renamed
- Duplicate column names in table or view definition aren't supported

#### Ambiguous Aliases

**Rules:**
- Error occurs if accessing a name is ambiguous (resolves to more than one unique object)
- Name is NOT ambiguous in `GROUP BY`, `ORDER BY`, or `HAVING` if it's both a column name and a `SELECT` list alias resolving to the same underlying object

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

1. **WITH**: Evaluate Common Table Expressions (CTEs)
2. **FROM**: Identify and join tables
3. **WHERE**: Filter rows
4. **GROUP BY**: Group rows and perform aggregation
5. **HAVING**: Filter groups
6. **WINDOW**: Compute window functions
7. **QUALIFY**: Filter window function results
8. **SELECT**: Select columns and expressions
9. **DISTINCT**: Remove duplicates (if `SELECT DISTINCT` is used)
10. **ORDER BY**: Sort results
11. **LIMIT/OFFSET**: Limit and paginate results

**Important:** 
- This is the logical order, not necessarily the physical execution order
- The query optimizer may reorder operations for efficiency
- Evaluation order doesn't always match syntax order
- Understanding this order helps determine where you can reference aliases, columns, and functions

## Common Syntax Errors to Avoid

1. **Using aggregate functions in WHERE clause**: Use `HAVING` instead
2. **Referencing window functions in WHERE clause**: Use `QUALIFY` instead
3. **Missing GROUP BY columns**: All non-aggregated columns must be in GROUP BY
4. **Using column aliases in WHERE clause**: Aliases are not available until SELECT
5. **Mixing aggregate and non-aggregate columns**: All columns must be aggregated or in GROUP BY
6. **Using GROUP BY ALL with complex expressions and joins**: When using `GROUP BY ALL` with aggregate functions and complex expressions (especially `CASE` statements) that reference columns from joined tables, the automatic inference may fail. Use explicit `GROUP BY` with a column list instead
7. **Invalid join conditions**: Join conditions must reference columns from joined tables
8. **Using DISTINCT with incompatible types**: Some types cannot be used with DISTINCT
9. **Invalid LIMIT/OFFSET**: OFFSET can only be used with LIMIT
10. **Circular CTE references**: Recursive CTEs must have proper base case
11. **Invalid table references**: Tables must exist and be accessible

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

