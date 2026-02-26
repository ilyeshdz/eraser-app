import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

interface ModelCacheDB extends DBSchema {
  models: {
    key: string
    value: {
      id: string
      modelId: string
      data: Blob
      timestamp: number
    }
  }
}

const DB_NAME = 'eraser-model-cache'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<ModelCacheDB>> | null = null

async function getDB(): Promise<IDBPDatabase<ModelCacheDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ModelCacheDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('models')) {
          db.createObjectStore('models', { keyPath: 'id' })
        }
      }
    })
  }
  return dbPromise
}

export async function getCachedModel(modelId: string): Promise<Blob | null> {
  try {
    const db = await getDB()
    const cached = await db.get('models', modelId)
    if (cached && cached.modelId === modelId) {
      const now = Date.now()
      const maxAge = 7 * 24 * 60 * 60 * 1000
      if (now - cached.timestamp < maxAge) {
        return cached.data
      }
    }
    return null
  } catch {
    return null
  }
}

export async function setCachedModel(modelId: string, data: Blob): Promise<void> {
  try {
    const db = await getDB()
    await db.put('models', {
      id: modelId,
      modelId,
      data,
      timestamp: Date.now()
    })
  } catch (error) {
    console.warn('Failed to cache model:', error)
  }
}

export async function clearModelCache(): Promise<void> {
  try {
    const db = await getDB()
    await db.clear('models')
  } catch (error) {
    console.warn('Failed to clear model cache:', error)
  }
}
