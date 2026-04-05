import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'

function Messages() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [user, setUser] = useState(null)
  const [adminId, setAdminId] = useState(null)

  useEffect(() => {
    const fetchMessages = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login'); return }
      setUser(user)
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .single()
      setAdminId(adminProfile?.id)
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !adminId) return
    setSending(true)
    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: adminId,
      content: newMessage,
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
    <div style={{ backgroundColor: '#050505', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", color: '#fff' }}>

      {/* Navbar */}
      <nav style={{ backgroundColor: '#080808', borderBottom: '1px solid #181818', padding: '0 2.5rem', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <img src={logo} alt="Perfect Tone" style={{ height: '55px', objectFit: 'contain', cursor: 'pointer' }} onClick={() => navigate('/')} />
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {[{ label: 'Home', path: '/' },
{ label: 'Catalog', path: '/catalog' },
{ label: 'Orders', path: '/orders' },
{ label: 'Messages', path: '/messages' },
{ label: 'Location', path: '/location' },].map(link => (
            <a key={link.label} onClick={() => navigate(link.path)} href="#" style={{ color: link.label === 'Messages' ? '#22c55e' : '#666', textDecoration: 'none', fontWeight: '500', fontSize: '0.9rem' }}>{link.label}</a>
          ))}
        </div>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2rem' }}>
          Messages <span style={{ color: '#a855f7' }}>Support</span>
        </h1>

        <div style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '600px' }}>

          {/* Chat Header */}
          <div style={{ padding: '14px 18px', background: '#0d0d0d', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0d2d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🎸</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#ddd' }}>Perfect Tone Support</div>
              <div style={{ fontSize: '11px', color: '#22c55e' }}>● Online</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                    maxWidth: '70%', padding: '10px 14px',
                    borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: isMe ? '#0d2d0d' : '#111',
                    border: isMe ? '1px solid #22c55e33' : '1px solid #1a1a1a',
                    fontSize: '13px', color: '#ddd', lineHeight: 1.5,
                  }}>
                    {msg.content}
                    <div style={{ fontSize: '10px', color: '#444', marginTop: '4px', textAlign: isMe ? 'right' : 'left' }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Input */}
          <div style={{ padding: '14px 18px', borderTop: '1px solid #111', display: 'flex', gap: '10px' }}>
            <input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              style={{ flex: 1, background: '#111', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none' }}
            />
            <button onClick={sendMessage} disabled={sending} style={{
              background: '#a855f7', color: '#fff', border: 'none', borderRadius: '8px',
              padding: '10px 20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
              textTransform: 'uppercase', opacity: sending ? 0.7 : 1,
            }}>{sending ? '...' : 'Send'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Messages