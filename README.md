# Reddit User MCP Server

A Model Context Protocol (MCP) server that provides access to Reddit posts, comments, and interactions through your Reddable account.

## Features

- ✅ Fetch user Reddit posts and comments
- ✅ Get comments for specific posts
- ✅ Hide Reddit comments
- ✅ Reply to comments and posts
- ✅ Secure API key authentication
- ✅ Built with TypeScript and Smithery

## Installation

### For Claude Desktop

Add this configuration to your MCP settings:

```json
{
  "mcpServers": {
    "reddit-user": {
      "command": "npx",
      "args": ["-y", "@reddable/reddit-user-mcp"],
      "env": {
        "REDDABLE_API_KEY": "your_reddable_api_key_here"
      }
    }
  }
}
```

## Getting Your API Key

1. Go to [Reddable Dashboard](https://reddable.com/dashboard)
2. Connect your Reddit account
3. Scroll to "MCP Integration" section
4. Copy your API key from the setup instructions

## Available Tools

- `get_user_posts` - Fetch Reddit posts from a user
- `get_user_comments` - Fetch Reddit comments from a user  
- `get_post_comments` - Get all comments on a specific post
- `hide_comment` - Hide a Reddit comment from your view
- `reply_to_comment` - Reply to a specific comment
- `post_comment` - Post a new comment on a post

## Development

```bash
npm install
npm run dev
```

This will start the development server with ngrok tunneling for testing.

## Security

- Uses long-term API keys (no password exposure)
- All Reddit credentials stored securely in Reddable
- API requests proxied through Reddable servers
- No direct Reddit app credentials needed

## Support

For issues or questions, visit [Reddable Support](https://reddable.com/support).