import { useEffect, useRef, useState } from 'react'
import { collection, deleteDoc, doc, onSnapshot, setDoc, type DocumentData } from 'firebase/firestore'
import { db } from './firebase'

type RecordWithId = { id: string }
type Update<T> = T[] | ((old: T[]) => T[])
export const demoMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === '1'

function demoInitial(name: 'tasks' | 'matches'): Array<RecordWithId & Record<string, unknown>> {
  if (name === 'matches') return [{
    id: 'example-match',
    opponent: 'الفريق المنافس (تجريبي)',
    competition: 'مباراة تجريبية',
    venue: 'استاد الإسكندرية',
    date: '2026-12-01T19:00',
    score: ''
  }]
  return [
    { id: 'example-1', title: 'تصميم تقديم المباراة (تجريبي)', type: 'تصميم', status: 'قيد التنفيذ', owner: 'فريق التصميم', due: '2026-12-01', platform: 'Facebook', notes: 'بيانات توضيحية غير مرتبطة بمباراة حقيقية', createdAt: new Date().toISOString() },
    { id: 'example-2', title: 'متابعة أخبار الفريق (تجريبي)', type: 'خبر', status: 'مراجعة', owner: 'التحرير', due: '', platform: 'Website', notes: 'عنصر للتجربة فقط', createdAt: new Date().toISOString() },
    { id: 'example-3', title: 'فكرة ريلز تاريخ الاتحاد (تجريبي)', type: 'ريلز', status: 'فكرة', owner: 'المونتاج', due: '', platform: 'Instagram', notes: 'عنصر للتجربة فقط', createdAt: new Date().toISOString() }
  ]
}

function demoLoad<T>(name: 'tasks' | 'matches'): T[] {
  try {
    const raw = window.localStorage.getItem('itthadcrm.preview.' + name)
    return raw ? JSON.parse(raw) as T[] : demoInitial(name) as T[]
  } catch { return demoInitial(name) as T[] }
}

export function useCloudCollection<T extends RecordWithId>(name: 'tasks' | 'matches'): [T[], (action: Update<T>) => void, boolean, string] {
  const [items, setItems] = useState<T[]>(() => demoMode ? demoLoad<T>(name) : [])
  const [ready, setReady] = useState(demoMode)
  const [error, setError] = useState('')
  const current = useRef<T[]>(demoMode ? demoLoad<T>(name) : [])
  const pending = useRef(new Set<string>())

  useEffect(() => {
    if (demoMode || !db) return
    const database = db
    return onSnapshot(collection(database, 'workspaces', 'itthadcrm', name), snapshot => {
      const next = snapshot.docs.map(d => ({ ...d.data(), id: d.id }) as T)
      const merged = next.filter(x => !pending.current.has(x.id))
      for (const x of current.current) if (pending.current.has(x.id)) merged.push(x)
      current.current = merged
      setItems(merged)
      setReady(true)
      setError('')
    }, err => { setReady(true); setError(err.message) })
  }, [name])

  const update = (action: Update<T>) => {
    if (!ready || error) return
    const before = current.current
    const after = typeof action === 'function' ? action(before) : action
    if (demoMode) {
      current.current = after
      setItems(after)
      try { window.localStorage.setItem('itthadcrm.preview.' + name, JSON.stringify(after)) }
      catch { setError('تعذّر حفظ التعديلات التجريبية في المتصفح') }
      return
    }
    if (!db) return
    const database = db
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
