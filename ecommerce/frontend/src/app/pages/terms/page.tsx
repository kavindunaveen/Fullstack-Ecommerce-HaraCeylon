'use client';
import { motion } from 'framer-motion';
import { FileText, Gavel, Scale, HelpCircle } from 'lucide-react';

export default function TermsAndConditions() {
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
              <Gavel size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif text-brand-dark mb-4">Terms & Conditions</h1>
            <p className="text-gray-500 font-light">Last Updated: May 2026</p>
          </div>

          <div className="prose prose-lg max-w-none text-gray-600 font-light leading-relaxed space-y-12">
            <section>
              <h2 className="text-2xl font-serif text-brand-dark mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-gold text-sm font-bold">1</span>
                Agreement to Terms
              </h2>
              <p>
                By accessing or using the HARA website and services, you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, you may not access the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif text-brand-dark mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-gold text-sm font-bold">2</span>
                Product Availability & Pricing
              </h2>
              <p>
                All our products are subject to availability. We reserve the right to limit the quantity of any product we offer. Prices for our products are subject to change without notice. We make every effort to display as accurately as possible the colors and images of our products.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif text-brand-dark mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-gold text-sm font-bold">3</span>
                Shipping & Delivery
              </h2>
              <p>
                Shipping costs and estimated delivery times are provided at checkout. While we strive to meet these estimates, delivery times are not guaranteed and may be affected by external factors beyond our control. Risk of loss and title for items purchased from HARA pass to you upon delivery of the items to the carrier.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif text-brand-dark mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-gold text-sm font-bold">4</span>
                Returns & Refunds
              </h2>
              <p>
                Due to the perishable nature of our products (tea and coffee), we generally do not accept returns. However, if your order is damaged or incorrect, please contact us within 48 hours of receipt for a replacement or refund.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif text-brand-dark mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-gold text-sm font-bold">5</span>
                Intellectual Property
              </h2>
              <p>
                The website and its original content, features, and functionality are and will remain the exclusive property of HARA and its licensors. Our trademarks and brand identity may not be used in connection with any product or service without the prior written consent of HARA.
              </p>
            </section>

            <section className="bg-gray-50 p-8 rounded-3xl border border-gray-100 flex items-start gap-4">
              <div className="text-brand-gold shrink-0 mt-1"><HelpCircle size={24} /></div>
              <div>
                <h4 className="font-bold text-brand-dark mb-2">Need Clarification?</h4>
                <p className="text-sm">If you have any questions about these Terms, please contact our legal department at <a href="mailto:legal@haraceylon.com" className="text-brand-gold">legal@haraceylon.com</a></p>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
