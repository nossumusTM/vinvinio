import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { buildListingsWhereClause } from '../listingFilters';

describe('buildListingsWhereClause', () => {
  it('defaults to approved status when no statuses are provided', () => {
    const query = buildListingsWhereClause({});
    assert.equal(query.status, 'approved');
  });

  it('allows explicit status filtering', () => {
    const query = buildListingsWhereClause({ statuses: ['pending', 'revision'] });
    assert.deepEqual(query.status, { in: ['pending', 'revision'] });
  });

  it('ignores empty strings in status filters', () => {
    const query = buildListingsWhereClause({ statuses: ['pending', '', 'revision'] });
    assert.deepEqual(query.status, { in: ['pending', 'revision'] });
  });
});
