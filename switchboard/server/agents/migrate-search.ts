import 'dotenv/config'
import { ensureService, resetServiceUserPassword } from '../aiven-provision'

// Real Elasticsearch -> Aiven OpenSearch migration. OpenSearch is ES-API
// compatible, so we read all docs from the source index and bulk-index them into
// Aiven over HTTPS, then read them back from Aiven to prove the move.

const SOURCE = process.env.ES_SOURCE || 'http://localhost:9201'
const INDEX = process.env.ES_INDEX || 'catalog'
const CLOUD = process.env.AIVEN_CLOUD_FREE || 'do-ams'

async function main() {
  const svc = await ensureService({ name: 'sb-opensearch', serviceType: 'opensearch', plan: 'free-4-20', cloud: CLOUD, onLog: (m) => console.log('  ' + m) })
  const pw = 'sbDemo-os-' + Math.random().toString(36).slice(2, 10)
  if (!(await resetServiceUserPassword({ service: 'sb-opensearch', username: 'avnadmin', newPassword: pw }))) {
    throw new Error('could not reset OpenSearch password')
  }
  await new Promise((r) => setTimeout(r, 7000)) // the credential reset takes a few seconds to apply on the node
  const base = `https://${svc.host}:${svc.port}`
  const auth = 'Basic ' + Buffer.from(`avnadmin:${pw}`).toString('base64')
  console.log(`\nsource: ${SOURCE}/${INDEX}`)
  console.log(`target: ${base}/${INDEX}\n`)

  // Read every doc from the source ES index.
  const sres: any = await fetch(`${SOURCE}/${INDEX}/_search?size=10000`).then((r) => r.json())
  const hits: any[] = sres.hits?.hits || []
  console.log(`  ${hits.length} docs read from source Elasticsearch`)

  // Bulk-index into Aiven OpenSearch.
  const bulk = hits.flatMap((h) => [JSON.stringify({ index: { _index: INDEX, _id: h._id } }), JSON.stringify(h._source)]).join('\n') + '\n'
  const bres: any = await fetch(`${base}/_bulk`, { method: 'POST', headers: { authorization: auth, 'content-type': 'application/x-ndjson' }, body: bulk }).then((r) => r.json())
  console.log(`  bulk indexed into Aiven (errors=${bres.errors})`)
  await fetch(`${base}/${INDEX}/_refresh`, { method: 'POST', headers: { authorization: auth } })

  // Verify by reading back FROM Aiven OpenSearch.
  const cnt: any = await fetch(`${base}/${INDEX}/_count`, { headers: { authorization: auth } }).then((r) => r.json())
  const swag: any = await fetch(`${base}/${INDEX}/_search?q=category:swag`, { headers: { authorization: auth } }).then((r) => r.json())
  console.log(`\n✅ Aiven OpenSearch "${INDEX}" count=${cnt.count}`)
  console.log(`   read back FROM Aiven (q=category:swag): ${(swag.hits?.hits || []).map((h: any) => h._source.name).join(', ')}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
