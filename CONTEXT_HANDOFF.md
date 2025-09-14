# Reddit MCP Server - Project Context Handoff

## Project Overview
Building a Reddit comments MCP (Model Context Protocol) server that provides tools to fetch user posts, fetch comments for specific posts, hide comments, and respond to comments. The server will be deployed on Smithery platform.

## Current Status: MAJOR PIVOT REQUIRED
⚠️ **IMPORTANT**: Smithery has discontinued STDIO support as of September 7, 2025. The current implementation uses STDIO but needs to be completely rewritten using Smithery's HTTP-based approach.

## What Has Been Accomplished

### 1. Research Completed
- ✅ Reddit API documentation and authentication (OAuth2 password grant flow)
- ✅ MCP protocol documentation and STDIO implementation
- ✅ Smithery platform requirements (HTTP-based, not STDIO)
- ✅ Current Smithery scaffold structure and requirements

### 2. STDIO Implementation (DEPRECATED - DO NOT USE)
Located in `/Users/Vikram/Desktop/reddable/reddit-user-mcp/`:
- Complete TypeScript STDIO-based MCP server
- Reddit OAuth2 authentication with password grant flow
- All 5 required tools implemented
- Built and compiles successfully
- **STATUS**: Obsolete due to Smithery STDIO discontinuation

### 3. New Smithery Scaffold Created
Located in `/Users/Vikram/Desktop/reddable/reddit-user-mcp-v2/`:
- Fresh Smithery scaffold created with `npm create smithery`
- Uses HTTP-based MCP protocol
- Ready for Reddit functionality implementation

## Required Reddit API Credentials
The user needs these environment variables:

```env
REDDIT_CLIENT_ID=your_client_id_here
REDDIT_CLIENT_SECRET=your_client_secret_here
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password
REDDIT_USER_AGENT=mcp-reddit-server:v1.0.0 (by /u/your_username)
```

### How to Get Reddit Credentials:
1. Go to https://www.reddit.com/prefs/apps
2. Click "Create App" or "Create Another App"
3. Choose "script" app type
4. Note the Client ID (under "personal use script") and Client Secret

## Reddit API Authentication Details
**Flow**: OAuth2 Password Grant (perfect for personal/script use)

**Authentication Process**:
```typescript
// Base64 encode client_id:client_secret
const authString = Buffer.from(`${client_id}:${client_secret}`).toString('base64');

// POST to token endpoint
const response = await axios.post(
  'https://www.reddit.com/api/v1/access_token',
  new URLSearchParams({
    grant_type: 'password',
    username: reddit_username,
    password: reddit_password,
  }),
  {
    headers: {
      Authorization: `Basic ${authString}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': user_agent,
    },
  }
);

// Token expires in 1 hour, implement refresh logic
```

## Required MCP Tools

### 1. get_user_posts
- **Description**: Fetch posts from a Reddit user
- **Parameters**: 
  - `username` (optional): Reddit username without /u/. If not provided, uses authenticated user
  - `limit` (optional): Number of posts to fetch (1-100, default: 25)
- **API Endpoint**: `GET https://oauth.reddit.com/user/{username}/submitted`

### 2. get_user_comments
- **Description**: Fetch comments from a Reddit user
- **Parameters**: Same as get_user_posts
- **API Endpoint**: `GET https://oauth.reddit.com/user/{username}/comments`

### 3. get_post_comments
- **Description**: Fetch comments for a specific Reddit post
- **Parameters**:
  - `postId` (required): Reddit post ID (alphanumeric string in URL)
  - `subreddit` (optional): Subreddit name for faster lookup
- **API Endpoint**: `GET https://oauth.reddit.com/r/{subreddit}/comments/{postId}` or resolve via post info

### 4. hide_comment
- **Description**: Hide a Reddit comment from user's view
- **Parameters**:
  - `commentId` (required): Reddit comment ID to hide
- **API Endpoint**: `POST https://oauth.reddit.com/api/hide` with `id=t1_{commentId}`

### 5. reply_to_comment
- **Description**: Reply to a Reddit comment
- **Parameters**:
  - `commentId` (required): Reddit comment ID to reply to
  - `text` (required): Reply text (markdown supported)
- **API Endpoint**: `POST https://oauth.reddit.com/api/comment` with `thing_id=t1_{commentId}`

## Current Smithery Requirements (2025)

### Project Structure
```
reddit-user-mcp-v2/
├── src/
│   └── index.ts          # Main server file
├── package.json
├── tsconfig.json
└── README.md
```

