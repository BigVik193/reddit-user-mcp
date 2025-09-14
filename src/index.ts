import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import axios, { AxiosInstance } from "axios"

interface RedditPost {
	id: string
	title: string
	selftext: string
	author: string
	subreddit: string
	created_utc: number
	score: number
	num_comments: number
	permalink: string
	url: string
}

interface RedditComment {
	id: string
	body: string
	author: string
	created_utc: number
	score: number
	permalink: string
	parent_id: string
	replies?: any
}

class RedditAPIClient {
	private axiosInstance: AxiosInstance
	private accessToken: string
	private apiBaseUrl: string

	constructor(accessToken: string, apiBaseUrl: string) {
		this.accessToken = accessToken
		this.apiBaseUrl = apiBaseUrl
		this.axiosInstance = axios.create({
			baseURL: apiBaseUrl,
			headers: {
				"Authorization": `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
		})
	}

	async getUserPosts(username?: string, limit: number = 25): Promise<RedditPost[]> {
		const response = await this.axiosInstance.get('/api/reddit/mcp/user-posts', {
			params: { username, limit },
		})
		return response.data
	}

	async getUserComments(username?: string, limit: number = 25): Promise<RedditComment[]> {
		const response = await this.axiosInstance.get('/api/reddit/mcp/user-comments', {
			params: { username, limit },
		})
		return response.data
	}

	async getPostComments(postId: string, subreddit?: string): Promise<RedditComment[]> {
		const response = await this.axiosInstance.get('/api/reddit/mcp/post-comments', {
			params: { postId, subreddit },
		})
		return response.data
	}

	async hideComment(commentId: string): Promise<boolean> {
		try {
			await this.axiosInstance.post('/api/reddit/mcp/hide-comment', {
				commentId
			})
			return true
		} catch (error) {
			console.error("Failed to hide comment:", error)
			return false
		}
	}

	async replyToComment(commentId: string, text: string): Promise<string | null> {
		try {
			const response = await this.axiosInstance.post('/api/reddit/mcp/reply-comment', {
				commentId,
				text
			})
			return response.data.replyId || null
		} catch (error) {
			console.error("Failed to reply to comment:", error)
			return null
		}
	}

	async postComment(postId: string, text: string): Promise<string | null> {
		try {
			const response = await this.axiosInstance.post('/api/reddit/mcp/post-comment', {
				postId,
				text
			})
			return response.data.commentId || null
		} catch (error) {
			console.error("Failed to post comment:", error)
			return null
		}
	}

	async getHotPosts(subreddit: string, limit: number = 25): Promise<RedditPost[]> {
		try {
			const response = await this.axiosInstance.post('/api/reddit/mcp/hot-posts', {
				subreddit,
				limit
			})
			return response.data.posts || []
		} catch (error) {
			console.error("Failed to get hot posts:", error)
			throw error
		}
	}

	async getNewPosts(subreddit: string, limit: number = 25): Promise<RedditPost[]> {
		try {
			const response = await this.axiosInstance.post('/api/reddit/mcp/new-posts', {
				subreddit,
				limit
			})
			return response.data.posts || []
		} catch (error) {
			console.error("Failed to get new posts:", error)
			throw error
		}
	}

	async getRisingPosts(subreddit: string, limit: number = 25): Promise<RedditPost[]> {
		try {
			const response = await this.axiosInstance.post('/api/reddit/mcp/rising-posts', {
				subreddit,
				limit
			})
			return response.data.posts || []
		} catch (error) {
			console.error("Failed to get rising posts:", error)
			throw error
		}
	}
}

export const configSchema = z.object({
	REDDABLE_API_KEY: z.string().describe("Long-term API key for Reddable MCP access"),
})

export default function createServer({
	config,
}: {
	config: z.infer<typeof configSchema>
}) {
	const server = new McpServer({
		name: "Reddit User MCP",
		version: "1.0.0",
	})

	const redditClient = new RedditAPIClient(config.REDDABLE_API_KEY, "https://reddable.vercel.app")

	server.registerTool(
		"get_user_posts",
		{
			title: "Get User Posts",
			description: "Fetch posts from a Reddit user",
			inputSchema: {
				username: z.string().optional().describe("Reddit username without /u/. If not provided, uses authenticated user"),
				limit: z.number().min(1).max(100).default(25).describe("Number of posts to fetch (1-100, default: 25)"),
			},
		},
		async ({ username, limit = 25 }) => {
			try {
				const posts = await redditClient.getUserPosts(username, limit)
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(posts, null, 2),
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error fetching user posts: ${error}`,
						},
					],
					isError: true,
				}
			}
		}
	)

	server.registerTool(
		"get_user_comments",
		{
			title: "Get User Comments",
			description: "Fetch comments from a Reddit user",
			inputSchema: {
				username: z.string().optional().describe("Reddit username without /u/. If not provided, uses authenticated user"),
				limit: z.number().min(1).max(100).default(25).describe("Number of comments to fetch (1-100, default: 25)"),
			},
		},
		async ({ username, limit = 25 }) => {
			try {
				const comments = await redditClient.getUserComments(username, limit)
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(comments, null, 2),
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error fetching user comments: ${error}`,
						},
					],
					isError: true,
				}
			}
		}
	)

	server.registerTool(
		"get_post_comments",
		{
			title: "Get Post Comments",
			description: "Fetch comments for a specific Reddit post",
			inputSchema: {
				postId: z.string().describe("Reddit post ID (alphanumeric string in URL)"),
				subreddit: z.string().optional().describe("Subreddit name for faster lookup (optional)"),
			},
		},
		async ({ postId, subreddit }) => {
			try {
				const comments = await redditClient.getPostComments(postId, subreddit)
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(comments, null, 2),
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error fetching post comments: ${error}`,
						},
					],
					isError: true,
				}
			}
		}
	)

	server.registerTool(
		"hide_comment",
		{
			title: "Report Comment as Spam",
			description: "Report a Reddit comment as spam (also hides it from your view)",
			inputSchema: {
				commentId: z.string().describe("Reddit comment ID to report as spam"),
			},
		},
		async ({ commentId }) => {
			try {
				const success = await redditClient.hideComment(commentId)
				return {
					content: [
						{
							type: "text",
							text: success
								? `Successfully hid comment ${commentId}`
								: `Failed to hide comment ${commentId}`,
						},
					],
					isError: !success,
				}
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error hiding comment: ${error}`,
						},
					],
					isError: true,
				}
			}
		}
	)

	server.registerTool(
		"reply_to_comment",
		{
			title: "Reply to Comment",
			description: "Reply to a Reddit comment",
			inputSchema: {
				commentId: z.string().describe("Reddit comment ID to reply to"),
				text: z.string().describe("Reply text (markdown supported)"),
			},
		},
		async ({ commentId, text }) => {
			try {
				const replyId = await redditClient.replyToComment(commentId, text)
				return {
					content: [
						{
							type: "text",
							text: replyId
								? `Successfully replied to comment ${commentId}. Reply ID: ${replyId}`
								: `Failed to reply to comment ${commentId}`,
						},
					],
					isError: !replyId,
				}
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error replying to comment: ${error}`,
						},
					],
					isError: true,
				}
			}
		}
	)

	server.registerTool(
		"post_comment",
		{
			title: "Post Comment",
			description: "Post a comment directly on a Reddit post",
			inputSchema: {
				postId: z.string().describe("Reddit post ID to comment on"),
				text: z.string().describe("Comment text (markdown supported)"),
			},
		},
		async ({ postId, text }) => {
			try {
				const commentId = await redditClient.postComment(postId, text)
				return {
					content: [
						{
							type: "text",
							text: commentId
								? `Successfully posted comment on post ${postId}. Comment ID: ${commentId}`
								: `Failed to post comment on post ${postId}`,
						},
					],
					isError: !commentId,
				}
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error posting comment: ${error}`,
						},
					],
					isError: true,
				}
			}
		}
	)

	server.registerTool(
		"get_hot_posts",
		{
			title: "Get Hot Posts",
			description: "Fetch hot posts from a subreddit",
			inputSchema: {
				subreddit: z.string().describe("Subreddit name without /r/"),
				limit: z.number().min(1).max(100).default(25).describe("Number of posts to fetch (1-100, default: 25)"),
			},
		},
		async ({ subreddit, limit = 25 }) => {
			try {
				const posts = await redditClient.getHotPosts(subreddit, limit)
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(posts, null, 2),
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error fetching hot posts: ${error}`,
						},
					],
					isError: true,
				}
			}
		}
	)

	server.registerTool(
		"get_new_posts",
		{
			title: "Get New Posts",
			description: "Fetch new posts from a subreddit",
			inputSchema: {
				subreddit: z.string().describe("Subreddit name without /r/"),
				limit: z.number().min(1).max(100).default(25).describe("Number of posts to fetch (1-100, default: 25)"),
			},
		},
		async ({ subreddit, limit = 25 }) => {
			try {
				const posts = await redditClient.getNewPosts(subreddit, limit)
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(posts, null, 2),
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error fetching new posts: ${error}`,
						},
					],
					isError: true,
				}
			}
		}
	)

	server.registerTool(
		"get_rising_posts",
		{
			title: "Get Rising Posts",
			description: "Fetch rising posts from a subreddit",
			inputSchema: {
				subreddit: z.string().describe("Subreddit name without /r/"),
				limit: z.number().min(1).max(100).default(25).describe("Number of posts to fetch (1-100, default: 25)"),
			},
		},
		async ({ subreddit, limit = 25 }) => {
			try {
				const posts = await redditClient.getRisingPosts(subreddit, limit)
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(posts, null, 2),
						},
					],
				}
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error fetching rising posts: ${error}`,
						},
					],
					isError: true,
				}
			}
		}
	)

	return server.server
}
