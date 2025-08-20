# Publishing to NPM - Complete Guide

This guide covers the complete process of publishing your Node.js package to NPM, including package configuration, versioning, and publication workflow.

## Prerequisites

1. **NPM Account**: Create an account at [npmjs.com](https://www.npmjs.com/)
2. **NPM CLI**: Ensure you have npm installed (comes with Node.js)
3. **Authentication**: Login to npm via CLI
   ```bash
   npm login
   ```

## 1. Package.json Configuration

Your `package.json` must be properly configured before publishing. Here are the essential fields:

### Required Fields

```json
{
  "name": "your-package-name",
  "version": "1.0.0",
  "description": "Brief description of your package",
  "main": "build/index.js",
  "author": "Your Name <your.email@example.com>",
  "license": "MIT"
}
```

### Important Optional Fields

```json
{
  "keywords": ["bitbucket", "mcp", "api", "cli"],
  "homepage": "https://github.com/username/repo#readme",
  "bugs": {
    "url": "https://github.com/username/repo/issues"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/username/repo.git"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "files": [
    "build/",
    "README.md",
    "LICENSE"
  ]
}
```

### Publishing Configuration

```json
{
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  },
  "scripts": {
    "prepublishOnly": "npm run build && npm test",
    "preversion": "npm run ltf",
    "version": "npm run build",
    "postversion": "git push && git push --tags"
  }
}
```

### Files to Include/Exclude

- **`.npmignore`**: Create this file to exclude development files
- **`files` field**: Explicitly list files to include (recommended)

Example `.npmignore`:
```
src/
*.test.js
*.spec.js
coverage/
.nyc_output/
.env*
.vscode/
.github/
docs/
examples/
```

## 2. NPM Version Commands

NPM provides built-in version management that follows semantic versioning (semver) and integrates with Git.

### Version Types

```bash
# Patch version (1.0.0 → 1.0.1) - Bug fixes
npm version patch

# Minor version (1.0.0 → 1.1.0) - New features (backward compatible)
npm version minor

# Major version (1.0.0 → 2.0.0) - Breaking changes
npm version major
```

### Pre-release Versions

```bash
# Pre-release versions
npm version prerelease          # 1.0.0 → 1.0.1-0
npm version prepatch            # 1.0.0 → 1.0.1-0
npm version preminor            # 1.0.0 → 1.1.0-0
npm version premajor            # 1.0.0 → 2.0.0-0

# With specific pre-release identifier
npm version prerelease --preid=alpha    # 1.0.0 → 1.0.1-alpha.0
npm version prerelease --preid=beta     # 1.0.0 → 1.0.1-beta.0
npm version prerelease --preid=rc       # 1.0.0 → 1.0.1-rc.0
```

### What npm version Does Automatically

When you run `npm version`, it performs these actions:

1. **Updates package.json**: Changes the version number
2. **Updates package-lock.json**: If it exists
3. **Runs lifecycle scripts**: In this order:
   - `preversion` - Run before version bump
   - `version` - Run after version bump but before commit
   - `postversion` - Run after commit and tag creation
4. **Git operations** (if in a git repository):
   - `git add package.json package-lock.json`
   - `git commit -m "v{new-version}"`
   - `git tag v{new-version}`

### Custom Version Numbers

```bash
# Set specific version
npm version 1.2.3

# Set pre-release version
npm version 1.2.3-alpha.1
```

### Skip Git Operations

```bash
# Skip git tag and commit
npm version patch --no-git-tag-version
```

## 3. Publishing Process

### Step-by-Step Publishing

1. **Prepare your package**:
   ```bash
   # Build and test
   npm run build
   npm test
   
   # Check what will be published
   npm pack --dry-run
   ```

2. **Version your package**:
   ```bash
   # Choose appropriate version bump
   npm version patch  # or minor/major
   ```

3. **Publish to NPM**:
   ```bash
   # Publish to public registry
   npm publish
   
   # Publish pre-release version
   npm publish --tag beta
   ```

### Publishing Pre-releases

Pre-release versions should be published with a specific tag:

```bash
# Publish alpha version
npm version prerelease --preid=alpha
npm publish --tag alpha

# Publish beta version
npm version prerelease --preid=beta
npm publish --tag beta

# Publish release candidate
npm version prerelease --preid=rc
npm publish --tag rc
```

Users can install pre-releases with:
```bash
npm install your-package@alpha
npm install your-package@beta
npm install your-package@rc
```

### Publishing Scoped Packages

For scoped packages (e.g., `@yourorg/package-name`):

```bash
# Public scoped package
npm publish --access public

# Private scoped package (requires paid npm account)
npm publish --access restricted
```

## 4. Lifecycle Scripts

Configure these scripts in `package.json` for automated workflows:

```json
{
  "scripts": {
    "prepublishOnly": "npm run build && npm test",
    "preversion": "npm run ltf",
    "version": "npm run build && git add -A build/",
    "postversion": "git push && git push --tags"
  }
}
```

### Script Execution Order

**For `npm version`**:
1. `preversion` - Quality checks before version bump
2. Version bump in package.json
3. `version` - Build and prepare files
4. Git commit and tag creation
5. `postversion` - Push changes to remote

**For `npm publish`**:
1. `prepublishOnly` - Final checks before publishing
2. Package creation and upload

## 5. Best Practices

### Before Publishing

1. **Test thoroughly**:
   ```bash
   npm run test
   npm run build
   ```

2. **Check package contents**:
   ```bash
   npm pack --dry-run
   ```

3. **Verify package.json**:
   - Correct entry point (`main`, `module`, `types`)
   - Proper dependencies vs devDependencies
   - Accurate metadata (description, keywords, repository)

4. **Update documentation**:
   - README.md with installation and usage instructions
   - CHANGELOG.md with version history

### Version Strategy

- **Patch** (1.0.x): Bug fixes, security patches
- **Minor** (1.x.0): New features, backward compatible
- **Major** (x.0.0): Breaking changes

### Security Considerations

1. **Two-Factor Authentication**: Enable 2FA on your npm account
2. **Access tokens**: Use automation tokens for CI/CD
3. **Audit dependencies**: Regularly run `npm audit`
4. **Review published content**: Use `npm pack` to verify included files

## 6. Common Workflows

### Development Workflow

```bash
# 1. Make changes
git add .
git commit -m "feat: add new feature"

# 2. Version and publish
npm version minor
npm publish

# Changes are automatically pushed to git
```

### CI/CD Workflow

For automated publishing in CI/CD:

```bash
# Set npm token as environment variable
export NPM_TOKEN=your_npm_token

# Create .npmrc for authentication
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc

# Publish
npm publish
```

### Hotfix Workflow

```bash
# Create hotfix branch
git checkout -b hotfix/critical-bug

# Make fix and test
# ... fix code ...
npm test

# Version as patch and publish
npm version patch
npm publish

# Merge back to main
git checkout main
git merge hotfix/critical-bug
git push
```

## 7. Troubleshooting

### Common Issues

1. **Version already exists**:
   ```
   npm ERR! 403 Forbidden - PUT https://registry.npmjs.org/package-name - You cannot publish over the previously published versions
   ```
   Solution: Increment version number

2. **Authentication failed**:
   ```bash
   npm login
   # or
   npm adduser
   ```

3. **Package name taken**:
   - Try a different name
   - Use a scoped package: `@yourname/package-name`

4. **Wrong files published**:
   - Review `.npmignore` or `files` field in package.json
   - Use `npm pack --dry-run` to preview

### Unpublishing Packages

⚠️ **Warning**: Unpublishing can break dependent packages

```bash
# Unpublish specific version (within 24 hours of publishing)
npm unpublish package-name@1.0.0

# Unpublish entire package (dangerous)
npm unpublish package-name --force
```

## 8. Example Complete Workflow

Here's a complete example for this bitbucket-mcp project:

```bash
# 1. Ensure everything is clean and tested
npm run ltf        # lint, typecheck, format
npm run build      # compile TypeScript
npm test           # run tests

# 2. Check what will be published
npm pack --dry-run

# 3. Version the package (this will automatically commit and tag)
npm version patch  # or minor/major depending on changes

# 4. Publish to npm
npm publish

# 5. Verify publication
npm view bitbucket-mcp
```

The automated scripts will handle:
- Running quality checks before versioning
- Building the project after version bump
- Pushing changes and tags to git
- Final quality checks before publishing

## Summary

Publishing to NPM involves:

1. **Configure** `package.json` with proper metadata and scripts
2. **Version** your package using `npm version` commands
3. **Publish** using `npm publish`
4. **Automate** the process with lifecycle scripts

Remember to follow semantic versioning, test thoroughly, and maintain good documentation for your users.
