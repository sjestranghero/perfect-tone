import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState(null)

  useEffect(() => {
    const fetchOrders = async () => {
      // Step 1: Fetch orders
      const { data: ordersRaw, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) { console.error('Orders error:', error); setLoading(false); return }

      // Step 2: Fetch all order_items for these orders
      const orderIds = ordersRaw.map(o => o.id)
      const { data: allItems, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds)

      if (itemsError) console.error('Order items error:', itemsError)

      // Step 3: Fetch products for those items
      const productIds = [...new Set((allItems || []).map(i => i.product_id).filter(Boolean))]
      let productsMap = {}
      if (productIds.length > 0) {
        const { data: products, error: prodError } = await supabase
          .from('products')
          .select('id, name, image_url, category, price')
          .in('id', productIds)
        if (prodError) console.error('Products error:', prodError)
        ;(products || []).forEach(p => { productsMap[p.id] = p })
      }

      // Step 4: Attach items+products to each order & enrich with profile
      const enriched = await Promise.all(
        (ordersRaw || []).map(async (order) => {
          const items = (allItems || [])
            .filter(i => i.order_id === order.id)
            .map(i => ({ ...i, products: productsMap[i.product_id] || null }))

          let profile = null
          try {
            const { data: p } = await supabase
              .from('profiles')
              .select('full_name, email, phone')
              .eq('id', order.user_id)
              .single()
            profile = p
          } catch (e) {
            console.error('Profile fetch error:', e)
          }

          return { ...order, order_items: items, profiles: profile }
        })
      )

      setOrders(enriched)
      setLoading(false)
    }
    fetchOrders()
  }, [])

  const updateStatus = async (id, status) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id)
    if (error) { console.error('Update error:', error); return }
    setOrders(orders.map(o => o.id === id ? { ...o, status } : o))
  }

  const statusStyle = (status) => {
    const map = {
      pending:    { bg: '#2d1a0022', color: '#f97316', border: '#f9731633' },
      processing: { bg: '#0a1a3a22', color: '#3b82f6', border: '#3b82f633' },
      shipped:    { bg: '#1a0a2e22', color: '#a855f7', border: '#a855f733' },
      completed:  { bg: '#0d2d0d22', color: '#22c55e', border: '#22c55e33' },
      cancelled:  { bg: '#2d0a0a22', color: '#ef4444', border: '#ef444433' },
    }
    return map[status] || { bg: '#11111122', color: '#888', border: '#88888833' }
  }

  const parseNotes = (notes) => {
    if (!notes) return {}
    const result = {}
    notes.split('\n').forEach(line => {
      if (line.startsWith('Name: '))    result.name    = line.replace('Name: ', '')
      else if (line.startsWith('Email: '))   result.email   = line.replace('Email: ', '')
      else if (line.startsWith('Phone: '))   result.phone   = line.replace('Phone: ', '')
      else if (line.startsWith('Address: ')) result.address = line.replace('Address: ', '')
      else if (line.startsWith('Notes: '))   result.extra   = line.replace('Notes: ', '')
    })
    // notes field in cart is "Address: xxx\nNotes: yyy"
    if (!result.address && notes.includes('Address:')) {
      const match = notes.match(/Address:\s*(.+?)(\n|$)/)
      if (match) result.address = match[1].trim()
    }
    return result
  }

  const statuses = ['All', 'pending', 'processing', 'shipped', 'completed', 'cancelled']
  const filtered = filter === 'All' ? orders : orders.filter(o => o.status === filter)

  return (
    <div style={{ display: 'flex', backgroundColor: '#050505', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", color: '#fff' }}>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="mobile-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 40, display: 'none' }} />
      )}

      <div className="mobile-sidebar-wrapper" style={{ position: 'fixed', top: 0, left: sidebarOpen ? 0 : '-230px', height: '100vh', zIndex: 50, transition: 'left 0.3s ease', width: '230px' }}>
        <AdminSidebar active="Orders" onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="desktop-sidebar-spacer" style={{ width: '230px', flexShrink: 0 }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Topbar */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#080808', position: 'sticky', top: 0, zIndex: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hamburger-btn" style={{ background: '#111', border: '1px solid #222', borderRadius: '8px', padding: '7px 10px', cursor: 'pointer', color: '#fff', fontSize: '16px', display: 'none', lineHeight: 1 }}>☰</button>
            <div>
              <h1 style={{ fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Manage <span style={{ color: '#3b82f6' }}>Orders</span>
              </h1>
              <p style={{ fontSize: '10px', color: '#444', marginTop: '1px' }}>{orders.length} total orders</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px' }}>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {statuses.map(s => {
              const st = statusStyle(s)
              const isActive = filter === s
              const count = s === 'All' ? orders.length : orders.filter(o => o.status === s).length
              return (
                <button key={s} onClick={() => setFilter(s)} style={{
                  background: isActive ? (s === 'All' ? '#22c55e' : st.bg) : '#0a0a0a',
                  color: isActive ? (s === 'All' ? '#000' : st.color) : '#555',
                  border: isActive ? `1px solid ${s === 'All' ? '#22c55e' : st.border}` : '1px solid #151515',
                  borderRadius: '20px', padding: '5px 12px', fontSize: '10px', fontWeight: '600',
                  cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  {s} {count > 0 && <span style={{ opacity: 0.7 }}>({count})</span>}
                </button>
              )
            })}
          </div>

          {loading ? (
            <div style={{ color: '#3b82f6', fontSize: '14px' }}>Loading orders...</div>
          ) : filtered.length === 0 ? (
            <div style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📦</div>
              <div style={{ color: '#444', fontSize: '13px' }}>No orders found</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filtered.map(order => {
                const s = statusStyle(order.status)
                const info = parseNotes(order.notes)
                const isExpanded = expandedOrder === order.id
                const itemCount = order.order_items?.length || 0
                const totalQty = order.order_items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0

                // Best name/email: prefer parsed notes, fallback to profiles
                const displayName    = info.name    || order.profiles?.full_name || `User ${order.user_id?.slice(0, 6)}`
                const displayEmail   = info.email   || order.profiles?.email    || '—'
                const displayPhone   = info.phone   || order.profiles?.phone    || '—'
                const displayAddress = info.address || '—'

                return (
                  <div key={order.id} style={{ background: '#0a0a0a', border: `1px solid ${isExpanded ? '#22c55e22' : '#151515'}`, borderRadius: '14px', overflow: 'hidden', transition: 'border-color 0.2s' }}>

                    {/* Order header row */}
                    <div style={{ padding: '14px 16px', borderBottom: isExpanded ? '1px solid #111' : 'none', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>

                      <div style={{ minWidth: '90px' }}>
                        <div style={{ fontSize: '12px', color: '#22c55e', fontWeight: '700' }}>#{order.id.slice(0, 8)}</div>
                        <div style={{ fontSize: '10px', color: '#444', marginTop: '1px' }}>{new Date(order.created_at).toLocaleDateString()}</div>
                      </div>

                      <div style={{ flex: 1, minWidth: '130px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#ddd' }}>{displayName}</div>
                        <div style={{ fontSize: '11px', color: '#555', marginTop: '1px' }}>{displayEmail}</div>
                      </div>

                      <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '20px', padding: '3px 10px', fontSize: '10px', color: '#888', whiteSpace: 'nowrap' }}>
                        🛒 {itemCount} item{itemCount !== 1 ? 's' : ''} · qty {totalQty}
                      </div>

                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#22c55e', minWidth: '75px', textAlign: 'right' }}>
                        ₱{order.total?.toLocaleString()}
                      </div>

                      <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
                        {order.status}
                      </span>

                      <select value={order.status} onChange={e => updateStatus(order.id, e.target.value)}
                        style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '6px', padding: '6px 8px', color: '#ddd', fontSize: '11px', cursor: 'pointer', outline: 'none' }}>
                        {['pending', 'processing', 'shipped', 'completed', 'cancelled'].map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>

                      <button onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        style={{ background: isExpanded ? '#0d2d0d' : '#111', border: `1px solid ${isExpanded ? '#22c55e44' : '#1a1a1a'}`, borderRadius: '6px', padding: '6px 10px', color: isExpanded ? '#22c55e' : '#888', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {isExpanded ? 'Hide ▲' : 'Details ▼'}
                      </button>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div style={{ padding: '14px 16px', display: 'grid', gap: '12px' }} className="order-details-grid">

                        {/* Customer details */}
                        <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '14px' }}>
                          <div style={{ fontSize: '10px', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700', marginBottom: '12px' }}>
                            👤 Customer Details
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                            {[
                              { label: 'Full Name', value: displayName },
                              { label: 'Email',     value: displayEmail },
                              { label: 'Phone',     value: displayPhone },
                              { label: 'Address',   value: displayAddress },
                              ...(info.extra ? [{ label: 'Notes', value: info.extra }] : []),
                            ].map(row => (
                              <div key={row.label} style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                                <span style={{ color: '#555', minWidth: '72px', flexShrink: 0 }}>{row.label}:</span>
                                <span style={{ color: '#ccc' }}>{row.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Order items */}
                        <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '14px' }}>
                          <div style={{ fontSize: '10px', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700', marginBottom: '12px' }}>
                            📦 Order Items ({itemCount})
                          </div>
                          {itemCount === 0 ? (
                            <div style={{ color: '#555', fontSize: '12px', padding: '8px 0' }}>
                              No items found — the order may have been placed before item tracking was set up.
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {order.order_items.map(item => (
                                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#111', borderRadius: '8px' }}>
                                  <div style={{ width: '42px', height: '42px', borderRadius: '6px', background: '#1a1a1a', overflow: 'hidden', flexShrink: 0 }}>
                                    {item.products?.image_url
                                      ? <img src={item.products.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🎸</div>
                                    }
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#ddd' }}>{item.products?.name || `Product #${item.product_id?.slice(0,8)}`}</div>
                                    {item.products?.category && <div style={{ fontSize: '10px', color: '#555', marginTop: '1px' }}>{item.products.category}</div>}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#666', flexShrink: 0 }}>×{item.quantity}</div>
                                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#22c55e', flexShrink: 0 }}>₱{(item.price * item.quantity).toLocaleString()}</div>
                                </div>
                              ))}
                              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 4px', borderTop: '1px solid #1a1a1a', marginTop: '4px' }}>
                                <span style={{ fontSize: '12px', color: '#555' }}>Order Total</span>
                                <span style={{ fontSize: '15px', fontWeight: '800', color: '#22c55e' }}>₱{order.total?.toLocaleString()}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 769px) {
          .mobile-sidebar-wrapper { left: 0 !important; position: fixed !important; }
          .desktop-sidebar-spacer { display: block !important; }
          .hamburger-btn { display: none !important; }
          .mobile-overlay { display: none !important; }
          .order-details-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 768px) {
          .mobile-sidebar-wrapper { position: fixed !important; }
          .desktop-sidebar-spacer { display: none !important; }
          .hamburger-btn { display: block !important; }
          .mobile-overlay { display: block !important; }
          .order-details-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

export default AdminOrders