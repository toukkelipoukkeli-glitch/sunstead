import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { z } from 'zod'
import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod'

// Custom in-process tools the scout agents use to read the source Lovable repo.
// Sandboxed to SOURCE_REPO so an agent can't wander the filesystem.

const ROOT = resolve(process.env.SOURCE_REPO || '/tmp/live-hype-wall')
const IGNORE = new Set(['node_modules', '.git', 'dist', 'build', '.next'])

function safe(p: string): string {
  const abs = resolve(ROOT, p)
  if (!abs.startsWith(ROOT)) throw new Error('path escapes the source repo')
  return abs
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (IGNORE.has(name)) continue
    const abs = join(dir, name)
    const st = statSync(abs)
    if (st.isDirectory()) walk(abs, acc)
    else acc.push(relative(ROOT, abs))
  }
  return acc
}

export const listFiles = betaZodTool({
  name: 'list_files',
  description: 'List every file path in the source repo (relative). Optionally filter by a substring.',
  inputSchema: z.object({ contains: z.string().optional().describe('only paths containing this substring') }),
  run: ({ contains }) => {
    const all = walk(ROOT)
    const hits = contains ? all.filter((f) => f.includes(contains)) : all
    return hits.slice(0, 800).join('\n')
  },
})

export const readFile = betaZodTool({
  name: 'read_file',
  description: 'Read a file from the source repo by relative path. Returns up to ~24k chars.',
  inputSchema: z.object({ path: z.string() }),
  run: ({ path }) => {
    try {
      return readFileSync(safe(path), 'utf8').slice(0, 24000)
    } catch (e) {
      return `ERROR: ${(e as Error).message}`
    }
  },
})

export const grep = betaZodTool({
  name: 'grep',
  description: 'Regex-search the source repo. Returns matching `path:line: text` (max 120).',
  inputSchema: z.object({ pattern: z.string(), glob: z.string().optional().describe('limit to paths containing this') }),
  run: ({ pattern, glob }) => {
    let re: RegExp
    try {
      re = new RegExp(pattern, 'i')
    } catch {
      return 'ERROR: invalid regex'
    }
    const out: string[] = []
    for (const f of walk(ROOT)) {
      if (glob && !f.includes(glob)) continue
      let text: string
      try {
        text = readFileSync(join(ROOT, f), 'utf8')
      } catch {
        continue
      }
      text.split('\n').forEach((line, i) => {
        if (out.length < 120 && re.test(line)) out.push(`${f}:${i + 1}: ${line.trim().slice(0, 200)}`)
      })
    }
    return out.join('\n') || '(no matches)'
  },
})

export const repoTools = [listFiles, readFile, grep]
