import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { REACTION_EMOJIS, type Post } from "@/lib/pulsewall-types";
import { toast } from "sonner";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export function PostCard({
  post,
  isNew,
  rank,
}: {
  post: Post;
  isNew?: boolean;
  rank?: number;
}) {
  const { user } = useAuth();
  const [pulse, setPulse] = useState(false);
  const [count, setCount] = useState(post.reaction_count);
  const [myReactions, setMyReactions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (count !== post.reaction_count) {
      setCount(post.reaction_count);
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 1200);
      return () => clearTimeout(t);
    }
  }, [post.reaction_count, count]);

  useEffect(() => {
    if (!user) {
      setMyReactions(new Set());
      return;
    }
    supabase
      .from("reactions")
      .select("emoji")
      .eq("post_id", post.id)
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setMyReactions(new Set(data.map((r) => r.emoji)));
      });
  }, [post.id, user]);

  const toggle = async (emoji: string) => {
    if (!user) {
      toast.error("Sign in to react.");
      return;
    }
    const mine = myReactions.has(emoji);
    if (mine) {
      const next = new Set(myReactions);
      next.delete(emoji);
      setMyReactions(next);
      const { error } = await supabase
        .from("reactions")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", user.id)
        .eq("emoji", emoji);
      if (error) {
        toast.error(error.message);
        setMyReactions(new Set(myReactions));
      }
    } else {
      const next = new Set(myReactions);
      next.add(emoji);
      setMyReactions(next);
      const { error } = await supabase
        .from("reactions")
        .insert({ post_id: post.id, user_id: user.id, emoji });
      if (error) {
        toast.error(error.message);
        next.delete(emoji);
        setMyReactions(next);
      }
    }
  };

  return (
    <article
      className={`relative overflow-hidden rounded-3xl border border-border bg-card/70 p-5 backdrop-blur-xl transition ${isNew ? "animate-hype-rise glow-hype" : ""}`}
    >
      {rank !== undefined && (
        <div className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full bg-gradient-hype font-display text-xl font-bold text-primary-foreground glow-hype">
          {rank}
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary font-display text-xs font-bold uppercase">
          {post.author_handle.slice(0, 2)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">@{post.author_handle}</p>
          <p className="text-xs text-muted-foreground">{timeAgo(post.created_at)} ago</p>
        </div>
      </div>

      <p className="mt-4 whitespace-pre-wrap break-words text-lg leading-snug">
        {post.body}
      </p>

      {post.image_url && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-border">
          <img
            src={post.image_url}
            alt=""
            loading="lazy"
            className="w-full object-cover"
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {REACTION_EMOJIS.map((emoji) => {
          const mine = myReactions.has(emoji);
          return (
            <button
              key={emoji}
              onClick={() => toggle(emoji)}
              className={`rounded-full border px-3 py-1.5 text-base transition active:scale-95 ${
                mine
                  ? "border-primary bg-primary/20 glow-pulse"
                  : "border-border bg-secondary/60 hover:border-primary/60"
              }`}
              aria-label={`React with ${emoji}`}
            >
              {emoji}
            </button>
          );
        })}
        <div
          className={`ml-auto flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1.5 text-sm font-semibold tabular-nums ${pulse ? "animate-hype-pop text-gradient-hype" : ""}`}
        >
          <span className="text-pulse">●</span>
          {count}
        </div>
      </div>
    </article>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="h-64 animate-pulse rounded-3xl border border-border bg-card/40" />
  );
}

export { Link };
