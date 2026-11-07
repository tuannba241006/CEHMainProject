import { useCallback, useEffect, useState } from "react"
import { getApiErrorMessage } from "../api/errors"

interface Remote<T> {
  list: () => Promise<{ data: unknown[] }>
  create?: (item: Omit<T, never>) => Promise<unknown>
  update?: (id: number, item: T) => Promise<unknown>
  remove?: (id: number) => Promise<unknown>
}

/**
 * useCollection: Quản lý collection dữ liệu tự động đồng bộ hóa với Service Layer
 * và lưu trữ bộ đệm cục bộ (sống sót qua F5 làm mới trình duyệt).
 */
export function useCollection<T extends object>(
  key: string,
  seed: T[],
  idKey: keyof T & string,
  remote: Remote<T>,
) {
  const [items, setItems] = useState<T[]>(() => {
    try {
      const raw = localStorage.getItem(`ceh_demo_${key}`)
      if (raw) return JSON.parse(raw) as T[]
    } catch {
      /* ignore */
    }
    return seed
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await remote.list()
      if (res && Array.isArray(res.data) && res.data.length > 0) {
        setItems(res.data as T[])
      }
    } catch (e) {
      setError(getApiErrorMessage(e))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    try {
      localStorage.setItem(`ceh_demo_${key}`, JSON.stringify(items))
    } catch {
      /* ignore */
    }
  }, [items, key])

  const save = async (item: T, isNew: boolean) => {
    const id = item[idKey] as number
    if (isNew) {
      if (remote.create) {
        await remote.create(item)
      } else {
        const next = Math.max(0, ...items.map((i) => Number(i[idKey]))) + 1
        setItems((prev) => [...prev, { ...item, [idKey]: next }])
      }
    } else {
      if (remote.update) {
        await remote.update(id, item)
      } else {
        setItems((prev) => prev.map((i) => (i[idKey] === item[idKey] ? item : i)))
      }
    }
    await reload()
  }

  const remove = async (id: number) => {
    if (remote.remove) {
      await remote.remove(id)
    } else {
      setItems((prev) => prev.filter((i) => Number(i[idKey]) !== id))
    }
    await reload()
  }

  return { items, loading, error, reload, save, remove }
}
