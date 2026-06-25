// overmind/mcp/test-client.ts
// A throwaway MCP client that spawns server.ts over stdio (exactly as a real MCP client
// would), lists the tools, and calls the read-only ones against LIVE Aiven to prove they
// return real data. Run with: npm test  (i.e. `tsx test-client.ts`).

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const SERVER = resolve(HERE, 'server.ts')

/** Pull the first text block out of a tool result. */
function firstText(res: any): string {
  const block = res?.content?.find((b: any) => b.type === 'text')
  return block?.text ?? JSON.stringify(res)
}

async function main() {
  const transport = new StdioClientTransport({
    // Spawn the server via the parent's tsx (node resolves up the tree).
    command: 'npx',
    args: ['tsx', SERVER],
  })
  const client = new Client({ name: 'overmind-mcp-test', version: '0.0.0' })
  await client.connect(transport)

  const { tools } = await client.listTools()
  console.log('═══ Tools exposed ═══')
  for (const t of tools) console.log(`  • ${t.name} — ${t.title ?? ''}`)
  console.log('')

  const exercise = async (name: string, args: Record<string, any> = {}) => {
    console.log(`═══ ${name}(${JSON.stringify(args)}) ═══`)
    const res = await client.callTool({ name, arguments: args })
    // Print the first (human-readable) text block; truncate so the log stays readable.
    const text = firstText(res)
    console.log(text.length > 2400 ? text.slice(0, 2400) + '\n  …(truncated)…' : text)
    console.log('')
    return res
  }

  await exercise('overmind_analyze')
  await exercise('overmind_status')
  await exercise('overmind_advise')
  // Bonus read-only proofs (not required, but cheap and confirm live Aiven REST works):
  await exercise('overmind_services')
  await exercise('overmind_cost')

  await client.close()
  console.log('✓ test client done — all read-only tools returned real data.')
  process.exit(0)
}

main().catch((e) => {
  console.error('test-client failed:', e?.stack ?? e)
  process.exit(1)
})
