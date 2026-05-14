'use client';
import { useState } from 'react';
import { CheckCircle2, Leaf, Heart, Globe, Award, Sparkles, ChevronRight, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState('vision');

  const containerVariants: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 200 } }
  };

  return (
    <div className="bg-[#fdfdfd] overflow-hidden">
      {/* ── Hero Section ────────────────────────────────── */}
      <section className="relative min-h-[80vh] flex items-center pt-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-brand-dark/40 z-10" />
          <img 
            src="/hero-bg.webp" 
            className="w-full h-full object-cover scale-105 animate-slow-zoom" 
            alt="Tea Plantation" 
          />
        </div>
        
        <div className="container max-w-7xl mx-auto px-6 relative z-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 bg-brand-gold/90 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6 backdrop-blur-sm">
              Est. 2024
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white mb-8 leading-tight drop-shadow-xl">
              From the <span className="text-brand-gold italic">Highlands</span> <br /> to your Cup.
            </h1>
            <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
              Discover the soul of Ceylon through a journey of taste, tradition, and uncompromising quality.
            </p>
          </motion.div>
        </div>

        {/* Decorative mask */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#fdfdfd] to-transparent z-20" />
      </section>

      {/* ── Our Heritage ────────────────────────────────── */}
      <section id="story" className="py-32 relative">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="grid grid-cols-2 gap-6 relative z-10">
                <div className="space-y-6">
                  <img src="/Green-tea1.png" className="rounded-3xl shadow-2xl w-full aspect-[3/4] object-cover" alt="Tea Leaves" />
                  <div className="bg-brand-gold p-8 rounded-3xl text-white">
                    <p className="text-4xl font-serif font-bold mb-2">100%</p>
                    <p className="text-xs uppercase tracking-widest font-black opacity-80">Single Origin Selection</p>
                  </div>
                </div>
                <div className="space-y-6 pt-12">
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-black/5">
                    <Leaf className="text-brand-green mb-4" size={32} />
                    <p className="text-gray-900 font-bold mb-2 text-xl">Pure Ceylon</p>
                    <p className="text-gray-500 text-sm leading-relaxed">Grown in the misty altitudes of Nuwara Eliya and Dimbula.</p>
                  </div>
                  <img src="/tea-processing.png" className="rounded-3xl shadow-2xl w-full aspect-[3/4] object-cover" alt="Processing" />
                </div>
              </div>
              
              {/* Artistic Blobs */}
              <div className="absolute -top-20 -left-20 w-64 h-64 bg-brand-gold/5 rounded-full blur-3xl -z-10" />
              <div className="absolute -bottom-20 -right-10 w-80 h-80 bg-brand-green/5 rounded-full blur-3xl -z-10" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-brand-gold font-black tracking-[0.3em] uppercase text-xs mb-4 block">The HARA Legacy</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-brand-dark mb-8 leading-tight">
                Honoring Centuries of <span className="text-brand-green">Artisanal Craft</span>
              </h2>
              <div className="space-y-6 text-gray-600 text-lg leading-relaxed font-light">
                <p>
                  Hara Ceylon Ltd is a proudly Sri Lankan company dedicated to delivering the finest natural products sourced from the fertile soils and rich heritage of Ceylon.
                </p>
                <p>
                  Our journey begins in the misty highlands, where perfect climate conditions and centuries of expertise come together to produce the world's most celebrated teas and coffees. 
                </p>
                <p>
                  Unlike mass-produced alternatives, every HARA leaf is hand-plucked at the peak of freshness and processed using traditional methods that preserve the delicate essential oils and antioxidants.
                </p>
              </div>

              <div className="mt-12 flex flex-col sm:flex-row gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-green/5 text-brand-green flex items-center justify-center border border-brand-green/10">
                    <Award size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-dark">Grade-A Quality</p>
                    <p className="text-xs text-gray-500">Exceeding ISO Standards</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-gold/5 text-brand-gold flex items-center justify-center border border-brand-gold/10">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-dark">Directly Sourced</p>
                    <p className="text-xs text-gray-500">Fair Trade Principles</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Our Pillars ──────────────────────────────────── */}
      <section className="py-32 bg-brand-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,#D4AF37_0%,transparent_50%)]" />
        </div>
        
        <div className="container max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">The Values we <span className="text-brand-gold">Brew By</span></h2>
            <p className="text-gray-400 max-w-2xl mx-auto font-light">Building a sustainable future for Sri Lankan agriculture while delivering excellence to your table.</p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { 
                icon: <Globe className="text-brand-gold" size={32} />, 
                title: "Sustainability", 
                desc: "We practice climate-smart agriculture and use biodegradable packaging to protect the island we call home."
              },
              { 
                icon: <Heart className="text-brand-gold" size={32} />, 
                title: "Community", 
                desc: "Supporting over 500 small-holder farming families through fair wages and educational scholarships."
              },
              { 
                icon: <CheckCircle2 className="text-brand-gold" size={32} />, 
                title: "Integrity", 
                desc: "No artificial flavors, no preservatives. Just 100% natural goodness from the heart of Ceylon."
              }
            ].map((pillar, idx) => (
              <motion.div 
                key={idx} 
                variants={itemVariants}
                className="bg-white/5 backdrop-blur-sm p-10 rounded-[2.5rem] border border-white/10 hover:bg-white/10 transition-all group"
              >
                <div className="mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">{pillar.icon}</div>
                <h3 className="text-2xl font-serif font-bold text-white mb-4">{pillar.title}</h3>
                <p className="text-gray-400 leading-relaxed font-light">{pillar.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Vision & Mission Tabs ────────────────────────── */}
      <section className="py-32 bg-brand-light">
        <div className="container max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="bg-white p-1.5 rounded-full inline-flex border border-gray-100 shadow-sm mb-8">
              <button 
                onClick={() => setActiveTab('vision')} 
                className={`px-10 py-3 rounded-full font-bold text-sm transition-all uppercase tracking-widest ${activeTab === 'vision' ? 'bg-brand-dark shadow-xl text-white' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Vision
              </button>
              <button 
                onClick={() => setActiveTab('mission')} 
                className={`px-10 py-3 rounded-full font-bold text-sm transition-all uppercase tracking-widest ${activeTab === 'mission' ? 'bg-brand-dark shadow-xl text-white' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Mission
              </button>
            </div>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="bg-white border border-gray-100 p-12 md:p-16 rounded-[3rem] shadow-2xl shadow-brand-dark/5 relative text-center"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-brand-gold rounded-full flex items-center justify-center text-white shadow-xl">
                <Quote size={24} />
              </div>

              {activeTab === 'vision' ? (
                <div>
                   <h3 className="text-2xl md:text-3xl font-serif font-bold text-brand-dark mb-6">Global Excellence</h3>
                   <p className="text-gray-600 italic text-xl md:text-2xl leading-relaxed font-light">
                    "To become a globally recognized leader in premium Sri Lankan natural products, enriching lives around the world through sustainable excellence and unwavering commitment to quality."
                  </p>
                </div>
              ) : (
                <div className="text-left">
                  <h3 className="text-2xl font-serif font-bold text-brand-dark mb-8 text-center">Our Commitment</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                      "Deliver ethically sourced products that meet highest international standards.",
                      "Cultivate long-term partnerships with our local farming communities.",
                      "Innovate while staying true to the authentic Sri Lankan heritage.",
                      "Ensure complete transparency from farm to final product packaging."
                    ].map((text, i) => (
                      <li key={i} className="flex items-start gap-4">
                        <div className="bg-brand-green/10 p-1.5 rounded-full text-brand-green mt-1">
                          <CheckCircle2 size={16} />
                        </div>
                        <span className="text-gray-600 font-medium leading-relaxed">{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ── CTA / Final Message ──────────────────────────── */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="bg-brand-gold rounded-[4rem] p-12 md:p-24 text-center relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-[-50%] left-[-10%] w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-[-50%] right-[-10%] w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl" />
            
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-8">Ready to Experience <br /> <span className="text-brand-dark">Pure Ceylon?</span></h2>
              <p className="text-white/90 text-lg md:text-xl mb-12 font-light leading-relaxed">
                Join thousands of tea lovers worldwide who have made HARA their daily ritual of peace and quality.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <a href="/products" className="bg-white text-brand-dark px-12 py-5 rounded-full font-black uppercase tracking-widest text-sm hover:bg-brand-dark hover:text-white transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2">
                  Browse Collection <ChevronRight size={18} />
                </a>
                <a href="/pages/contact" className="bg-brand-dark/20 backdrop-blur-sm text-white border border-white/30 px-12 py-5 rounded-full font-black uppercase tracking-widest text-sm hover:bg-white hover:text-brand-dark transition-all flex items-center justify-center gap-2">
                  Get in Touch
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @keyframes slow-zoom {
          from { transform: scale(1); }
          to { transform: scale(1.1); }
        }
        .animate-slow-zoom {
          animation: slow-zoom 20s ease-in-out infinite alternate;
        }
      `}</style>
    </div>
  );
}
