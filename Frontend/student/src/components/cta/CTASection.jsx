import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Shield, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTASection = () => {
  const benefits = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Experience blazing-fast performance with optimized infrastructure",
    },
    {
      icon: Shield,
      title: "Bank-Level Security",
      description: "Your data is protected with military-grade encryption",
    },
    {
      icon: TrendingUp,
      title: "Real-time Analytics",
      description: "Make informed decisions with powerful analytics dashboards",
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8" id="about">
      <div className="max-w-7xl mx-auto">
        {/* Why Choose EduHub Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Why{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Institutions Choose EduHub
            </span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Join over 10,000+ institutions transforming their education delivery
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-all group"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="h-7 w-7 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">{benefit.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200 rounded-3xl p-12 mb-16"
        >
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Trusted by Educational Leaders
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "10K+", label: "Institutions" },
              { number: "500K+", label: "Students" },
              { number: "98%", label: "Uptime" },
              { number: "24/7", label: "Support" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <p className="text-gray-600 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-center text-white"
        >
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Institution?
          </h3>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of educational institutions using EduHub to streamline
            operations and improve student outcomes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold px-8 py-3 rounded-lg">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <button className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors">
              Schedule Demo
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
