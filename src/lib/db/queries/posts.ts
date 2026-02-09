import { desc, eq, sql } from "drizzle-orm";
import { db } from "../index.js";
import { feedFollows, feeds, posts, users } from "../schema.js";


export async function createPost(params: {
  title: string | null;
  url: string;
  description: string | null;
  publishedAt: Date | null;
  feedId: string;
}) {
  const [result] = await db
    .insert(posts)
    .values({
      title: params.title,
      url: params.url,
      description: params.description,
      publishedAt: params.publishedAt,
      feedId: params.feedId,
    })
    
    .onConflictDoNothing({ target: posts.url })
    .returning();

  return result; 
}

export async function getPostsForUser(userId: string, limit: number) {
  return await db
    .select({
      postId: posts.id,
      title: posts.title,
      url: posts.url,
      description: posts.description,
      publishedAt: posts.publishedAt,
      feedName: feeds.name,
    })
    .from(posts)
    .innerJoin(feeds, eq(posts.feedId, feeds.id))
    .innerJoin(feedFollows, eq(feedFollows.feedId, feeds.id))
    .where(eq(feedFollows.userId, userId))
    .orderBy(desc(posts.publishedAt), desc(posts.createdAt))
    .limit(limit);
}

