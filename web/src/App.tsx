import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiUrl } from './api'
import './index.css'

type Nature = 'DEBIT' | 'CREDIT'
type Level = 'CLASS' | 'GROUP' | 'ACCOUNT' | 'SUBACCOUNT'
type AccountNode = { code: string; name: string; nature: Nature; level: Level; parentCode: string | null; allowsMovements: boolean; children: AccountNode[] }
type Form = { code: string; name: string; nature: Nature }
type ApiError = { message?: string | string[] }
const levelLabel: Record<Level, string> = { CLASS: 'Clase', GROUP: 'Grupo', ACCOUNT: 'Cuenta', SUBACCOUNT: 'Subcuenta' }
const natureLabel: Record<Nature, string> = { DEBIT: 'Débito', CREDIT: 'Crédito' }

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response
  try { response = await fetch(apiUrl(path), options) }
  catch { throw new Error('No se pudo conectar con la API. Verifica que NestJS esté ejecutándose.') }
  if (!response.ok) {
    const payload: ApiError = await response.json().catch(() => ({}))
    throw new Error(Array.isArray(payload.message) ? payload.message.join(', ') : payload.message || `Error HTTP ${response.status}`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

function countNodes(nodes: AccountNode[]): number { return nodes.reduce((total, node) => total + 1 + countNodes(node.children), 0) }
function filterTree(nodes: AccountNode[], query: string): AccountNode[] {
  if (!query.trim()) return nodes
  const term = query.trim().toLocaleLowerCase()
  return nodes.flatMap(node => {
    const children = filterTree(node.children, term)
    return node.code.includes(term) || node.name.toLocaleLowerCase().includes(term) || children.length
      ? [{ ...node, children }] : []
  })
}

function App() {
  const [accounts, setAccounts] = useState<AccountNode[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [form, setForm] = useState<Form>({ code: '', name: '', nature: 'DEBIT' })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true); setLoadError('')
    try { setAccounts(await request<AccountNode[]>('/accounts/tree')) }
    catch (error) { setLoadError((error as Error).message) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void refresh() }, [refresh])

  const filtered = useMemo(() => filterTree(accounts, query), [accounts, query])
  const isClass = form.code.length === 1
  const nextLength = (length: number) => length === 1 ? 2 : length === 2 ? 4 : length === 4 ? 6 : 0
  function validate(): Record<string, string> {
    const errors: Record<string, string> = {}
    if (!/^\d+$/.test(form.code) || ![1, 2, 4, 6].includes(form.code.length)) errors.code = 'El código debe contener 1, 2, 4 o 6 dígitos numéricos.'
    if (!form.name.trim()) errors.name = 'El nombre es obligatorio.'
    return errors
  }
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFormError(''); setNotice('')
    const errors = validate(); setFieldErrors(errors)
    if (Object.keys(errors).length) return
    setBusy(true)
    try {
      await request('/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: form.code, name: form.name.trim(), ...(isClass ? { nature: form.nature } : {}) }) })
      setExpanded(prev => new Set([...prev, ...[form.code.slice(0, 1), form.code.slice(0, 2), form.code.slice(0, 4)]]))
      setForm({ code: '', name: '', nature: 'DEBIT' }); setFieldErrors({}); setNotice('Cuenta creada correctamente.')
      await refresh()
    } catch (error) {
      const message = (error as Error).message
      if (/code|código|already exists|duplicate/i.test(message)) setFieldErrors({ code: message })
      else if (/parent|padre/i.test(message)) setFieldErrors({ code: message })
      else if (/name|nombre/i.test(message)) setFieldErrors({ name: message })
      else if (/nature|naturaleza/i.test(message)) setFieldErrors({ nature: message })
      else setFormError(message)
    } finally { setBusy(false) }
  }
  async function remove(node: AccountNode) {
    setDeleteError(''); setNotice('')
    if (!window.confirm(`¿Eliminar la cuenta ${node.code} — ${node.name}?`)) return
    setBusy(true)
    try { await request(`/accounts/${encodeURIComponent(node.code)}`, { method: 'DELETE' }); setNotice(`Cuenta ${node.code} eliminada.`); await refresh() }
    catch (error) { setDeleteError((error as Error).message) }
    finally { setBusy(false) }
  }
  async function rename(node: AccountNode) {
    if (!renameValue.trim()) { setDeleteError('El nombre no puede estar vacío.'); return }
    setBusy(true); setDeleteError('')
    try {
      await request(`/accounts/${encodeURIComponent(node.code)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: renameValue.trim() }) })
      setRenaming(null); setNotice('Cuenta renombrada.'); await refresh()
    } catch (error) { setDeleteError((error as Error).message) }
    finally { setBusy(false) }
  }
  function renderNode(node: AccountNode, depth = 0): React.ReactNode {
    const open = query.trim() ? true : expanded.has(node.code)
    const hasChildren = node.children.length > 0
    return <div key={node.code} className="tree-item">
      <div className="tree-row" style={{ paddingLeft: `${12 + depth * 22}px` }}>
        <button type="button" className="toggle" aria-label={`${open ? 'Contraer' : 'Expandir'} ${node.code}`} disabled={!hasChildren} onClick={() => setExpanded(previous => { const next = new Set(previous); if (next.has(node.code)) next.delete(node.code); else next.add(node.code); return next })}>{hasChildren ? open ? '▾' : '▸' : '·'}</button>
        <span className="account-code">{node.code}</span>
        <div className="account-info">
          {renaming === node.code ? <form className="rename-form" onSubmit={event => { event.preventDefault(); void rename(node) }}><input aria-label="Nuevo nombre" value={renameValue} onChange={event => setRenameValue(event.target.value)} autoFocus /><button disabled={busy}>Guardar</button><button type="button" onClick={() => setRenaming(null)}>Cancelar</button></form> : <strong>{node.name}</strong>}
          <span className="account-meta">{levelLabel[node.level]} · {natureLabel[node.nature]} {node.allowsMovements ? '· Admite movimientos' : ''}</span>
        </div>
        <div className="node-actions">
          {nextLength(node.code.length) > 0 && <button type="button" disabled={busy} title="Crear hija" onClick={() => { setForm({ code: node.code, name: '', nature: node.nature }); setFieldErrors({}); document.getElementById('account-code')?.focus() }}>+ Hija</button>}
          <button type="button" disabled={busy} onClick={() => { setRenaming(node.code); setRenameValue(node.name) }}>Editar</button>
          <button type="button" className="danger-text" disabled={busy} onClick={() => void remove(node)}>Eliminar</button>
        </div>
      </div>
      {hasChildren && open && <div>{node.children.map(child => renderNode(child, depth + 1))}</div>}
    </div>
  }
  return <div className="app-shell">
    <header className="topbar"><div className="brand-mark">A</div><div><strong>ARAVIA</strong><span>Administración contable</span></div><span className="topbar-tag">Catálogo de cuentas</span></header>
    <main className="page">
      <div className="heading"><div><p className="eyebrow">CONTABILIDAD / CONFIGURACIÓN</p><h1>Catálogo de cuentas</h1><p>Administra la estructura jerárquica de tus cuentas contables.</p></div><span className="count-chip">{countNodes(accounts)} cuentas</span></div>
      <div className="layout">
        <section className="panel catalog"><div className="panel-heading"><div><h2>Plan de cuentas</h2><p>Explora y administra las cuentas registradas</p></div><button className="outline" type="button" onClick={() => void refresh()} disabled={loading || busy}>Actualizar</button></div>
          <div className="search-wrap"><span>⌕</span><input aria-label="Buscar cuentas" placeholder="Buscar por código o nombre..." value={query} onChange={event => setQuery(event.target.value)} /></div>
          {notice && <p role="status" className="message success">{notice}</p>}
          {deleteError && <p role="alert" className="message error">{deleteError}</p>}
          {loading ? <p role="status" className="empty">Cargando catálogo...</p> : loadError ? <div className="empty"><p role="alert">{loadError}</p><button onClick={() => void refresh()}>Reintentar</button></div> : filtered.length ? <div className="tree">{filtered.map(node => renderNode(node))}</div> : <div className="empty">{query ? 'No se encontraron coincidencias.' : 'Aún no hay cuentas. Crea una clase para comenzar.'}</div>}
        </section>
        <aside className="panel create-panel"><div className="panel-heading"><div><h2>Nueva cuenta</h2><p>Agrega una cuenta al catálogo</p></div><span className="plus-mark">+</span></div>
          <form onSubmit={event => void create(event)} noValidate>
            <label htmlFor="account-code">Código <span>*</span></label><input id="account-code" value={form.code} inputMode="numeric" maxLength={6} placeholder="Ej. 110505" onChange={event => { setForm({ ...form, code: event.target.value }); setFieldErrors({ ...fieldErrors, code: '' }) }} aria-invalid={Boolean(fieldErrors.code)} />
            {fieldErrors.code ? <small role="alert" className="field-error">{fieldErrors.code}</small> : <small>1 dígito: clase · 2: grupo · 4: cuenta · 6: subcuenta</small>}
            <label htmlFor="account-name">Nombre <span>*</span></label><input id="account-name" value={form.name} placeholder="Ej. Caja general" onChange={event => { setForm({ ...form, name: event.target.value }); setFieldErrors({ ...fieldErrors, name: '' }) }} aria-invalid={Boolean(fieldErrors.name)} />
            {fieldErrors.name && <small role="alert" className="field-error">{fieldErrors.name}</small>}
            {isClass && <><label htmlFor="account-nature">Naturaleza <span>*</span></label><select id="account-nature" value={form.nature} onChange={event => setForm({ ...form, nature: event.target.value as Nature })}><option value="DEBIT">Débito</option><option value="CREDIT">Crédito</option></select>{fieldErrors.nature && <small role="alert" className="field-error">{fieldErrors.nature}</small>}</>}
            {formError && <p role="alert" className="message error">{formError}</p>}
            <button className="primary" disabled={busy} type="submit">{busy ? 'Procesando...' : '+ Crear cuenta'}</button>
          </form><div className="help-box"><strong>¿Cómo funciona?</strong><p>Primero crea una clase. Para crear niveles inferiores, su cuenta padre debe existir. Solo las cuentas sin hijas admiten movimientos.</p></div>
        </aside>
      </div>
    </main>
  </div>
}
export default App
