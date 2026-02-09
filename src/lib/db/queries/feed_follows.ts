import { db } from "../index.js";
import { feedFollows, feeds, users } from "../schema.js";
import { eq } from "drizzle-orm";
import { and } from "drizzle-orm";


export async function createFeedFollow(userId: string, feedId: string) {

  const [ff] = await db.insert(feedFollows).values({ userId, feedId }).returning();

  const rows = await db
    .select({
      id: feedFollows.id,
      createdAt: feedFollows.createdAt,
      updatedAt: feedFollows.updatedAt,
      userId: feedFollows.userId,
      feedId: feedFollows.feedId,
      userName: users.name,
      feedName: feeds.name,
    })
    .from(feedFollows)
    .innerJoin(users, eq(feedFollows.userId, users.id))
    .innerJoin(feeds, eq(feedFollows.feedId, feeds.id))
    .where(eq(feedFollows.id, ff.id))
    .limit(1);

  return rows[0];
}

export async function getFeedFollowsForUser(userId: string) {
  return await db
    .select({
      id: feedFollows.id,
      createdAt: feedFollows.createdAt,
      updatedAt: feedFollows.updatedAt,
      userId: feedFollows.userId,
      feedId: feedFollows.feedId,
      userName: users.name,
      feedName: feeds.name,
    })
    .from(feedFollows)
    .innerJoin(users, eq(feedFollows.userId, users.id))
    .innerJoin(feeds, eq(feedFollows.feedId, feeds.id))
    .where(eq(feedFollows.userId, userId));
}

export async function deleteFeedFollowByUserAndUrl(userId: string, url: string) {
  const feed = await db.select().from(feeds).where(eq(feeds.url, url)).limit(1);
  const found = feed[0];
  if (!found) {
    throw new Error(`Feed not found: ${url}`);
  }

  await db
    .delete(feedFollows)
    .where(and(eq(feedFollows.userId, userId), eq(feedFollows.feedId, found.id)));
}

