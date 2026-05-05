# Testing Documentation

This project uses **Vitest** for unit and integration testing.

## Testing Strategy

- **Repositories**: Tested using an in-memory SQLite database. Each test file mocks `@/lib/db` to ensure isolation and prevent data loss in the production database.
- **Utilities**: Pure utility functions are tested with various inputs (happy path and edge cases).
- **Mocks**: External libraries like `xlsx` and browser APIs like `matchMedia` are mocked to ensure consistent test results.

## Running Tests

### All Tests
```bash
npm test
```

### Run Tests Once
```bash
npm run test:run
```

### Coverage Report
```bash
npm run test:coverage
```

## Writing New Tests

1. Create a file in the `tests/` directory with the `.test.ts` extension.
2. If testing a repository, use the following pattern to mock the database:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import db from '@/lib/db';

vi.mock('@/lib/db', async () => {
  const Database = (await import('better-sqlite3')).default;
  const { runMigrations } = await import('@/lib/migrations');
  const mockDb = new Database(':memory:');
  runMigrations(mockDb);
  return {
    default: mockDb,
  };
});
```

3. Ensure you clean up data in `beforeEach` if necessary.

## Testing Stack

- **Vitest**: Test runner
- **JSDOM**: Browser environment simulation
- **Testing Library**: Component and DOM testing utilities
