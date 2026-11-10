import { useEffect, useRef, useState } from 'react'
import { collection, deleteDoc, doc, onSnapshot, setDoc, type DocumentData } from 'firebase/firestore'
import { db } from './firebase'

type RecordWithId = { id: string }
type Update<T> = T[] | ((old: T[]) => T[])

export function useCloudCollection<T extends RecordWithId>(name: 'tasks' | 'matches'): [T[], (action: Update<T>) => void, boolean, string] {
  const [items, setItems] = useState<T[]>([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const current = useRef<T[]>([])
  const pending = useRef(new Set<string>())
  useEffect(() => {
    if (!db) return
    const database = db
    return onSnapshot(collection(database, 'workspaces', 'itthadcrm', name), snapshot => {
      const next = snapshot.docs.map(d => ({ ...d.data(), id: d.id }) as T)
      // Local changes are optimistic; ignore server echoes only for pending records.
      const merged = next.filter(x => !pending.current.has(x.id))
      for (const x of current.current) if (pending.current.has(x.id)) merged.push(x)
      current.current = merged
      setItems(merged)
      setReady(true)
      setError('')
    }, err => { setReady(true); setError(err.message) })
  }, [name])

  const update = (action: Update<T>) => {
    if (!db || !ready || error) return
    const database = db
    const before = current.current
    const after = typeof action === 'function' ? action(before) : action
    current.current = after
    setItems(after)
    const original = new Map(before.map(x => [x.id, x]))
    const next = new Map(after.map(x => [x.id, x]))
    for (const item of after) {
      if (JSON.stringify(item) === JSON.stringify(original.get(item.id))) continue
      pending.current.add(item.id)
      const { id, ...data } = item
      void setDoc(doc(database, 'workspaces', 'itthadcrm', name, id), data as DocumentData)
        .catch(err => setError(err.message))
        .finally(() => pending.current.delete(id))
    }
    for (const item of before) {
      if (next.has(item.id)) continue
      pending.current.add(item.id)
      void deleteDoc(doc(database, 'workspaces', 'itthadcrm', name, item.id))
        .catch(err => setError(err.message))
        .finally(() => pending.current.delete(item.id))
    }
  }
  return [items, update, ready, error]
}
