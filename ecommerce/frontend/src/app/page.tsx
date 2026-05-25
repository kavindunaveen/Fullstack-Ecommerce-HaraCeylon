'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { productsApi, cartApi } from '@/lib/api';
import { ArrowRight, ShoppingBag, Leaf, Droplets, Globe2 } from 'lucide-react';
import { useCartStore, useCurrencyStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { motion, Variants } from 'framer-motion';

interface Product {
  id: string;
  slug: string;
  name: string;
  category_name?: string;
  effective_price: string | number;
  main_image?: { image_url: string };
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemAnim: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { setCart, openCart } = useCartStore();
  const { formatPrice } = useCurrencyStore();

  useEffect(() => {
    productsApi.featured().then((res) => {
      const data = res.data.results || res.data || [];
      setProducts(data);
    }).catch((err) => {
      console.error(err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const addToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    // Open cart and toast immediately — don't wait for API
    openCart();
    toast.success('Added to bag');
    try {
      const res = await cartApi.add({ product_id: product.id, quantity: 1 });
      setCart(res.data);
    } catch {
      toast.error('Could not add to bag');
    }
  };

  return (
    <div className="bg-white">
      {/* Modern Hero Section */}
      <section className="relative h-[95vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <video 
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay muted loop playsInline poster="/hero.png"
          preload="metadata"
        >
          <source src="/video2.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/40 to-transparent"></div>
        
        <div className="relative z-10 container max-w-5xl mx-auto px-6 text-center mt-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8 }} 
            className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/90 backdrop-blur-md shadow-2xl shadow-black/20 mb-8 border border-white/50"
          >
            <Leaf size={14} className="text-brand-gold fill-brand-gold/20" />
            <span className="text-brand-dark text-[11px] font-black tracking-[0.25em] uppercase">
              100% <span className="text-brand-gold">Organic</span> Ceylon
            </span>
          </motion.div>
          
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-5xl md:text-7xl lg:text-8xl font-serif text-white mb-6 leading-[1.1] tracking-tight">
            The Purest Taste <br/> <span className="text-brand-gold italic font-light">of Nature</span>
          </motion.h1>
          
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.4 }} className="text-gray-200 text-lg md:text-xl font-light max-w-2xl mx-auto mb-10 leading-relaxed">
            Elevate your daily ritual with our sustainably sourced, single-origin teas and coffees from the misty highlands of Sri Lanka.
          </motion.p>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/products" className="btn-modern bg-brand-gold text-white px-8 py-4 rounded-full font-medium tracking-wide flex items-center gap-2 hover:bg-white hover:text-brand-dark group w-full sm:w-auto justify-center shadow-2xl shadow-brand-gold/20">
              Shop Collection <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="#story" className="px-8 py-4 rounded-full text-white font-medium hover:bg-white/10 transition-colors w-full sm:w-auto justify-center flex">
              Discover Our Story
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Ribbon */}
      <section className="bg-brand-dark py-12">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
            <div className="flex flex-col items-center gap-3 py-4 md:py-0">
              <Globe2 size={24} className="text-brand-gold" strokeWidth={1.5} />
              <h3 className="text-white font-serif text-lg">Single Origin</h3>
              <p className="text-gray-400 text-sm">Direct from Sri Lankan estates</p>
            </div>
            <div className="flex flex-col items-center gap-3 py-4 md:py-0">
              <Leaf size={24} className="text-brand-gold" strokeWidth={1.5} />
              <h3 className="text-white font-serif text-lg">100% Natural</h3>
              <p className="text-gray-400 text-sm">No artificial additives</p>
            </div>
            <div className="flex flex-col items-center gap-3 py-4 md:py-0">
              <Droplets size={24} className="text-brand-gold" strokeWidth={1.5} />
              <h3 className="text-white font-serif text-lg">Small Batch</h3>
              <p className="text-gray-400 text-sm">Roasted & packed with care</p>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Collection Section */}
      <section className="py-32 bg-brand-light">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <span className="text-brand-gold font-bold uppercase text-xs tracking-[0.2em] mb-3 block">Bestsellers</span>
              <h2 className="text-4xl md:text-5xl font-serif text-brand-dark leading-tight">Curated <span className="italic font-light">Selections</span></h2>
            </div>
            <Link href="/products" className="text-brand-dark font-medium hover:text-brand-gold transition-colors flex items-center gap-2 border-b border-brand-dark pb-1 hover:border-brand-gold">
              View Entire Catalog <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-3xl aspect-[4/5] mb-6"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">No featured products available at the moment.</div>
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((product) => (
              <motion.div variants={itemAnim} key={product.id} className="group cursor-pointer">
                <Link href={`/products/${product.slug}`} className="block relative bg-white rounded-3xl overflow-hidden aspect-[4/5] mb-6 transition-all duration-500 shadow-sm hover:shadow-xl group-hover:-translate-y-2">
                  <div className="absolute inset-0 bg-gray-50/50 group-hover:bg-transparent transition-colors z-0"></div>
                  {product.main_image && (
                    <Image
                      src={product.main_image.image_url}
                      alt={product.name}
                      width={400}
                      height={500}
                      className="w-full h-full object-contain p-8 relative z-10 transition-transform duration-700 group-hover:scale-110"
                    />
                  )}
                  <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                    <span className="bg-white/90 backdrop-blur text-brand-dark px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-sm">
                      {product.category_name}
                    </span>
                    <div className="bg-brand-dark/90 backdrop-blur p-1 rounded-lg w-fit shadow-sm border border-white/10">
                      <Image src="/logo.png" alt="Hara" width={64} height={16} className="h-4 w-auto" />
                    </div>
                  </div>
                  
                  {/* Hover Add to Cart */}
                  <div className="absolute bottom-4 left-4 right-4 z-20 translate-y-16 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <button onClick={(e) => addToCart(e, product)} className="w-full bg-brand-dark text-white py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-brand-gold transition-colors shadow-lg">
                      <ShoppingBag size={16} /> Add to Bag
                    </button>
                  </div>
                </Link>
                <div>
                  <Link href={`/products/${product.slug}`} className="font-serif text-lg text-gray-900 group-hover:text-brand-green transition-colors line-clamp-1">
                    {product.name}
                  </Link>
                  <p className="text-gray-500 mt-1 font-medium">{formatPrice(Number(product.effective_price))}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
          )}
        </div>
      </section>

      {/* Modern Story Section */}
      <section id="story" className="py-32 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-light/50 -z-10" />
        <div className="container max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            <div className="lg:col-span-6 relative">
              <div className="relative z-10">
                <Image
                  src="/hero-bg.webp"
                  alt="Tea Estate"
                  width={700}
                  height={500}
                  className="rounded-[2.5rem] shadow-2xl w-full h-[500px] object-cover"
                  priority
                />
                <div className="absolute -bottom-10 -right-10 w-2/3 hidden md:block">
                  <Image
                    src="/tea-processing.png"
                    alt="Tea Selection"
                    width={400}
                    height={225}
                    className="rounded-3xl shadow-2xl border-8 border-white object-cover aspect-video"
                  />
                </div>
              </div>
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-brand-gold/10 rounded-full blur-2xl -z-10" />
            </div>

            <div className="lg:col-span-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <span className="text-brand-gold font-bold uppercase text-xs tracking-[0.2em] mb-4 block">Our Heritage</span>
                <h2 className="text-4xl md:text-5xl font-serif text-brand-dark mb-8 leading-tight">
                  Rooted in <span className="italic text-brand-green">Tradition</span>, Crafted for the Modern Soul
                </h2>
                <div className="space-y-6 text-gray-600 text-lg leading-relaxed font-light mb-10">
                  <p>
                    For generations, the fertile soils of Sri Lanka have been the cradle of the world's most aromatic teas and coffees. At HARA, we don't just sell products; we share a legacy.
                  </p>
                  <p>
                    Every leaf and bean is a testament to the dedication of local artisans who have mastered the craft over decades. We combine this ancient wisdom with modern sustainability to bring you purity in every sip.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-8 mb-12">
                  <div className="border-l-2 border-brand-gold/20 pl-6">
                    <p className="text-3xl font-serif font-bold text-brand-dark mb-1">100%</p>
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Traceable Source</p>
                  </div>
                  <div className="border-l-2 border-brand-gold/20 pl-6">
                    <p className="text-3xl font-serif font-bold text-brand-dark mb-1">Fair</p>
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Trade Partnerships</p>
                  </div>
                </div>

                <Link href="/pages/about" className="inline-flex items-center gap-4 bg-brand-dark text-white px-10 py-5 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-brand-gold transition-all shadow-xl shadow-brand-dark/10 group">
                  Discover Our Whole Journey
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-2" />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
