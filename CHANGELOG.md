# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.8] - 2025-08-20

### Fixed
- **Repository browsing**: Reverted to commit SHA resolution for subdirectory browsing in `bb_browse_repository` tool
  - Restored hybrid URL approach to properly handle complex branch names (e.g., `feature/SSP-1024`)
  - Re-implemented commit SHA resolution logic for subdirectory access to avoid Bitbucket API URL parsing issues
  - Root directory browsing continues to use `?at={ref}` pattern (works with all branch names)
  - Subdirectory browsing now uses `/src/{commit_sha}/{path}/` pattern (resolves branch to commit SHA first)
  - This fixes regression introduced in v1.4.6 where branches with forward slashes would fail on subdirectory access

## [1.4.7] - 2025-08-20

### Added
- **Changelog integration**: Added comprehensive changelog management and distribution
  - Created CHANGELOG.md following [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format
  - Added changelog to npm package files for distribution with published packages
  - Added `release` script for automated build, publish, and git operations
  - Integrated changelog with GitHub releases workflow

### Changed
- **Package distribution**: Updated `files` array in package.json to include CHANGELOG.md and README.md
- **Release workflow**: Enhanced npm scripts with automated release command

## [1.4.6] - 2025-08-20

### Changed
- **Repository browsing**: Simplified URL construction for subdirectory access in `bb_browse_repository` tool ([#022a60f](https://github.com/tugudush/bitbucket-mcp/commit/022a60fc07c5fe607ada19f58747e18b07f18d0c))
  - Removed complex commit SHA resolution logic for subdirectories
  - Now uses direct `/src/{ref}/{path}/` pattern consistently with file content access
  - Eliminates fallback mechanisms and reduces code complexity by 25 lines
  - Improves reliability for browsing subdirectories with branch names containing special characters

### Technical Details
- Refactored `handleToolCall` function in `src/tools.ts`
- Simplified subdirectory URL construction from 31 lines to 12 lines
- Removed try-catch block for commit SHA resolution
- Unified URL pattern with file content retrieval method
- Maintained trailing slash handling for proper directory browsing

---

*This changelog was generated based on commit [022a60f](https://github.com/tugudush/bitbucket-mcp/commit/022a60fc07c5fe607ada19f58747e18b07f18d0c) from August 20, 2025*
