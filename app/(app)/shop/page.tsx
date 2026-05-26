'use client';

import { useEffect, useState } from 'react';
import { fetchProducts, fetchFeaturedProducts, searchProducts, CATEGORIES, getProductImage } from '../../../lib/products';
import { Product, ProductCategory } from '../../../lib/types';

const c = {
  bg:      '#0E0C09',
  card:    '#181410',
  gold:    '#C7AB78',
  cream:   '#F5F2EE',
  muted:   '#807A74',
  divider: '#2A251E',
};

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts(4).then(({ data }) => setFeatured(data));
  }, []);

  useEffect(() => {
    setLoading(true);
    if (search.trim()) {
      searchProducts(search).then(({ data }) => { setProducts(data); setLoading(false); });
    } else {
      fetchProducts(category ?? undefined).then(({ data }) => { setProducts(data); setLoading(false); });
    }
  }, [category, search]);

  const displayProducts = search ? products : products.filter(p => !featured.some(f => f.id === p.id));

  return (
    <div style={{ backgroundColor: c.bg, minHeight: '100vh', paddingBottom: 80 }}>
      {/* Hero */}
      <div style={{
        padding: '64px 48px 48px',
        textAlign: 'center',
        borderBottom: `1px solid ${c.divider}`,
      }}>
        <p style={{ fontSize: 11, color: c.gold, letterSpacing: 4, marginBottom: 12, fontFamily: "'Barlow', sans-serif" }}>
          THE COLLECTION
        </p>
        <h1 style={{
          fontSize: 42, color: c.cream, fontWeight: 300, margin: 0,
          fontFamily: "'Cormorant Garamond', serif",
        }}>
          Shop YVEY
        </h1>
        <p style={{ fontSize: 14, color: c.muted, marginTop: 12, fontFamily: "'Barlow', sans-serif" }}>
          Curated luxury for textured hair and radiant skin.
        </p>
      </div>

      {/* Search + Filters */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px 0' }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginBottom: 32 }}>
          {/* Search */}
          <div style={{
            flex: 1, minWidth: 240,
            display: 'flex', alignItems: 'center',
            backgroundColor: c.card, borderRadius: 8,
            border: `1px solid ${c.divider}`,
            padding: '10px 16px',
          }}>
            <span style={{ color: c.muted, marginRight: 10 }}>&#x2315;</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: c.cream, fontSize: 14, fontFamily: "'Barlow', sans-serif",
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{
                background: 'none', border: 'none', color: c.muted, cursor: 'pointer', fontSize: 18,
              }}>
                &times;
              </button>
            )}
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setCategory(null)}
              style={{
                padding: '8px 16px', borderRadius: 99, cursor: 'pointer',
                border: `1px solid ${!category ? c.gold : c.divider}`,
                backgroundColor: !category ? c.gold : 'transparent',
                color: !category ? c.bg : c.muted,
                fontSize: 11, fontWeight: 600, letterSpacing: 1,
                fontFamily: "'Barlow', sans-serif",
              }}
            >
              ALL
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key as ProductCategory)}
                style={{
                  padding: '8px 16px', borderRadius: 99, cursor: 'pointer',
                  border: `1px solid ${category === cat.key ? c.gold : c.divider}`,
                  backgroundColor: category === cat.key ? c.gold : 'transparent',
                  color: category === cat.key ? c.bg : c.muted,
                  fontSize: 11, fontWeight: 600, letterSpacing: 1,
                  fontFamily: "'Barlow', sans-serif",
                }}
              >
                {cat.icon} {cat.label.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Section */}
        {!search && !category && featured.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <h2 style={{
              fontSize: 11, color: c.muted, letterSpacing: 3, marginBottom: 20,
              fontFamily: "'Barlow', sans-serif", fontWeight: 600,
            }}>
              FEATURED
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
              {featured.map(product => (
                <a
                  key={product.id}
                  href={`/shop/${product.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    backgroundColor: c.card, borderRadius: 12,
                    border: `1px solid ${c.gold}33`,
                    overflow: 'hidden', transition: 'transform 0.2s, border-color 0.2s',
                  }}>
                    <div style={{
                      height: 200, overflow: 'hidden',
                      background: `url(${getProductImage(product)}) center/cover`,
                    }} />
                    <div style={{ padding: 16 }}>
                      <p style={{ fontSize: 10, color: c.gold, letterSpacing: 2, margin: '0 0 6px', fontFamily: "'Barlow', sans-serif" }}>
                        {product.category.replace('_', ' ').toUpperCase()} &bull; FEATURED
                      </p>
                      <h3 style={{ fontSize: 16, color: c.cream, margin: '0 0 8px', fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
                        {product.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18, fontWeight: 700, color: c.gold, fontFamily: "'Barlow', sans-serif" }}>
                          ${product.price}
                        </span>
                        {product.compare_price && (
                          <span style={{ fontSize: 13, color: c.muted, textDecoration: 'line-through' }}>
                            ${product.compare_price}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div>
          <h2 style={{
            fontSize: 11, color: c.muted, letterSpacing: 3, marginBottom: 20,
            fontFamily: "'Barlow', sans-serif", fontWeight: 600,
          }}>
            {search ? `RESULTS FOR "${search.toUpperCase()}"` : 'ALL PRODUCTS'}
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <p style={{ color: c.muted, fontFamily: "'Barlow', sans-serif" }}>Loading...</p>
            </div>
          ) : displayProducts.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: 48,
              backgroundColor: c.card, borderRadius: 12,
              border: `1px solid ${c.divider}`,
            }}>
              <p style={{ color: c.muted, fontFamily: "'Barlow', sans-serif" }}>No products found.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
              {displayProducts.map(product => (
                <a
                  key={product.id}
                  href={`/shop/${product.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    backgroundColor: c.card, borderRadius: 12,
                    border: `1px solid ${c.divider}`,
                    overflow: 'hidden', transition: 'transform 0.2s',
                  }}>
                    <div style={{
                      height: 180, overflow: 'hidden',
                      background: `url(${getProductImage(product)}) center/cover`,
                    }} />
                    <div style={{ padding: 16 }}>
                      <p style={{ fontSize: 10, color: c.muted, letterSpacing: 1.5, margin: '0 0 6px', fontFamily: "'Barlow', sans-serif" }}>
                        {product.category.replace('_', ' ').toUpperCase()}
                      </p>
                      <h3 style={{ fontSize: 16, color: c.cream, margin: '0 0 6px', fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, lineHeight: 1.3 }}>
                        {product.name}
                      </h3>
                      <p style={{
                        fontSize: 12, color: c.muted, margin: '0 0 10px', lineHeight: 1.5,
                        fontFamily: "'Barlow', sans-serif",
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any,
                        overflow: 'hidden',
                      }}>
                        {product.description}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18, fontWeight: 700, color: c.gold, fontFamily: "'Barlow', sans-serif" }}>
                            ${product.price}
                          </span>
                          {product.compare_price && (
                            <span style={{ fontSize: 12, color: c.muted, textDecoration: 'line-through' }}>
                              ${product.compare_price}
                            </span>
                          )}
                        </div>
                        {product.stock <= 5 && product.stock > 0 && (
                          <span style={{ fontSize: 10, color: '#D4A054', fontFamily: "'Barlow', sans-serif" }}>
                            Only {product.stock} left
                          </span>
                        )}
                        {product.stock === 0 && (
                          <span style={{ fontSize: 10, color: '#E57373', fontFamily: "'Barlow', sans-serif" }}>
                            Sold out
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
