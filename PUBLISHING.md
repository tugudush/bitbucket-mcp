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

### 2. Increment Version
Use the automated version increment scripts to update both `package.json` and `src/version.ts`:

```bash
# Increment version automatically
npm run vi:patch   # Bug fixes (1.0.0 → 1.0.1)
npm run vi:minor   # New features (1.0.0 → 1.1.0)
npm run vi:major   # Breaking changes (1.0.0 → 2.0.0)
```

This automatically updates:
- `package.json` version
- `src/version.ts` VERSION constant

> **Note:** The VERSION constant is used for the User-Agent header and server identification.

### 3. Commit and Tag
```bash
# Commit the version changes
git add package.json src/version.ts
git commit -m "chore: bump version to x.x.x"

# Create git tag
git tag vx.x.x
```

### 4. Publish to NPM
```bash
npm publish
```

### 5. Create GitHub Release
```bash
# Push code and tags
git push
git push --tags

# Create GitHub release using the latest tag automatically
gh release create $(git describe --tags --abbrev=0) --generate-notes

# Or create release with custom notes
gh release create $(git describe --tags --abbrev=0) --notes "Bug fixes and improvements"
```

## Understanding Git Tags

This project uses manual version management with custom scripts:

1. `npm run vi:patch/minor/major` updates version numbers in files
2. You manually commit the changes
3. You manually create a git tag (e.g., `v1.0.1`)

Useful git tag commands:
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
npm run ltfb         # lint, typecheck, format, build
npm test             # run tests

# 3. Check what will be published
npm pack --dry-run

# 4. Increment version (automatically updates package.json and src/version.ts)
npm run vi:minor     # or vi:patch / vi:major

# 5. Commit version changes and create tag
git add package.json src/version.ts
git commit -m "chore: bump version to 1.5.0"
git tag v1.5.0

# 6. Push everything
git push
git push --tags

# 7. Publish to NPM
npm publish

# 8. Create GitHub release
gh release create v1.5.0 --generate-notes

# 9. Verify everything worked
npm view @tugudush/bitbucket-mcp
gh release list
```

## Pre-release Versions

For testing before official release:

```bash
# Create pre-release version (manual editing required)
# 1. Edit package.json and src/version.ts to use pre-release version format
#    Example: "1.0.1-beta.0"

# 2. Commit and tag
git add package.json src/version.ts
git commit -m "chore: bump to 1.0.1-beta.0"
git tag v1.0.1-beta.0

# 3. Push and publish with beta tag
git push --tags
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

1. **Test** your code (`npm run ltfb && npm test`)
2. **Increment** version (`npm run vi:patch/minor/major`)
3. **Commit** changes (`git add . && git commit -m "chore: bump version to x.x.x"`)
4. **Tag** release (`git tag vx.x.x`)
5. **Push** everything (`git push && git push --tags`)
6. **Publish** to NPM (`npm publish`)
7. **Release** on GitHub (`gh release create vx.x.x --generate-notes`)

That's it! Your package is now available on NPM and GitHub.
