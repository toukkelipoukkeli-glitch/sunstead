import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({ query: z.string().trim().min(1).max(280) });

export const embedSearchQuery = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("missing LOVABLE_API_KEY");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/text-embedding-3-small",
        input: data.query,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`embedding failed: ${res.status} ${text}`);
    }

    const json = await res.json();
    const embedding: number[] | undefined = json?.data?.[0]?.embedding;
    if (!embedding) throw new Error("no embedding in response");
    return { embedding };
  });
