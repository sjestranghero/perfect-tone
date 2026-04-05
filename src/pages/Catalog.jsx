import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

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
    if (existing) { existing.quantity += 1 } else { cart.push({ ...product, quantity: 1 }) }
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
      <Navbar active="Catalog" user={user} cartCount={cartCount} />

      {/* Header */}
      <div style={{ textAlign: 'center', padding: '2rem 1.5rem 1rem' }}>
        <h1 style={{ fontSize: 'clamp(1.4rem, 6vw, 2rem)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Our <span style={{ color: '#22c55e' }}>Catalog</span>
        </h1>
        <p style={{ color: '#555', fontSize: '0.9rem', marginTop: '0.4rem' }}>Browse our full collection of premium gear</p>
      </div>

      {/* Search */}
      <div style={{ padding: '0 1.5rem 1rem', display: 'flex', justifyContent: 'center' }}>
        <input
          type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', maxWidth: '480px', backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '0.7rem 1rem', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
        />
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', padding: '0 1.5rem 1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)} style={{
            backgroundColor: category === cat ? '#22c55e' : '#0a0a0a',
            color: category === cat ? '#000' : '#555',
            border: `1px solid ${category === cat ? '#22c55e' : '#151515'}`,
            borderRadius: '20px', padding: '0.4rem 1rem',
            fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>{cat}</button>
        ))}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#22c55e' }}>Loading products...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎸</div>
          <p style={{ color: '#555' }}>No products found.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.8rem', padding: '0 1.5rem 3rem' }}>
          {filtered.map(product => (
            <div key={product.id} style={{ backgroundColor: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ height: '160px', backgroundColor: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                {product.image_url ? <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '40px' }}>🎸</span>}
                {product.stock === 0 && (
                  <div style={{ position: 'absolute', top: '8px', right: '8px', background: '#ef444422', color: '#ef4444', border: '1px solid #ef444433', borderRadius: '20px', padding: '2px 8px', fontSize: '9px', fontWeight: '700' }}>Out of Stock</div>
                )}
                {product.stock > 0 && product.stock <= 3 && (
                  <div style={{ position: 'absolute', top: '8px', right: '8px', background: '#f9731622', color: '#f97316', border: '1px solid #f9731633', borderRadius: '20px', padding: '2px 8px', fontSize: '9px', fontWeight: '700' }}>Only {product.stock} left!</div>
                )}
              </div>
              <div style={{ padding: '0.8rem' }}>
                <div style={{ fontSize: '0.65rem', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600', marginBottom: '0.2rem' }}>{product.category}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.2rem', color: '#ddd', lineHeight: 1.3 }}>{product.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#555', marginBottom: '0.6rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.description}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '1rem', fontWeight: '800', color: '#22c55e' }}>₱{product.price?.toLocaleString()}</span>
                  <span style={{ fontSize: '0.7rem', color: product.stock > 0 ? '#444' : '#ef4444' }}>{product.stock > 0 ? `${product.stock} left` : 'Out of stock'}</span>
                </div>
                <button
                  onClick={() => { if (!user) { navigate('/login'); return } addToCart(product) }}
                  disabled={product.stock === 0}
                  style={{ width: '100%', backgroundColor: product.stock > 0 ? '#22c55e' : '#111', color: product.stock > 0 ? '#000' : '#444', border: product.stock > 0 ? 'none' : '1px solid #1a1a1a', borderRadius: '8px', padding: '0.6rem', fontSize: '0.8rem', fontWeight: '700', cursor: product.stock > 0 ? 'pointer' : 'not-allowed', textTransform: 'uppercase' }}>
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