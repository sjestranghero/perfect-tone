import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

function Cart() {
  const navigate = useNavigate()
  const [cart, setCart] = useState([])
  const [placing, setPlacing] = useState(false)
  const [user, setUser] = useState(null)
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const stored = localStorage.getItem('cart')
      setCart(stored ? JSON.parse(stored) : [])
    }
    getUser()
  }, [])

  const updateQty = (id, qty) => {
    if (qty < 1) return removeItem(id)
    const updated = cart.map(item => item.id === id ? { ...item, quantity: qty } : item)
    setCart(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
  }

  const removeItem = (id) => {
    const updated = cart.filter(item => item.id !== id)
    setCart(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const placeOrder = async () => {
    if (!user) return navigate('/login')
    if (cart.length === 0) return alert('Your cart is empty!')
    if (!fullName.trim()) return alert('Please enter your full name!')
    if (!email.trim()) return alert('Please enter your email address!')
    if (!phone.trim()) return alert('Please enter your phone number!')
    if (!address.trim()) return alert('Please enter your delivery address!')

    setPlacing(true)

    // Store all customer info in the notes field so admin can see it
    const orderNotes = [
      `Name: ${fullName}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Address: ${address}`,
      notes ? `Notes: ${notes}` : '',
    ].filter(Boolean).join('\n')

    const { data: order, error } = await supabase.from('orders').insert({
      user_id: user.id, total, status: 'pending',
      notes: orderNotes,
    }).select().single()

    if (error) { alert('Error placing order'); setPlacing(false); return }

    const items = cart.map(item => ({ order_id: order.id, product_id: item.id, quantity: item.quantity, price: item.price }))
    await supabase.from('order_items').insert(items)
    localStorage.removeItem('cart')
    setCart([])
    setPlacing(false)
    navigate('/orders')
  }

  const inputStyle = {
    width: '100%', background: '#111', border: '1px solid #1a1a1a',
    borderRadius: '8px', padding: '10px 12px', color: '#fff',
    fontSize: '13px', outline: 'none', boxSizing: 'border-box',
  }

  const labelStyle = {
    color: '#555', fontSize: '11px', textTransform: 'uppercase',
    letterSpacing: '0.08em', display: 'block', marginBottom: '6px', fontWeight: '600',
  }

  return (
    <div style={{ backgroundColor: '#050505', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", color: '#fff' }}>
      <Navbar active="Cart" user={user} cartCount={cart.length} />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem' }}>
        <h1 style={{ fontSize: 'clamp(1.3rem, 5vw, 1.8rem)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1.5rem' }}>
          Your <span style={{ color: '#22c55e' }}>Cart</span>
        </h1>

        {cart.length === 0 ? (
          <div style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🛒</div>
            <p style={{ color: '#444', fontSize: '14px', marginBottom: '1.5rem' }}>Your cart is empty</p>
            <button onClick={() => navigate('/catalog')} style={{ background: '#22c55e', color: '#000', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase' }}>Browse Catalog</button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {cart.map(item => (
                <div key={item.id} style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', padding: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '10px', overflow: 'hidden', background: '#111', flexShrink: 0 }}>
                    {item.image_url ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🎸</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#ddd', marginBottom: '2px' }}>{item.name}</div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#22c55e' }}>₱{item.price?.toLocaleString()}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <button onClick={() => updateQty(item.id, item.quantity - 1)} style={{ width: '26px', height: '26px', background: '#111', border: '1px solid #1a1a1a', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>-</button>
                      <span style={{ fontSize: '13px', fontWeight: '700', minWidth: '18px', textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, item.quantity + 1)} style={{ width: '26px', height: '26px', background: '#111', border: '1px solid #1a1a1a', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>+</button>
                      <span style={{ fontSize: '12px', color: '#888', marginLeft: '4px' }}>= ₱{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.id)} style={{ background: '#2d0a0a', color: '#ef4444', border: '1px solid #ef444433', borderRadius: '6px', padding: '6px 8px', fontSize: '10px', fontWeight: '600', cursor: 'pointer', flexShrink: 0 }}>✕</button>
                </div>
              ))}
            </div>

            {/* Order Summary + Form */}
            <div style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', padding: '16px' }}>
              {/* Summary */}
              <h2 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', marginBottom: '12px' }}>Order Summary</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#666' }}>{item.name} x{item.quantity}</span>
                    <span style={{ color: '#ddd' }}>₱{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div style={{ height: '1px', background: '#151515', marginBottom: '12px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#ddd' }}>Total</span>
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#22c55e' }}>₱{total.toLocaleString()}</span>
              </div>

              {/* Customer Info section */}
              <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                  👤 Customer Information
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                    <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Juan dela Cruz" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. juan@email.com" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone Number <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 09123456789" style={inputStyle} />
                  </div>
                </div>
              </div>

              {/* Delivery Info section */}
              <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                  📦 Delivery Information
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Delivery Address <span style={{ color: '#ef4444' }}>*</span></label>
                    <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter your full delivery address..." style={{ ...inputStyle, resize: 'vertical', minHeight: '70px' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Order Notes (Optional)</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special instructions..." style={{ ...inputStyle, resize: 'vertical', minHeight: '55px' }} />
                  </div>
                </div>
              </div>

              <button onClick={placeOrder} disabled={placing} style={{ width: '100%', background: '#22c55e', color: '#000', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: placing ? 0.7 : 1, marginBottom: '8px' }}>
                {placing ? 'Placing Order...' : 'Place Order'}
              </button>
              <button onClick={() => navigate('/catalog')} style={{ width: '100%', background: 'transparent', color: '#666', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '11px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', textTransform: 'uppercase' }}>
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Cart