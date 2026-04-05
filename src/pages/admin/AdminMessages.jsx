import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

function AdminMessages() {
  const [messages, setMessages] = useState([])
  const [selected, setSelected] = useState(null)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [adminId, setAdminId] = useState(null)

  useEffect(() => {
    const fetchMessages = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setAdminId(user?.id)
      const { data } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(full_name, email)')
        .order('created_at', { ascending: false })
      setMessages(data || [])
      setLoading(false)
    }
    fetchMessages()
  }, [])

  const handleReply = async () => {
    if (!reply.trim() || !selected || !adminId) return
    setSending(true)
    await supabase.from('messages').insert({
      sender_id: adminId,
      receiver_id: selected.sender_id,
      content: reply,
    })
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(full_name, email)')
      .order('created_at', { ascending: false })
    setMessages(data || [])
    setReply('')
    setSending(false)
  }

  const conversation = selected
    ? messages.filter(m => m.sender_id === selected.sender_id || m.receiver_id === selected.sender_id)
    : []

  const uniqueSenders = messages.reduce((acc, m) => {
    if (!acc.find(s => s.sender_id === m.sender_id)) acc.push(m)
    return acc
  }, [])

  return (
    <div style={{ display: 'flex', backgroundColor: '#050505', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", color: '#fff' }}>
      <AdminSidebar active="Messages" />

      <div style={{ marginLeft: '230px', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Topbar */}
        <div style={{ padding: '16px 28px', borderBottom: '1px solid #111', background: '#080808' }}>
          <h1 style={{ fontSize: '18px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Customer <span style={{ color: '#a855f7' }}>Messages</span>
          </h1>
          <p style={{ fontSize: '11px', color: '#444', marginTop: '2px' }}>{uniqueSenders.length} conversations</p>
        </div>

        <div style={{ padding: '24px 28px', flex: 1 }}>
          {loading ? (
            <div style={{ color: '#a855f7', fontSize: '14px' }}>Loading messages...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '14px', height: 'calc(100vh - 140px)' }}>

              {/* Conversations List */}
              <div style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #111', fontSize: '11px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>
                  Conversations
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {uniqueSenders.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#333', fontSize: '12px' }}>No messages yet</div>
                  ) : uniqueSenders.map(msg => (
                    <div key={msg.id} onClick={() => setSelected(msg)} style={{
                      padding: '14px 16px', borderBottom: '1px solid #0d0d0d', cursor: 'pointer',
                      background: selected?.sender_id === msg.sender_id ? '#111' : 'transparent',
                      borderLeft: selected?.sender_id === msg.sender_id ? '3px solid #a855f7' : '3px solid transparent',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#1a0a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#a855f7', fontWeight: '700', flexShrink: 0 }}>
                          {msg.sender?.full_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#ddd' }}>{msg.sender?.full_name || 'Unknown'}</div>
                          <div style={{ fontSize: '11px', color: '#444', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.content}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Window */}
              <div style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {!selected ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '32px' }}>💬</div>
                    <div style={{ color: '#444', fontSize: '13px' }}>Select a conversation to view messages</div>
                  </div>
                ) : (
                  <>
                    {/* Chat Header */}
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', gap: '12px', background: '#0d0d0d' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1a0a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#a855f7', fontWeight: '700' }}>
                        {selected.sender?.full_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#ddd' }}>{selected.sender?.full_name || 'Unknown'}</div>
                        <div style={{ fontSize: '11px', color: '#444' }}>{selected.sender?.email}</div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {conversation.map(msg => {
                        const isAdmin = msg.sender_id === adminId
                        return (
                          <div key={msg.id} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                            <div style={{
                              maxWidth: '70%', padding: '10px 14px', borderRadius: isAdmin ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                              background: isAdmin ? '#0d2d0d' : '#111',
                              border: isAdmin ? '1px solid #22c55e33' : '1px solid #1a1a1a',
                              fontSize: '13px', color: '#ddd', lineHeight: 1.5,
                            }}>
                              {msg.content}
                              <div style={{ fontSize: '10px', color: '#444', marginTop: '4px', textAlign: isAdmin ? 'right' : 'left' }}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Reply Box */}
                    <div style={{ padding: '14px 18px', borderTop: '1px solid #111', display: 'flex', gap: '10px' }}>
                      <input
                        value={reply}
                        onChange={e => setReply(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleReply()}
                        placeholder="Type a reply..."
                        style={{ flex: 1, background: '#111', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none' }}
                      />
                      <button onClick={handleReply} disabled={sending} style={{
                        background: '#a855f7', color: '#fff', border: 'none',
                        borderRadius: '8px', padding: '10px 20px', fontSize: '12px',
                        fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase',
                        opacity: sending ? 0.7 : 1,
                      }}>{sending ? '...' : 'Send'}</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminMessages