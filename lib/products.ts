import { createClient } from './supabase';
import { Product, ProductCategory } from './types';

export const CATEGORIES = [
  { key: 'haircare',    label: 'Haircare',    icon: '◎' },
  { key: 'skincare',    label: 'Skincare',    icon: '◇' },
  { key: 'styling',     label: 'Styling',     icon: '✦' },
  { key: 'ritual_kits', label: 'Ritual Kits', icon: '◈' },
] as const;

export const CATEGORY_IMAGES: Record<string, string> = {
  haircare:    'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&q=80',
  skincare:    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80',
  styling:     'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&q=80',
  ritual_kits: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80',
};

export function getProductImage(p: Product): string {
  return p.image_url || CATEGORY_IMAGES[p.category] || CATEGORY_IMAGES.haircare;
}

function sb() { return createClient(); }

export async function fetchProducts(category?: ProductCategory) {
  let q = sb()
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });
  if (category) q = q.eq('category', category);
  const { data, error } = await q;
  return { data: (data as Product[]) || [], error };
}

export async function fetchAllProducts(category?: ProductCategory) {
  let q = sb()
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  if (category) q = q.eq('category', category);
  const { data, error } = await q;
  return { data: (data as Product[]) || [], error };
}

export async function fetchProductById(id: string) {
  const { data, error } = await sb()
    .from('products').select('*').eq('id', id).single();
  return { data: data as Product, error };
}

export async function fetchFeaturedProducts(limit = 4) {
  const { data, error } = await sb()
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data: (data as Product[]) || [], error };
}

export async function searchProducts(query: string) {
  const { data, error } = await sb()
    .from('products')
    .select('*')
    .eq('is_active', true)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order('is_featured', { ascending: false });
  return { data: (data as Product[]) || [], error };
}

export async function createProduct(
  data: Omit<Product, 'id' | 'created_at' | 'updated_at'>,
  userId: string,
) {
  return sb().from('products').insert({ ...data, created_by: userId });
}

export async function updateProduct(id: string, data: Partial<Product>) {
  return sb().from('products').update(data).eq('id', id);
}

export async function toggleProductActive(id: string, isActive: boolean) {
  return sb().from('products').update({ is_active: isActive }).eq('id', id);
}

export async function toggleProductFeatured(id: string, isFeatured: boolean) {
  return sb().from('products').update({ is_featured: isFeatured }).eq('id', id);
}

export async function deleteProduct(id: string) {
  return sb().from('products').delete().eq('id', id);
}
