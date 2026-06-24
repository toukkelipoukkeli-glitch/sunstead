import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, handleFromEmail } from "@/hooks/use-auth";
import { toast } from "sonner";
import { ImagePlus, X, Sparkles } from "lucide-react";

const MAX_LEN = 280;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function Composer() {
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <div className="rounded-3xl border border-border bg-card/60 p-6 backdrop-blur-xl">
        <p className="text-sm text-muted-foreground">
          <Link to="/auth" className="font-semibold text-gradient-hype">
            Sign in
          </Link>{" "}
          to drop a hype on the wall.
        </p>
      </div>
    );
  }

  const onFile = (f: File | null) => {
    if (!f) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    if (!f.type.startsWith("image/")) {
      toast.error("That's not an image.");
      return;
    }
    if (f.size > MAX_IMAGE_BYTES) {
      toast.error("Image too large (max 5MB).");
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const reset = () => {
    setBody("");
    onFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) {
      toast.error("Say something hype.");
      return;
    }
    if (trimmed.length > MAX_LEN) {
      toast.error("Too long. Keep it under 280 characters.");
      return;
    }
    setPosting(true);
    try {
      let image_url: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("post-images")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("post-images").getPublicUrl(path);
        image_url = data.publicUrl;
      }

      const { error } = await supabase.from("posts").insert({
        author_id: user.id,
        author_handle: handleFromEmail(user.email),
        body: trimmed,
        image_url,
      });
      if (error) throw error;

      reset();
      toast.success("Posted!");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to post.");
    } finally {
      setPosting(false);
    }
  };

  const remaining = MAX_LEN - body.length;

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border border-border bg-card/60 p-5 backdrop-blur-xl"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-hype font-display text-sm font-bold text-primary-foreground">
          {handleFromEmail(user.email).slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={MAX_LEN}
            rows={2}
            placeholder="Drop your hype…"
            className="w-full resize-none bg-transparent text-lg outline-none placeholder:text-muted-foreground"
          />
          {previewUrl && (
            <div className="relative mt-2 inline-block">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-56 rounded-2xl border border-border"
              />
              <button
                type="button"
                onClick={() => onFile(null)}
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-background/80 text-foreground backdrop-blur"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Add image"
          >
            <ImagePlus className="h-5 w-5" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          <span
            className={`text-xs tabular-nums ${remaining < 30 ? "text-destructive" : "text-muted-foreground"}`}
          >
            {remaining}
          </span>
        </div>
        <button
          type="submit"
          disabled={posting || !body.trim()}
          className="flex items-center gap-2 rounded-full bg-gradient-hype px-5 py-2 text-sm font-semibold text-primary-foreground glow-hype disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          {posting ? "Posting…" : "Hype it"}
        </button>
      </div>
    </form>
  );
}
