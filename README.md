# Gator CLI

Gator is a command-line tool that allows users to manage RSS feeds, fetch the latest posts from websites, and store them in a structured database. It supports multiple users, feed subscriptions, and post aggregation.

---

## Features

- User registration, login, and account management
- Add and manage RSS feeds
- Follow/unfollow feeds
- Fetch posts from feeds (RSS aggregator)
- Browse posts from followed feeds
- Reset database for testing purposes
- Fully CLI-based interface

---

## Requirements

- Node.js v24+
- PostgreSQL 16+
- `npm` or `yarn` for package management
- `drizzle-kit` for database migrations

---

## Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd Gator


2-Install dependencies:
npm install


3-Configure the database in drizzle.config.ts:

export default {
  driver: 'postgres',
  dbCredentials: {
    database: 'gator',
    user: 'postgres',
    password: '<your-password>',
    host: 'localhost',
    port: 5432,
  },
  migrationsFolder: './migrations',
};


4-Run the database migrations:

npx drizzle-kit migrate

5- commands
User commands

Register a new user

npm run start register <username>


Login

npm run start login <username>


List users

npm run start users


Reset database

npm run start reset

Feed commands

Add a feed

npm run start addfeed <feed-name> <feed-url>


Follow a feed

npm run start follow <feed-url>


Unfollow a feed

npm run start unfollow <feed-url>


List your followed feeds

npm run start following


Browse posts

npm run start browse [limit]



