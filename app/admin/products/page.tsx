'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '../../../lib/supabase';
import {
  fetchAllProducts, createProduct, updateProduct,
  toggleProductActive, toggleProductFeatured, deleteProduct,
  getProductImage, CATEGORIES,
} from '../../../lib/products';
import { Product, ProductCategory } from '../../../lib/types';

const c = {
  bg: '#0E0C09', card: '#181410', card2: '#1E1A14',
  gold: '#C7AB78', goldLight: '#E5D1AD', cream: '#F5F2EE',
  muted: '#807A74', mutedLight: '#B3ADA6', divider: '#2A251E',
  green: '#27AE60', red: '#C0392B',
};

const CAT_LABELS: Record<string, string> = {
  haircare: 'Haircare', skincare: 'Skincare',
  styling: 'Styling', ritual_kits: 'Ritual Kits',
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
      const { data } = await fetchAllProducts();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = products.filter(p => {
    const matchCat = filter === 'all' || p.category === filter;
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const activeCount = products.filter(p => p.is_active).length;
  const featuredCount = products.filter(p => p.is_featured).length;

  async function handleToggleActive(p: Product) {
    await toggleProductActive(p.id, !p.is_active);
    load();
  }

  async function handleToggleFeatured(p: Product) {
    await toggleProductFeatured(p.id, !p.is_featured);
    load();
  }

  async function handleDelete(p: Product) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    await deleteProduct(p.id);
    load();
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: c.bg, fontFamily: "'Barlow', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        backgroundColor: c.bg, borderBottom: `1px solid ${c.divider}`,
        padding: '20px 32px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: 11, color: c.gold, letterSpacing: 3, fontWeight: 600, margin: '0 0 4px' }}>YVEY ADMIN</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: c.cream, margin: '0 0 6px' }}>Products</h1>
            <p style={{ fontSize: 12, color: c.muted, margin: 0 }}>
              {products.length} total · {activeCount} active · {featuredCount} featured
            </p>
          </div>
          <button onClick={() => { setEditing(null); setShowModal(true); }} style={{
            backgroundColor: c.gold, color: c.bg, border: 'none',
            padding: '12px 22px', borderRadius: 6, fontSize: 12,
            fontWeight: 700, letterSpacing: 2, cursor: 'pointer',
          }}>+ ADD PRODUCT</button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{
        borderBottom: `1px solid ${c.divider}`, padding: '16px 32px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            style={{
              backgroundColor: c.card, color: c.cream, border: `1px solid ${c.divider}`,
              padding: '10px 16px', borderRadius: 20, fontSize: 13, width: 240, outline: 'none',
            }} />
          {[{ key: 'all', label: 'All' }, ...CATEGORIES].map(cat => (
            <button key={cat.key} onClick={() => setFilter(cat.key)} style={{
              backgroundColor: filter === cat.key ? c.gold : c.card,
              color: filter === cat.key ? c.bg : c.muted,
              border: `1px solid ${filter === cat.key ? c.gold : c.divider}`,
              padding: '8px 16px', borderRadius: 16, fontSize: 11,
              fontWeight: 600, letterSpacing: 1, cursor: 'pointer',
            }}>{cat.label.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px' }}>
        {loading ? (
          <p style={{ color: c.muted, textAlign: 'center', padding: 60 }}>Loading products...</p>
        ) : filtered.length === 0 ? (
          <div style={{ backgroundColor: c.card, borderRadius: 12, padding: 60, textAlign: 'center', border: `1px solid ${c.divider}` }}>
            <p style={{ fontSize: 28, margin: '0 0 10px' }}>✦</p>
            <p style={{ color: c.muted }}>No products found.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${c.divider}` }}>
                {['Product', 'Category', 'Price', 'Stock', '★', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '12px 16px', fontSize: 10,
                    color: c.muted, letterSpacing: 1.5, fontWeight: 600,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} style={{
                  backgroundColor: i % 2 === 0 ? c.card : 'transparent',
                  opacity: p.is_active ? 1 : 0.5,
                  borderBottom: `1px solid ${c.divider}`,
                }}>
                  <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    {p.image_url ? (
                      <img src={getProductImage(p)} alt="" style={{
                        width: 40, height: 40, borderRadius: 6, objectFit: 'cover',
                        filter: 'brightness(0.9)',
                      }} />
                    ) : (
                      <div style={{
                        width: 40, height: 40, borderRadius: 6, backgroundColor: c.card2,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ color: c.gold, fontSize: 16 }}>✦</span>
                      </div>
                    )}
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: c.cream, margin: 0 }}>{p.name}</p>
                      <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                        {(p.tags || []).slice(0, 3).map(t => (
                          <span key={t} style={{
                            fontSize: 9, color: c.gold, backgroundColor: c.gold + '15',
                            padding: '2px 6px', borderRadius: 8, letterSpacing: 0.5,
                          }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: c.mutedLight }}>
                    {CAT_LABELS[p.category] || p.category}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: c.cream, fontWeight: 600 }}>
                    ${p.price}
                    {p.compare_price && (
                      <span style={{ fontSize: 11, color: c.muted, textDecoration: 'line-through', marginLeft: 6 }}>
                        ${p.compare_price}
                      </span>
                    )}
                  </td>
                  <td style={{
                    padding: '12px 16px', fontSize: 13,
                    color: p.stock < 10 ? c.red : c.mutedLight,
                    fontWeight: p.stock < 10 ? 700 : 400,
                  }}>{p.stock}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => handleToggleFeatured(p)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 18, color: p.is_featured ? c.gold : c.divider,
                    }}>★</button>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => handleToggleActive(p)} style={{
                      background: p.is_active ? c.green + '20' : c.red + '20',
                      color: p.is_active ? c.green : c.red,
                      border: 'none', borderRadius: 12,
                      padding: '4px 12px', fontSize: 11, fontWeight: 600,
                      letterSpacing: 0.5, cursor: 'pointer',
                    }}>{p.is_active ? 'Active' : 'Inactive'}</button>
                  </td>
                  <td style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
                    <button onClick={() => { setEditing(p); setShowModal(true); }} style={{
                      backgroundColor: c.card2, color: c.mutedLight, border: `1px solid ${c.divider}`,
                      padding: '6px 14px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                    }}>Edit</button>
                    <button onClick={() => handleDelete(p)} style={{
                      backgroundColor: c.red + '15', color: c.red, border: `1px solid ${c.red}30`,
                      padding: '6px 14px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                    }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ProductModal
          product={editing}
          userId={userId}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={() => { setShowModal(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function ProductModal({ product, userId, onClose, onSaved }: {
  product: Product | null; userId: string | null;
  onClose: () => void; onSaved: () => void;
}) {
  const isEdit = !!product;
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [comparePrice, setComparePrice] = useState(product?.compare_price?.toString() || '');
  const [category, setCategory] = useState<ProductCategory>(product?.category || 'haircare');
  const [stock, setStock] = useState(product?.stock?.toString() || '0');
  const [imageUrl, setImageUrl] = useState(product?.image_url || '');
  const [tags, setTags] = useState((product?.tags || []).join(', '));
  const [isFeatured, setIsFeatured] = useState(product?.is_featured || false);
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !price.trim()) {
      alert('Name and price are required.'); return;
    }
    setSaving(true);
    const payload = {
      name: name.trim(), description: description.trim(),
      price: parseFloat(price), compare_price: comparePrice ? parseFloat(comparePrice) : null,
      category, stock: parseInt(stock) || 0,
      image_url: imageUrl.trim() || null, images: [] as string[],
      variants: [] as { name: string; price: number }[],
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      is_featured: isFeatured, is_active: isActive,
    };
    try {
      if (isEdit && product) {
        const { error } = await updateProduct(product.id, payload);
        if (error) throw error;
      } else {
        if (!userId) { alert('Not signed in.'); setSaving(false); return; }
        const { error } = await createProduct(payload as any, userId);
        if (error) throw error;
      }
      onSaved();
    } catch (err: any) {
      alert(err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: c.bg, color: c.cream, border: `1px solid ${c.divider}`,
    padding: 12, borderRadius: 8, fontSize: 13, width: '100%',
    boxSizing: 'border-box', outline: 'none',
  };

  const isValidImg = imageUrl && (() => { try { return ['http:', 'https:'].includes(new URL(imageUrl).protocol); } catch { return false; } })();

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        backgroundColor: c.card, borderRadius: 16, border: `1px solid ${c.divider}`,
        width: '90%', maxWidth: 640, maxHeight: '85vh', overflow: 'auto', padding: 32,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: c.cream, margin: 0 }}>
            {isEdit ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: c.muted,
            fontSize: 24, cursor: 'pointer',
          }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div style={{ gridColumn: '1 / -1', marginBottom: 16 }}>
              <label style={{ fontSize: 10, color: c.muted, letterSpacing: 2, display: 'block', marginBottom: 6 }}>NAME *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Product name" style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1', marginBottom: 16 }}>
              <label style={{ fontSize: 10, color: c.muted, letterSpacing: 2, display: 'block', marginBottom: 6 }}>DESCRIPTION</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Product description..." rows={3}
                style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 10, color: c.muted, letterSpacing: 2, display: 'block', marginBottom: 6 }}>PRICE *</label>
              <input value={price} onChange={e => setPrice(e.target.value)} type="number" step="0.01" placeholder="0.00" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 10, color: c.muted, letterSpacing: 2, display: 'block', marginBottom: 6 }}>COMPARE PRICE</label>
              <input value={comparePrice} onChange={e => setComparePrice(e.target.value)} type="number" step="0.01" placeholder="Original price" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 10, color: c.muted, letterSpacing: 2, display: 'block', marginBottom: 6 }}>CATEGORY</label>
              <select value={category} onChange={e => setCategory(e.target.value as ProductCategory)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {CATEGORIES.map(cat => (
                  <option key={cat.key} value={cat.key}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 10, color: c.muted, letterSpacing: 2, display: 'block', marginBottom: 6 }}>STOCK</label>
              <input value={stock} onChange={e => setStock(e.target.value)} type="number" placeholder="0" style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1', marginBottom: 16 }}>
              <label style={{ fontSize: 10, color: c.muted, letterSpacing: 2, display: 'block', marginBottom: 6 }}>IMAGE URL</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." style={{ ...inputStyle, flex: 1 }} />
                {isValidImg && (
                  <img src={imageUrl} alt="" style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                )}
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1', marginBottom: 16 }}>
              <label style={{ fontSize: 10, color: c.muted, letterSpacing: 2, display: 'block', marginBottom: 6 }}>TAGS</label>
              <input value={tags} onChange={e => setTags(e.target.value)} placeholder="bestseller, type4, hydration" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: c.cream, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} style={{ accentColor: c.gold, width: 16, height: 16 }} />
              Featured product
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: c.cream, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} style={{ accentColor: c.gold, width: 16, height: 16 }} />
              Active (visible in app)
            </label>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" disabled={saving} style={{
              backgroundColor: c.gold, color: c.bg, border: 'none',
              padding: '14px 28px', borderRadius: 8, fontSize: 12,
              fontWeight: 700, letterSpacing: 2, cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}>{saving ? 'SAVING...' : (isEdit ? 'SAVE CHANGES' : 'CREATE PRODUCT')}</button>
            <button type="button" onClick={onClose} style={{
              backgroundColor: 'transparent', color: c.muted,
              border: `1px solid ${c.divider}`, padding: '14px 28px',
              borderRadius: 8, fontSize: 12, fontWeight: 700, letterSpacing: 2, cursor: 'pointer',
            }}>CANCEL</button>
          </div>
        </form>
      </div>
    </div>
  );
}
