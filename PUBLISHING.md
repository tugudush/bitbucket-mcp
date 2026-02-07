# Publishing Guide

Simple guide to publish your package to NPM and create GitHub releases.

## Prerequisites

1. Create an NPM account at [npmjs.com](https://www.npmjs.com/)
2. Login to npm in your terminal:
   ```bash
   npm login
   ```

## Quick Publishing Steps

### 1. Prepare Your Code
```bash
# Build and test your package
npm run ltf        # lint, typecheck, format
npm run build      # compile TypeScript
npm test           # run tests
```

### 2. Update Version Constants
Before creating a new version, update the `VERSION` constant in both source files to match your new version:

**Files to update:**
- `src/index.ts` - Line 18: `export const VERSION = 'x.x.x';`
- `src/api.ts` - Line 10: `export const VERSION = 'x.x.x';`

```bash
# Example: If bumping to 1.5.0, update both files:
# export const VERSION = '1.5.0';
```

> **Note:** These VERSION constants are used for the User-Agent header and server identification. They must match the version in `package.json`.

### 3. Create a Version
Choose the right version type:
- **Patch** (`1.0.1`) - Bug fixes
- **Minor** (`1.1.0`) - New features
- **Major** (`2.0.0`) - Breaking changes

```bash
# Create version (this also creates a git tag)
npm version patch   # or minor/major
```

### 3. Publish to NPM
```bash
npm publish
```

### 5. Create GitHub Release
```bash
# Push the tag created by npm version
git push --tags

# Create GitHub release using the latest tag automatically
gh release create $(git describe --tags --abbrev=0) --generate-notes

# Or create release with custom notes
gh release create $(git describe --tags --abbrev=0) --notes "Bug fixes and improvements"
```

## Understanding Git Tags

When you run `npm version`, it automatically:
1. Updates `package.json` version
2. Creates a git commit
3. Creates a git tag (e.g., `v1.0.1`)

You can also create tags manually:
```bash
# Create and push a tag manually
git tag v1.0.1
git push origin v1.0.1

# List all tags
git tag -l

# Delete a tag (local and remote)
git tag -d v1.0.1
git push origin :refs/tags/v1.0.1
```

## GitHub Releases

### Using GitHub CLI (Recommended)
```bash
# Install GitHub CLI first: https://cli.github.com/

# Create release from latest tag automatically
gh release create $(git describe --tags --abbrev=0) --generate-notes

# Create release with custom description
gh release create v1.0.1 --title "Version 1.0.1" --notes "
- Fixed authentication bug
- Added new search feature
- Improved error handling
"

# Upload files to release
gh release create v1.0.1 --generate-notes dist/*.zip
```

### Using GitHub Web Interface
1. Go to your repository on GitHub
2. Click "Releases" → "Create a new release"
3. Choose your tag (e.g., `v1.0.1`)
4. Add release title and description
5. Click "Publish release"

## Complete Example Workflow

Here's the full process for this project:

```bash
# 1. Make your changes and commit
git add .
git commit -m "feat: add new feature"

# 2. Test everything
npm run ltf
npm run build
npm test

# 3. Check what will be published
npm pack --dry-run

# 4. Update VERSION constants in source files
# Edit src/index.ts and src/api.ts to match your new version
# Example: export const VERSION = '1.5.0';

# 5. Commit version constant updates
git add src/index.ts src/api.ts
git commit -m "chore: bump version constants to 1.5.0"

# 6. Create version and publish
npm version minor      # Creates tag and commits
npm publish           # Publishes to NPM

# 7. Create GitHub release
git push --tags       # Push the tag
gh release create $(git describe --tags --abbrev=0) --generate-notes

# 8. Verify everything worked
npm view bitbucket-mcp
gh release list
```

## Pre-release Versions

For testing before official release:

```bash
# Create pre-release version
npm version prerelease --preid=beta  # 1.0.1-beta.0

# Publish with beta tag
npm publish --tag beta

# Create GitHub pre-release
gh release create v1.0.1-beta.0 --prerelease --generate-notes

# Users can install beta version
npm install bitbucket-mcp@beta
```

## Troubleshooting

**Version already exists error:**
```bash
# Increment version again
npm version patch
```

**Authentication failed:**
```bash
npm login
```

**Wrong files published:**
```bash
# Check what will be included
npm pack --dry-run
```

**Need to unpublish (within 24 hours only):**
```bash
npm unpublish package-name@1.0.0
```

## Package.json Setup

Make sure your `package.json` has these key fields:

```json
{
  "name": "your-package-name",
  "version": "1.0.0",
  "description": "Brief description",
  "main": "build/index.js",
  "files": ["build/", "README.md", "LICENSE"],
  "scripts": {
    "prepublishOnly": "npm run build && npm test"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

## Summary

1. **Test** your code (`npm run ltf && npm test`)
2. **Update** VERSION constants in `src/index.ts` and `src/api.ts`
3. **Version** your package (`npm version patch/minor/major`)
4. **Publish** to NPM (`npm publish`)
5. **Release** on GitHub (`gh release create $(git describe --tags --abbrev=0) --generate-notes`)

That's it! Your package is now available on NPM and GitHub.
