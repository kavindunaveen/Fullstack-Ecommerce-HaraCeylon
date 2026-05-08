'use client';
import { useState } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { pagesApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'General Inquiry', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await pagesApi.submitContact(formData);
      toast.success('Message sent! We will get back to you shortly.');
      setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' });
    } catch {
      toast.error('Failed to send message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-[80px]">
      <section className="bg-brand-dark relative py-24 md:py-32 overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-brand-gold opacity-10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-brand-green opacity-20 blur-[120px] rounded-full"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-center">
            
            <div className="lg:col-span-2 text-center lg:text-left">
              <span className="text-brand-gold font-bold tracking-[0.3em] uppercase text-xs mb-4 block">Connections</span>
              <h2 className="text-white text-4xl md:text-5xl font-serif font-bold mb-6 leading-tight">
                Begin Your <br/><span className="text-brand-gold italic">Pure Journey</span> With Us
              </h2>
              <p className="text-gray-400 text-lg mb-10 leading-relaxed font-light">
                Whether you're looking for wholesale opportunities or a single premium cup, we're here to share the essence of Sri Lanka with you.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center justify-center lg:justify-start gap-5 group">
                  <div className="w-12 h-12 rounded-full border border-brand-gold/30 flex items-center justify-center text-brand-gold group-hover:bg-brand-gold group-hover:text-white transition-all duration-300">
                    <Mail size={18} />
                  </div>
                  <span className="text-white/80 font-medium tracking-wide">info@haraceylon.com</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-5 group">
                  <div className="w-12 h-12 rounded-full border border-brand-gold/30 flex items-center justify-center text-brand-gold group-hover:bg-brand-gold group-hover:text-white transition-all duration-300">
                    <Phone size={18} />
                  </div>
                  <span className="text-white/80 font-medium tracking-wide">+44 7438 413454</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-5 group">
                  <div className="w-12 h-12 rounded-full border border-brand-gold/30 flex items-center justify-center text-brand-gold group-hover:bg-brand-gold group-hover:text-white transition-all duration-300">
                    <MapPin size={18} />
                  </div>
                  <span className="text-white/80 font-medium tracking-wide">United Kingdom</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="luxury-card p-8 md:p-12 rounded-[2rem]">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-brand-gold/60 text-[10px] uppercase font-bold tracking-widest ml-1">Full Name</label>
                      <input 
                        required type="text" 
                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full px-6 py-4 rounded-xl text-white outline-none placeholder-gray-600 bg-white/5 border border-white/10 focus:border-brand-gold focus:bg-white/10 transition-all" 
                        placeholder="E.g. John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-brand-gold/60 text-[10px] uppercase font-bold tracking-widest ml-1">Email Address</label>
                      <input 
                        required type="email" 
                        value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full px-6 py-4 rounded-xl text-white outline-none placeholder-gray-600 bg-white/5 border border-white/10 focus:border-brand-gold focus:bg-white/10 transition-all" 
                        placeholder="E.g. john@example.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-brand-gold/60 text-[10px] uppercase font-bold tracking-widest ml-1">Your Message</label>
                    <textarea 
                      required rows={5} 
                      value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}
                      className="w-full px-6 py-4 rounded-xl text-white outline-none placeholder-gray-600 resize-none bg-white/5 border border-white/10 focus:border-brand-gold focus:bg-white/10 transition-all" 
                      placeholder="Share your inquiry or thoughts..."
                    ></textarea>
                  </div>
                  <button disabled={loading} type="submit" className="w-full bg-brand-gold hover:bg-white hover:text-brand-dark text-white py-5 rounded-xl font-bold text-sm uppercase tracking-[0.2em] transition-all duration-500 shadow-[0_10px_30px_rgba(212,175,55,0.2)]">
                    {loading ? 'Sending...' : 'Send Inquiry'}
                  </button>
                </form>
              </div>
            </div>
            
          </div>
        </div>
      </section>
    </div>
  );
}
