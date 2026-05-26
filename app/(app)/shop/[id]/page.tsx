'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchProductById, fetchProducts, getProductImage } from '../../../../lib/products';
import { Product } from '../../../../lib/types';

const c = {
  bg:      '#0E0C09',
  card:    '#181410',
  gold:    '#C7AB78',
  cream:   '#F5F2EE',
  muted:   '#807A74',
  divider: '#2A251E',
};

export default function ProductDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchProductById(id).then(({ data }) => {
      setProduct(data);
      setLoading(false);
      if (data) {
        fetchProducts(data.category).then(({ data: rel }) => {
          setRelated(rel.filter(r => r.id !== id).slice(0, 4));
        });
      }
    });
  }, [id]);

  function handleAdd() {
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: c.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: c.muted, fontFamily: "'Barlow', sans-serif" }}>Loading...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ backgroundColor: c.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: c.muted, fontFamily: "'Barlow', sans-serif" }}>Product not found.</p>
      </div>
    );
  }

  const currentPrice = product.variants.length > 0
    ? product.variants[selectedVariant]?.price ?? product.price
    : product.price;

  return (
    <div style={{ backgroundColor: c.bg, minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 32px' }}>
        {/* Back */}
        <a href="/shop" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          color: c.muted, textDecoration: 'none', fontSize: 13,
          fontFamily: "'Barlow', sans-serif", marginBottom: 32,
        }}>
          &larr; Back to Shop
        </a>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>
          {/* Image column */}
          <div>
            <div style={{
              borderRadius: 16, overflow: 'hidden',
              border: `1px solid ${c.divider}`,
              aspectRatio: '1',
              background: `url(${getProductImage(product)}) center/cover`,
              filter: 'brightness(0.9) saturate(0.95)',
            }} />
            {/* Image gallery thumbnails */}
            {product.images && product.images.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {product.images.map((img, i) => (
                  <div key={i} style={{
                    width: 64, height: 64, borderRadius: 8, overflow: 'hidden',
                    border: `1px solid ${c.divider}`,
                    background: `url(${img}) center/cover`,
                    cursor: 'pointer', opacity: 0.8,
                  }} />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <p style={{ fontSize: 11, color: c.gold, letterSpacing: 3, margin: '0 0 12px', fontFamily: "'Barlow', sans-serif" }}>
              {product.category.replace('_', ' ').toUpperCase()}
            </p>
            <h1 style={{
              fontSize: 36, color: c.cream, fontWeight: 400, margin: '0 0 16px',
              fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.2,
            }}>
              {product.name}
            </h1>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <span style={{
                fontSize: 40, fontWeight: 400, color: c.gold,
                fontFamily: "'Cormorant Garamond', serif",
              }}>
                ${currentPrice}
              </span>
              {product.compare_price && (
                <>
                  <span style={{ fontSize: 16, color: c.muted, textDecoration: 'line-through' }}>
                    ${product.compare_price}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: '#27AE60',
                    backgroundColor: '#27AE6018', borderRadius: 99,
                    padding: '4px 10px', fontFamily: "'Barlow', sans-serif",
                  }}>
                    Save ${product.compare_price - currentPrice}
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <p style={{ fontSize: 15, color: c.muted, lineHeight: 1.7, margin: '0 0 28px', fontFamily: "'Barlow', sans-serif" }}>
              {product.description}
            </p>

            {/* Tags */}
            {product.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
                {product.tags.map(tag => (
                  <span key={tag} style={{
                    fontSize: 10, color: c.gold, letterSpacing: 1.5,
                    backgroundColor: `${c.gold}15`, borderRadius: 99,
                    padding: '5px 12px', border: `1px solid ${c.gold}30`,
                    fontFamily: "'Barlow', sans-serif",
                  }}>
                    {tag.toUpperCase()}
                  </span>
                ))}
              </div>
            )}

            {/* Variants */}
            {product.variants.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontSize: 11, color: c.muted, letterSpacing: 2, marginBottom: 10, fontFamily: "'Barlow', sans-serif" }}>
                  SIZE / VARIANT
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {product.variants.map((v, i) => (
                    <button
                      key={v.name}
                      onClick={() => setSelectedVariant(i)}
                      style={{
                        padding: '10px 18px', borderRadius: 8, cursor: 'pointer',
                        border: `1px solid ${selectedVariant === i ? c.gold : c.divider}`,
                        backgroundColor: selectedVariant === i ? `${c.gold}15` : 'transparent',
                        color: selectedVariant === i ? c.gold : c.cream,
                        fontSize: 13, fontFamily: "'Barlow', sans-serif",
                      }}
                    >
                      {v.name} &mdash; ${v.price}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock */}
            <div style={{ marginBottom: 28 }}>
              {product.stock > 0 && product.stock <= 10 && (
                <p style={{ fontSize: 12, color: '#D4A054', margin: 0, fontFamily: "'Barlow', sans-serif" }}>
                  Only {product.stock} left in stock
                </p>
              )}
              {product.stock > 10 && (
                <p style={{ fontSize: 12, color: '#6B8F6B', margin: 0, fontFamily: "'Barlow', sans-serif" }}>
                  In stock
                </p>
              )}
              {product.stock === 0 && (
                <p style={{ fontSize: 12, color: '#E57373', margin: 0, fontFamily: "'Barlow', sans-serif" }}>
                  Sold out
                </p>
              )}
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAdd}
              disabled={product.stock === 0}
              style={{
                width: '100%', padding: '16px 32px', borderRadius: 8, cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                border: `1px solid ${c.gold}`,
                backgroundColor: added ? 'transparent' : (product.stock === 0 ? c.card : c.gold),
                color: added ? c.gold : (product.stock === 0 ? c.muted : c.bg),
                fontSize: 14, fontWeight: 700, letterSpacing: 2,
                fontFamily: "'Barlow', sans-serif",
                transition: 'all 0.2s',
                opacity: product.stock === 0 ? 0.5 : 1,
              }}
            >
              {product.stock === 0 ? 'SOLD OUT' : added ? '✓  ADDED TO BAG' : 'ADD TO BAG'}
            </button>

            {/* Membership note */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginTop: 16, padding: '12px 16px',
              backgroundColor: c.card, borderRadius: 8,
              border: `1px solid ${c.divider}`,
            }}>
              <span style={{ color: c.gold, fontSize: 14 }}>✦</span>
              <p style={{ fontSize: 12, color: c.muted, margin: 0, fontFamily: "'Barlow', sans-serif" }}>
                YVEY Members receive <span style={{ color: c.gold, fontWeight: 600 }}>free shipping</span> on every order.
              </p>
            </div>

            {/* Product info rows */}
            <div style={{ marginTop: 24, borderTop: `1px solid ${c.divider}`, paddingTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: c.muted, fontFamily: "'Barlow', sans-serif" }}>Category</span>
                <span style={{ fontSize: 12, color: c.cream, fontFamily: "'Barlow', sans-serif" }}>
                  {product.category.replace('_', ' ').replace(/^\w/, ch => ch.toUpperCase())}
                </span>
              </div>
              {product.tags.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: c.muted, fontFamily: "'Barlow', sans-serif" }}>Tags</span>
                  <span style={{ fontSize: 12, color: c.cream, fontFamily: "'Barlow', sans-serif" }}>
                    {product.tags.join(', ')}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: c.muted, fontFamily: "'Barlow', sans-serif" }}>SKU</span>
                <span style={{ fontSize: 12, color: c.cream, fontFamily: "'Barlow', sans-serif", fontVariant: 'tabular-nums' }}>
                  {product.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div style={{ marginTop: 64 }}>
            <h2 style={{
              fontSize: 11, color: c.muted, letterSpacing: 3, marginBottom: 24,
              fontFamily: "'Barlow', sans-serif", fontWeight: 600,
            }}>
              YOU MAY ALSO LIKE
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
              {related.map(r => (
                <a key={r.id} href={`/shop/${r.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    backgroundColor: c.card, borderRadius: 12,
                    border: `1px solid ${c.divider}`, overflow: 'hidden',
                  }}>
                    <div style={{
                      height: 160, background: `url(${getProductImage(r)}) center/cover`,
                    }} />
                    <div style={{ padding: 14 }}>
                      <h3 style={{ fontSize: 14, color: c.cream, margin: '0 0 6px', fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
                        {r.name}
                      </h3>
                      <span style={{ fontSize: 15, fontWeight: 700, color: c.gold, fontFamily: "'Barlow', sans-serif" }}>
                        ${r.price}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
