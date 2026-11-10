import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db, firebaseConfigured, projectConflict } from './lib/firebase'
import App from './App'

type Staff = { role: string; active: boolean; email?: string }
export default function AuthGate() {
  const [user, setUser] = useState<User | null>(null)
  const [staff, setStaff] = useState<Staff | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  useEffect(() => {
    if (!auth) { setLoading(false); return }
    return onAuthStateChanged(auth, u => {
      setUser(u)
      setStaff(null)
      setChecking(Boolean(u))
      setLoading(false)
    }, err => { setError(err.message); setLoading(false) })
  }, [])
  useEffect(() => {
    if (!user || !db) return
    return onSnapshot(doc(db, 'staff', user.uid), snap => {
      setStaff(snap.exists() ? snap.data() as Staff : null)
      setChecking(false)
    }, err => { setError(err.message); setChecking(false) })
  }, [user])
  if (!firebaseConfigured) return <div className="auth-screen"><div className="auth-card"><div className="brand-mark">IT</div><h1>استوديو الاتحاد</h1><p>{projectConflict ? 'تم رفض إعدادات Firebase لأنها تخص مشروعًا آخر. أنشئ Firebase مستقل للاستوديو ولا تستخدم بيانات القناة أو البورتفوليو.' : 'لسه مطلوب إعداد Firebase مستقل للمشروع.'} انسخ <code>.env.example</code> إلى <code>.env.local</code> وأضف إعدادات تطبيق الويب الخاصة بالقناة، ثم شغّل المشروع.</p><span>بيانات اعتماد السيرفر لا تُحفظ داخل كود الواجهة.</span></div></div>
  if (loading || checking) return <div className="auth-screen"><div className="auth-card">جارٍ التحقق من الحساب...</div></div>
  if (user && !staff?.active) return <div className="auth-screen"><div className="auth-card"><h2>الحساب غير مُصرح له</h2><p>يجب إضافة مستند <code>staff/{user.uid}</code> في Firestore بواسطة مسؤول النظام وتحديد <code>active: true</code> و <code>role: "admin"</code> للمسؤول الأول.</p><p>معرّف المستخدم: <code>{user.uid}</code></p><button className="secondary-btn" onClick={() => auth && signOut(auth)}>تسجيل الخروج</button></div></div>
  if (user && staff?.active) return <><div className="session-bar"><span>متصل: {user.email} • {staff.role}</span><button onClick={() => auth && signOut(auth)}>تسجيل الخروج</button></div><App key={user.uid}/></>
  return <div className="auth-screen"><form className="auth-card" onSubmit={async e => { e.preventDefault(); if (!auth) return; setError(''); try { await signInWithEmailAndPassword(auth, email.trim(), password) } catch { setError('تعذر تسجيل الدخول. راجع البريد وكلمة المرور وتفعيل طريقة Email/Password.') } }}><div className="brand-mark">IT</div><span className="eyebrow">ITTHAD CONTENT STUDIO</span><h1>تسجيل الدخول</h1><p>بوابة إدارة قناة الاتحاد السكندري</p><label>البريد الإلكتروني<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)}/></label><label>كلمة المرور<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)}/></label>{error && <p role="alert" className="auth-error">{error}</p>}<button type="submit" className="primary-btn">دخول الاستوديو</button></form></div>
}
