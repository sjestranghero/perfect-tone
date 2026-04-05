import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

function Messages() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [user, setUser] = useState(null)
  const [adminId, setAdminId] = useState(null)
  const [adminError, setAdminError] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    const fetchMessages = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login'); return }
      setUser(user)

      // Look up admin by role in profiles
      const { data: adminProfile, error: adminErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .single()

      if (adminErr || !adminProfile) {
        console.error('Admin profile not found:', adminErr)
        setAdminError(true)
        setLoading(false)
        return
      }

      setAdminId(adminProfile.id)

      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true })

      setMessages(data || [])
      setLoading(false)
    }
    fetchMessages()
  }, [navigate])

  // Scroll to bottom when messages load or change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !adminId) return
    setSending(true)

    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: adminId,
      content: newMessage.trim(),
    })

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: true })

    setMessages(data || [])
    setNewMessage('')
    setSending(false)
  }

  return (
    <div style={{ backgroundColor: '#050505', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <Navbar active="Messages" user={user} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '800px', width: '100%', margin: '0 auto', padding: '1.5rem', boxSizing: 'border-box' }}>
        <h1 style={{ fontSize: 'clamp(1.3rem, 5vw, 1.8rem)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
          Messages <span style={{ color: '#a855f7' }}>Support</span>
        </h1>

        {adminError ? (
          <div style={{ background: '#2d0a0a', border: '1px solid #ef444433', borderRadius: '14px', padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️</div>
            <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '4px', fontWeight: '600' }}>Support chat unavailable</div>
            <div style={{ color: '#888', fontSize: '12px' }}>No admin account found. Please contact us at hello@perfecttone.ph</div>
          </div>
        ) : (
          <div style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, minHeight: '500px' }}>

            {/* Chat Header */}
            <div style={{ padding: '12px 16px', background: '#0d0d0d', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0d2d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🎸</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#ddd' }}>Perfect Tone Support</div>
                <div style={{ fontSize: '11px', color: adminId ? '#22c55e' : '#666' }}>
                  {adminId ? '● Online' : '○ Connecting...'}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {loading ? (
                <div style={{ color: '#444', fontSize: '13px' }}>Loading...</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#333', fontSize: '13px', marginTop: '2rem' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
                  Send us a message and we'll get back to you!
                </div>
              ) : messages.map(msg => {
                const isMe = msg.sender_id === user?.id
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '80%', padding: '10px 14px',
                      borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: isMe ? '#0d2d0d' : '#111',
                      border: isMe ? '1px solid #22c55e33' : '1px solid #1a1a1a',
                      fontSize: '13px', color: '#ddd', lineHeight: 1.5, wordBreak: 'break-word',
                    }}>
                      {msg.content}
                      <div style={{ fontSize: '10px', color: '#444', marginTop: '4px', textAlign: isMe ? 'right' : 'left' }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px 14px', borderTop: '1px solid #111', display: 'flex', gap: '8px' }}>
              <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={adminId ? 'Type your message...' : 'Loading support...'}
                disabled={!adminId || loading}
                style={{ flex: 1, background: '#111', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', opacity: (!adminId || loading) ? 0.5 : 1 }}
              />
              <button
                onClick={sendMessage}
                disabled={sending || !adminId || loading}
                style={{ background: '#a855f7', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 16px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase', opacity: (sending || !adminId) ? 0.7 : 1, whiteSpace: 'nowrap' }}
              >
                {sending ? '...' : 'Send'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Messages