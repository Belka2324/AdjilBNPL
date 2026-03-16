;(function () {
  const T_LOGIN = 'tpl-login'
  const T_DASH = 'tpl-dashboard'
  const SEL = {
    app: '#app',
    tabs: '.admin-tab',
    sections: '.admin-section',
    statUsers: '#stat-users',
    statTx: '#stat-transactions',
    statTickets: '#stat-tickets',
    usersTbody: '#users-tbody',
    txTbody: '#tx-tbody',
    ticketsTbody: '#tickets-tbody',
    usersSearch: '#users-search',
    txSearch: '#tx-search',
    btnLogout: '#btn-admin-logout',
    btnLogin: '#btn-admin-login',
    email: '#admin-email',
    password: '#admin-password',
    loginErr: '#admin-login-error'
  }
  let state = { tab: 'overview', users: [], txs: [], tickets: [] }
  const el = (sel, root) => (root || document).querySelector(sel)
  const els = (sel, root) => Array.from((root || document).querySelectorAll(sel))
  const html = (id) => el(`#${id}`).innerHTML
  const mount = (id) => (el(SEL.app).innerHTML = html(id))
  const setHidden = (e, h) => (h ? e.classList.add('hidden') : e.classList.remove('hidden'))
  async function getSession() {
    if (!window.supabaseClient) return null
    const { data } = await window.supabaseClient.auth.getSession()
    return data?.session || null
  }
  function onAuthChange() {
    if (!window.supabaseClient || !window.supabaseClient.auth) return
    window.supabaseClient.auth.onAuthStateChange((_e, _s) => init())
  }
  function setActiveTab() {
    els(SEL.tabs).forEach((b) => {
      if (b.getAttribute('data-tab') === state.tab) b.classList.add('bg-blue-600', 'text-white')
      else b.classList.remove('bg-blue-600', 'text-white')
    })
    els(SEL.sections).forEach((s) => setHidden(s, s.id !== `admin-${state.tab}`))
  }
  function renderUsers(list) {
    const body = el(SEL.usersTbody)
    body.innerHTML = ''
    list.forEach((u) => {
      const tr = document.createElement('tr')
      tr.innerHTML = [
        `<td class="p-3">${u.name || '-'}</td>`,
        `<td class="p-3">${u.role || '-'}</td>`,
        `<td class="p-3">${u.status || '-'}</td>`,
        `<td class="p-3">${formatNum(u.balance)}</td>`,
        `<td class="p-3">${u.email || '-'}</td>`
      ].join('')
      body.appendChild(tr)
    })
  }
  function renderTxs(list) {
    const body = el(SEL.txTbody)
    body.innerHTML = ''
    list.forEach((t) => {
      const tr = document.createElement('tr')
      const d = t.created_at ? new Date(t.created_at) : null
      tr.innerHTML = [
        `<td class="p-3">${t.id}</td>`,
        `<td class="p-3">${formatNum(t.amount)}</td>`,
        `<td class="p-3">${t.method || '-'}</td>`,
        `<td class="p-3">${d ? d.toLocaleString('ar-DZ') : '-'}</td>`,
        `<td class="p-3">${t.merchant_name || '-'}</td>`,
        `<td class="p-3">${t.customer_name || '-'}</td>`,
        `<td class="p-3">${t.status || '-'}</td>`
      ].join('')
      body.appendChild(tr)
    })
  }
  function renderTickets(list) {
    const body = el(SEL.ticketsTbody)
    body.innerHTML = ''
    list.forEach((t) => {
      const tr = document.createElement('tr')
      const d = t.created_at ? new Date(t.created_at) : null
      tr.innerHTML = [
        `<td class="p-3">${t.id}</td>`,
        `<td class="p-3">${t.user_email || '-'}</td>`,
        `<td class="p-3">${t.subject || '-'}</td>`,
        `<td class="p-3">${d ? d.toLocaleString('ar-DZ') : '-'}</td>`,
        `<td class="p-3">${t.status || 'open'}</td>`
      ].join('')
      body.appendChild(tr)
    })
  }
  function formatNum(v) {
    const n = Number(v || 0)
    return n.toLocaleString('ar-DZ') + ' دج'
  }
  function bindDashboard() {
    els(SEL.tabs).forEach((b) =>
      b.addEventListener('click', () => {
        state.tab = b.getAttribute('data-tab') || 'overview'
        setActiveTab()
      })
    )
    el(SEL.btnLogout).addEventListener('click', async () => {
      if (window.supabaseClient?.auth) await window.supabaseClient.auth.signOut()
      init()
    })
    el(SEL.usersSearch).addEventListener('input', (e) => {
      const q = (e.target.value || '').toLowerCase()
      const list = state.users.filter(
        (u) =>
          String(u.name || '').toLowerCase().includes(q) ||
          String(u.email || '').toLowerCase().includes(q)
      )
      renderUsers(list)
    })
    el(SEL.txSearch).addEventListener('input', (e) => {
      const q = (e.target.value || '').toLowerCase()
      const list = state.txs.filter(
        (t) =>
          String(t.id || '').toLowerCase().includes(q) ||
          String(t.customer_name || '').toLowerCase().includes(q) ||
          String(t.merchant_name || '').toLowerCase().includes(q)
      )
      renderTxs(list)
    })
  }
  async function loadData() {
    const c = window.supabaseClient
    if (!c) return
    const { data: users } = await c.from('users').select('id,name,email,role,status,balance').order('created_at', { ascending: false }).limit(500)
    const { data: txs } = await c.from('transactions').select('id,amount,method,created_at,merchant_name,customer_name,status').order('created_at', { ascending: false }).limit(500)
    const { data: tickets } = await c.from('support_tickets').select('id,user_email,subject,created_at,status').order('created_at', { ascending: false }).limit(500)
    state.users = Array.isArray(users) ? users : []
    state.txs = Array.isArray(txs) ? txs : []
    state.tickets = Array.isArray(tickets) ? tickets : []
    el(SEL.statUsers).textContent = String(state.users.length)
    el(SEL.statTx).textContent = String(state.txs.length)
    el(SEL.statTickets).textContent = String(state.tickets.length)
    renderUsers(state.users)
    renderTxs(state.txs)
    renderTickets(state.tickets)
  }
  function bindLogin() {
    const btn = el(SEL.btnLogin)
    const email = el(SEL.email)
    const pw = el(SEL.password)
    const err = el(SEL.loginErr)
    btn.addEventListener('click', async () => {
      err.classList.add('hidden')
      const e = email.value.trim()
      const p = pw.value.trim()
      if (!e || !p) {
        err.textContent = 'يرجى إدخال البريد وكلمة المرور'
        err.classList.remove('hidden')
        return
      }
      try {
        if (!window.supabaseClient?.auth) throw new Error('supabase client not ready')
        const { error } = await window.supabaseClient.auth.signInWithPassword({ email: e, password: p })
        if (error) {
          err.textContent = 'فشل تسجيل الدخول'
          err.classList.remove('hidden')
          return
        }
        init()
      } catch (_ex) {
        err.textContent = 'تعذر الاتصال بالخادم'
        err.classList.remove('hidden')
      }
    })
  }
  async function startDashboard() {
    mount(T_DASH)
    setActiveTab()
    bindDashboard()
    await loadData()
  }
  async function startLogin() {
    mount(T_LOGIN)
    bindLogin()
  }
  async function init() {
    onAuthChange()
    const session = await getSession()
    if (session) {
      await startDashboard()
    } else {
      await startLogin()
    }
  }
  document.addEventListener('DOMContentLoaded', init)
})()

