import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-8xl font-bold text-gradient-hype">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This URL isn't on the wall.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-gradient-hype px-6 py-2.5 text-sm font-semibold text-primary-foreground glow-hype"
          >
            Back to the wall
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-bold">Something went sideways</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The wall hit an error. Try again in a moment.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-full bg-gradient-hype px-6 py-2.5 text-sm font-semibold text-primary-foreground glow-hype"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-full border border-border bg-card px-6 py-2.5 text-sm font-medium"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PulseWall — Live Event Hype Wall" },
      { name: "description", content: "A real-time hype wall for festivals and launches. Post, react, and watch the energy build live." },
      { name: "theme-color", content: "#1a0b1f" },
      { property: "og:title", content: "PulseWall — Live Event Hype Wall" },
      { property: "og:description", content: "A real-time hype wall for festivals and launches. Post, react, and watch the energy build live." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "PulseWall — Live Event Hype Wall" },
      { name: "twitter:description", content: "A real-time hype wall for festivals and launches. Post, react, and watch the energy build live." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0ea8ab40-4256-4914-964c-893345cdab7c/id-preview-8a0c89a3--0628cd79-5f1e-46bc-bb1b-ce0cacf4e087.lovable.app-1782335880159.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0ea8ab40-4256-4914-964c-893345cdab7c/id-preview-8a0c89a3--0628cd79-5f1e-46bc-bb1b-ce0cacf4e087.lovable.app-1782335880159.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function TopNav() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-hype glow-hype">
            <span className="block h-3 w-3 rounded-full bg-background animate-hype-pulse" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            Pulse<span className="text-gradient-hype">Wall</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 md:gap-2">
          <Link
            to="/"
            className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-card hover:text-foreground"
            activeProps={{ className: "rounded-full px-4 py-2 text-sm font-semibold bg-card text-foreground" }}
            activeOptions={{ exact: true }}
          >
            Wall
          </Link>
          <Link
            to="/leaderboard"
            className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-card hover:text-foreground"
            activeProps={{ className: "rounded-full px-4 py-2 text-sm font-semibold bg-card text-foreground" }}
          >
            Leaderboard
          </Link>
          {email ? (
            <button
              onClick={signOut}
              className="ml-1 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary"
              title={email}
            >
              Sign out
            </button>
          ) : (
            <Link
              to="/auth"
              className="ml-1 rounded-full bg-gradient-hype px-4 py-2 text-sm font-semibold text-primary-foreground glow-hype"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen">
        <TopNav />
        <Outlet />
        <Toaster theme="dark" position="top-center" richColors />
      </div>
    </QueryClientProvider>
  );
}
