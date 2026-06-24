import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Post } from "@/lib/pulsewall-types";
import { PostCard, PostCardSkeleton } from "@/components/PostCard";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — PulseWall" },
      { name: "description", content: "The top hypes ranked live by reactions. Updates instantly as the crowd reacts." },
      { property: "og:title", content: "Leaderboard — PulseWall" },
      { property: "og:description", content: "Top posts ranked in real time by reaction count." },
    ],
  }),
  component: LeaderboardPage,
  errorComponent: ({ error, reset }) => (
    <div className="mx-auto max-w-md p-8 text-center">
      <p className="text-destructive">{error.message}</p>
      <button onClick={reset} className="mt-4 rounded-full bg-gradient-hype px-5 py-2 text-sm font-semibold text-primary-foreground">
        Retry
      </button>
    </div>
  ),
  notFoundComponent: () => <div className="p-8 text-center">Not found.</div>,
});

const TOP_N = 20;

function LeaderboardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("posts")
        .select("*")
        .order("reaction_count", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(TOP_N);
      if (!cancelled && data) setPosts(data as Post[]);
      if (!cancelled) setLoading(false);
    };
    load();

    const channel = supabase
      .channel("pulsewall-leaderboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => {
          load();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-12">
      <header className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-gradient-hype glow-hype">
          <Trophy className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="font-display text-5xl font-bold tracking-tight md:text-6xl">
          Top <span className="text-gradient-hype">Hypes</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Ranked in real time by reactions. Updates instantly.
        </p>
      </header>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/40 p-12 text-center">
          <p className="font-display text-xl">No hypes ranked yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Posts will appear here as soon as the crowd reacts.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {posts.map((p, i) => (
            <PostCard key={p.id} post={p} rank={i + 1} />
          ))}
        </div>
      )}
    </main>
  );
}
