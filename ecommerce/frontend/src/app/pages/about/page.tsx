'use client';
import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState('vision');

  return (
    <div className="pt-[80px]">
      <section className="py-24 bg-white relative overflow-hidden min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <img src="/Green-tea1.png" className="rounded-2xl shadow-xl w-full h-[400px] object-cover transform translate-y-8" alt="Tea Plantation" />
              <img src="/hero-bg.webp" className="rounded-2xl shadow-xl w-full h-[400px] object-cover" alt="Tea Leaves" />
            </div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-brand-gold text-white p-6 rounded-full shadow-2xl w-32 h-32 flex flex-col justify-center items-center text-center border-4 border-white">
              <span className="text-3xl font-bold font-serif">100%</span>
              <span className="text-xs uppercase tracking-widest">Natural</span>
            </div>
          </div>

          <div>
            <span className="text-brand-green font-bold tracking-widest uppercase text-sm mb-2 block">About Hara Ceylon</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-gray-900 mb-6 leading-tight">
              Honoring Centuries of <br /> <span className="text-brand-green italic">Tea-Making Heritage</span>
            </h2>
            <p className="text-gray-600 mb-6 text-lg leading-relaxed">
              Hara Ceylon Ltd is a proudly Sri Lankan company dedicated to delivering the finest natural products sourced from the fertile soils and rich heritage of Ceylon.
            </p>
            <p className="text-gray-600 mb-10 text-lg leading-relaxed">
              Our journey begins in the misty highlands, where perfect climate conditions and centuries of expertise come together to produce the world's most celebrated teas and coffees. We believe in preserving this heritage while adopting sustainable practices for the future.
            </p>
            
            <div className="bg-brand-light p-1 rounded-xl inline-flex mb-8">
              <button 
                onClick={() => setActiveTab('vision')} 
                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'vision' ? 'bg-white shadow text-brand-green' : 'text-gray-500'}`}
              >
                Vision
              </button>
              <button 
                onClick={() => setActiveTab('mission')} 
                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'mission' ? 'bg-white shadow text-brand-green' : 'text-gray-500'}`}
              >
                Mission
              </button>
            </div>
            
            <div className="bg-white border border-gray-100 p-8 rounded-2xl shadow-sm relative">
              {activeTab === 'vision' ? (
                <p className="text-gray-600 italic text-lg leading-relaxed">
                  "To become a globally recognized leader in premium Sri Lankan natural products, enriching lives around the world through sustainable excellence and unwavering commitment to quality."
                </p>
              ) : (
                <ul className="space-y-4">
                  <li className="flex items-start gap-3 text-gray-700">
                    <CheckCircle2 className="text-brand-gold mt-1 flex-shrink-0" size={20} /> 
                    <span>Deliver ethically sourced products that meet the highest international standards.</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-700">
                    <CheckCircle2 className="text-brand-gold mt-1 flex-shrink-0" size={20} /> 
                    <span>Cultivate long-term partnerships with our local farming communities.</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-700">
                    <CheckCircle2 className="text-brand-gold mt-1 flex-shrink-0" size={20} /> 
                    <span>Innovate while staying true to the authentic Sri Lankan heritage.</span>
                  </li>
                </ul>
              )}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
