/**
 * SQL Validation Recommendations
 * 
 * This file maps validation rule IDs to recommendations and documentation references.
 * Recommendations are aligned with the BigQuery syntax rules documented in:
 * bigquery_query_syntax_rules.md
 * 
 * When updating this file, ensure recommendations match the corresponding sections
 * in the syntax rules markdown file.
 */

export interface ValidationRecommendation {
  recommendation: string;
  documentation?: string;
  example?: string;
}

/**
 * Maps rule IDs to recommendations based on BigQuery syntax rules
 */
export const VALIDATION_RECOMMENDATIONS: Record<string, ValidationRecommendation> = {
  'aggregate-in-where': {
    recommendation: 'Move the filter condition to a HAVING clause after GROUP BY. HAVING filters groups after aggregation, while WHERE filters rows before aggregation.',
    documentation: 'See "HAVING Clause Rules" in BigQuery syntax rules. HAVING is evaluated after GROUP BY and aggregation.',
    example: '-- Instead of:\nWHERE SUM(amount) > 100\n-- Use:\nGROUP BY category\nHAVING SUM(amount) > 100'
  },
  
  'window-in-where': {
    recommendation: 'Use QUALIFY clause to filter window function results. QUALIFY is evaluated after window functions are computed.',
    documentation: 'See "QUALIFY Clause Rules" in BigQuery syntax rules. QUALIFY filters results of window functions.',
    example: '-- Instead of:\nWHERE ROW_NUMBER() OVER (PARTITION BY id ORDER BY date) = 1\n-- Use:\nQUALIFY ROW_NUMBER() OVER (PARTITION BY id ORDER BY date) = 1'
  },
  
  'window-in-having': {
    recommendation: 'Use QUALIFY clause to filter window function results. Window functions cannot be filtered in HAVING clause.',
    documentation: 'See "QUALIFY Clause Rules" in BigQuery syntax rules.',
    example: '-- Instead of:\nHAVING ROW_NUMBER() OVER (PARTITION BY id ORDER BY date) = 1\n-- Use:\nQUALIFY ROW_NUMBER() OVER (PARTITION BY id ORDER BY date) = 1'
  },
  
  'offset-without-limit': {
    recommendation: 'OFFSET can only be used with LIMIT. Add a LIMIT clause before OFFSET.',
    documentation: 'See "LIMIT and OFFSET Rules" in BigQuery syntax rules.',
    example: '-- Instead of:\nOFFSET 10\n-- Use:\nLIMIT 100 OFFSET 10'
  },
  
  'missing-group-by': {
    recommendation: 'Add the column to the GROUP BY clause, or use an aggregate function on the column.',
    documentation: 'See "GROUP BY Rules" in BigQuery syntax rules. All non-aggregated columns must appear in GROUP BY.',
    example: '-- Add to GROUP BY:\nGROUP BY category, product_name'
  },
  
  'group-by-all-limitations': {
    recommendation: 'Use explicit GROUP BY with a column list instead. Include all non-aggregated columns and columns referenced in complex expressions (including those from joined tables).',
    documentation: 'See "Group rows by ALL" section in BigQuery syntax rules for limitations and best practices.',
    example: '-- Instead of GROUP BY ALL, use:\nGROUP BY o.OrderNumber, o.DisplayName, t.DisplayName'
  }
};

/**
 * Gets a recommendation for a validation rule
 */
export const getRecommendation = (ruleId: string): ValidationRecommendation | undefined => {
  return VALIDATION_RECOMMENDATIONS[ruleId];
};

/**
 * Formats a recommendation as Markdown for Monaco Editor hover messages
 */
export const formatRecommendationAsMarkdown = (issue: {
  message: string;
  rule?: string;
  recommendation?: string;
  documentation?: string;
  example?: string;
}): string => {
  let markdown = `**${issue.message}**\n\n`;
  
  if (issue.recommendation) {
    markdown += `**Recommendation:** ${issue.recommendation}\n\n`;
  }
  
  if (issue.example) {
    markdown += `**Example:**\n\`\`\`sql\n${issue.example}\n\`\`\`\n\n`;
  }
  
  if (issue.documentation) {
    markdown += `*${issue.documentation}*`;
  }
  
  return markdown;
};
