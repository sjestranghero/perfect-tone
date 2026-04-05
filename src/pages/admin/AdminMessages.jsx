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
  const bottomRef = useRef(null)

  useEffect(() => {
    const fetchMessages = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setAdminId(user?.id)

      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(full_name, email)')
        .order('created_at', { ascending: true }) // oldest first
      
      if (error) console.error('Messages error:', error)
      setMessages(data || [])
      setLoading(false)
    }
    fetchMessages()
  }, [])

  // Scroll to bottom when conversation changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected, messages])

  const handleReply = async () => {
    if (!reply.trim() || !selected || !adminId) return
    setSending(true)

    await supabase.from('messages').insert({
      sender_id: adminId,
      receiver_id: selected.customerId,
      content: reply.trim(),
    })

    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(full_name, email)')
      .order('created_at', { ascending: true })

    setMessages(data || [])
    setReply('')
    setSending(false)
  }

  const selectConversation = (convo) => {
    setSelected(convo)
    setShowChat(true)
  }

  // Build unique customer conversations (exclude admin as a "sender" in the list)
  const conversations = (() => {
    if (!adminId) return []
    const map = {}
    messages.forEach(msg => {
      // The customer is whoever is NOT the admin
      const customerId = msg.sender_id === adminId ? msg.receiver_id : msg.sender_id
      const customerProfile = msg.sender_id === adminId ? null : msg.sender

      if (!map[customerId]) {
        map[customerId] = {
          customerId,
          customerProfile,
          lastMessage: msg.content,
        }
      } else {
        // Keep updating so lastMessage is the most recent
        map[customerId].lastMessage = msg.content
        if (!map[customerId].customerProfile && customerProfile) {
          map[customerId].customerProfile = customerProfile
        }
      }
    })
    return Object.values(map)
  })()

  // Get conversation messages between admin and selected customer, sorted oldest→newest
  const conversation = selected
    ? messages.filter(m =>
        (m.sender_id === adminId && m.receiver_id === selected.customerId) ||
        (m.sender_id === selected.customerId && m.receiver_id === adminId)
      )
    : []

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
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Customer <span style={{ color: '#a855f7' }}>Messages</span>
            </h1>
            <p style={{ fontSize: '10px', color: '#444', marginTop: '1px' }}>{conversations.length} conversations</p>
          </div>
        </div>

        <div style={{ padding: '16px', flex: 1 }}>
          {loading ? (
            <div style={{ color: '#a855f7', fontSize: '14px' }}>Loading messages...</div>
          ) : (
            <>
              <div className="desktop-messages" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '14px', height: 'calc(100vh - 120px)' }}>
                <ConversationList conversations={conversations} selected={selected} onSelect={selectConversation} />
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
                  <ConversationList conversations={conversations} selected={selected} onSelect={selectConversation} />
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

function ConversationList({ conversations, selected, onSelect }) {
  return (
    <div style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #111', fontSize: '11px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>
        Conversations
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {conversations.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#333', fontSize: '12px' }}>No messages yet</div>
        ) : conversations.map(convo => (
          <div
            key={convo.customerId}
            onClick={() => onSelect(convo)}
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid #0d0d0d',
              cursor: 'pointer',
              background: selected?.customerId === convo.customerId ? '#111' : 'transparent',
              borderLeft: selected?.customerId === convo.customerId ? '3px solid #a855f7' : '3px solid transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1a0a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#a855f7', fontWeight: '700', flexShrink: 0 }}>
                {convo.customerProfile?.full_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#ddd' }}>
                  {convo.customerProfile?.full_name || convo.customerProfile?.email || 'Unknown'}
                </div>
                <div style={{ fontSize: '11px', color: '#444', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {convo.lastMessage}
                </div>
              </div>
              <div style={{ fontSize: '18px', color: '#333' }}>›</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChatWindow({ selected, conversation, adminId, reply, setReply, handleReply, sending, bottomRef }) {
  return (
    <div style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
      {!selected ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '32px' }}>💬</div>
          <div style={{ color: '#444', fontSize: '13px' }}>Select a conversation to view messages</div>
        </div>
      ) : (
        <>
          {/* Chat header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', gap: '12px', background: '#0d0d0d' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1a0a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#a855f7', fontWeight: '700' }}>
              {selected.customerProfile?.full_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#ddd' }}>
                {selected.customerProfile?.full_name || 'Unknown'}
              </div>
              <div style={{ fontSize: '11px', color: '#444' }}>{selected.customerProfile?.email}</div>
            </div>
          </div>

          {/* Messages — oldest at top, newest at bottom */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {conversation.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#333', fontSize: '12px', marginTop: '2rem' }}>No messages yet</div>
            ) : conversation.map(msg => {
              const isAdmin = msg.sender_id === adminId
              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '75%',
                    padding: '10px 14px',
                    borderRadius: isAdmin ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: isAdmin ? '#0d2d0d' : '#111',
                    border: isAdmin ? '1px solid #22c55e33' : '1px solid #1a1a1a',
                    fontSize: '13px',
                    color: '#ddd',
                    lineHeight: 1.5,
                    wordBreak: 'break-word',
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

          {/* Reply input */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #111', display: 'flex', gap: '8px' }}>
            <input
              value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleReply()}
              placeholder="Type a reply..."
              style={{ flex: 1, background: '#111', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none' }}
            />
            <button
              onClick={handleReply}
              disabled={sending}
              style={{ background: '#a855f7', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 16px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase', opacity: sending ? 0.7 : 1, whiteSpace: 'nowrap' }}
            >
              {sending ? '...' : 'Send'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminMessages