import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

function AdminMessages() {
  const [messages, setMessages] = useState([])
  const [selected, setSelected] = useState(null)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [adminId, setAdminId] = useState(null)
  const [, setTick] = useState(0)
  const bottomRef = useRef(null)

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000)
    return () => clearInterval(interval)
  }, [])

  const loadMessages = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(full_name, email)')
      .order('created_at', { ascending: true })
    return data || []
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setAdminId(user?.id)
      const data = await loadMessages()
      setMessages(data)
      setLoading(false)
    }
    init()
  }, [loadMessages])

  useEffect(() => {
    const channel = supabase
      .channel('admin-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, async () => {
        const data = await loadMessages()
        setMessages(data)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, selected])

  const selectConversation = async (convo) => {
    setSelected(convo)
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', convo.customerId)
      .eq('is_read', false)
    const data = await loadMessages()
    setMessages(data)
  }

  const handleReply = async () => {
    if (!reply.trim() || !selected || !adminId) return
    setSending(true)
    await supabase.from('messages').insert({
      sender_id: adminId,
      receiver_id: selected.customerId,
      content: reply.trim(),
      is_read: true,
    })
    const data = await loadMessages()
    setMessages(data)
    setReply('')
    setSending(false)
  }

  const conversations = (() => {
    if (!adminId) return []
    const map = {}
    messages.forEach(msg => {
      const customerId = msg.sender_id === adminId ? msg.receiver_id : msg.sender_id
      const customerProfile = msg.sender_id !== adminId ? msg.sender : null
      if (!map[customerId]) {
        map[customerId] = {
          customerId,
          customerProfile: customerProfile || null,
          lastMessage: msg.content,
          lastTime: msg.created_at,
          messages: [],
        }
      } else {
        map[customerId].lastMessage = msg.content
        map[customerId].lastTime = msg.created_at
        if (!map[customerId].customerProfile && customerProfile) {
          map[customerId].customerProfile = customerProfile
        }
      }
      map[customerId].messages.push(msg)
    })

    return Object.values(map)
      .map(convo => {
        const unreadCount = convo.messages.filter(m =>
          m.sender_id !== adminId && m.is_read === false
        ).length
        return { ...convo, unreadCount }
      })
      .sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime))
  })()

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

  const conversation = selected
    ? messages.filter(m =>
        (m.sender_id === adminId && m.receiver_id === selected.customerId) ||
        (m.sender_id === selected.customerId)
      )
    : []

  return (
    <div style={{ display: 'flex', backgroundColor: '#050505', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", color: '#fff' }}>
      <AdminSidebar active="Messages" />

      <div style={{ marginLeft: '230px', flex: 1, display: 'flex', flexDirection: 'column' }}>

        <div style={{ padding: '14px 28px', borderBottom: '1px solid #111', background: '#080808', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '18px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Customer <span style={{ color: '#a855f7' }}>Messages</span>
              {totalUnread > 0 && (
                <span style={{ background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '20px' }}>
                  {totalUnread} new
                </span>
              )}
            </h1>
            <p style={{ fontSize: '11px', color: '#444', marginTop: '2px' }}>{conversations.length} conversations</p>
          </div>
        </div>

        <div style={{ padding: '24px 28px', flex: 1 }}>
          {loading ? (
            <div style={{ color: '#a855f7', fontSize: '14px' }}>Loading messages...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '14px', height: 'calc(100vh - 140px)' }}>

              {/* Conversations List */}
              <div style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
                        onClick={() => selectConversation(convo)}
                        style={{
                          padding: '13px 16px', borderBottom: '1px solid #0d0d0d', cursor: 'pointer',
                          background: isSelected ? '#130d1f' : hasUnread ? '#0f0a1a' : 'transparent',
                          borderLeft: isSelected ? '3px solid #a855f7' : hasUnread ? '3px solid #a855f744' : '3px solid transparent',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            <div style={{
                              width: '38px', height: '38px', borderRadius: '50%',
                              background: isSelected ? '#2d1060' : '#1a0a2e',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '14px', color: '#a855f7', fontWeight: '800',
                              border: isSelected ? '2px solid #a855f7' : '2px solid transparent',
                            }}>
                              {convo.customerProfile?.full_name?.[0]?.toUpperCase() || '?'}
                            </div>
                            {hasUnread && (
                              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', border: '2px solid #0a0a0a' }} />
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                              <div style={{ fontSize: '13px', fontWeight: hasUnread ? '700' : '600', color: hasUnread ? '#fff' : '#ddd' }}>
                                {convo.customerProfile?.full_name || convo.customerProfile?.email || 'Unknown'}
                              </div>
                              <div style={{ fontSize: '10px', color: hasUnread ? '#a855f7' : '#333', fontWeight: hasUnread ? '600' : '400', flexShrink: 0, marginLeft: '6px' }}>
                                {new Date(convo.lastTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontSize: '11px', color: hasUnread ? '#888' : '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                {convo.lastMessage}
                              </div>
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

              {/* Chat Window */}
              <div style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {!selected ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '40px' }}>💬</div>
                    <div style={{ color: '#444', fontSize: '13px' }}>Select a conversation to view messages</div>
                  </div>
                ) : (
                  <>
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', gap: '12px', background: '#0d0d0d' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#1a0a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', color: '#a855f7', fontWeight: '800', border: '2px solid #a855f755' }}>
                        {selected.customerProfile?.full_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#ddd' }}>{selected.customerProfile?.full_name || 'Unknown'}</div>
                        <div style={{ fontSize: '11px', color: '#444' }}>{selected.customerProfile?.email}</div>
                      </div>
                      <div style={{ marginLeft: 'auto', fontSize: '11px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                        Live
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
                      <button onClick={handleReply} disabled={sending} style={{
                        background: '#a855f7', color: '#fff', border: 'none', borderRadius: '8px',
                        padding: '10px 20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                        textTransform: 'uppercase', opacity: sending ? 0.7 : 1,
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