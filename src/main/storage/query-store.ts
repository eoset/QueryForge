import Store from 'electron-store';
import { randomUUID } from 'crypto';
import type { SavedQuery, SaveQueryInput, UpdateQueryInput } from '../../shared/types/query';

interface QueryStoreData {
  queries: SavedQuery[];
}

const store = new Store<QueryStoreData>({
  name: 'queries',
  defaults: {
    queries: [],
  },
}) as Store<QueryStoreData> & {
  get(key: 'queries'): SavedQuery[];
  set(key: 'queries', value: SavedQuery[]): void;
};

export function getQueries(): SavedQuery[] {
  return store.get('queries') || [];
}

export function getQuery(id: string): SavedQuery | undefined {
  const queries = getQueries();
  return queries.find((q) => q.id === id);
}

export function saveQuery(input: SaveQueryInput): SavedQuery {
  const queries = getQueries();

  // Validate name
  if (!input.name || input.name.trim() === '') {
    throw new Error('Query name is required');
  }

  if (input.name.length > 255) {
    throw new Error('Query name must be 255 characters or less');
  }

  // Check for duplicate name
  const duplicate = queries.find((q) => q.name === input.name.trim());
  if (duplicate) {
    throw new Error(`A query with the name "${input.name}" already exists`);
  }

  const now = new Date().toISOString();
  const newQuery: SavedQuery = {
    id: randomUUID(),
    name: input.name.trim(),
    sqlText: input.sqlText,
    description: input.description,
    tags: input.tags,
    createdAt: now,
    updatedAt: now,
  };

  queries.push(newQuery);
  store.set('queries', queries);

  return newQuery;
}

export function updateQuery(id: string, updates: UpdateQueryInput): SavedQuery {
  const queries = getQueries();
  const index = queries.findIndex((q) => q.id === id);

  if (index === -1) {
    throw new Error(`Query with id "${id}" not found`);
  }

  const existingQuery = queries[index];

  // Validate name if provided
  if (updates.name !== undefined) {
    if (!updates.name || updates.name.trim() === '') {
      throw new Error('Query name cannot be empty');
    }

    if (updates.name.length > 255) {
      throw new Error('Query name must be 255 characters or less');
    }

    // Check for duplicate name (excluding current query)
    const nameToCheck = updates.name.trim();
    const duplicate = queries.find((q) => q.id !== id && q.name === nameToCheck);
    if (duplicate) {
      throw new Error(`A query with the name "${nameToCheck}" already exists`);
    }
  }

  const updatedQuery: SavedQuery = {
    ...existingQuery,
    name: updates.name !== undefined ? updates.name.trim() : existingQuery.name,
    sqlText: updates.sqlText !== undefined ? updates.sqlText : existingQuery.sqlText,
    description: updates.description !== undefined ? updates.description : existingQuery.description,
    tags: updates.tags !== undefined ? updates.tags : existingQuery.tags,
    updatedAt: new Date().toISOString(),
  };

  queries[index] = updatedQuery;
  store.set('queries', queries);

  return updatedQuery;
}

export function deleteQuery(id: string): void {
  const queries = getQueries();
  const filtered = queries.filter((q) => q.id !== id);

  if (filtered.length === queries.length) {
    throw new Error(`Query with id "${id}" not found`);
  }

  store.set('queries', filtered);
}

export function searchQueries(term: string): SavedQuery[] {
  const queries = getQueries();
  const lowerTerm = term.toLowerCase().trim();

  if (!lowerTerm) {
    return queries;
  }

  return queries.filter(
    (q) =>
      q.name.toLowerCase().includes(lowerTerm) ||
      q.sqlText.toLowerCase().includes(lowerTerm) ||
      (q.description && q.description.toLowerCase().includes(lowerTerm)) ||
      (q.tags && q.tags.some((tag) => tag.toLowerCase().includes(lowerTerm)))
  );
}
