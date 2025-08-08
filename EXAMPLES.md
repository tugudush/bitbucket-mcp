# Bitbucket MCP Server - Usage Examples

## Basic Repository Operations

### Get Repository Information
```
Ask Claude: "Get information about the repository myworkspace/myrepo"
```

### List Repositories in a Workspace
```
Ask Claude: "List all repositories in the myworkspace workspace"
```

### Get File Content
```
Ask Claude: "Show me the content of README.md from myworkspace/myrepo"
Ask Claude: "Get the package.json file from the main branch of myworkspace/myrepo"
```

## Pull Request Operations

### List Pull Requests
```
Ask Claude: "Show me all open pull requests for myworkspace/myrepo"
Ask Claude: "List merged pull requests for myworkspace/myrepo"
```

### Get Specific Pull Request
```
Ask Claude: "Get details for pull request #123 in myworkspace/myrepo"
```

### Pull Request Comments
```
Ask Claude: "Show me all comments for pull request #123 in myworkspace/myrepo"
Ask Claude: "Get the discussion on PR #123 in myworkspace/myrepo"
```

### Pull Request Activity and Reviews
```
Ask Claude: "Show me the activity and reviews for pull request #123 in myworkspace/myrepo"
Ask Claude: "Get the approval status and review history for PR #123 in myworkspace/myrepo"
```

## Issue Management

### List Issues
```
Ask Claude: "Show me all open bugs in myworkspace/myrepo"
Ask Claude: "List all enhancement requests in myworkspace/myrepo"
```

### Get Specific Issue
```
Ask Claude: "Get details for issue #456 in myworkspace/myrepo"
```

## Version Control

### View Commits
```
Ask Claude: "Show me the recent commits on the main branch of myworkspace/myrepo"
Ask Claude: "Get commits from the develop branch of myworkspace/myrepo"
```

### List Branches
```
Ask Claude: "Show me all branches in myworkspace/myrepo"
```

## Code Search

### Search for Code
```
Ask Claude: "Search for 'TODO' comments in myworkspace/myrepo"
Ask Claude: "Find all functions named 'calculateTotal' in myworkspace/myrepo"
```

## User and Workspace Information

### User Information
```
Ask Claude: "Get information about the user johndoe"
```

### Workspace Information
```
Ask Claude: "Show me details about the myworkspace workspace"
```

## Advanced Examples

### Repository Analysis
```
Ask Claude: "Analyze the myworkspace/myrepo repository. Show me:
- Repository information
- Recent commits on main branch
- Open pull requests
- Open issues
- List of branches"
```

### Pull Request Review
```
Ask Claude: "Help me review pull request #123 in myworkspace/myrepo. Show me:
- Pull request details
- All comments and discussions
- Review activity and approvals
- Recent commits"
```

### Comprehensive PR Analysis
```
Ask Claude: "Give me a complete analysis of PR #123 in myworkspace/myrepo including:
- PR description and metadata
- All comments (both inline and general)
- Review history and current approval status
- Activity timeline"
```

### Issue Triage
```
Ask Claude: "Help me triage issues in myworkspace/myrepo. Show me:
- All open bugs
- All open enhancement requests
- Issues created in the last week"
```

## Tips for Effective Usage

1. **Be Specific**: Always include the workspace and repository name in your requests
2. **Use Pagination**: For large datasets, ask Claude to show specific pages
3. **Combine Operations**: You can ask Claude to perform multiple operations in one request
4. **Filter Results**: Use state filters for pull requests and issues (open, closed, merged, etc.)
5. **Branch-Specific**: Specify branches when looking at commits or file content

## Authentication Notes

- Public repositories can be accessed without authentication
- Private repositories require BITBUCKET_USERNAME and BITBUCKET_APP_PASSWORD environment variables
- App passwords can be created in your Bitbucket account settings under Access management
