'use client'
import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const MODELS = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (gratis)' },
  { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B (gratis)' },
  { id: 'deepseek-r1-distill-llama-70b', label: 'DeepSeek R1 (gratis)' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet' },
  { id: 'gpt-4o', label: 'GPT-4o' },
]

export default function ChatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [model, setModel] = useState('claude-sonnet-4-6')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status])

  useEffect(() => {
    if (session) loadConversations()
  }, [session])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadConversations() {
    const res = await fetch('/api/conversations')
    const data = await res.json()
    setConversations(data)
  }

  async function newChat() {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model }),
    })
    const conv = await res.json()
    setConversations([conv, ...conversations])
    setActiveId(conv._id)
    setMessages([])
  }

  async function openConversation(id) {
    setActiveId(id)
    const res = await fetch(`/api/conversations/${id}`)
    const data = await res.json()
    setMessages(data.messages || [])
  }

  async function deleteConversation(id, e) {
    e.stopPropagation()
    await fetch(`/api/conversations/${id}`, { method: 'DELETE' })
    setConversations(conversations.filter((c) => c._id !== id))
    if (activeId === id) {
      setActiveId(null)
      setMessages([])
    }
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!input.trim() || !activeId || loading) return

    const userMsg = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: activeId, message: input }),
    })
    const data = await res.json()

    setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    setLoading(false)

    // Actualizar título en sidebar
    loadConversations()
  }

  if (status === 'loading') {
    return (
      <div style={{ ...s.page, alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text2)' }}>Cargando...</p>
      </div>
    )
  }

  return (
    <div style={s.page}>
      {/* SIDEBAR */}
      <aside style={{ ...s.sidebar, ...(sidebarOpen ? {} : s.sidebarHidden) }}>
        <div style={s.sidebarTop}>
          <div style={s.sidebarHeader}>
            <span style={s.logo}>✦ ChatApp</span>
            <button onClick={() => setSidebarOpen(false)} style={s.iconBtn} title="Cerrar">✕</button>
          </div>

          <button onClick={newChat} style={s.newChatBtn}>
            + Nueva conversación
          </button>

          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            style={s.select}
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>

        <div style={s.convList}>
          {conversations.length === 0 && (
            <p style={s.emptyMsg}>Aún no tienes chats</p>
          )}
          {conversations.map((c) => (
            <div
              key={c._id}
              onClick={() => openConversation(c._id)}
              style={{ ...s.convItem, ...(activeId === c._id ? s.convItemActive : {}) }}
            >
              <span style={s.convTitle}>{c.title}</span>
              <button
                onClick={(e) => deleteConversation(c._id, e)}
                style={s.deleteBtn}
                title="Eliminar"
              >
                🗑
              </button>
            </div>
          ))}
        </div>

        <div style={s.sidebarBottom}>
          <div style={s.userInfo}>
            <div style={s.avatar}>{session?.user?.name?.[0]?.toUpperCase()}</div>
            <span style={s.userName}>{session?.user?.name}</span>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/login' })} style={s.signOutBtn}>
            Salir
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={s.main}>
        {/* Top bar */}
        <div style={s.topbar}>
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} style={s.iconBtn}>☰</button>
          )}
          <span style={s.topbarTitle}>
            {activeId
              ? conversations.find((c) => c._id === activeId)?.title || 'Chat'
              : 'ChatApp'}
          </span>
        </div>

        {/* Messages */}
        <div style={s.messages}>
          {!activeId && (
            <div style={s.welcome}>
              <div style={s.welcomeIcon}>✦</div>
              <h2 style={s.welcomeTitle}>¿En qué puedo ayudarte?</h2>
              <p style={s.welcomeText}>Crea una conversación nueva para empezar</p>
              <button onClick={newChat} style={s.welcomeBtn}>Nueva conversación</button>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} style={{ ...s.msgRow, ...(m.role === 'user' ? s.msgRowUser : {}) }}>
              {m.role === 'assistant' && <div style={s.aiAvatar}>✦</div>}
              <div style={{ ...s.bubble, ...(m.role === 'user' ? s.bubbleUser : s.bubbleAI) }}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={s.msgRow}>
              <div style={s.aiAvatar}>✦</div>
              <div style={{ ...s.bubble, ...s.bubbleAI, color: 'var(--text2)' }}>
                Escribiendo...
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} style={s.inputArea}>
          <div style={s.inputWrapper}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage(e)
                }
              }}
              placeholder={activeId ? 'Escribe un mensaje... (Enter para enviar)' : 'Crea una conversación para empezar'}
              disabled={!activeId || loading}
              rows={1}
              style={s.textarea}
            />
            <button
              type="submit"
              disabled={!activeId || loading || !input.trim()}
              style={s.sendBtn}
            >
              ↑
            </button>
          </div>
          <p style={s.disclaimer}>La IA puede cometer errores. Verifica información importante.</p>
        </form>
      </main>
    </div>
  )
}

