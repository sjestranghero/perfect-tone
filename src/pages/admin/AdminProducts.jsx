import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', category: 'Guitars' })

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
      setProducts(data || [])
      setLoading(false)
    }
    fetchProducts()
  }, [])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const uploadImage = async () => {
    if (!imageFile) return null
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const { error } = await supabase.storage.from('product-images').upload(fileName, imageFile)
    if (error) { console.error(error); return null }
    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName)
    return data.publicUrl
  }

  const handleSubmit = async () => {
    if (!form.name || !form.price) return alert('Name and price are required!')
    setUploading(true)
    let imageUrl = editProduct?.image_url || null
    if (imageFile) imageUrl = await uploadImage()
    const payload = {
      name: form.name, description: form.description,
      price: parseFloat(form.price), stock: parseInt(form.stock),
      category: form.category, image_url: imageUrl,
    }
    if (editProduct) {
      await supabase.from('products').update(payload).eq('id', editProduct.id)
    } else {
      await supabase.from('products').insert(payload)
    }
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(data || [])
    setForm({ name: '', description: '', price: '', stock: '', category: 'Guitars' })
    setImageFile(null)
    setImagePreview(null)
    setEditProduct(null)
    setShowForm(false)
    setUploading(false)
  }

  const handleEdit = (product) => {
    setEditProduct(product)
    setForm({ name: product.name, description: product.description || '', price: product.price, stock: product.stock, category: product.category })
    setImagePreview(product.image_url)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    await supabase.from('products').delete().eq('id', id)
    setProducts(products.filter(p => p.id !== id))
  }

  const inputStyle = {
    width: '100%', backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a',
    borderRadius: '8px', padding: '10px 14px', color: '#fff',
    fontSize: '13px', outline: 'none', boxSizing: 'border-box',
  }

  const labelStyle = {
    color: '#555', fontSize: '11px', textTransform: 'uppercase',
    letterSpacing: '0.08em', display: 'block', marginBottom: '6px', fontWeight: '600',
  }

  return (
    <div style={{ display: 'flex', backgroundColor: '#050505', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", color: '#fff' }}>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="mobile-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 40, display: 'none' }} />
      )}

      <div className="mobile-sidebar-wrapper" style={{ position: 'fixed', top: 0, left: sidebarOpen ? 0 : '-230px', height: '100vh', zIndex: 50, transition: 'left 0.3s ease', width: '230px' }}>
        <AdminSidebar active="Products" onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="desktop-sidebar-spacer" style={{ width: '230px', flexShrink: 0 }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Topbar */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#080808', position: 'sticky', top: 0, zIndex: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hamburger-btn" style={{ background: '#111', border: '1px solid #222', borderRadius: '8px', padding: '7px 10px', cursor: 'pointer', color: '#fff', fontSize: '16px', display: 'none', lineHeight: 1 }}>☰</button>
            <div>
              <h1 style={{ fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Manage <span style={{ color: '#22c55e' }}>Products</span>
              </h1>
              <p style={{ fontSize: '10px', color: '#444', marginTop: '1px' }}>{products.length} products in catalog</p>
            </div>
          </div>
          <button onClick={() => { setShowForm(!showForm); setEditProduct(null); setForm({ name: '', description: '', price: '', stock: '', category: 'Guitars' }); setImagePreview(null) }} style={{
            background: showForm ? '#1a1a1a' : '#22c55e',
            color: showForm ? '#888' : '#000',
            border: showForm ? '1px solid #333' : 'none',
            borderRadius: '8px', padding: '8px 14px',
            fontSize: '11px', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase', whiteSpace: 'nowrap',
          }}>{showForm ? 'Cancel' : '+ Add'}</button>
        </div>

        <div style={{ padding: '16px' }}>

          {/* Add/Edit Form */}
          {showForm && (
            <div style={{ background: '#0a0a0a', border: '1px solid #22c55e22', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '4px', height: '20px', background: '#22c55e', borderRadius: '4px' }} />
                <h2 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#22c55e' }}>
                  {editProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
              </div>
              <div className="form-grid" style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Product Name</label>
                  <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Fender Stratocaster" />
                </div>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select style={inputStyle} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {['Guitars', 'Pedals', 'Amplifiers', 'Accessories'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Price (₱)</label>
                  <input style={inputStyle} type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="e.g. 32000" />
                </div>
                <div>
                  <label style={labelStyle}>Stock</label>
                  <input style={inputStyle} type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="e.g. 10" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Description</label>
                  <textarea style={{ ...inputStyle, height: '80px', resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Short product description..." />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Product Image</label>
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ color: '#666', fontSize: '12px' }} />
                  {imagePreview && <img src={imagePreview} alt="Preview" style={{ marginTop: '10px', height: '100px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #1a1a1a' }} />}
                </div>
              </div>
              <button onClick={handleSubmit} disabled={uploading} style={{
                marginTop: '16px', background: '#22c55e', color: '#000',
                border: 'none', borderRadius: '8px', padding: '10px 24px',
                fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                textTransform: 'uppercase', opacity: uploading ? 0.7 : 1,
              }}>{uploading ? 'Saving...' : editProduct ? 'Update Product' : 'Add Product'}</button>
            </div>
          )}

          {/* Products List */}
          {loading ? (
            <div style={{ color: '#22c55e', fontSize: '14px' }}>Loading products...</div>
          ) : products.length === 0 ? (
            <div style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎸</div>
              <div style={{ color: '#444', fontSize: '13px' }}>No products yet. Add your first product!</div>
            </div>
          ) : (
            <div style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', overflow: 'hidden' }}>

              {/* Desktop table header */}
              <div className="table-header" style={{ display: 'grid', gridTemplateColumns: '60px 1fr 110px 100px 70px 120px', padding: '10px 18px', background: '#0d0d0d', borderBottom: '1px solid #111' }}>
                {['Image', 'Product', 'Category', 'Price', 'Stock', 'Actions'].map(h => (
                  <div key={h} style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>{h}</div>
                ))}
              </div>

              {products.map(product => (
                <div key={product.id}>
                  {/* Desktop row */}
                  <div className="desktop-row" style={{ display: 'grid', gridTemplateColumns: '60px 1fr 110px 100px 70px 120px', padding: '14px 18px', borderBottom: '1px solid #0d0d0d', alignItems: 'center' }}>
                    <div>
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #1a1a1a' }} />
                      ) : (
                        <div style={{ width: '42px', height: '42px', background: '#111', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', border: '1px solid #1a1a1a' }}>🎸</div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#ddd' }}>{product.name}</div>
                      <div style={{ fontSize: '11px', color: '#444', marginTop: '2px' }}>{product.description?.slice(0, 45)}...</div>
                    </div>
                    <div><span style={{ background: '#0d2d0d', color: '#22c55e', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '600' }}>{product.category}</span></div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#22c55e' }}>₱{product.price?.toLocaleString()}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: product.stock > 0 ? '#22c55e' : '#ef4444' }}>{product.stock}</div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => handleEdit(product)} style={{ background: '#0a1a3a', color: '#3b82f6', border: '1px solid #3b82f633', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDelete(product.id)} style={{ background: '#2d0a0a', color: '#ef4444', border: '1px solid #ef444433', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Del</button>
                    </div>
                  </div>

                  {/* Mobile card */}
                  <div className="mobile-card" style={{ display: 'none', padding: '14px 16px', borderBottom: '1px solid #0d0d0d' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #1a1a1a', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '56px', height: '56px', background: '#111', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', border: '1px solid #1a1a1a', flexShrink: 0 }}>🎸</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#ddd', marginBottom: '4px' }}>{product.name}</div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '6px' }}>
                          <span style={{ background: '#0d2d0d', color: '#22c55e', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '600' }}>{product.category}</span>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#22c55e' }}>₱{product.price?.toLocaleString()}</span>
                          <span style={{ fontSize: '11px', color: product.stock > 0 ? '#22c55e' : '#ef4444' }}>Stock: {product.stock}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => handleEdit(product)} style={{ background: '#0a1a3a', color: '#3b82f6', border: '1px solid #3b82f633', borderRadius: '6px', padding: '5px 12px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Edit</button>
                          <button onClick={() => handleDelete(product.id)} style={{ background: '#2d0a0a', color: '#ef4444', border: '1px solid #ef444433', borderRadius: '6px', padding: '5px 12px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Delete</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
          .form-grid { grid-template-columns: 1fr 1fr; }
          .table-header { display: grid !important; }
          .desktop-row { display: grid !important; }
          .mobile-card { display: none !important; }
        }
        @media (max-width: 768px) {
          .mobile-sidebar-wrapper { position: fixed !important; }
          .desktop-sidebar-spacer { display: none !important; }
          .hamburger-btn { display: block !important; }
          .mobile-overlay { display: block !important; }
          .form-grid { grid-template-columns: 1fr; }
          .table-header { display: none !important; }
          .desktop-row { display: none !important; }
          .mobile-card { display: block !important; }
        }
      `}</style>
    </div>
  )
}

export default AdminProducts