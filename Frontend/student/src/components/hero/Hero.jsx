import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, BookOpen, Award, ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center py-20 px-4 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 border border-indigo-200 rounded-full mb-8">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-indigo-700 text-sm font-medium">Complete Student Management Solution</span>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Streamline Your
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 " >
              Educational Journey
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10 font-light">
            Powerful tools for tracking, managing, and optimizing student performance.
            Built for modern educational institutions.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/signup">
              <Button className="hover:opacity-90 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-indigo-500/25" >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" className="border-gray-300 text-gray-700 px-8 py-6 text-lg rounded-xl hover:bg-gray-50">
                Sign In
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
        >
          {[
            { icon: Users, label: "Active Users", value: "10,000+" },
            { icon: BookOpen, label: "Courses", value: "500+" },
            { icon: GraduationCap, label: "Students", value: "50,000+" },
            { icon: Award, label: "Success Rate", value: "98%" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
              className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <stat.icon className="h-8 w-8 text-indigo-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-gray-500 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;
