import type { AivenReceipt } from "@aiden/contracts"
import { ModeBadge } from "./ModeBadge"

const controlPlaneLabel = (receipt: AivenReceipt) => {
  const controlPlane = receipt.details?.controlPlane
  if (controlPlane === "direct_aiven_fallback") return "direct fallback"
  if (typeof controlPlane === "string") return controlPlane.replaceAll("_", " ")
  return "receipt"
}

const targetLabel = (target: string) => target.replaceAll("demo_users", "users")

export const ReceiptStream = ({ receipts }: { receipts: AivenReceipt[] }) => (
  <section className="panel receipt-panel">
    <div className="panel-header">
      <div>
        <p className="eyebrow">Aiven receipts</p>
        <h2>Action receipts</h2>
      </div>
      <span className="path-chip">MCP config / direct fallback</span>
    </div>
    <div className="receipt-list">
      {receipts.map((receipt) => (
        <article className="receipt-row" key={receipt.id}>
          <div>
            <strong>{receipt.tool}</strong>
            <p>{receipt.intent}</p>
            <span>{targetLabel(receipt.target)}</span>
          </div>
          <div className="receipt-meta">
            <ModeBadge source={receipt.source} />
            <small>{controlPlaneLabel(receipt)}</small>
            <small>{receipt.risk}</small>
          </div>
        </article>
      ))}
    </div>
  </section>
)
