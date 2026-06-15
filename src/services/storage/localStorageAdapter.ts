function storage() {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export const localStorageAdapter = {
  getItem(key: string) {
    return storage()?.getItem(key) ?? null
  },

  setItem(key: string, value: string) {
    try {
      storage()?.setItem(key, value)
    } catch {
      // Local persistence is best-effort.
    }
  },

  removeItem(key: string) {
    try {
      storage()?.removeItem(key)
    } catch {
      // Local persistence is best-effort.
    }
  },

  getJson<T>(key: string) {
    const stored = this.getItem(key)
    if (!stored) return null

    try {
      return JSON.parse(stored) as T
    } catch {
      return null
    }
  },

  setJson<T>(key: string, value: T) {
    this.setItem(key, JSON.stringify(value))
  },
}
