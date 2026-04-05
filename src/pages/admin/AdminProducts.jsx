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
      <AdminSidebar active="Products" />

      <div style={{ marginLeft: '230px', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Topbar */}
        <div style={{ padding: '16px 28px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#080808' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Manage <span style={{ color: '#22c55e' }}>Products</span>
            </h1>
            <p style={{ fontSize: '11px', color: '#444', marginTop: '2px' }}>{products.length} products in catalog</p>
          </div>
          <button onClick={() => { setShowForm(!showForm); setEditProduct(null); setForm({ name: '', description: '', price: '', stock: '', category: 'Guitars' }); setImagePreview(null) }} style={{
            background: showForm ? '#1a1a1a' : '#22c55e',
            color: showForm ? '#888' : '#000',
            border: showForm ? '1px solid #333' : 'none',
            borderRadius: '8px', padding: '8px 18px',
            fontSize: '12px', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase',
          }}>{showForm ? 'Cancel' : '+ Add Product'}</button>
        </div>

        <div style={{ padding: '24px 28px' }}>

          {/* Add/Edit Form */}
          {showForm && (
            <div style={{ background: '#0a0a0a', border: '1px solid #22c55e22', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '4px', height: '20px', background: '#22c55e', borderRadius: '4px' }} />
                <h2 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#22c55e' }}>
                  {editProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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

          {/* Products Table */}
          {loading ? (
            <div style={{ color: '#22c55e', fontSize: '14px' }}>Loading products...</div>
          ) : products.length === 0 ? (
            <div style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎸</div>
              <div style={{ color: '#444', fontSize: '13px' }}>No products yet. Add your first product!</div>
            </div>
          ) : (
            <div style={{ background: '#0a0a0a', border: '1px solid #151515', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 110px 100px 70px 120px', padding: '10px 18px', background: '#0d0d0d', borderBottom: '1px solid #111' }}>
                {['Image', 'Product', 'Category', 'Price', 'Stock', 'Actions'].map(h => (
                  <div key={h} style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>{h}</div>
                ))}
              </div>
              {products.map(product => (
                <div key={product.id} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 110px 100px 70px 120px', padding: '14px 18px', borderBottom: '1px solid #0d0d0d', alignItems: 'center' }}>
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
                  <div>
                    <span style={{ background: '#0d2d0d', color: '#22c55e', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '600' }}>{product.category}</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#22c55e' }}>₱{product.price?.toLocaleString()}</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: product.stock > 0 ? '#22c55e' : '#ef4444' }}>{product.stock}</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleEdit(product)} style={{ background: '#0a1a3a', color: '#3b82f6', border: '1px solid #3b82f633', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => handleDelete(product.id)} style={{ background: '#2d0a0a', color: '#ef4444', border: '1px solid #ef444433', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Del</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminProducts