# Suggested Documentation Improvements

## API Documentation

### Tool Reference
Each tool should have:
- **Purpose**: What the tool does
- **Parameters**: All required and optional parameters with examples
- **Response Format**: Expected response structure
- **Error Scenarios**: Common error cases and solutions
- **Rate Limits**: API usage considerations
- **Examples**: Multiple usage scenarios

### Example for bb_get_repository:

```typescript
/**
 * Get detailed information about a specific repository
 * 
 * @param workspace - The workspace slug (e.g., "mycompany")
 * @param repo_slug - The repository name (e.g., "my-project")
 * 
 * @returns Repository information including:
 * - Basic details (name, description, language)
 * - Metadata (creation date, size, privacy)
 * - Statistics (forks, watchers)
 * - Clone URLs
 * 
 * @throws {AuthenticationError} When credentials are invalid
 * @throws {NotFoundError} When repository doesn't exist or access denied
 * @throws {RateLimitError} When API rate limit exceeded
 * 
 * @example
 * // Basic usage
 * bb_get_repository({
 *   workspace: "mycompany",
 *   repo_slug: "my-project"
 * })
 * 
 * @example
 * // In VS Code Copilot Chat
 * "Show me details for mycompany/my-project repository"
 * 
 * @example
 * // In Claude Desktop
 * "Get information about the repository mycompany/my-project"
 */
```

## Architecture Documentation

### High-Level Architecture Diagram
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MCP Client    │    │  Bitbucket MCP  │    │  Bitbucket API  │
│                 │    │     Server      │    │                 │
│  VS Code        │◄──►│                 │◄──►│  api.bitbucket  │
│  Claude Desktop │    │  Read-Only      │    │  .org/2.0       │
│                 │    │  TypeScript     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow Documentation
1. **Request Flow**: MCP Client → Schema Validation → Authentication → API Call → Response Formatting
2. **Error Flow**: API Error → Error Classification → User-Friendly Message → Client Response
3. **Caching Flow**: Request → Cache Check → API Call (if miss) → Cache Store → Response

## Security Documentation

### Security Model
- **Read-Only Design**: No write operations at any level
- **Authentication**: API tokens (preferred) or App Passwords (legacy)
- **Environment Isolation**: All credentials via environment variables
- **Rate Limiting**: Respects Bitbucket API limits
- **Error Handling**: No sensitive data in error messages

### Threat Model
- **In Scope**: Data exfiltration, credential exposure, injection attacks
- **Out of Scope**: Data modification (impossible by design)
- **Mitigations**: Input validation, output sanitization, secure authentication

## Troubleshooting Guide

### Common Issues

#### Authentication Problems
```bash
# Problem: 401 Unauthorized
# Solution: Check credentials
export BITBUCKET_API_TOKEN="your-token"
export BITBUCKET_EMAIL="your@email.com"

# Problem: 403 Forbidden  
# Solution: Check repository access permissions
```

#### Performance Issues
```bash
# Problem: Slow responses
# Solution: Enable caching (when implemented)
export BITBUCKET_CACHE_TTL=300

# Problem: Rate limiting
# Solution: Reduce request frequency
```

#### Code Search Issues
```bash
# Problem: Search returns no results
# Solution: Enable code search in Bitbucket settings
# Go to: https://bitbucket.org/search
```

## Development Guide

### Adding New Tools
1. **Define TypeScript interface** for API response
2. **Create Zod schema** with descriptions
3. **Add to readOnlyTools** array if read-only
4. **Register tool** in ListToolsRequestSchema handler
5. **Implement handler** in CallToolRequestSchema switch
6. **Add tests** for new functionality
7. **Update documentation** with examples

### Code Style Guidelines
- **TypeScript strict mode**: All code must compile without warnings
- **ESLint compliance**: No linting errors allowed
- **Prettier formatting**: Consistent code style
- **Interface over any**: Use typed interfaces, avoid `any`
- **Error handling**: All API calls must have error handling
- **Documentation**: All public functions need JSDoc comments
