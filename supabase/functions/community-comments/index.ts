import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify } from "https://esm.sh/jose@6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function getClerkUserId(req: Request): Promise<string> {
  const header = req.headers.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new Error("Not authenticated.");
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid authentication token.");
  const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
  const issuer = String(payload.iss || "").replace(/\/$/, "");
  if (!issuer || !issuer.startsWith("https://")) throw new Error("Invalid authentication token.");
  const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
  const verified = await jwtVerify(token, jwks, { issuer });
  const userId = String(verified.payload.sub || "");
  if (!userId) throw new Error("Invalid authentication token.");
  return userId;
}

async function loadComments(postId: string, viewerId: string) {
  const { data: comments, error } = await supabase
    .from("devcollective_post_comments")
    .select("id,post_id,author_clerk_user_id,content,created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw error;
  if (!comments?.length) return [];

  const authorIds = [...new Set(comments.map((comment) => comment.author_clerk_user_id))];
  const { data: profiles, error: profileError } = await supabase
    .from("devcollective_profiles")
    .select("clerk_user_id,name,avatar,role,rep")
    .in("clerk_user_id", authorIds);
  if (profileError) throw profileError;
  const profileMap = new Map((profiles || []).map((profile) => [profile.clerk_user_id, profile]));

  const commentIds = comments.map((comment) => comment.id);
  const { data: likes, error: likeError } = await supabase
    .from("devcollective_post_comment_likes")
    .select("comment_id,user_clerk_user_id")
    .in("comment_id", commentIds);
  if (likeError) throw likeError;
  const likeCount = new Map<string, number>();
  const likedByViewer = new Set<string>();
  for (const like of likes || []) {
    likeCount.set(like.comment_id, (likeCount.get(like.comment_id) || 0) + 1);
    if (like.user_clerk_user_id === viewerId) likedByViewer.add(like.comment_id);
  }

  return comments.map((comment) => {
    const author = profileMap.get(comment.author_clerk_user_id);
    return {
      id: comment.id,
      postId: comment.post_id,
      authorId: comment.author_clerk_user_id,
      authorName: author?.name || "Developer",
      authorAvatar: author?.avatar || "",
      authorRole: author?.role || "student",
      authorRep: Number(author?.rep) || 0,
      content: comment.content,
      createdAt: comment.created_at,
      likes: likeCount.get(comment.id) || 0,
      likedByMe: likedByViewer.has(comment.id),
    };
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const userId = await getClerkUserId(req);
    const url = new URL(req.url);
    const postId = url.searchParams.get("postId");
    const mode = url.searchParams.get("mode");

    if (req.method === "GET" && mode === "counts") {
      const { data, error } = await supabase
        .from("devcollective_post_comments")
        .select("post_id")
        .limit(5000);
      if (error) throw error;
      const counts = new Map<string, number>();
      for (const row of data || []) counts.set(row.post_id, (counts.get(row.post_id) || 0) + 1);
      return json({ counts: Array.from(counts, ([id, count]) => ({ postId: id, count })) });
    }

    if (req.method === "GET") {
      if (!postId) return json({ error: "postId is required." }, 400);
      return json({ comments: await loadComments(postId, userId), viewerId: userId });
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const targetPostId = String(body.postId || postId || "");
      const content = typeof body.content === "string" ? body.content.trim().slice(0, 2000) : "";
      if (!targetPostId) return json({ error: "postId is required." }, 400);
      if (!content) return json({ error: "Comment cannot be empty." }, 400);

      const { data: post, error: postError } = await supabase
        .from("devcollective_posts")
        .select("id")
        .eq("id", targetPostId)
        .maybeSingle();
      if (postError) throw postError;
      if (!post) return json({ error: "Post not found." }, 404);

      const { data: created, error } = await supabase
        .from("devcollective_post_comments")
        .insert({ post_id: targetPostId, author_clerk_user_id: userId, content })
        .select("id")
        .single();
      if (error) throw error;

      const comments = await loadComments(targetPostId, userId);
      return json({ comment: comments.find((item) => item.id === created.id) || null, count: comments.length }, 201);
    }

    return json({ error: "Method not allowed." }, 405);
  } catch (error) {
    console.error("community-comments error", error);
    const message = error instanceof Error ? error.message : "Could not process community comments.";
    const status = message.includes("Not authenticated") || message.includes("Invalid authentication") ? 401 : 500;
    return json({ error: message }, status);
  }
});
