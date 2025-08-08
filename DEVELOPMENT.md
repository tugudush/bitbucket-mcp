# Development Scripts

This project includes several npm scripts to help with development workflow:

## Individual Scripts

### Core Scripts
- **`npm run build`** - Compile TypeScript to JavaScript and make the output executable
- **`npm run watch`** - Watch for changes and recompile automatically
- **`npm run start`** - Run the compiled server
- **`npm run prepare`** - Prepare the package (runs build automatically)

### Code Quality Scripts
- **`npm run lint`** - Run ESLint to check for code quality issues
  - Checks TypeScript files in `src/` directory
  - Reports code quality issues (unused variables, explicit any types, etc.)
  - Does NOT check formatting (that's handled by Prettier)

- **`npm run typecheck`** - Run TypeScript compiler type checking without emitting files
  - Validates TypeScript types and interfaces
  - Catches type errors before runtime

- **`npm run format`** - Run Prettier to format code automatically
  - Formats TypeScript files in `src/` directory
  - Applies consistent code styling
  - Automatically fixes formatting issues

## Compound Scripts

### `npm run lf` (Lint + Format)
Runs linting followed by formatting:
```bash
npm run lint && npm run format
```
Use this when you want to:
- Check for code quality issues
- Automatically fix formatting

### `npm run ltf` (Lint + Type-check + Format)
Runs the complete code quality pipeline:
```bash
npm run lint && npm run format && npm run typecheck
```
Use this when you want to:
- Check for code quality issues
- Format the code consistently
- Validate TypeScript types

This is the most comprehensive check and is recommended before committing code.

## Workflow Recommendations

### During Development
```bash
npm run watch  # Keep this running to auto-compile changes
```

### Before Committing
```bash
npm run ltf    # Run full quality checks
npm run build  # Ensure it compiles successfully
```

### Quick Formatting
```bash
npm run format  # Fix formatting issues quickly
```

### Code Review Preparation
```bash
npm run ltf     # Full quality pipeline
```

## Configuration Files

- **ESLint**: `eslint.config.js` - Code quality rules (ESLint v9 format)
- **Prettier**: `.prettierrc` - Code formatting rules
- **TypeScript**: `tsconfig.json` - TypeScript compiler configuration

## Separation of Concerns

This setup follows best practices by separating:
- **ESLint**: Code quality, potential bugs, code style violations
- **Prettier**: Code formatting, whitespace, quotes, semicolons
- **TypeScript**: Type checking, interface validation

Each tool has a specific responsibility and they work together without conflicts.
