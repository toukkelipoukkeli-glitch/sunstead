import type { AivenReceipt } from "@aiden/contracts"
import { ModeBadge } from "./ModeBadge"

export const ReceiptStream = ({ receipts }: { receipts: AivenReceipt[] }) => (
  <section className="panel receipt-panel">
    <div className="panel-header">
      <div>
        <p className="eyebrow">MCP receipts</p>
        <h2>Audit receipts</h2>
      </div>
      <span className="path-chip">risk + rollback</span>
    </div>
    <div className="receipt-list">
      {receipts.map((receipt) => (
        <article className="receipt-row" key={receipt.id}>
          <div>
            <strong>{receipt.tool}</strong>
            <p>{receipt.intent}</p>
            <span>{receipt.target}</span>
          </div>
          <div className="receipt-meta">
            <ModeBadge source={receipt.source} />
            <small>{receipt.risk}</small>
          </div>
        </article>
      ))}
    </div>
  </section>
)
