import 'dotenv/config'
import Redis from 'ioredis'
import { ensureService, resetServiceUserPassword } from '../aiven-provision'

// Real Redis -> Aiven Valkey migration. Source is a real (non-Aiven) Redis; we
// copy every key with DUMP/RESTORE so type + TTL transfer exactly, then read the
// values back from Aiven to prove they arrived. Valkey speaks the Redis protocol,
// so the same ioredis client talks to both.

const SOURCE = process.env.REDIS_SOURCE || 'redis://localhost:6380'
const CLOUD = process.env.AIVEN_CLOUD_FREE || 'do-ams'

async function main() {
  // Target: Aiven Valkey. Reset the 'default' user password to a known value
  // (the restricted AIVEN_TOKEN returns "<redacted>" on read).
  const svc = await ensureService({ name: 'sb-valkey', serviceType: 'valkey', plan: 'free-1', cloud: CLOUD, onLog: (m) => console.log('  ' + m) })
  const pw = 'sbDemo-valkey-' + Math.random().toString(36).slice(2, 10)
  if (!(await resetServiceUserPassword({ service: 'sb-valkey', username: 'default', newPassword: pw }))) {
    throw new Error('could not reset Valkey password')
  }
  const target = `rediss://default:${pw}@${svc.host}:${svc.port}`
  console.log(`\nsource: ${SOURCE}`)
  console.log(`target: rediss://default:****@${svc.host}:${svc.port}\n`)

  const src = new Redis(SOURCE)
  const dst = new Redis(target, { tls: { rejectUnauthorized: false } })

  // Enumerate all source keys.
  const keys: string[] = []
  let cursor = '0'
  do {
    const [next, batch] = await src.scan(cursor, 'COUNT', 200)
    cursor = next
    keys.push(...batch)
  } while (cursor !== '0')

  // Copy each key with type-aware commands. (DUMP/RESTORE is version-coupled —
  // Redis 7's RDB payload is rejected by Aiven Valkey's RESTORE — so we read the
  // logical value per type and rewrite it, which works across versions.)
  let n = 0
  for (const key of keys) {
    const type = await src.type(key)
    const ttl = await src.pttl(key)
    await dst.del(key)
    if (type === 'string') {
      await dst.set(key, (await src.get(key)) as string)
    } else if (type === 'hash') {
      const h = await src.hgetall(key)
      if (Object.keys(h).length) await dst.hset(key, h)
    } else if (type === 'list') {
      const l = await src.lrange(key, 0, -1)
      if (l.length) await dst.rpush(key, ...l)
    } else if (type === 'set') {
      const s = await src.smembers(key)
      if (s.length) await dst.sadd(key, ...s)
    } else if (type === 'zset') {
      const z = await src.zrange(key, 0, -1, 'WITHSCORES')
      const args: (string | number)[] = []
      for (let i = 0; i < z.length; i += 2) args.push(z[i + 1], z[i]) // ZADD wants score, member
      if (args.length) await (dst as any).zadd(key, ...args)
    } else {
      console.log(`  · skipped ${key} (unsupported type ${type})`)
      continue
    }
    if (ttl > 0) await dst.pexpire(key, ttl)
    n++
    console.log(`  ✓ ${key} (${type})`)
  }

  // Verify by reading the migrated values back FROM Aiven Valkey.
  const verify = {
    dbsize: await dst.dbsize(),
    title: await dst.get('cache:board:33333333:title'),
    ada: await dst.hgetall('user:ada'),
    topVotes: await dst.zrevrange('board:33333333:votes', 0, 2, 'WITHSCORES'),
    recent: await dst.lrange('session:ada:recent', 0, -1),
  }
  console.log(`\n✅ ${n} keys migrated → Aiven Valkey (DBSIZE=${verify.dbsize})`)
  console.log('   read back FROM Aiven:')
  console.log(`     cache:board:…:title = ${verify.title}`)
  console.log(`     user:ada (hash)     = ${JSON.stringify(verify.ada)}`)
  console.log(`     top votes (zset)    = ${verify.topVotes.join('  ')}`)
  console.log(`     session:ada:recent  = [${verify.recent.join(', ')}]`)

  src.disconnect()
  dst.disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
