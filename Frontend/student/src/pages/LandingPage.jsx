import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import Hero from '@/components/hero/Hero';
import Features from '@/components/features/Features';
import Pricing from '@/components/pricing/Pricing';
import Testimonials from '@/components/testimonials/Testimonials';
import CTASection from '@/components/cta/CTASection';
import FAQ from '@/components/faq/FAQ';
import Footer from '@/components/footer/Footer';
import { Button } from '@/components/ui/button';

const LandingPage = () => {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50">
      <div className="absolute inset-0 opacity-70 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.08) 1px, transparent 0)', backgroundSize: '60px 60px' }} />
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-indigo-100/80 via-transparent to-transparent pointer-events-none" />
      <Layout>
        <Hero />
        <div id="features">
          <Features />
        </div>
        <div id="pricing">
          <Pricing />
        </div>
        <div id="about">
          <CTASection />
        </div>
        <Testimonials />
        <FAQ />
        <Footer />

        {/* Floating CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="fixed bottom-8 right-8 z-50"
        >
          <Link to="/signup">
            <Button className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 transition-opacity text-white font-semibold px-8 py-6 rounded-full shadow-2xl">
              Get Started Free
            </Button>
          </Link>
        </motion.div>
      </Layout>
    </div>
  );
};

export default LandingPage;
