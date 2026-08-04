'use client';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2, Plus, Edit2, Trash2, Image as ImageIcon, Video, GripVertical } from 'lucide-react';

export default function HeroAdminPage() {
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    tagline: '',
    caption: '',
    mediaUrl: '',
    mediaType: 'image',
    buttonText: 'Shop Collection',
    buttonLink: '/products',
    isActive: true,
  });

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const res = await adminApi.getHeroSlides();
      setSlides(res.data);
    } catch {
      toast.error('Failed to load slides');
    } finally {
      setLoading(false);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.append('image', file); // Use the existing 'image' field for both image/video

    try {
      const res = await adminApi.uploadImage(data);
      const isVideo = file.type.startsWith('video');
      setFormData(prev => ({ 
        ...prev, 
        mediaUrl: res.data.imageUrl,
        mediaType: isVideo ? 'video' : 'image' 
      }));
      toast.success('Media uploaded successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.mediaUrl) return toast.error('Media is required');

    try {
      if (editingId) {
        await adminApi.updateHeroSlide(editingId, formData);
        toast.success('Slide updated');
      } else {
        await adminApi.createHeroSlide({ ...formData, orderIndex: slides.length });
        toast.success('Slide created');
      }
      resetForm();
      fetchSlides();
    } catch {
      toast.error('Failed to save slide');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this slide?')) return;
    try {
      await adminApi.deleteHeroSlide(id);
      toast.success('Slide deleted');
      fetchSlides();
    } catch {
      toast.error('Failed to delete slide');
    }
  };

  const handleEdit = (slide: any) => {
    setEditingId(slide.id);
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle || '',
      tagline: slide.tagline || '',
      caption: slide.caption || '',
      mediaUrl: slide.mediaUrl,
      mediaType: slide.mediaType,
      buttonText: slide.buttonText || '',
      buttonLink: slide.buttonLink || '',
      isActive: slide.isActive,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: '', subtitle: '', tagline: '', caption: '', mediaUrl: '', 
      mediaType: 'image', buttonText: 'Shop Collection', buttonLink: '/products', isActive: true
    });
  };

  const moveSlide = async (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= slides.length) return;
    const newSlides = [...slides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[index + direction];
    newSlides[index + direction] = temp;
    
    setSlides(newSlides);
    
    try {
      await adminApi.reorderHeroSlides(newSlides.map(s => s.id));
    } catch {
      toast.error('Failed to reorder');
      fetchSlides();
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-brand-gold" /></div>;
  }

  return (
    <div className="p-6 md:p-10 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-brand-dark mb-1">Hero Slideshow</h1>
          <p className="text-gray-500 text-sm">Manage the dynamic hero section on the homepage.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Slides List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Current Slides</h2>
          {slides.map((slide, idx) => (
            <div key={slide.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <button onClick={() => moveSlide(idx, -1)} disabled={idx === 0} className="text-gray-300 hover:text-brand-dark disabled:opacity-30">▲</button>
                <button onClick={() => moveSlide(idx, 1)} disabled={idx === slides.length - 1} className="text-gray-300 hover:text-brand-dark disabled:opacity-30">▼</button>
              </div>
              <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden relative shrink-0">
                {slide.mediaType === 'video' ? (
                  <video src={process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') + slide.mediaUrl} className="w-full h-full object-cover" />
                ) : (
                  <img src={process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') + slide.mediaUrl} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{slide.title}</p>
                <p className="text-xs text-gray-500 truncate">{slide.tagline}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full ${slide.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-[10px] uppercase font-bold text-gray-400">{slide.isActive ? 'Active' : 'Hidden'}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button onClick={() => handleEdit(slide)} className="p-2 bg-gray-50 hover:bg-brand-gold hover:text-white rounded-xl transition-colors">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(slide.id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {slides.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm border-2 border-dashed rounded-2xl">
              No slides yet. Add one!
            </div>
          )}
        </div>

        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-brand-dark mb-6 border-b border-gray-100 pb-4">
              {editingId ? 'Edit Slide' : 'Create New Slide'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Media Upload */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Background Media (Image or Video) *</label>
                {formData.mediaUrl ? (
                  <div className="relative h-[200px] w-full rounded-2xl overflow-hidden bg-brand-dark group">
                    {formData.mediaType === 'video' ? (
                      <video src={process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') + formData.mediaUrl} className="w-full h-full object-cover" autoPlay muted loop />
                    ) : (
                      <img src={process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') + formData.mediaUrl} className="w-full h-full object-cover" />
                    )}
                    <button type="button" onClick={() => setFormData({...formData, mediaUrl: ''})} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:bg-gray-50 transition-colors">
                    <input type="file" accept="image/*,video/mp4,video/webm" onChange={handleMediaUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2 text-brand-gold"><Loader2 className="animate-spin" size={24} /><span className="text-sm font-bold">Uploading...</span></div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <div className="flex gap-2"><ImageIcon size={24} /><Video size={24} /></div>
                        <span className="text-sm font-medium">Click or drag media here</span>
                        <span className="text-xs">Supports optimized JPG, PNG, WEBP, MP4, WEBM (Max 10MB)</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Tagline (e.g. 100% Organic Ceylon)</label>
                  <input type="text" value={formData.tagline} onChange={e => setFormData({...formData, tagline: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-gold/50 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Main Title *</label>
                  <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-gold/50 outline-none" placeholder="The Purest Taste" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Subtitle (Italic part)</label>
                  <input type="text" value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-gold/50 outline-none" placeholder="of Nature" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Button Text</label>
                  <input type="text" value={formData.buttonText} onChange={e => setFormData({...formData, buttonText: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-gold/50 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Caption Description</label>
                <textarea rows={3} value={formData.caption} onChange={e => setFormData({...formData, caption: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-gold/50 outline-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Button Link</label>
                  <input type="text" value={formData.buttonLink} onChange={e => setFormData({...formData, buttonLink: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-gold/50 outline-none" />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-5 h-5 accent-brand-gold" />
                  <label htmlFor="isActive" className="text-sm font-bold text-gray-700">Set as Active Slide</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                {editingId && (
                  <button type="button" onClick={resetForm} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                    Cancel Edit
                  </button>
                )}
                <button type="submit" disabled={uploading || !formData.mediaUrl} className="bg-brand-dark text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-gold transition-colors disabled:opacity-50">
                  {editingId ? 'Save Changes' : <><Plus size={18} /> Add Slide</>}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
