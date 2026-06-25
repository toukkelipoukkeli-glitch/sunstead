import type { Post } from "@aiden/contracts"
import { Database, Heart, Image, Send, ShieldCheck } from "lucide-react"

export const SourceAppPanel = ({
  posts,
  onReact,
  cutoverReady,
  sourceLabel
}: {
  posts: Post[]
  onReact: () => void
  cutoverReady: boolean
  sourceLabel: string
}) => (
  <section className="panel source-panel">
    <div className="panel-header">
      <div>
        <p className="eyebrow">{cutoverReady ? "Aiven runtime" : "Source app"}</p>
        <h2>{sourceLabel}</h2>
      </div>
      <span className={cutoverReady ? "path-chip success" : "path-chip"}>
        {cutoverReady ? "Aiven adapter" : "source untouched"}
      </span>
    </div>
    <div className="source-runtime">
      {cutoverReady ? <Database aria-hidden="true" size={16} /> : <ShieldCheck aria-hidden="true" size={16} />}
      <span>
        {cutoverReady
          ? "Aiven path: Lovable UI -> local Aiden adapter -> Aiven Postgres + app_events"
          : "Source path: Lovable UI -> Supabase client -> Postgres / Realtime"}
      </span>
    </div>
    {posts[0] ? (
      <article className="source-hero-post">
        {posts[0].imageUrl ? <img src={posts[0].imageUrl} alt="" /> : <div className="source-hero-fallback" />}
        <div>
          <span>Visible app state</span>
          <strong>{posts[0].body}</strong>
          <p>
            {posts[0].authorHandle} - {posts[0].reactionCount} reactions
          </p>
        </div>
      </article>
    ) : null}
    <div className="source-feed">
      {posts.slice(1, 4).map((post) => (
        <article className="post-row" key={post.id}>
          <div className="avatar">{post.authorHandle.slice(1, 3).toUpperCase()}</div>
          <div>
            <strong>{post.authorHandle}</strong>
            <p>{post.body}</p>
            <span>
              <Heart aria-hidden="true" size={13} />
              {post.reactionCount} reactions
            </span>
          </div>
          {post.imageUrl ? <Image aria-hidden="true" className="post-image-icon" size={18} /> : null}
        </article>
      ))}
    </div>
    <button className="secondary-button" type="button" onClick={onReact}>
      <Send aria-hidden="true" size={15} />
      Trigger reaction
    </button>
  </section>
)
