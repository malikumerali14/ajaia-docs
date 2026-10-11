'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Editor from '../components/Editor';

async function api(method, url, body, isForm) {
  const res = await fetch(url, {
    method,
    headers: body && !isForm ? { 'Content-Type': 'application/json' } : {},
    body: isForm ? body : body && JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(data.error || 'Request failed'); e.status = res.status; throw e; }
  return data;
}

export default function Home() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [list, setList] = useState({ owned: [], shared: [] });
  const [currentId, setCurrentId] = useState(null);
  const [toast, setToast] = useState(null);
  const fileRef = useRef();

  const notify = (msg, ok) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };
  const run = (fn) => async (...a) => { try { await fn(...a); } catch (e) { if (e.status === 401) setUser(null); notify(e.message); } };
  const refresh = useCallback(async () => setList(await api('GET', '/api/docs')), []);

  useEffect(() => {
    (async () => {
      try {
        const me = await api('GET', '/api/me');
        setUser(me.username);
        setUsers(me.users);
        await refresh();
        const id = location.hash.slice(1);
        if (id) setCurrentId(id);
      } catch { /* not signed in */ }
      setReady(true);
    })();
  }, [refresh]);

  const open = (id) => { setCurrentId(id); history.replaceState(null, '', '#' + id); };
  const login = run(async (u) => {
    await api('POST', '/api/login', { username: u });
    const me = await api('GET', '/api/me');
    setUser(me.username); setUsers(me.users); setCurrentId(null); history.replaceState(null, '', '#');
    await refresh();
  });
  const logout = run(async () => { await api('POST', '/api/logout'); setUser(null); setCurrentId(null); });
  const create = run(async () => { const { id } = await api('POST', '/api/docs', {}); await refresh(); open(id); });
  const upload = run(async (e) => {
    const file = e.target.files[0]; e.target.value = '';
    if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    const { id } = await api('POST', '/api/import', fd, true);
    notify(`Imported "${file.name}"`, true); await refresh(); open(id);
  });

  if (!ready) return null;
  const toastEl = toast && <div id="toast" className={toast.ok ? 'ok' : ''}>{toast.msg}</div>;

  if (!user) return (
    <>
      <div className="panel login">
        <h1>Ajaia Docs</h1>
        <p className="hint">Demo sign-in (no passwords). Pick a seeded user. Open two browser windows to see sharing.</p>
        {['umer', 'ahtisham', 'ali'].map((u) => <button key={u} onClick={() => login(u)}>Continue as {u}</button>)}
      </div>
      {toastEl}
    </>
  );

  const Row = ({ d, shared }) => (
    <div className={'item' + (currentId === d.id ? ' active' : '')} onClick={() => open(d.id)}>
      <span>{d.title}<br /><small>{shared ? `from ${d.owner}` : new Date(d.updatedAt).toLocaleString()}</small></span>
      {shared && <span className="badge">{d.role}</span>}
    </div>
  );

  return (
    <>
      <header>
        <h1>Ajaia Docs</h1>
        <span>Signed in as <strong>{user}</strong></span>
        <button onClick={logout}>Switch user</button>
      </header>
      <div className="layout">
        <div className="panel">
          <div className="actions">
            <button className="primary" onClick={create}>+ New</button>
            <button onClick={() => fileRef.current.click()}>Upload file</button>
            <input ref={fileRef} type="file" accept=".txt,.md,.docx" hidden onChange={upload} />
          </div>
          <div className="hint">Upload supports .txt, .md, .docx (max 2 MB) and creates a new editable doc.</div>
          <h2>My documents</h2>
          {list.owned.length ? list.owned.map((d) => <Row key={d.id} d={d} />) : <div className="empty">Nothing yet. Create or upload one.</div>}
          <h2>Shared with me</h2>
          {list.shared.length ? list.shared.map((d) => <Row key={d.id} d={d} shared />) : <div className="empty">Nothing shared with you.</div>}
        </div>
        <div className="panel">
          {currentId
            ? <DocPane key={currentId} id={currentId} user={user} users={users} refresh={refresh} notify={notify}
              onGone={() => { setCurrentId(null); history.replaceState(null, '', '#'); refresh(); }} />
            : <div className="empty">Select a document, create one, or upload a file.</div>}
        </div>
      </div>
      {toastEl}
    </>
  );
}

function DocPane({ id, user, users, refresh, notify, onGone }) {
  const [doc, setDoc] = useState(null);
  const [status, setStatus] = useState('Saved');
  const [who, setWho] = useState('');
  const [role, setRole] = useState('viewer');
  const pending = useRef(null); // latest unsaved content
  const timer = useRef();

  const load = useCallback(async () => {
    try { setDoc(await api('GET', `/api/docs/${id}`)); }
    catch (e) { notify(e.message); onGone(); }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);

  const send = async (patch) => {
    setStatus('Saving…');
    try { await api('PUT', `/api/docs/${id}`, patch); setStatus('Saved'); refresh(); }
    catch (e) { setStatus('Not saved'); notify(e.message); }
  };
  // Flush any pending edit when leaving this document.
  useEffect(() => () => {
    if (pending.current != null) fetch(`/api/docs/${id}`, { method: 'PUT', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: pending.current }) });
  }, [id]);

  const onChange = (html) => {
    pending.current = html; setStatus('Unsaved changes…'); clearTimeout(timer.current);
    timer.current = setTimeout(async () => { const c = pending.current; pending.current = null; await send({ content: c }); }, 800);
  };
  const rename = async (e) => {
    const v = e.target.value;
    if (!v.trim()) { e.target.value = doc.title; return notify('Title cannot be empty'); }
    setDoc({ ...doc, title: v }); await send({ title: v });
  };
  const act = (fn) => async () => { try { await fn(); await load(); refresh(); } catch (e) { notify(e.message); } };

  if (!doc) return <div className="empty">Loading…</div>;
  const canEdit = doc.role !== 'viewer', isOwner = doc.role === 'owner';
  const others = users.filter((u) => u !== user);

  return (
    <div>
      <input className="title" defaultValue={doc.title} maxLength={200} disabled={!canEdit} onBlur={rename} />
      <div className="bar">
        <span className="badge">{isOwner ? 'Owner: you' : `${doc.role} access · owned by ${doc.owner}`}</span>
        <span>{canEdit ? status : 'Read-only'}</span>
        <span className="grow" />
        {isOwner && <button className="danger" onClick={async () => {
          if (!confirm('Delete this document for everyone?')) return;
          try { await api('DELETE', `/api/docs/${id}`); onGone(); } catch (e) { notify(e.message); }
        }}>Delete</button>}
      </div>
      <Editor content={doc.content} editable={canEdit} onChange={onChange} />
      {isOwner && (
        <div className="share">
          <strong>Share</strong>
          <div className="share-row">
            <select value={who || others[0]} onChange={(e) => setWho(e.target.value)}>
              {others.map((u) => <option key={u}>{u}</option>)}
            </select>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="viewer">Can view</option><option value="editor">Can edit</option>
            </select>
            <button className="primary" onClick={act(() => api('POST', `/api/docs/${id}/share`, { username: who || others[0], role }))}>Share</button>
          </div>
          {doc.shares?.length ? doc.shares.map((s) => (
            <div className="share-row" key={s.username}>
              <span>{s.username}</span><span className="badge">{s.role}</span>
              <button onClick={act(() => api('DELETE', `/api/docs/${id}/share?username=${s.username}`))}>Remove</button>
            </div>
          )) : <div className="empty">Not shared with anyone yet.</div>}
        </div>
      )}
    </div>
  );
}
