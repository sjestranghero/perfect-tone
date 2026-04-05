import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'

function Orders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login'); return }
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*, products(name, image_url, category))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setOrders(data || [])
      setLoading(false)
    }
    fetchOrders()
  }, [navigate])

  const statusStyle = (status) => {
    const map = {
      pending: { color: '#f97316', bg: '#2d1a0022', border: '#f9731633' },
      processing: { color: '#3b82f6', bg: '#0a1a3a22', border: '#3b82f633' },
      shipped: { color: '#a855f7', bg: '#1a0a2e22', border: '#a855f733' },
      completed: { color: '#22c55e', bg: '#0d2d0d22', border: '#22c55e33' },
      cancelled: { color: '#ef4444', bg: '#2d0a0a22', border: '#ef444433' },
    }
    return map[status] || { color: '#888', bg: '#11111122', border: '#88888833' }
  }

  const trackingSteps = ['pending', 'processing', 'shipped', 'completed']

  return (
    <div style={{ backgroundColor: '#050505', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", color: '#fff' }}>

      {/* Navbar */}
      <nav style={{ backgroundColor: '#080808', borderBottom: '1px solid #181818', padding: '0 2.5rem', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <img src={logo} alt="Perfect Tone" style={{ height: '55px', objectFit: 'contain', cursor: 'pointer' }} onClick={() => navigate('/')} />
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {[
            { label: 'Home', path: '/' },
            { label: 'Catalog', path: '/catalog' },
            { label: 'Orders', path: '/orders' },
            { label: 'Messages', path: '/messages' },
            { label: 'Location', path: '/location' },
          ].map(link => (
            <a key={link.label} onClick={() => navigate(link.path)} href="#" style={{ color: link.label === 'Orders' ? '#22c55e' : '#666', textDecoration: 'none', fontWeight: '500', fontSize: '0.9rem' }}>{link.label}</a>
          ))}
        </div>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2rem' }}>
          My <span style={{ color: '#22c55e' }}>Orders</span>
        </h1>

        {loading ? (
          <div style={{ color: '#22c55e' }}>Loading orders...</div>
        ) : orders.length === 0 ? (
          <div style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', padding: '4rem', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '1rem' }}>📦</div>
            <p style={{ color: '#444', fontSize: '14px', marginBottom: '1.5rem' }}>No orders yet</p>
            <button onClick={() => navigate('/catalog')} style={{ background: '#22c55e', color: '#000', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase' }}>Shop Now</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {orders.map(order => {
              const s = statusStyle(order.status)
              const currentStep = trackingSteps.indexOf(order.status)
              return (
                <div key={order.id} style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', overflow: 'hidden' }}>

                  {/* Order Header */}
                  <div style={{ padding: '14px 18px', background: '#0d0d0d', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Order ID</div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#22c55e' }}>#{order.id.slice(0, 8)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Date</div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#ddd' }}>{new Date(order.created_at).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</div>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#22c55e' }}>₱{order.total?.toLocaleString()}</div>
                      </div>
                    </div>
                    <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{order.status}</span>
                  </div>

                  {/* Tracking Steps */}
                  {order.status !== 'cancelled' && (
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid #111', background: '#0a0a0a' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '13px', left: '5%', right: '5%', height: '2px', background: '#1a1a1a', zIndex: 0 }} />
                        {[
                          { label: 'Order Placed', key: 'pending' },
                          { label: 'Processing', key: 'processing' },
                          { label: 'Shipped', key: 'shipped' },
                          { label: 'Delivered', key: 'completed' },
                        ].map((step) => {
                          const stepIndex = trackingSteps.indexOf(step.key)
                          const isDone = stepIndex <= currentStep
                          return (
                            <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 1, flex: 1 }}>
                              <div style={{
                                width: '28px', height: '28px', borderRadius: '50%',
                                background: isDone ? '#22c55e' : '#111',
                                border: `2px solid ${isDone ? '#22c55e' : '#333'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '12px', fontWeight: '700', color: isDone ? '#000' : '#333',
                              }}>{isDone ? '✓' : ''}</div>
                              <div style={{ fontSize: '10px', color: isDone ? '#22c55e' : '#444', fontWeight: isDone ? '600' : '400', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{step.label}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Order Notes/Address */}
                  {order.notes && (
                    <div style={{ padding: '10px 18px', borderBottom: '1px solid #111', background: '#0d0d0d' }}>
                      <div style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Delivery Info</div>
                      <div style={{ fontSize: '12px', color: '#888', whiteSpace: 'pre-line' }}>{order.notes}</div>
                    </div>
                  )}

                  {/* Order Items */}
                  <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {order.order_items?.map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#111', overflow: 'hidden', flexShrink: 0 }}>
                          {item.products?.image_url ? (
                            <img src={item.products.image_url} alt={item.products?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🎸</div>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#ddd' }}>{item.products?.name}</div>
                          <div style={{ fontSize: '11px', color: '#444' }}>{item.products?.category} • x{item.quantity}</div>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#22c55e' }}>₱{item.price?.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Orders