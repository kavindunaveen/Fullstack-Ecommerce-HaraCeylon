'use client';
import { useEffect, useState } from 'react';
import api, { BACKEND_URL } from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Upload } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function ProductForm() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    basePrice: '',
    effectivePrice: '',
    stock: '',
    categoryId: '',
    imageUrl: '',
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false
  });

  useEffect(() => {
    fetchCategories();
    if (isEdit) fetchProduct();
  }, [id]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/products/categories');
      setCategories(res.data.results || []);
    } catch {
      toast.error('Failed to load categories');
    }
  };

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/admin/products/${id}`);
      setFormData({
        name: res.data.name,
        slug: res.data.slug,
        description: res.data.description,
        basePrice: res.data.basePrice.toString(),
        effectivePrice: res.data.effectivePrice.toString(),
        stock: res.data.stock.toString(),
        categoryId: res.data.categoryId,
        imageUrl: res.data.images?.[0]?.imageUrl || '',
        isFeatured: res.data.isFeatured,
        isNewArrival: res.data.isNewArrival,
        isBestSeller: res.data.isBestSeller
      });
    } catch {
      toast.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, imageUrl: res.data.imageUrl }));
      toast.success('Image uploaded successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/admin/products/${id}`, formData);
        toast.success('Product updated');
      } else {
        await api.post('/admin/products', formData);
        toast.success('Product created');
      }
      router.push('/admin/products');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-500">Loading product data...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/products" className="p-2 hover:bg-white rounded-lg transition-all text-gray-400 hover:text-brand-dark">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-serif font-bold text-gray-900">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Basic Info */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-brand-gold border-b border-gray-50 pb-4">Basic Information</h2>
            
            <div className="form-group">
              <label className="form-label">Product Name</label>
              <input 
                type="text" required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="form-control"
                placeholder="e.g. Premium Ceylon Black"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Slug (URL Path)</label>
              <input 
                type="text" required
                value={formData.slug}
                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                className="form-control"
                placeholder="e.g. premium-ceylon-black"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select 
                required
                value={formData.categoryId}
                onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                className="form-control"
              >
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea 
                required
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="form-control"
                rows={4}
                placeholder="Describe the product..."
              />
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6 h-fit">
            <h2 className="text-sm font-black uppercase tracking-widest text-brand-gold border-b border-gray-50 pb-4">Pricing & Inventory</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Base Price (£)</label>
                <input 
                  type="number" step="0.01" required
                  value={formData.basePrice}
                  onChange={e => setFormData({ ...formData, basePrice: e.target.value })}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Sale Price (£)</label>
                <input 
                  type="number" step="0.01" required
                  value={formData.effectivePrice}
                  onChange={e => setFormData({ ...formData, effectivePrice: e.target.value })}
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Stock Quantity</label>
              <input 
                type="number" required
                value={formData.stock}
                onChange={e => setFormData({ ...formData, stock: e.target.value })}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Product Image</label>
              <div className="space-y-4">
                {formData.imageUrl && (
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shadow-inner group">
                    <Image 
                      src={formData.imageUrl.startsWith('http') ? formData.imageUrl : `${BACKEND_URL}${formData.imageUrl}`} 
                      alt="Preview" 
                      width={200}
                      height={200}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <button 
                         type="button"
                         onClick={() => setFormData({ ...formData, imageUrl: '' })}
                         className="bg-red-500 text-white p-2 rounded-full hover:scale-110 transition-all shadow-lg"
                       >
                         <ArrowLeft className="rotate-45" size={16} />
                       </button>
                    </div>
                  </div>
                )}
                
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label 
                    htmlFor="image-upload"
                    className={`flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                      uploading ? 'bg-gray-50 border-gray-200' : 'bg-brand-gold/5 border-brand-gold/20 hover:bg-brand-gold/10 hover:border-brand-gold/40'
                    }`}
                  >
                    {uploading ? (
                      <Loader2 className="animate-spin text-brand-gold" size={32} />
                    ) : (
                      <Upload className="text-brand-gold" size={32} />
                    )}
                    <div className="text-center">
                      <p className="text-sm font-black text-brand-dark uppercase tracking-widest">
                        {uploading ? 'Uploading...' : 'Choose Local File'}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">JPEG, PNG or WebP (Max 5MB)</p>
                    </div>
                  </label>
                </div>

                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-[1px] flex-1 bg-gray-100" />
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">OR USE EXTERNAL LINK</span>
                    <div className="h-[1px] flex-1 bg-gray-100" />
                  </div>
                  <input 
                    type="text"
                    value={formData.imageUrl}
                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="form-control"
                    placeholder="https://example.com/image.png"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Marketing Options */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-sm font-black uppercase tracking-widest text-brand-gold border-b border-gray-50 pb-4 mb-6">Marketing Features</h2>
          <div className="flex flex-wrap gap-8">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox"
                checked={formData.isFeatured}
                onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-brand-gold focus:ring-brand-gold"
              />
              <span className="text-sm font-bold text-gray-700 group-hover:text-brand-dark">Featured Product</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox"
                checked={formData.isNewArrival}
                onChange={e => setFormData({ ...formData, isNewArrival: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-brand-gold focus:ring-brand-gold"
              />
              <span className="text-sm font-bold text-gray-700 group-hover:text-brand-dark">New Arrival</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox"
                checked={formData.isBestSeller}
                onChange={e => setFormData({ ...formData, isBestSeller: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-brand-gold focus:ring-brand-gold"
              />
              <span className="text-sm font-bold text-gray-700 group-hover:text-brand-dark">Best Seller</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={saving}
            className="flex items-center gap-2 px-12 py-4 bg-brand-dark text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-gold transition-all shadow-xl shadow-brand-dark/20 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {isEdit ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
