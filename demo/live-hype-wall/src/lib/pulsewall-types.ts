export type Post = {
  id: string;
  author_id: string;
  author_handle: string;
  body: string;
  image_url: string | null;
  reaction_count: number;
  created_at: string;
};

export type Reaction = {
  id: string;
  post_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
};

export const REACTION_EMOJIS = ["🔥", "🙌", "💖", "🚀", "🤯"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];
