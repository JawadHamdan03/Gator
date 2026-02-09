import { readConfig, setUser } from "./config.js";

import { createUser, getUserByName, deleteAllUsers, getUsers } from "./lib/db/queries/users.js";
import { createFeed, getFeeds, getFeedByUrl, getNextFeedToFetch, markFeedFetched } from "./lib/db/queries/feeds.js";
import { createFeedFollow, getFeedFollowsForUser, deleteFeedFollowByUserAndUrl } from "./lib/db/queries/feed_follows.js";
import { createPost, getPostsForUser } from "./lib/db/queries/posts.js";

import { fetchFeed } from "./rss.js";
import type { Feed, User } from "./lib/db/schema.js";

export type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;
export type CommandsRegistry = { [key: string]: CommandHandler };

export type UserCommandHandler = (cmdName: string, user: User, ...args: string[]) => Promise<void>;

export function middlewareLoggedIn(handler: UserCommandHandler): CommandHandler {
  return async (cmdName: string, ...args: string[]) => {
    const cfg = readConfig();
    const userName = cfg.currentUserName;
    if (!userName) throw new Error("No current user. Please login first.");

    const user = await getUserByName(userName);
    if (!user) throw new Error(`User ${userName} not found`);

    await handler(cmdName, user, ...args);
  };
}

export function registerCommand(registry: CommandsRegistry, cmdName: string, handler: CommandHandler): void {
  registry[cmdName] = handler;
}

export async function runCommand(registry: CommandsRegistry, cmdName: string, ...args: string[]): Promise<void> {
  const handler = registry[cmdName];
  if (!handler) throw new Error(`Unknown command: ${cmdName}`);
  await handler(cmdName, ...args);
}

function printFeed(feed: Feed, user: User): void {
  console.log(`* ${feed.name}`);
  console.log(`  - URL: ${feed.url}`);
  console.log(`  - User: ${user.name}`);
}

type FeedWithUser = { feedName: string; feedUrl: string; userName: string };

function printFeeds(rows: FeedWithUser[]): void {
  for (const r of rows) {
    console.log(`* ${r.feedName}`);
    console.log(`  - URL: ${r.feedUrl}`);
    console.log(`  - User: ${r.userName}`);
  }
}

function parseDuration(durationStr: string): number {
  const regex = /^(\d+)(ms|s|m|h)$/;
  const match = durationStr.match(regex);
  if (!match) throw new Error("Invalid duration. Use like 500ms, 10s, 5m, 1h");

  const value = Number(match[1]);
  const unit = match[2];

  if (unit === "ms") return value;
  if (unit === "s") return value * 1000;
  if (unit === "m") return value * 60 * 1000;
  return value * 60 * 60 * 1000;
}

function parsePublishedAt(pubDate: string | null | undefined): Date | null {
  if (!pubDate) return null;

  const t = Date.parse(pubDate);
  if (!Number.isNaN(t)) return new Date(t);

  return null;
}

async function scrapeFeeds(): Promise<void> {
  const next = await getNextFeedToFetch();
  if (!next) {
    console.log("No feeds to fetch.");
    return;
  }

  console.log(`Fetching: ${next.name} (${next.url})`);
  await markFeedFetched(next.id);

  const rss = await fetchFeed(next.url);

  let saved = 0;
  for (const item of rss.channel.item) {
    if (!item?.link || !item?.title) continue;

    const inserted = await createPost({
      title: item.title ?? null,
      url: item.link,
      description: item.description ?? null,
      publishedAt: parsePublishedAt(item.pubDate),
      feedId: next.id,
    });

    if (inserted) saved++;
  }

  console.log(`Saved ${saved} new posts from ${next.name}`);
}

export async function handlerLogin(cmdName: string, ...args: string[]): Promise<void> {
  if (args.length < 1) throw new Error("login requires a username");
  const name = args[0];

  const user = await getUserByName(name);
  if (!user) throw new Error(`User ${name} not found`);

  setUser(name);
  console.log(`Logged in as ${name}`);
}

