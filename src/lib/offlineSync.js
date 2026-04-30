/**
 * Offline-First Sync Engine
 * - Detects network status changes in real-time
 * - Queues failed mutation requests (POST/PUT/PATCH/DELETE) to IndexedDB
 * - Auto-replays queue in FIFO order when connection restores
 * - Exposes reactive state for UI indicators
 */

const DB_NAME = 'restroai_offline'
const STORE_NAME = 'sync_queue'
const DB_VERSION = 1

class OfflineSyncEngine {
  constructor() {
    this.db = null
    this.isOnline = navigator.onLine
    this.isSyncing = false
    this.pendingCount = 0
    this.listeners = new Set()
    this._init()
  }

  // ── IndexedDB Setup ──
  async _init() {
    try {
      this.db = await new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION)
        req.onupgradeneeded = (e) => {
          const db = e.target.result
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
          }
        }
        req.onsuccess = (e) => resolve(e.target.result)
        req.onerror = (e) => reject(e.target.error)
      })
      await this._refreshCount()
    } catch (err) {
      console.warn('[OfflineSync] IndexedDB unavailable, falling back to localStorage', err)
    }

    window.addEventListener('online', () => {
      this.isOnline = true
      this._notify()
      console.log('🟢 Network restored — starting sync...')
      this.flush()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this._notify()
      console.log('🔴 Network lost — requests will be queued')
    })
  }

  // ── Queue a failed request ──
  async enqueue(config) {
    const entry = {
      method: config.method,
      url: config.url,
      data: config.data || null,
      headers: { 'Content-Type': config.headers?.['Content-Type'] || 'application/json' },
      timestamp: Date.now(),
      retries: 0
    }

    if (this.db) {
      await new Promise((resolve, reject) => {
        const tx = this.db.transaction(STORE_NAME, 'readwrite')
        tx.objectStore(STORE_NAME).add(entry)
        tx.oncomplete = resolve
        tx.onerror = (e) => reject(e.target.error)
      })
    } else {
      // localStorage fallback
      const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]')
      queue.push(entry)
      localStorage.setItem('offline_queue', JSON.stringify(queue))
    }

    await this._refreshCount()
    this._notify()
    console.log(`📦 Queued offline: ${entry.method.toUpperCase()} ${entry.url}`)
  }

  // ── Get all queued items ──
  async getQueue() {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction(STORE_NAME, 'readonly')
        const req = tx.objectStore(STORE_NAME).getAll()
        req.onsuccess = () => resolve(req.result || [])
        req.onerror = (e) => reject(e.target.error)
      })
    }
    return JSON.parse(localStorage.getItem('offline_queue') || '[]')
  }

  // ── Remove a synced item ──
  async _remove(id) {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction(STORE_NAME, 'readwrite')
        tx.objectStore(STORE_NAME).delete(id)
        tx.oncomplete = resolve
        tx.onerror = (e) => reject(e.target.error)
      })
    }
    const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]')
    localStorage.setItem('offline_queue', JSON.stringify(queue.filter(q => q.id !== id)))
  }

  // ── Flush queue when online ──
  async flush() {
    if (!this.isOnline || this.isSyncing) return
    this.isSyncing = true
    this._notify()

    const queue = await this.getQueue()
    if (queue.length === 0) {
      this.isSyncing = false
      this._notify()
      return
    }

    console.log(`🔄 Syncing ${queue.length} queued request(s)...`)
    const token = localStorage.getItem('token')
    let synced = 0

    for (const item of queue) {
      try {
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
        const url = item.url.startsWith('http') ? item.url : `${baseURL}${item.url}`

        await fetch(url, {
          method: item.method.toUpperCase(),
          headers: {
            ...item.headers,
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: item.data ? JSON.stringify(item.data) : undefined
        })

        await this._remove(item.id)
        synced++
      } catch (err) {
        console.warn(`⚠️ Sync failed for ${item.method} ${item.url}:`, err.message)
        // If still offline, stop trying
        if (!navigator.onLine) break
      }
    }

    console.log(`✅ Synced ${synced}/${queue.length} requests`)
    this.isSyncing = false
    await this._refreshCount()
    this._notify()
  }

  // ── State helpers ──
  async _refreshCount() {
    const queue = await this.getQueue()
    this.pendingCount = queue.length
  }

  getState() {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: this.pendingCount
    }
  }

  // ── Reactive subscription ──
  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  _notify() {
    const state = this.getState()
    this.listeners.forEach(fn => fn(state))
  }

  // ── Should this request be queued if it fails? ──
  shouldQueue(config) {
    return ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())
  }
}

const offlineSync = new OfflineSyncEngine()
export default offlineSync
