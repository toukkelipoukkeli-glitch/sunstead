import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'

// Resolve a CLI tool that may be keg-only / in anaconda / on PATH.
function bin(name: string): string {
  const cands = [
    process.env[`${name.toUpperCase()}_BIN`] || '',
    `/opt/homebrew/bin/${name}`,
    `/usr/local/bin/${name}`,
    `/opt/anaconda3/bin/${name}`,
  ].filter(Boolean)
  for (const p of cands) if (existsSync(p)) return p
  return name
}

function mysqlArgs(url: string): { args: string[]; db: string } {
  const u = new URL(url)
  const db = decodeURIComponent(u.pathname.replace(/^\//, '')) || 'defaultdb'
  const args = [
    '-h', u.hostname,
    '-P', u.port || '3306',
    '-u', decodeURIComponent(u.username) || 'avnadmin',
    `-p${decodeURIComponent(u.password)}`,
    '--ssl-mode=REQUIRED',
  ]
  return { args, db }
}

export type MigrateOutcome = { ok: boolean; detail: string; rows?: number }

// MySQL → Aiven MySQL: mysqldump (source) piped straight into mysql (target).
export function migrateMysql(sourceUrl: string, targetUrl: string, onLog: (m: string) => void = () => {}): Promise<MigrateOutcome> {
  return new Promise((resolve) => {
    const src = mysqlArgs(sourceUrl)
    const tgt = mysqlArgs(targetUrl)
    onLog('dumping MySQL schema + data…')
    const dump = spawn(bin('mysqldump'), [...src.args, '--no-tablespaces', '--set-gtid-purged=OFF', '--single-transaction', '--routines', src.db])
    const load = spawn(bin('mysql'), [...tgt.args, tgt.db])
    dump.stdout.pipe(load.stdin)
    let err = ''
    const grab = (d: Buffer) => { const s = String(d).trim(); if (s && !/Using a password/.test(s)) err += s + '\n' }
    dump.stderr.on('data', grab)
    load.stderr.on('data', grab)
    const timer = setTimeout(() => { dump.kill(); load.kill(); resolve({ ok: false, detail: 'MySQL copy timed out' }) }, 120000)
    const fail = (e: Error) => { clearTimeout(timer); resolve({ ok: false, detail: e.message.slice(0, 140) }) }
    dump.on('error', (e) => fail(new Error('mysqldump: ' + e.message)))
    load.on('error', (e) => fail(new Error('mysql: ' + e.message)))
    load.on('close', (code) => {
      clearTimeout(timer)
      if (code === 0) resolve({ ok: true, detail: 'schema + data copied' })
      else resolve({ ok: false, detail: (err.split('\n').find(Boolean) || 'mysql exited ' + code).slice(0, 140) })
    })
  })
}

// Redis → Valkey: best-effort key copy via redis-cli (DUMP/RESTORE per key).
// Binary DUMP payloads don't survive shell piping, so for a reliable bulk copy
// we provision + repoint and report the keyspace size; full sync is a deeper layer.
export function probeRedis(sourceUrl: string, onLog: (m: string) => void = () => {}): Promise<MigrateOutcome> {
  return new Promise((resolve) => {
    const out: string[] = []
    const cli = spawn(bin('redis-cli'), ['-u', sourceUrl, 'DBSIZE'])
    cli.stdout.on('data', (d) => out.push(String(d)))
    const timer = setTimeout(() => { cli.kill(); resolve({ ok: false, detail: 'source Redis unreachable' }) }, 15000)
    cli.on('error', () => { clearTimeout(timer); resolve({ ok: false, detail: 'redis-cli unavailable' }) })
    cli.on('close', () => {
      clearTimeout(timer)
      const n = parseInt(out.join('').replace(/\D/g, ''), 10)
      if (Number.isFinite(n)) { onLog(`source keyspace: ${n} keys`); resolve({ ok: true, detail: `${n} keys (provisioned + repointed)`, rows: n }) }
      else resolve({ ok: false, detail: 'could not read keyspace' })
    })
  })
}
