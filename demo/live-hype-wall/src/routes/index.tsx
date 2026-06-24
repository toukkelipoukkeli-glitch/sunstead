import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Post } from "@/lib/pulsewall-types";
import { Composer } from "@/components/Composer";
import { PostCard, PostCardSkeleton } from "@/components/PostCard";
import { HypeCounter } from "@/components/HypeCounter";
import { embedSearchQuery } from "@/lib/embed-search.functions";
import { useServerFn } from "@tanstack/react-start";
import { Search, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PulseWall — Live Event Hype Wall" },
      { name: "description", content: "Post hypes, react in real time, and watch the energy build live at your event." },
      { property: "og:title", content: "PulseWall — Live Event Hype Wall" },
      { property: "og:description", content: "Real-time reactions and a live leaderboard for festivals and launches." },
    ],
  }),
  component: WallPage,
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

type SearchResult = Post & { similarity: number };

function WallPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [total, setTotal] = useState(0);

  // Search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const embedFn = useServerFn(embedSearchQuery);

  // Initial fetch
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (cancelled) return;
      if (error) {
        toast.error(error.message);
      } else if (data) {
        setPosts(data as Post[]);
        setTotal((data as Post[]).reduce((acc, p) => acc + p.reaction_count, 0));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Realtime
  const totalRef = useRef(total);
  totalRef.current = total;

  useEffect(() => {
    const channel = supabase
      .channel("pulsewall-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          const post = payload.new as Post;
          setPosts((prev) => {
            if (prev.some((p) => p.id === post.id)) return prev;
            return [post, ...prev].slice(0, 100);
          });
          setNewIds((s) => new Set(s).add(post.id));
          setTimeout(() => {
            setNewIds((s) => {
              const n = new Set(s);
              n.delete(post.id);
              return n;
            });
          }, 2000);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "posts" },
        (payload) => {
          const post = payload.new as Post;
          const old = payload.old as Partial<Post>;
          setPosts((prev) =>
            prev.map((p) => (p.id === post.id ? { ...p, ...post } : p)),
          );
          const delta = (post.reaction_count ?? 0) - (old.reaction_count ?? 0);
          if (delta) setTotal((t) => Math.max(0, t + delta));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "posts" },
        (payload) => {
          const old = payload.old as Partial<Post>;
          if (old.id) setPosts((prev) => prev.filter((p) => p.id !== old.id));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Search
  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      setResults(null);
      return;
    }
    setSearching(true);
    try {
      const { embedding } = await embedFn({ data: { query: q } });
      const { data, error } = await supabase.rpc("match_posts", {
        query_embedding: embedding as unknown as string,
        match_count: 12,
      });
      if (error) throw error;
      setResults((data ?? []) as SearchResult[]);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults(null);
  };

  const feed = useMemo(() => results ?? posts, [results, posts]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
      <section className="rounded-[2rem] border border-border bg-card/40 px-6 py-10 backdrop-blur-xl md:py-16">
        <HypeCounter total={total} />
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-[1fr_2fr]">
        <div className="space-y-4">
          <Composer />
          <form
            onSubmit={runSearch}
            className="rounded-3xl border border-border bg-card/60 p-3 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2">
              <Search className="ml-2 h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by meaning — try 'pure euphoria'"
                className="flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
              {results !== null && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={searching || !query.trim()}
                className="rounded-full bg-gradient-hype px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
              >
                {searching ? "…" : "Search"}
              </button>
            </div>
          </form>
          {results !== null && (
            <p className="px-2 text-xs text-muted-foreground">
              Showing {results.length} semantic matches for "{query}".
            </p>
          )}
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between px-1">
            <h2 className="font-display text-2xl font-bold">
              {results !== null ? "Matches" : "Live wall"}
            </h2>
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              {feed.length} posts
            </span>
          </div>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <PostCardSkeleton key={i} />
              ))}
            </div>
          ) : feed.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/40 p-12 text-center">
              <p className="font-display text-xl">No hypes yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Be the first to light up the wall.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {feed.map((p) => (
                <PostCard key={p.id} post={p} isNew={newIds.has(p.id)} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
