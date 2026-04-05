import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'

function Catalog() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [cartCount, setCartCount] = useState(0)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
      setProducts(data || [])
      setLoading(false)
    }
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const stored = localStorage.getItem('cart')
      setCartCount(stored ? JSON.parse(stored).length : 0)
    }
    fetchProducts()
    getUser()
  }, [])

  const addToCart = (product) => {
    const stored = localStorage.getItem('cart')
    const cart = stored ? JSON.parse(stored) : []
    const existing = cart.find(i => i.id === product.id)
    if (existing) {
      existing.quantity += 1
    } else {
      cart.push({ ...product, quantity: 1 })
    }
    localStorage.setItem('cart', JSON.stringify(cart))
    setCartCount(cart.length)
    alert(`✅ ${product.name} added to cart!`)
  }

  const filtered = products.filter(p => {
    const matchCat = category === 'All' || p.category === category
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const categories = ['All', 'Guitars', 'Pedals', 'Amplifiers', 'Accessories']

  return (
    <div style={{ backgroundColor: '#050505', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", color: '#fff' }}>

      {/* Navbar */}
      <nav style={{
        backgroundColor: '#080808',
        borderBottom: '1px solid #181818',
        padding: '0 2.5rem',
        height: '68px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <img src={logo} alt="Perfect Tone" style={{ height: '55px', objectFit: 'contain', cursor: 'pointer' }} onClick={() => navigate('/')} />
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {[
           { label: 'Home', path: '/' },
{ label: 'Catalog', path: '/catalog' },
{ label: 'Orders', path: '/orders' },
{ label: 'Messages', path: '/messages' },
{ label: 'Location', path: '/location' },
          ].map(link => (
            <a key={link.label} onClick={() => navigate(link.path)} href="#" style={{
              color: link.label === 'Catalog' ? '#22c55e' : '#666',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '0.9rem',
            }}>{link.label}</a>
          ))}
          <div onClick={() => navigate('/cart')} style={{
            background: '#111', border: '1px solid #1a1a1a',
            color: '#ddd', padding: '6px 14px', borderRadius: '6px',
            fontSize: '12px', fontWeight: '600', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            🛒 <span style={{ color: '#22c55e', fontWeight: '700' }}>{cartCount}</span>
          </div>
          {user ? (
            <div onClick={() => navigate('/orders')} style={{
              background: '#22c55e', color: '#000', padding: '6px 14px',
              borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
            }}>My Orders</div>
          ) : (
            <button onClick={() => navigate('/login')} style={{
              backgroundColor: '#22c55e', color: '#000', padding: '0.45rem 1.2rem',
              borderRadius: '6px', border: 'none', fontWeight: '700', fontSize: '0.85rem',
              cursor: 'pointer', textTransform: 'uppercase',
            }}>Login</button>
          )}
        </div>
      </nav>

      {/* Header */}
      <div style={{ textAlign: 'center', padding: '3rem 2.5rem 1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Our <span style={{ color: '#22c55e' }}>Catalog</span>
        </h1>
        <p style={{ color: '#555', fontSize: '0.9rem', marginTop: '0.5rem' }}>Browse our full collection of premium gear</p>
      </div>

      {/* Search */}
      <div style={{ padding: '0 2.5rem 1.5rem', display: 'flex', justifyContent: 'center' }}>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', maxWidth: '480px',
            backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a',
            borderRadius: '10px', padding: '0.75rem 1rem',
            color: '#fff', fontSize: '0.95rem', outline: 'none',
          }}
        />
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: '0.75rem', padding: '0 2.5rem 2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)} style={{
            backgroundColor: category === cat ? '#22c55e' : '#0a0a0a',
            color: category === cat ? '#000' : '#555',
            border: `1px solid ${category === cat ? '#22c55e' : '#151515'}`,
            borderRadius: '20px', padding: '0.4rem 1.2rem',
            fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>{cat}</button>
        ))}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#22c55e', fontSize: '1.1rem' }}>Loading products...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎸</div>
          <p style={{ color: '#555', fontSize: '1rem' }}>No products found. Check back soon!</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '1.2rem',
          padding: '0 2.5rem 3rem',
        }}>
          {filtered.map(product => (
            <div key={product.id} style={{
              backgroundColor: '#0a0a0a',
              border: '1px solid #151515',
              borderRadius: '14px',
              overflow: 'hidden',
            }}>
              {/* Product Image */}
              <div style={{
                height: '180px', backgroundColor: '#0d0d0d',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', position: 'relative',
              }}>
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '48px' }}>🎸</span>
                )}
                {product.stock === 0 && (
                  <div style={{
                    position: 'absolute', top: '10px', right: '10px',
                    background: '#ef444422', color: '#ef4444',
                    border: '1px solid #ef444433', borderRadius: '20px',
                    padding: '3px 10px', fontSize: '10px', fontWeight: '700',
                  }}>Out of Stock</div>
                )}
                {product.stock > 0 && product.stock <= 3 && (
                  <div style={{
                    position: 'absolute', top: '10px', right: '10px',
                    background: '#f9731622', color: '#f97316',
                    border: '1px solid #f9731633', borderRadius: '20px',
                    padding: '3px 10px', fontSize: '10px', fontWeight: '700',
                  }}>Only {product.stock} left!</div>
                )}
              </div>

              {/* Product Info */}
              <div style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600', marginBottom: '0.3rem' }}>{product.category}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.3rem', color: '#ddd' }}>{product.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#555', marginBottom: '0.8rem', lineHeight: 1.5 }}>{product.description}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#22c55e' }}>₱{product.price?.toLocaleString()}</span>
                  <span style={{ fontSize: '0.75rem', color: product.stock > 0 ? '#444' : '#ef4444' }}>
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (!user) { navigate('/login'); return }
                    addToCart(product)
                  }}
                  disabled={product.stock === 0}
                  style={{
                    width: '100%',
                    backgroundColor: product.stock > 0 ? '#22c55e' : '#111',
                    color: product.stock > 0 ? '#000' : '#444',
                    border: product.stock > 0 ? 'none' : '1px solid #1a1a1a',
                    borderRadius: '8px', padding: '0.65rem',
                    fontSize: '0.85rem', fontWeight: '700',
                    cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                  {product.stock > 0 ? '+ Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}

export default Catalog