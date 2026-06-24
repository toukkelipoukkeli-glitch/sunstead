import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — PulseWall" },
      { name: "description", content: "Sign in to PulseWall to post hypes and react." },
      { property: "og:title", content: "Sign in — PulseWall" },
      { property: "og:description", content: "Magic-link sign-in for the live event hype wall." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate({ to: "/" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Check your inbox for the magic link.");
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-md flex-col items-center justify-center px-4 py-12">
      <div className="w-full rounded-3xl border border-border bg-card/60 p-8 backdrop-blur-xl glow-hype">
        <h1 className="font-display text-3xl font-bold">
          Join the <span className="text-gradient-hype">hype</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We'll email you a magic link — no password needed.
        </p>

        {sent ? (
          <div className="mt-8 rounded-2xl border border-accent/40 bg-accent/10 p-4 text-sm">
            <p className="font-semibold text-accent">Check your email.</p>
            <p className="mt-1 text-muted-foreground">
              Click the link in your inbox to sign in to PulseWall.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full rounded-2xl border border-border bg-background/60 px-5 py-3 text-base outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-2xl bg-gradient-hype py-3 text-base font-semibold text-primary-foreground glow-hype disabled:opacity-60"
            >
              {sending ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Anyone can view the wall. Sign in to post or react.
        </p>
      </div>
    </main>
  );
}
