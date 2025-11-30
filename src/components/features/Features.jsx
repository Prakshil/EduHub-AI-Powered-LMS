import React from "react";
import { motion } from "framer-motion";
import { BarChart3, CheckCircle, GraduationCap, MessageCircle, FileText, BookOpen } from "lucide-react";

const Features = () => {
  const features = [
    {
      title: "Student Analytics",
      description: "Track performance metrics, attendance, and grades in real-time with powerful analytics dashboards.",
      icon: BarChart3,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Attendance Tracking",
      description: "Automated attendance management with biometric integration and instant notifications.",
      icon: CheckCircle,
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Grade Management",
      description: "Comprehensive grading system with automated calculations and report generation.",
      icon: GraduationCap,
      color: "bg-orange-100 text-orange-600",
    },
    {
      title: "Communication Hub",
      description: "Seamless communication between students, teachers, and parents with instant messaging.",
      icon: MessageCircle,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Assignment Portal",
      description: "Digital assignment submission, grading, and feedback system for efficient workflow.",
      icon: FileText,
      color: "bg-indigo-100 text-indigo-600",
    },
    {
      title: "Resource Library",
      description: "Centralized digital library with course materials, e-books, and learning resources.",
      icon: BookOpen,
      color: "bg-pink-100 text-pink-600",
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8" id="features">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Powerful{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Features
            </span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Everything you need to manage your educational institution efficiently
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="h-full bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-200 transition-all group">
                <div className={`inline-flex p-3 rounded-xl ${feature.color} mb-4`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bento Grid Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <h3 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Why Choose{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              EduHub?
            </span>
            <div className="text-center mt-2 text-sm text-gray-600">AI-Powered LMS for smarter education</div>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Large Feature */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-8 hover:shadow-lg transition-all"
            >
              <div className="h-full flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                    <span className="text-3xl">🚀</span>
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-4">
                    Lightning Fast Performance
                  </h4>
                  <p className="text-gray-600">
                    Built with modern technologies for instant load times and seamless interactions. Experience the speed difference.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400"></div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"></div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-red-400"></div>
                  </div>
                  <span className="text-sm text-gray-600">Trusted by 10k+ institutions</span>
                </div>
              </div>
            </motion.div>

            {/* Small Features */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-purple-50 border border-purple-200 rounded-2xl p-6 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                <span className="text-2xl">🔒</span>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                Secure & Private
              </h4>
              <p className="text-sm text-gray-600">
                Bank-level encryption for all student data
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-orange-50 border border-orange-200 rounded-2xl p-6 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                <span className="text-2xl">📱</span>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                Mobile Ready
              </h4>
              <p className="text-sm text-gray-600">
                Access anywhere on any device
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-green-50 border border-green-200 rounded-2xl p-6 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                <span className="text-2xl">⚡</span>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                Real-time Updates
              </h4>
              <p className="text-sm text-gray-600">
                Instant notifications and live data sync
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-blue-50 border border-blue-200 rounded-2xl p-6 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <span className="text-2xl">🎯</span>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                Easy Integration
              </h4>
              <p className="text-sm text-gray-600">
                Connect with existing school systems
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