### Required Dependencies
```json
{
  "@modelcontextprotocol/sdk": "latest",
  "axios": "^1.12.1",
  "dotenv": "^17.2.2",
  "zod": "^3.x.x"
}
```

### Smithery Server Structure
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Configuration schema
export const configSchema = z.object({
  REDDIT_CLIENT_ID: z.string().describe("Reddit OAuth2 Client ID"),
  REDDIT_CLIENT_SECRET: z.string().describe("Reddit OAuth2 Client Secret"),
  REDDIT_USERNAME: z.string().describe("Reddit username"),
  REDDIT_PASSWORD: z.string().describe("Reddit password"),
  REDDIT_USER_AGENT: z.string().default("mcp-reddit-server:v1.0.0").describe("User agent"),
});

export default function createServer({ config }) {
  const server = new McpServer({
    name: "Reddit User MCP",
    version: "1.0.0",
  });

  // Register tools here
  server.registerTool("get_user_posts", {
    title: "Get User Posts",
    description: "Fetch posts from a Reddit user",
    inputSchema: {
      username: z.string().optional().describe("Reddit username without /u/"),
      limit: z.number().min(1).max(100).default(25).describe("Number of posts to fetch")
    }
  }, async ({ username, limit }) => {
    // Implementation here
  });

  return server.server;
}
```

## Reddit Client Implementation (Reference from STDIO version)

The Reddit client class needs these key methods:
- `authenticate()`: Handle OAuth2 token refresh
- `getUserPosts(username?, limit?)`: Fetch user posts
- `getUserComments(username?, limit?)`: Fetch user comments  
- `getPostComments(postId, subreddit?)`: Fetch post comments
- `hideComment(commentId)`: Hide comment
- `replyToComment(commentId, text)`: Reply to comment

**Key Implementation Notes**:
- Tokens expire every hour - implement auto-refresh
- Use `raw_json=1` parameter to avoid HTML escaping
- Reddit API requires proper User-Agent header
- Handle rate limiting gracefully
- Parse nested comment structures for `getPostComments`

## Development and Testing Workflow

### 1. Local Development
```bash
cd reddit-user-mcp-v2
npm run dev
```
This uses ngrok to expose local server to Smithery playground.

### 2. Testing
Use Smithery playground to test tools with prompts like:
- "Get my recent posts"
- "Show comments for post ID abc123"
- "Hide comment xyz789"

### 3. Deployment
1. Push to GitHub repository
2. Go to smithery.ai
3. Click "Deploy" and select repository
4. Configure environment variables in Smithery dashboard

## Technical Challenges to Address

### 1. Comment Parsing
Reddit comments have nested structure - need recursive parsing:
```typescript
const parseComments = (commentData: any) => {
  if (commentData.kind === 'Listing') {
    commentData.data.children.forEach((child: any) => {
      if (child.kind === 't1') {
        // Process comment
        if (child.data.replies && child.data.replies.data) {
          parseComments(child.data.replies); // Recursive
        }
      }
    });
  }
};
```

### 2. Error Handling
- Invalid credentials
- Rate limiting
- Post/comment not found
- Network timeouts
- API changes

### 3. Data Types
Define TypeScript interfaces for:
- RedditPost
- RedditComment  
- RedditAuthResponse
- API error responses

## Security Considerations
- Never log credentials
- Store API tokens securely
- Validate all inputs
- Handle sensitive user data appropriately
- Use environment variables for all secrets

## Files to Reference from STDIO Implementation
Located in `/Users/Vikram/Desktop/reddable/reddit-user-mcp/src/`:
- `reddit-client.ts` - Complete Reddit API client implementation
- `index.ts` - Tool definitions and MCP server setup (adapt for HTTP)

## Next Steps for Implementation
1. Set up Reddit client in new Smithery project
2. Port authentication logic to HTTP-based server
3. Implement all 5 tools using Smithery's `registerTool` API
4. Add proper error handling and validation
5. Test in Smithery playground
6. Deploy to Smithery platform

## Additional Resources
- Reddit API Docs: https://www.reddit.com/dev/api/
- Smithery Docs: https://smithery.ai/docs
- MCP Specification: https://modelcontextprotocol.io/
- Smithery GitHub: https://github.com/smithery-ai

## Notes
- User has Node.js v18.20.2 (Smithery requires >18, so compatible)
- TypeScript compilation was working in STDIO version
- All Reddit API research and implementation patterns are proven
- Focus on HTTP transport adaptation, not Reddit API logic