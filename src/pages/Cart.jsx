import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'

function Cart() {
  const navigate = useNavigate()
  const [cart, setCart] = useState([])
  const [placing, setPlacing] = useState(false)
  const [user, setUser] = useState(null)
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

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
    if (!address) return alert('Please enter your delivery address!')
    setPlacing(true)
    const { data: order, error } = await supabase.from('orders').insert({
      user_id: user.id,
      total,
      status: 'pending',
      notes: `Address: ${address}${notes ? `\nNotes: ${notes}` : ''}`,
    }).select().single()
    if (error) { alert('Error placing order'); setPlacing(false); return }
    const items = cart.map(item => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price,
    }))
    await supabase.from('order_items').insert(items)
    localStorage.removeItem('cart')
    setCart([])
    setPlacing(false)
    navigate('/orders')
  }

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Catalog', path: '/catalog' },
    { label: 'Orders', path: '/orders' },
    { label: 'Messages', path: '/messages' },
    { label: 'Location', path: '/location' },
  ]

  return (
    <div style={{ backgroundColor: '#050505', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", color: '#fff' }}>

      {/* Navbar */}
      <nav style={{ backgroundColor: '#080808', borderBottom: '1px solid #181818', padding: '0 2.5rem', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <img src={logo} alt="Perfect Tone" style={{ height: '55px', objectFit: 'contain', cursor: 'pointer' }} onClick={() => navigate('/')} />
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {navLinks.map(link => (
            <a key={link.label} onClick={() => navigate(link.path)} href="#" style={{ color: '#666', textDecoration: 'none', fontWeight: '500', fontSize: '0.9rem' }}>{link.label}</a>
          ))}
          <div onClick={() => navigate('/cart')} style={{ background: '#22c55e', color: '#000', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
            🛒 Cart ({cart.length})
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2rem' }}>
          Your <span style={{ color: '#22c55e' }}>Cart</span>
        </h1>

        {cart.length === 0 ? (
          <div style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', padding: '4rem', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🛒</div>
            <p style={{ color: '#444', fontSize: '14px', marginBottom: '1.5rem' }}>Your cart is empty</p>
            <button onClick={() => navigate('/catalog')} style={{ background: '#22c55e', color: '#000', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase' }}>Browse Catalog</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>

            {/* Cart Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cart.map(item => (
                <div key={item.id} style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '70px', height: '70px', borderRadius: '10px', overflow: 'hidden', background: '#111', flexShrink: 0 }}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>🎸</div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#ddd' }}>{item.name}</div>
                    <div style={{ fontSize: '11px', color: '#444', marginTop: '2px' }}>{item.category}</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#22c55e', marginTop: '6px' }}>₱{item.price?.toLocaleString()}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={() => updateQty(item.id, item.quantity - 1)} style={{ width: '28px', height: '28px', background: '#111', border: '1px solid #1a1a1a', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '16px' }}>-</button>
                    <span style={{ fontSize: '14px', fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)} style={{ width: '28px', height: '28px', background: '#111', border: '1px solid #1a1a1a', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '16px' }}>+</button>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff', minWidth: '80px', textAlign: 'right' }}>₱{(item.price * item.quantity).toLocaleString()}</div>
                  <button onClick={() => removeItem(item.id)} style={{ background: '#2d0a0a', color: '#ef4444', border: '1px solid #ef444433', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Remove</button>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', padding: '20px', height: 'fit-content' }}>
              <h2 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', marginBottom: '16px' }}>Order Summary</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#666' }}>{item.name} x{item.quantity}</span>
                    <span style={{ color: '#ddd' }}>₱{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div style={{ height: '1px', background: '#151515', marginBottom: '16px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#ddd' }}>Total</span>
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#22c55e' }}>₱{total.toLocaleString()}</span>
              </div>

              {/* Delivery Address */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ color: '#555', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                  Delivery Address <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Enter your full delivery address..."
                  style={{ width: '100%', background: '#111', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '12px', outline: 'none', resize: 'vertical', minHeight: '70px', boxSizing: 'border-box' }}
                />
              </div>

              {/* Order Notes */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#555', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Order Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any special instructions..."
                  style={{ width: '100%', background: '#111', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '12px', outline: 'none', resize: 'vertical', minHeight: '60px', boxSizing: 'border-box' }}
                />
              </div>

              <button onClick={placeOrder} disabled={placing} style={{
                width: '100%', background: '#22c55e', color: '#000', border: 'none',
                borderRadius: '10px', padding: '12px', fontSize: '13px',
                fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase',
                letterSpacing: '0.06em', opacity: placing ? 0.7 : 1,
              }}>{placing ? 'Placing Order...' : 'Place Order'}</button>
              <button onClick={() => navigate('/catalog')} style={{ width: '100%', background: 'transparent', color: '#666', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', marginTop: '8px', textTransform: 'uppercase' }}>Continue Shopping</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Cart