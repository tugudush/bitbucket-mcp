# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