export async function handlerRegister(cmdName: string, ...args: string[]): Promise<void> {
  if (args.length < 1) throw new Error("register requires a username");
  const name = args[0];

  const existing = await getUserByName(name);
  if (existing) throw new Error(`User already exists: ${name}`);

  const user = await createUser(name);
  setUser(user.name);
  console.log(`Created user ${user.name}`);
  console.log(user);
}

export async function handlerReset(cmdName: string, ...args: string[]): Promise<void> {
  await deleteAllUsers();
  console.log("Database reset successful");
}

export async function handlerUsers(cmdName: string, ...args: string[]): Promise<void> {
  const cfg = readConfig();
  const current = cfg.currentUserName;

  const all = await getUsers();
  for (const u of all) {
    const suffix = current && u.name === current ? " (current)" : "";
    console.log(`* ${u.name}${suffix}`);
  }
}

export async function handlerFeeds(cmdName: string, ...args: string[]): Promise<void> {
  const rows = await getFeeds();
  printFeeds(rows as FeedWithUser[]);
}

export async function handlerAgg(cmdName: string, ...args: string[]): Promise<void> {
  if (args.length < 1) {
    throw new Error("agg requires time_between_reqs like 10s, 1m, 500ms");
  }

  const timeBetweenRequests = parseDuration(args[0]);
  console.log(`Collecting feeds every ${args[0]}`);

  const handleError = (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(msg);
  };

  await scrapeFeeds().catch(handleError);

  const interval = setInterval(() => {
    scrapeFeeds().catch(handleError);
  }, timeBetweenRequests);

  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => {
      console.log("Shutting down feed aggregator...");
      clearInterval(interval);
      resolve();
    });
  });
}

export async function handlerAddFeed(cmdName: string, user: User, ...args: string[]): Promise<void> {
  if (args.length < 2) throw new Error("addfeed requires a name and a url");
  const name = args[0];
  const url = args[1];

  const feed = await createFeed(name, url, user.id);

  const ff = await createFeedFollow(user.id, feed.id);
  console.log(`${ff.userName} now follows ${ff.feedName}`);

  printFeed(feed, user);
}

export async function handlerFollow(cmdName: string, user: User, ...args: string[]): Promise<void> {
  if (args.length < 1) throw new Error("follow requires a url");
  const url = args[0];

  const feed = await getFeedByUrl(url);
  if (!feed) throw new Error(`Feed not found: ${url}`);

  const ff = await createFeedFollow(user.id, feed.id);
  console.log(`${ff.userName} now follows ${ff.feedName}`);
}

export async function handlerFollowing(cmdName: string, user: User, ...args: string[]): Promise<void> {
  const follows = await getFeedFollowsForUser(user.id);
  for (const f of follows) console.log(f.feedName);
}

export async function handlerUnfollow(cmdName: string, user: User, ...args: string[]): Promise<void> {
  if (args.length < 1) throw new Error("unfollow requires a url");
  const url = args[0];

  await deleteFeedFollowByUserAndUrl(user.id, url);
  console.log(`Unfollowed: ${url}`);
}

export async function handlerBrowse(cmdName: string, user: User, ...args: string[]): Promise<void> {
  let limit = 2;
  if (args.length >= 1) {
    const n = Number(args[0]);
    if (!Number.isFinite(n) || n <= 0) {
      throw new Error("browse limit must be a positive number");
    }
    limit = Math.floor(n);
  }

  const rows = await getPostsForUser(user.id, limit);

  for (const p of rows) {
    const when = p.publishedAt ? new Date(p.publishedAt).toISOString() : "unknown date";
    console.log(`* ${p.title ?? "(no title)"} (${p.feedName})`);
    console.log(`  - ${p.url}`);
    console.log(`  - ${when}`);
  }
}

