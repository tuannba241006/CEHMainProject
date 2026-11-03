import { useCallback, useEffect, useState } from "react"
import { isApiMode } from "../api/config"
import { getApiErrorMessage } from "../api/errors"

interface Remote<T> {
  list: () => Promise<{ data: unknown[] }>
  create?: (item: Omit<T, never>) => Promise<unknown>
  update?: (id: number, item: T) => Promise<unknown>
  remove?: (id: number) => Promise<unknown>
}

/**
 * Demo Mode: lưu bộ sưu tập vào localStorage (sống sót qua refresh).
 * API Mode: tải từ backend, chỉ cập nhật UI sau khi backend phản hồi thành công.
 */
export function useCollection<T extends object>(
  key: string,
  seed: T[],
  idKey: keyof T & string,
  remote: Remote<T>,
) {
  const [items, setItems] = useState<T[]>(() => {
    if (isApiMode()) return []
    try {
      const raw = localStorage.getItem(`ceh_demo_${key}`)
      if (raw) return JSON.parse(raw) as T[]
    } catch {
      /* ignore */
    }
    return seed
  })
  const [loading, setLoading] = useState(isApiMode())
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!isApiMode()) return
    setLoading(true)
    setError(null)
    try {
      const res = await remote.list()
      setItems(res.data as T[])
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
    if (!isApiMode()) localStorage.setItem(`ceh_demo_${key}`, JSON.stringify(items))
  }, [items, key])

  const save = async (item: T, isNew: boolean) => {
    if (isApiMode()) {
      const id = item[idKey] as number
      if (isNew) {
        if (!remote.create) throw new Error("Backend chưa hỗ trợ tạo dữ liệu cho chức năng này.")
        await remote.create(item)
      } else {
        if (!remote.update) throw new Error("Backend chưa hỗ trợ cập nhật dữ liệu cho chức năng này.")
        await remote.update(id, item)
      }
      await reload()
      return
    }
    if (isNew) {
      const next = Math.max(0, ...items.map((i) => Number(i[idKey]))) + 1
      setItems((prev) => [...prev, { ...item, [idKey]: next }])
    } else {
      setItems((prev) => prev.map((i) => (i[idKey] === item[idKey] ? item : i)))
    }
  }

  const remove = async (id: number) => {
    if (isApiMode()) {
      if (!remote.remove) throw new Error("Backend chưa hỗ trợ xóa dữ liệu cho chức năng này.")
      await remote.remove(id)
      await reload()
      return
    }
    setItems((prev) => prev.filter((i) => Number(i[idKey]) !== id))
  }

  return { items, loading, error, reload, save, remove }
}