const s = {
  page: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    background: 'var(--bg)',
  },
  sidebar: {
    width: '260px',
    minWidth: '260px',
    background: 'var(--bg2)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.2s',
    overflow: 'hidden',
  },
  sidebarHidden: {
    width: 0,
    minWidth: 0,
    borderRight: 'none',
  },
  sidebarTop: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    borderBottom: '1px solid var(--border)',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    color: 'var(--accent)',
    fontWeight: '700',
    fontSize: '16px',
  },
  iconBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text2)',
    fontSize: '16px',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  newChatBtn: {
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '10px',
    fontSize: '14px',
    fontWeight: '600',
    width: '100%',
  },
  select: {
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text)',
    padding: '8px 10px',
    fontSize: '13px',
    width: '100%',
    outline: 'none',
  },
  convList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  emptyMsg: {
    color: 'var(--text2)',
    fontSize: '13px',
    textAlign: 'center',
    padding: '20px 0',
  },
  convItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '9px 10px',
    borderRadius: '8px',
    cursor: 'pointer',
    gap: '8px',
  },
  convItemActive: {
    background: 'var(--bg3)',
  },
  convTitle: {
    fontSize: '13px',
    color: 'var(--text)',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  deleteBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: '13px',
    opacity: 0.4,
    padding: '2px',
    flexShrink: 0,
  },
  sidebarBottom: {
    padding: '12px 16px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    overflow: 'hidden',
  },
  avatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    background: 'var(--accent)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '700',
    flexShrink: 0,
  },
  userName: {
    fontSize: '13px',
    color: 'var(--text)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  signOutBtn: {
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text2)',
    padding: '5px 10px',
    fontSize: '12px',
    flexShrink: 0,
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  topbar: {
    padding: '14px 20px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'var(--bg)',
  },
  topbarTitle: {
    fontSize: '15px',
    color: 'var(--text)',
    fontWeight: '500',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  welcome: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: '12px',
    marginTop: '80px',
  },
  welcomeIcon: {
    fontSize: '48px',
    color: 'var(--accent)',
  },
  welcomeTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: 'var(--text)',
  },
  welcomeText: {
    color: 'var(--text2)',
    fontSize: '15px',
  },
  welcomeBtn: {
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '11px 24px',
    fontSize: '15px',
    fontWeight: '600',
    marginTop: '8px',
  },
  msgRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    maxWidth: '800px',
    width: '100%',
    margin: '0 auto',
  },
  msgRowUser: {
    flexDirection: 'row-reverse',
  },
  aiAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    color: '#fff',
    flexShrink: 0,
    marginTop: '2px',
  },
  bubble: {
    padding: '12px 16px',
    borderRadius: '14px',
    fontSize: '15px',
    lineHeight: '1.6',
    maxWidth: '80%',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  bubbleUser: {
    background: 'var(--user-bubble)',
    color: '#fff',
    borderBottomRightRadius: '4px',
  },
  bubbleAI: {
    background: 'var(--ai-bubble)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    borderBottomLeftRadius: '4px',
  },
  inputArea: {
    padding: '16px 20px',
    borderTop: '1px solid var(--border)',
    background: 'var(--bg)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  inputWrapper: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-end',
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '8px 8px 8px 16px',
  },
  textarea: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: 'var(--text)',
    fontSize: '15px',
    resize: 'none',
    outline: 'none',
    maxHeight: '200px',
    lineHeight: '1.5',
    padding: '4px 0',
  },
  sendBtn: {
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    width: '36px',
    height: '36px',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background 0.15s',
  },
  disclaimer: {
    color: 'var(--text2)',
    fontSize: '11px',
    textAlign: 'center',
  },
}
