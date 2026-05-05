# Comment Refactoring Plan

## Objective
Menghapus semua komentar yang ada di project dan menggantinya dengan komentar 1 baris yang singkat, jelas, dan informatif.

## Scope
- **Total Comments Found**: 162 komentar
- **File Types**: TypeScript (.ts), TypeScript React (.tsx), JavaScript (.js)
- **Directories**: src/, tests/, root config files

## Comment Categories to Remove

### 1. Multi-line JSDoc Comments (/** ... */)
```typescript
// BEFORE:
/**
 * Format date to Indonesian locale string
 * @param date - Date string or Date object
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */

// AFTER:
// Format date to Indonesian locale with optional custom formatting
```

### 2. Section Divider Comments
```typescript
// BEFORE:
// ============================================================================
// Common Schemas
// ============================================================================

// AFTER:
// Common validation schemas
```

### 3. Inline Explanation Comments
```typescript
// BEFORE:
// Validate file presence
if (!file) {
  throw new ValidationError('File tidak ditemukan');
}

// AFTER:
if (!file) throw new ValidationError('File tidak ditemukan');
```

### 4. UI Section Comments
```typescript
// BEFORE:
{/* Header & Toggle Form Button */}
<div className="flex">

// AFTER:
<div className="flex"> {/* Header with form toggle */}
```

### 5. "Made with Bob" Signatures
```typescript
// BEFORE:
// Made with Bob

// AFTER:
(removed completely)
```

## Refactoring Strategy by Directory

### Phase 1: Utility Files (src/utils/)
**Files**: date.ts, duration.ts, json.ts, project.ts, validation.ts

**Strategy**:
- Remove all JSDoc comments
- Add single-line comment above each exported function
- Keep comments concise (max 60 characters)
- Focus on "what" not "how"

**Example**:
```typescript
// Convert date string to ISO format (YYYY-MM-DD)
export function formatDateISO(date: string | Date): string {
```

### Phase 2: Library Files (src/lib/)
**Files**: db.ts, env.ts, errors.ts, excel.ts, migrations.ts, parseExcel.ts, response.ts, schema.ts, topology.ts, validation.ts

**Strategy**:
- Remove section dividers (// ====)
- Replace JSDoc with brief one-liners
- Remove inline comments explaining obvious code
- Keep only critical business logic comments

**Example**:
```typescript
// Custom error class with HTTP status codes
export class AppError extends Error {
```

### Phase 3: Repository Files (src/repositories/)
**Files**: AanwijzingRepository.ts, BoqRepository.ts, ProjectRepository.ts, UtRepository.ts

**Strategy**:
- Remove verbose method documentation
- Add brief comment for each public method
- Remove SQL query explanation comments

**Example**:
```typescript
// Insert or update project data with history tracking
static upsert(data: ProjectInput): void {
```

### Phase 4: API Routes (src/app/api/)
**Files**: All route.ts files in api subdirectories

**Strategy**:
- Remove validation step comments
- Add single comment at top of each handler
- Remove inline comments for obvious validations

**Example**:
```typescript
// Upload and parse BoQ Excel file
export const POST = withErrorHandling(async (request: NextRequest) => {
```

### Phase 5: Component Files (src/components/)
**Files**: All .tsx files in components directory

**Strategy**:
- Remove UI section comments (/* Header */, /* Footer */)
- Add brief component purpose comment at top
- Keep JSX inline comments minimal
- Remove obvious state/prop comments

**Example**:
```typescript
// Dashboard table with filtering and pagination
export default function DashboardClient({ initialProjects }: Props) {
```

### Phase 6: Page Files (src/app/)
**Files**: All page.tsx files

**Strategy**:
- Remove layout section comments
- Add page purpose at top
- Remove form field comments
- Keep only complex logic comments

**Example**:
```typescript
// UT (User Testing) data management page
export default function UtPage() {
```

### Phase 7: Test Files (tests/)
**Files**: All .test.ts files

**Strategy**:
- Remove test explanation comments
- Keep test case descriptions in it() blocks
- Remove setup/teardown comments
- Remove inline value explanation comments

**Example**:
```typescript
// BEFORE:
const date = new Date(2024, 4, 5); // May 5

// AFTER:
const date = new Date(2024, 4, 5);
```

### Phase 8: Config Files
**Files**: next.config.ts, vitest.config.ts, etc.

**Strategy**:
- Remove placeholder comments
- Keep only non-obvious configuration comments

## Comment Writing Guidelines

### DO:
✅ Keep comments under 60 characters when possible
✅ Use active voice ("Convert date" not "Converts date")
✅ Focus on business logic, not implementation
✅ Use domain-specific terms (BoQ, UT, Aanwijzing)
✅ Place comment on line immediately above code

### DON'T:
❌ State the obvious ("Loop through array")
❌ Repeat function/variable names
❌ Use multi-line comments
❌ Add comments for self-documenting code
❌ Include author signatures or timestamps

## Examples of Good vs Bad Comments

### Good Comments:
```typescript
// Parse Excel serial number to JavaScript Date
// Validate Indonesian phone number format
// Calculate project completion percentage
// Fetch topology data with branch hierarchy
```

### Bad Comments (to avoid):
```typescript
// This function validates the input
// Loop through the projects array
// Set the state to true
// Return the result
```

## File-by-File Breakdown

### High Priority (Most Comments):
1. **src/app/(main)/ut/page.tsx** - ~30 comments (UI sections)
2. **src/app/(main)/aanwijzing/page.tsx** - ~30 comments (UI sections)
3. **src/app/(main)/boq/page.tsx** - ~25 comments (UI sections)
4. **src/lib/validation.ts** - ~20 comments (JSDoc + sections)
5. **src/utils/date.ts** - ~15 comments (JSDoc)

### Medium Priority:
6. **src/lib/errors.ts** - ~10 comments
7. **src/lib/response.ts** - ~8 comments
8. **src/components/features/** - ~20 comments total
9. **tests/** - ~15 comments total

### Low Priority:
10. Config files - ~5 comments
11. Other utility files - ~10 comments

## Implementation Order

1. ✅ Create this plan document
2. Start with utility files (easiest, most reusable patterns)
3. Move to library files (establish patterns for complex logic)
4. Refactor repositories (database layer)
5. Update API routes (backend logic)
6. Refactor components (UI layer)
7. Update page files (largest files)
8. Clean up test files
9. Final pass on config files
10. Remove all "Made with Bob" signatures
11. Verify with code review
12. Run full test suite

## Quality Checks

After refactoring each file:
- [ ] No multi-line comments remain
- [ ] All functions have max 1 comment (if needed)
- [ ] Comments are concise (<60 chars preferred)
- [ ] Code remains readable without comments
- [ ] No "Made with Bob" signatures
- [ ] Tests still pass

## Estimated Impact

- **Files to modify**: ~50 files
- **Comments to remove**: 162
- **New comments to add**: ~80-100 (only where truly needed)
- **Net reduction**: ~40% fewer comments
- **Improved clarity**: Self-documenting code with strategic comments

## Success Criteria

✅ All JSDoc comments replaced with single-line comments
✅ All section dividers removed
✅ All "Made with Bob" signatures removed
✅ All inline obvious comments removed
✅ Strategic comments added for complex logic
✅ Code remains clear and maintainable
✅ All tests pass after refactoring
✅ No functionality broken

## Notes

- This is a code quality improvement, not a feature change
- Focus on making code self-documenting first
- Add comments only when code alone isn't clear
- Prioritize business logic comments over implementation details
- Use TypeScript types to document interfaces instead of comments