# gator (RSS Feed Aggregator CLI)

**gator** is a multi-user command-line RSS feed aggregator written in **TypeScript**.  
It lets you register users, add RSS feeds, follow/unfollow feeds, continuously collect posts into a **PostgreSQL** database, and browse the latest posts right in your terminal.

---

## Features

- Multi-user (local) CLI using a shared database
- Add RSS feeds (unique by URL)
- Follow / unfollow feeds
- Long-running aggregator (`agg`) that fetches feeds on an interval
- Stores posts in Postgres (deduped by post URL)
- Browse latest posts from the feeds you follow

> Note: This project is for local use. There is no user authentication.

---

## Requirements

- **Node.js** (recommended: `v22.15.0`)
- **npm**
- **PostgreSQL 16+**
- (Optional) `psql` for debugging

If you use `nvm`, create a `.nvmrc` file with:

```txt
22.15.0

