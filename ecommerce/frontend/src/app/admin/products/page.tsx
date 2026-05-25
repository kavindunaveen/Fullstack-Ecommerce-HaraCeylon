'use client';
import { useEffect, useState } from 'react';
import api, { BACKEND_URL } from '@/lib/api';
import toast from 'react-hot-toast';
import { useCurrencyStore } from '@/lib/store';
import { Plus, Edit2, Trash2, Package, Search } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { formatPrice } = useCurrencyStore();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/admin/products');
      setProducts(res.data.products || []);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      toast.success('Product deleted');
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-2">Manage your tea and coffee inventory.</p>
        </div>
        <Link href="/admin/products/new" className="flex items-center gap-2 px-6 py-3 bg-brand-dark text-white rounded-xl font-bold hover:bg-brand-gold transition-all shadow-lg">
          <Plus size={18} /> Add Product
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-500 font-bold border-b border-gray-100">
                <th className="p-4">Product</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="p-12 text-center text-gray-500 font-medium">Loading inventory...</td></tr>
              ) : filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex items-center justify-center p-1">
                        {p.images?.[0] ? (
                          <Image 
                            src={p.images[0].imageUrl.startsWith('http') ? p.images[0].imageUrl : `${BACKEND_URL}${p.images[0].imageUrl}`} 
                            alt="" 
                            width={48}
                            height={48}
                            className="w-full h-full object-contain" 
                          />
                        ) : <Package size={20} className="text-gray-300" />}
                      </div>
                      <div>
                        <p className="font-bold text-brand-dark line-clamp-1">{p.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{p.category?.name || 'Uncategorized'}</td>
                  <td className="p-4 font-bold text-brand-dark">{formatPrice(Number(p.effectivePrice))}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${p.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {p.stock} in stock
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/products/${p.id}`} className="p-2 text-gray-400 hover:text-brand-gold hover:bg-brand-gold/5 rounded-lg transition-all">
                        <Edit2 size={16} />
                      </Link>
                      <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && !loading && (
                <tr><td colSpan={5} className="p-12 text-center text-gray-500 font-medium">No products found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
