import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

function AdminMessages() {
  const [messages, setMessages] = useState([])
  const [selected, setSelected] = useState(null)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [adminId, setAdminId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [readMap, setReadMap] = useState({}) // customerId -> last read timestamp
  const bottomRef = useRef(null)
  const selectedRef = useRef(null)
  const adminIdRef = useRef(null)

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(full_name, email)')
      .order('created_at', { ascending: true })
    if (error) console.error('Messages error:', error)
    return data || []
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setAdminId(user?.id)
      adminIdRef.current = user?.id
      const data = await loadMessages()
      setMessages(data)
      setLoading(false)
    }
    init()

    // Poll every 5 seconds for new messages
    const interval = setInterval(async () => {
      const data = await loadMessages()
      setMessages(data)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Keep selectedRef in sync so interval can access it
  useEffect(() => {
    selectedRef.current = selected
  }, [selected])

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, selected])

  const handleReply = async () => {
    if (!reply.trim() || !selected || !adminId) return
    setSending(true)
    await supabase.from('messages').insert({
      sender_id: adminId,
      receiver_id: selected.customerId,
      content: reply.trim(),
    })
    const data = await loadMessages()
    setMessages(data)
    // Mark as read immediately after replying
    setReadMap(prev => ({ ...prev, [selected.customerId]: new Date().toISOString() }))
    setReply('')
    setSending(false)
  }

  const selectConversation = (convo) => {
    setSelected(convo)
    setShowChat(true)
    // Mark this conversation as read now
    setReadMap(prev => ({ ...prev, [convo.customerId]: new Date().toISOString() }))
  }

  // Build conversations: group by customer, sort by latest message time, count unread
  const conversations = (() => {
    if (!adminId) return []
    const map = {}

    messages.forEach(msg => {
      const customerId = msg.sender_id === adminId ? msg.receiver_id : msg.sender_id
      const customerProfile = msg.sender_id === adminId ? null : msg.sender

      if (!map[customerId]) {
        map[customerId] = {
          customerId,
          customerProfile: customerProfile || null,
          lastMessage: msg.content,
          lastTime: msg.created_at,
          unreadCount: 0,
        }
      } else {
        map[customerId].lastMessage = msg.content
        map[customerId].lastTime = msg.created_at
        if (!map[customerId].customerProfile && customerProfile) {
          map[customerId].customerProfile = customerProfile
        }
      }

      // Count unread: messages FROM customer that arrived after last read time
      const lastRead = readMap[customerId]
      const isFromCustomer = msg.sender_id !== adminId
      const isUnread = !lastRead || new Date(msg.created_at) > new Date(lastRead)
      if (isFromCustomer && isUnread) {
        map[customerId].unreadCount = (map[customerId].unreadCount || 0) + 1
      }
    })

    // Sort by latest message time (most recent first)
    return Object.values(map).sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime))
  })()

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)

  const conversation = selected
    ? messages.filter(m =>
        (m.sender_id === adminId && m.receiver_id === selected.customerId) ||
        (m.sender_id === selected.customerId && m.receiver_id === adminId)
      )
    : []

  function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return new Date(dateStr).toLocaleDateString()
  }

  return (
    <div style={{ display: 'flex', backgroundColor: '#050505', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", color: '#fff' }}>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="mobile-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 40, display: 'none' }} />
      )}

      <div className="mobile-sidebar-wrapper" style={{ position: 'fixed', top: 0, left: sidebarOpen ? 0 : '-230px', height: '100vh', zIndex: 50, transition: 'left 0.3s ease', width: '230px' }}>
        <AdminSidebar active="Messages" onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="desktop-sidebar-spacer" style={{ width: '230px', flexShrink: 0 }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Topbar */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #111', background: '#080808', position: 'sticky', top: 0, zIndex: 30, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hamburger-btn" style={{ background: '#111', border: '1px solid #222', borderRadius: '8px', padding: '7px 10px', cursor: 'pointer', color: '#fff', fontSize: '16px', display: 'none', lineHeight: 1 }}>☰</button>
          {showChat && selected && (
            <button onClick={() => setShowChat(false)} className="back-btn" style={{ background: '#111', border: '1px solid #222', borderRadius: '8px', padding: '7px 10px', cursor: 'pointer', color: '#fff', fontSize: '13px', display: 'none', lineHeight: 1 }}>← Back</button>
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Customer <span style={{ color: '#a855f7' }}>Messages</span>
              {totalUnread > 0 && (
                <span style={{ background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '2px 7px', borderRadius: '20px', letterSpacing: '0.02em' }}>
                  {totalUnread} new
                </span>
              )}
            </h1>
            <p style={{ fontSize: '10px', color: '#444', marginTop: '1px' }}>{conversations.length} conversations</p>
          </div>
        </div>

        <div style={{ padding: '16px', flex: 1 }}>
          {loading ? (
            <div style={{ color: '#a855f7', fontSize: '14px' }}>Loading messages...</div>
          ) : (
            <>
              <div className="desktop-messages" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '14px', height: 'calc(100vh - 120px)' }}>
                <ConversationList conversations={conversations} selected={selected} onSelect={selectConversation} timeAgo={timeAgo} />
                <ChatWindow
                  selected={selected}
                  conversation={conversation}
                  adminId={adminId}
                  reply={reply}
                  setReply={setReply}
                  handleReply={handleReply}
                  sending={sending}
                  bottomRef={bottomRef}
                />
              </div>

              <div className="mobile-messages" style={{ display: 'none', height: 'calc(100vh - 120px)' }}>
                {!showChat ? (
                  <ConversationList conversations={conversations} selected={selected} onSelect={selectConversation} timeAgo={timeAgo} />
                ) : (
                  <ChatWindow
                    selected={selected}
                    conversation={conversation}
                    adminId={adminId}
                    reply={reply}
                    setReply={setReply}
                    handleReply={handleReply}
                    sending={sending}
                    bottomRef={bottomRef}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 769px) {
          .mobile-sidebar-wrapper { left: 0 !important; position: fixed !important; }
          .desktop-sidebar-spacer { display: block !important; }
          .hamburger-btn { display: none !important; }
          .mobile-overlay { display: none !important; }
          .back-btn { display: none !important; }
          .desktop-messages { display: grid !important; }
          .mobile-messages { display: none !important; }
        }
        @media (max-width: 768px) {
          .mobile-sidebar-wrapper { position: fixed !important; }
          .desktop-sidebar-spacer { display: none !important; }
          .hamburger-btn { display: block !important; }
          .mobile-overlay { display: block !important; }
          .back-btn { display: block !important; }
          .desktop-messages { display: none !important; }
          .mobile-messages { display: block !important; }
        }
      `}</style>
    </div>
  )
}

function ConversationList({ conversations, selected, onSelect, timeAgo }) {
  return (
    <div style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #111', fontSize: '11px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>
        Conversations
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {conversations.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#333', fontSize: '12px' }}>No messages yet</div>
        ) : conversations.map(convo => {
          const isSelected = selected?.customerId === convo.customerId
          const hasUnread = convo.unreadCount > 0
          return (
            <div
              key={convo.customerId}
              onClick={() => onSelect(convo)}
              style={{
                padding: '13px 16px',
                borderBottom: '1px solid #0d0d0d',
                cursor: 'pointer',
                background: isSelected ? '#130d1f' : hasUnread ? '#0f0a1a' : 'transparent',
                borderLeft: isSelected ? '3px solid #a855f7' : hasUnread ? '3px solid #a855f744' : '3px solid transparent',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: isSelected ? '#2d1060' : '#1a0a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#a855f7', fontWeight: '800', border: isSelected ? '2px solid #a855f7' : '2px solid transparent' }}>
                    {convo.customerProfile?.full_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  {/* Online dot — green pulse if unread */}
                  {hasUnread && (
                    <div style={{ position: 'absolute', bottom: '0', right: '0', width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', border: '2px solid #0a0a0a' }} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <div style={{ fontSize: '13px', fontWeight: hasUnread ? '700' : '600', color: hasUnread ? '#fff' : '#ddd' }}>
                      {convo.customerProfile?.full_name || convo.customerProfile?.email || 'Unknown'}
                    </div>
                    <div style={{ fontSize: '10px', color: hasUnread ? '#a855f7' : '#333', fontWeight: hasUnread ? '600' : '400', flexShrink: 0, marginLeft: '6px' }}>
                      {timeAgo(convo.lastTime)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', color: hasUnread ? '#888' : '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {convo.lastMessage}
                    </div>
                    {/* Unread badge */}
                    {hasUnread && (
                      <div style={{ background: '#a855f7', color: '#fff', fontSize: '10px', fontWeight: '800', minWidth: '18px', height: '18px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', marginLeft: '6px', flexShrink: 0 }}>
                        {convo.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ChatWindow({ selected, conversation, adminId, reply, setReply, handleReply, sending, bottomRef }) {
  return (
    <div style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
      {!selected ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '40px' }}>💬</div>
          <div style={{ color: '#444', fontSize: '13px' }}>Select a conversation to view messages</div>
        </div>
      ) : (
        <>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', gap: '12px', background: '#0d0d0d' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#1a0a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', color: '#a855f7', fontWeight: '800', border: '2px solid #a855f755' }}>
              {selected.customerProfile?.full_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#ddd' }}>{selected.customerProfile?.full_name || 'Unknown'}</div>
              <div style={{ fontSize: '11px', color: '#444' }}>{selected.customerProfile?.email}</div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {conversation.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#333', fontSize: '12px', marginTop: '2rem' }}>No messages yet</div>
            ) : conversation.map(msg => {
              const isAdmin = msg.sender_id === adminId
              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '75%', padding: '10px 14px',
                    borderRadius: isAdmin ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: isAdmin ? '#1a0a3a' : '#111',
                    border: isAdmin ? '1px solid #a855f733' : '1px solid #1a1a1a',
                    fontSize: '13px', color: '#ddd', lineHeight: 1.5, wordBreak: 'break-word',
                  }}>
                    {msg.content}
                    <div style={{ fontSize: '10px', color: '#444', marginTop: '4px', textAlign: isAdmin ? 'right' : 'left' }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: '12px 16px', borderTop: '1px solid #111', display: 'flex', gap: '8px' }}>
            <input
              value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleReply()}
              placeholder="Type a reply..."
              style={{ flex: 1, background: '#111', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none' }}
            />
            <button onClick={handleReply} disabled={sending} style={{ background: '#a855f7', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 16px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase', opacity: sending ? 0.7 : 1, whiteSpace: 'nowrap' }}>
              {sending ? '...' : 'Send'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminMessages