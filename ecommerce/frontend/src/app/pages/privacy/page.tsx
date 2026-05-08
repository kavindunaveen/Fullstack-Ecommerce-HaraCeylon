'use client';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="bg-brand-light min-h-screen pt-32 pb-24">
      <div className="container max-w-4xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden p-8 md:p-16"
        >
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-gold/10 text-brand-gold mb-6">
              <Shield size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif text-brand-dark mb-4">Privacy Policy</h1>
            <p className="text-gray-500 font-light">Last Updated: May 2026</p>
          </div>

          <div className="prose prose-lg max-w-none text-gray-600 font-light leading-relaxed space-y-12">
            <section>
              <h2 className="text-2xl font-serif text-brand-dark mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-gold text-sm font-bold">1</span>
                Introduction
              </h2>
              <p>
                At HARA, we value the trust you place in us when sharing your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our e-commerce platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif text-brand-dark mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-gold text-sm font-bold">2</span>
                Information Collection
              </h2>
              <p>
                We collect information that you provide directly to us, such as when you create an account, make a purchase, or contact our customer support. This may include:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Name, email address, and phone number</li>
                <li>Billing and shipping addresses</li>
                <li>Payment information (processed securely via our partners)</li>
                <li>Order history and preferences</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-serif text-brand-dark mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-gold text-sm font-bold">3</span>
                How We Use Your Data
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div className="text-brand-gold mb-3"><Lock size={20} /></div>
                  <h4 className="font-bold text-brand-dark mb-2">Order Fulfillment</h4>
                  <p className="text-sm">To process and deliver your orders, and provide tracking updates.</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div className="text-brand-gold mb-3"><Eye size={20} /></div>
                  <h4 className="font-bold text-brand-dark mb-2">Personalization</h4>
                  <p className="text-sm">To tailor our product recommendations and shopping experience to your tastes.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-serif text-brand-dark mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-gold text-sm font-bold">4</span>
                Data Security
              </h2>
              <p>
                We implement industry-standard security measures to protect your personal data. All sensitive payment information is encrypted and processed through PCI-compliant gateways. We do not store your full credit card details on our servers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif text-brand-dark mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-gold text-sm font-bold">5</span>
                Your Rights
              </h2>
              <p>
                You have the right to access, correct, or delete your personal information at any time. You can manage these settings through your account profile or by contacting our support team.
              </p>
            </section>

            <section className="pt-12 border-t border-gray-100">
              <p className="text-center italic text-gray-400">
                If you have any questions regarding this Privacy Policy, please reach out to us at <a href="mailto:privacy@haraceylon.com" className="text-brand-gold">privacy@haraceylon.com</a>
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
