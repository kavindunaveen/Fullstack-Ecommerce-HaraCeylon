'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cartApi } from '@/lib/api';
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
  stock_status?: string;
  stock_quantity?: number;
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemAnim: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
};

export default function HomeClient({ initialProducts }: { initialProducts: Product[] }) {
  const { setCart, optimisticAdd, revertCart } = useCartStore();
  const { formatPrice } = useCurrencyStore();
  const [addingId, setAddingId] = useState<string | null>(null);

  const addToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    if (addingId === product.id) return;
    setAddingId(product.id);
    // ⚡ Instantly open cart and update counts — no waiting for network
    const previousCart = optimisticAdd(product as any, 1);
    toast.success('Added to bag');
    try {
      const res = await cartApi.add({ product_id: product.id, quantity: 1 });
      setCart(res.data); // Replace optimistic state with real server data
    } catch {
      revertCart(previousCart); // Roll back on failure
      toast.error('Could not add to bag');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="bg-white">
      {/* ── Hero Section ── */}
      <section className="relative h-[100svh] min-h-[580px] flex items-center justify-center overflow-hidden">
        <Image
          src="/hero.png"
          alt="HARA Ceylon Tea Estate"
          fill
          priority
          className="object-cover absolute inset-0 z-0"
        />
        <video
          className="absolute inset-0 w-full h-full object-cover z-0"
          autoPlay muted loop playsInline
          preload="none"
        >
          <source src="/video2.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/40 to-transparent" />

        <div className="relative z-10 container max-w-5xl mx-auto px-5 text-center mt-16 md:mt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/90 backdrop-blur-md shadow-xl shadow-black/10 mb-6 border border-white/50"
          >
            <Leaf size={13} className="text-brand-gold fill-brand-gold/20" />
            <span className="text-brand-dark text-[10px] md:text-[11px] font-black tracking-[0.25em] uppercase">
              100% <span className="text-brand-gold">Organic</span> Ceylon
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="text-[2.6rem] leading-[1.1] sm:text-5xl md:text-7xl lg:text-8xl font-serif text-white mb-5 md:mb-6 tracking-tight"
          >
            The Purest Taste <br /> <span className="text-brand-gold italic font-light">of Nature</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-gray-200 text-base md:text-xl font-light max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed px-2"
          >
            Elevate your daily ritual with our sustainably sourced, single-origin teas and coffees from the misty highlands of Sri Lanka.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0"
          >
            <Link
              href="/products"
              className="btn-modern bg-brand-gold text-white px-8 py-4 rounded-full font-semibold tracking-wide flex items-center gap-2 hover:bg-white hover:text-brand-dark group w-full sm:w-auto justify-center shadow-2xl shadow-brand-gold/20 text-sm md:text-base"
            >
              Shop Collection <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="#story"
              className="px-8 py-4 rounded-full text-white font-medium hover:bg-white/10 transition-colors w-full sm:w-auto justify-center flex text-sm md:text-base border border-white/20"
            >
              Discover Our Story
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Features Ribbon ── */}
      <section className="bg-brand-dark py-8 md:py-12">
        <div className="container max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-3 gap-4 md:gap-8 text-center divide-x divide-white/10">
            <div className="flex flex-col items-center gap-2 md:gap-3 px-2 md:px-4">
              <Globe2 size={20} className="text-brand-gold md:w-6 md:h-6" strokeWidth={1.5} />
              <h2 className="text-white font-serif text-sm md:text-lg">Single Origin</h2>
              <p className="text-gray-400 text-[11px] md:text-sm hidden sm:block">Direct from Sri Lankan estates</p>
            </div>
            <div className="flex flex-col items-center gap-2 md:gap-3 px-2 md:px-4">
              <Leaf size={20} className="text-brand-gold md:w-6 md:h-6" strokeWidth={1.5} />
              <h2 className="text-white font-serif text-sm md:text-lg">100% Natural</h2>
              <p className="text-gray-400 text-[11px] md:text-sm hidden sm:block">No artificial additives</p>
            </div>
            <div className="flex flex-col items-center gap-2 md:gap-3 px-2 md:px-4">
              <Droplets size={20} className="text-brand-gold md:w-6 md:h-6" strokeWidth={1.5} />
              <h2 className="text-white font-serif text-sm md:text-lg">Small Batch</h2>
              <p className="text-gray-400 text-[11px] md:text-sm hidden sm:block">Roasted &amp; packed with care</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Products Grid ── */}
      <section className="py-16 md:py-32 bg-brand-light">
        <div className="container max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-end justify-between mb-8 md:mb-16 gap-4">
            <div>
              <span className="text-brand-gold font-bold uppercase text-[10px] md:text-xs tracking-[0.2em] mb-2 md:mb-3 block">Bestsellers</span>
              <h2 className="text-3xl md:text-5xl font-serif text-brand-dark leading-tight">
                Curated <span className="italic font-light">Selections</span>
              </h2>
            </div>
            <Link
              href="/products"
              className="text-brand-dark text-xs md:text-sm font-medium hover:text-brand-gold transition-colors flex items-center gap-1.5 border-b border-brand-dark pb-0.5 hover:border-brand-gold whitespace-nowrap shrink-0"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>

          {initialProducts.length === 0 ? (
            <div className="text-center py-20 text-gray-400">No featured products available at the moment.</div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-80px' }}
              className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8"
            >
              {initialProducts.map((product) => (
                <motion.div variants={itemAnim} key={product.id} className="group cursor-pointer">
                  {/* Card */}
                  <div className="relative bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group-hover:-translate-y-1 md:group-hover:-translate-y-2 mb-3 md:mb-6">
                    <Link href={`/products/${product.slug}`} className="block aspect-[4/5]">
                      {product.main_image ? (
                        <Image
                          src={product.main_image.image_url}
                          alt={product.name}
                          width={400}
                          height={500}
                          className="w-full h-full object-contain p-4 md:p-8 transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No Image</div>
                      )}

                      {/* Category badge */}
                      <div className="absolute top-2.5 left-2.5 md:top-4 md:left-4 z-10">
                        <span className="bg-white/90 backdrop-blur text-brand-dark px-2 py-1 md:px-3 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-bold tracking-wider uppercase shadow-sm">
                          {product.category_name}
                        </span>
                      </div>

                      {/* Desktop hover Add to Bag */}
                      <div className="absolute bottom-3 left-3 right-3 z-20 translate-y-14 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hidden md:block">
                        <button
                          onClick={(e) => addToCart(e, product)}
                          disabled={addingId === product.id || product.stock_status === 'out_of_stock'}
                          className="w-full bg-brand-dark text-white py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-brand-gold transition-colors shadow-lg disabled:opacity-60"
                        >
                          <ShoppingBag size={15} /> {product.stock_status === 'out_of_stock' ? 'Out of Stock' : 'Add to Bag'}
                        </button>
                      </div>
                    </Link>

                    {/* Mobile always-visible Add to Bag */}
                    <div className="md:hidden border-t border-gray-100">
                      <button
                        onClick={(e) => addToCart(e, product)}
                        disabled={addingId === product.id || product.stock_status === 'out_of_stock'}
                        className="w-full py-2.5 bg-brand-dark text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-brand-gold transition-colors disabled:opacity-60"
                      >
                        <ShoppingBag size={13} />
                        {addingId === product.id ? 'Adding…' : product.stock_status === 'out_of_stock' ? 'Out of Stock' : 'Add to Bag'}
                      </button>
                    </div>
                  </div>

                  {/* Product info */}
                  <div className="px-0.5">
                    <Link
                      href={`/products/${product.slug}`}
                      className="font-serif text-sm md:text-lg text-gray-900 group-hover:text-brand-green transition-colors line-clamp-2 leading-snug"
                    >
                      {product.name}
                    </Link>
                    <p className="text-gray-500 mt-0.5 md:mt-1 font-semibold text-sm md:text-base">
                      {formatPrice(Number(product.effective_price))}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Story Section ── */}
      <section id="story" className="py-16 md:py-32 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-light/50 -z-10" />
        <div className="container max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16 items-center">

            <div className="lg:col-span-6 relative">
              <div className="relative z-10">
                <Image
                  src="/hero-bg.webp"
                  alt="Tea Estate"
                  width={700}
                  height={500}
                  className="rounded-2xl md:rounded-[2.5rem] shadow-2xl w-full h-64 sm:h-80 md:h-[500px] object-cover"
                  priority
                />
                <div className="absolute -bottom-8 -right-4 w-2/5 md:w-2/3 hidden sm:block">
                  <Image
                    src="/tea-processing.png"
                    alt="Tea Selection"
                    width={400}
                    height={225}
                    className="rounded-2xl md:rounded-3xl shadow-2xl border-4 md:border-8 border-white object-cover aspect-video"
                  />
                </div>
              </div>
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-brand-gold/10 rounded-full blur-2xl -z-10" />
            </div>

            <div className="lg:col-span-6 lg:pl-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <span className="text-brand-gold font-bold uppercase text-xs tracking-[0.2em] mb-3 md:mb-4 block">Our Heritage</span>
                <h2 className="text-3xl md:text-5xl font-serif text-brand-dark mb-5 md:mb-8 leading-tight">
                  Rooted in <span className="italic text-brand-green">Tradition</span>, Crafted for the Modern Soul
                </h2>
                <div className="space-y-4 md:space-y-6 text-gray-600 text-base md:text-lg leading-relaxed font-light mb-8 md:mb-10">
                  <p>
                    For generations, the fertile soils of Sri Lanka have been the cradle of the world's most aromatic teas and coffees. At HARA, we don't just sell products; we share a legacy.
                  </p>
                  <p>
                    Every leaf and bean is a testament to the dedication of local artisans who have mastered the craft over decades. We combine this ancient wisdom with modern sustainability to bring you purity in every sip.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8 md:mb-12">
                  <div className="border-l-2 border-brand-gold/20 pl-5">
                    <p className="text-2xl md:text-3xl font-serif font-bold text-brand-dark mb-1">100%</p>
                    <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest font-bold">Traceable Source</p>
                  </div>
                  <div className="border-l-2 border-brand-gold/20 pl-5">
                    <p className="text-2xl md:text-3xl font-serif font-bold text-brand-dark mb-1">Fair</p>
                    <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest font-bold">Trade Partnerships</p>
                  </div>
                </div>

                <Link
                  href="/pages/about"
                  className="inline-flex items-center gap-3 md:gap-4 bg-brand-dark text-white px-7 md:px-10 py-4 md:py-5 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-brand-gold transition-all shadow-xl shadow-brand-dark/10 group w-full sm:w-auto justify-center sm:justify-start"
                >
                  Discover Our Whole Journey
                  <ArrowRight size={17} className="transition-transform group-hover:translate-x-2" />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
