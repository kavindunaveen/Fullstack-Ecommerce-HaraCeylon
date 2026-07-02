'use client';
import Link from 'next/link';
import { Mail, ArrowUpRight, MapPin, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-white pt-24 pb-12 border-t border-brand-green/20">
      <div className="container max-w-7xl mx-auto px-6">
        
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-20">
          
          <div className="lg:col-span-5 flex flex-col items-start">
            <Link href="/" className="inline-block mb-6 group">
              <h1 className="font-serif text-3xl font-black tracking-tight text-white transition-colors group-hover:text-brand-gold">
                HARA <span className="text-brand-gold italic font-light group-hover:text-white transition-colors">CEYLON</span>
              </h1>
            </Link>
            <p className="text-gray-400 font-light leading-relaxed max-w-md mb-8">
              Cultivating wellness and tradition, from the misty hills of Sri Lanka straight to your cherished daily ritual.
            </p>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-gold mb-6">Explore</h4>
            <ul className="flex flex-col gap-4">
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-1 group">Home <ArrowUpRight size={14} className="opacity-0 -translate-y-1 translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0" /></Link></li>
              <li><Link href="/products" className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-1 group">Shop Collection <ArrowUpRight size={14} className="opacity-0 -translate-y-1 translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0" /></Link></li>
              <li><Link href="/pages/about" className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-1 group">Our Story <ArrowUpRight size={14} className="opacity-0 -translate-y-1 translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0" /></Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-gold mb-6">Support</h4>
            <ul className="flex flex-col gap-4">
              <li><Link href="/pages/contact" className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-1 group">Contact Us <ArrowUpRight size={14} className="opacity-0 -translate-y-1 translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0" /></Link></li>
              <li><Link href="/account" className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-1 group">My Account <ArrowUpRight size={14} className="opacity-0 -translate-y-1 translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0" /></Link></li>
              <li><Link href="/pages/privacy" className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-1 group">Privacy Policy <ArrowUpRight size={14} className="opacity-0 -translate-y-1 translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0" /></Link></li>
              <li><Link href="/pages/terms" className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-1 group">Terms & Conditions <ArrowUpRight size={14} className="opacity-0 -translate-y-1 translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0" /></Link></li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-gold mb-6">Contact</h4>
            <div className="flex flex-col gap-4">
              <a href="mailto:info@haraceylon.com" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors text-sm">
                <Mail size={16} /> info@haraceylon.com
              </a>
              <p className="flex items-start gap-3 text-gray-400 text-sm leading-relaxed">
                <MapPin size={16} className="shrink-0 mt-1" />
                United Kingdom <br/> (Global Shipping Available)
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500 font-medium tracking-wide">
            © {new Date().getFullYear()} HARA CEYLON LTD. ALL RIGHTS RESERVED.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Premium Sri Lankan Heritage</span>
          </div>
        </div>

        {/* Developer Credit */}
        <div className="mt-6 pt-4 border-t border-white/5 flex justify-center">
          <a
            href="https://www.facebook.com/websynic"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-600 hover:text-brand-gold transition-colors duration-300 group"
          >
            <span className="text-[10px] uppercase tracking-[0.2em] font-medium">Developed by</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 group-hover:text-brand-gold transition-colors">
              Websynic Digital Solutions
            </span>
            <ArrowUpRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-gold" />
          </a>
        </div>


      </div>
    </footer>
  );
}
