import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const Pricing = () => {
  const plans = [
    {
      name: "Starter",
      price: "₹4,999",
      period: "/month",
      description: "Perfect for small institutions",
      features: [
        "Up to 500 students",
        "Basic student management",
        "OTP authentication",
        "Email notifications",
        "Basic reporting",
        "Community support",
      ],
      highlight: false,
    },
    {
      name: "Professional",
      price: "₹9,999",
      period: "/month",
      description: "Ideal for growing institutions",
      features: [
        "Up to 5,000 students",
        "Advanced course management",
        "AI-powered exam generation",
        "Grade tracking & analytics",
        "Assignment management",
        "Priority email support",
        "Custom branding",
      ],
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "pricing",
      description: "For large-scale institutions",
      features: [
        "Unlimited students",
        "All features included",
        "Dedicated account manager",
        "24/7 phone support",
        "Custom integrations",
        "On-premise deployment",
        "Advanced security",
      ],
      highlight: false,
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8" id="pricing">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple,{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Transparent Pricing
            </span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Choose the perfect plan for your institution. No hidden fees.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative rounded-2xl transition-all ${
                plan.highlight
                  ? "bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300 shadow-2xl md:scale-105"
                  : "bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 text-sm mb-6">{plan.description}</p>

                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 ml-2">{plan.period}</span>
                  </div>
                </div>

                <button
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all mb-8 ${
                    plan.highlight
                      ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:shadow-lg"
                      : "border-2 border-gray-300 text-gray-900 hover:border-indigo-600 hover:text-indigo-600"
                  }`}
                >
                  Get Started
                </button>

                <div className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      viewport={{ once: true }}
                      className="flex items-start gap-3"
                    >
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-gray-600 mb-6">
            Not sure which plan is right for you?
          </p>
          <button className="px-8 py-3 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors">
            Schedule a Demo
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
