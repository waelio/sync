/**
 * @waelio/sync — Client SDK
 *
 * Install: npm install @waelio/sync
 *
 * Use this in your own Cloudflare Workers, Node.js services, or browser apps
 * to talk to a deployed @waelio/sync endpoint.
 *
 * @example
 * // In your Worker / Node / browser
 * import { SyncClient } from '@waelio/sync'
 *
 * const sync = new SyncClient('https://your-sync-worker.workers.dev')
 *
 * const item = await sync.create({ title: 'hello', content: 'world' })
 * const all   = await sync.list()
 * await sync.delete(item.id)
 */

export interface SyncItem {
  id: string
  title: string
  content: string
  tags?: string[]
  meta?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type CreateItemInput = Pick<SyncItem, 'title' | 'content'> & {
  tags?: string[]
  meta?: Record<string, unknown>
}

export type UpdateItemInput = Partial<Pick<SyncItem, 'title' | 'content' | 'tags' | 'meta'>>

export interface SyncListResult {
  items: SyncItem[]
  total: number
  cursor?: string
}

export interface SyncClientOptions {
  /** Base URL of your deployed @waelio/sync Worker */
  baseUrl: string
  /** Optional bearer token if you enable auth on your Worker */
  token?: string
  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number
}

export class SyncError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown
  ) {
    super(message)
    this.name = 'SyncError'
  }
}

export class SyncClient {
  private readonly baseUrl: string
  private readonly headers: Record<string, string>
  private readonly timeout: number

  constructor(options: SyncClientOptions | string) {
    if (typeof options === 'string') {
      this.baseUrl = options.replace(/\/$/, '')
      this.headers = { 'Content-Type': 'application/json' }
      this.timeout = 10_000
    } else {
      this.baseUrl = options.baseUrl.replace(/\/$/, '')
      this.timeout = options.timeout ?? 10_000
      this.headers = {
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      }
    }
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeout)

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: { ...this.headers, ...(init.headers as Record<string, string> ?? {}) },
        signal: controller.signal,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new SyncError(
          `@waelio/sync: ${res.status} ${res.statusText}`,
          res.status,
          body
        )
      }

      return res.json() as Promise<T>
    } finally {
      clearTimeout(timer)
    }
  }

  /** Create a new synced item */
  async create(input: CreateItemInput): Promise<SyncItem> {
    return this.request<SyncItem>('/api/items', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }

  /** List all synced items, newest first */
  async list(opts?: { limit?: number; cursor?: string }): Promise<SyncListResult> {
    const params = new URLSearchParams()
    if (opts?.limit) params.set('limit', String(opts.limit))
    if (opts?.cursor) params.set('cursor', opts.cursor)
    const qs = params.toString()
    return this.request<SyncListResult>(`/api/items${qs ? `?${qs}` : ''}`)
  }

  /** Get a single item by ID */
  async get(id: string): Promise<SyncItem> {
    return this.request<SyncItem>(`/api/items/${encodeURIComponent(id)}`)
  }

  /** Update an existing item */
  async update(id: string, input: UpdateItemInput): Promise<SyncItem> {
    return this.request<SyncItem>(`/api/items/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    })
  }

  /** Delete an item by ID */
  async delete(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/items/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  }

  /** Health check — returns true if the Worker is reachable */
  async ping(): Promise<boolean> {
    try {
      await this.request<{ ok: boolean }>('/api/health')
      return true
    } catch {
      return false
    }
  }
}

/** Convenience factory — shorthand for `new SyncClient(url)` */
export function createSyncClient(baseUrl: string, token?: string): SyncClient {
  return new SyncClient({ baseUrl, token })
}

export default SyncClient
