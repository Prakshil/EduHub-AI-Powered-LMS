import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSmoothScroll = (sectionId) => {
    // Robust scrolling helper: retry until target exists (for route navigation delays)
    const tryScrollWithRetries = (maxAttempts = 20, interval = 100) => {
      let attempts = 0;
      const id = setInterval(() => {
        attempts += 1;
        const element = document.getElementById(sectionId);
        if (element) {
          clearInterval(id);
          // small delay to allow layout to settle
          setTimeout(() => {
            const headerOffset = 96; // height of fixed navbar (approx)
            const elementPosition = element.getBoundingClientRect().top + window.scrollY;
            const offsetPosition = Math.max(0, elementPosition - headerOffset);
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
          }, 40);
        } else if (attempts >= maxAttempts) {
          clearInterval(id);
        }
      }, interval);
    };

    if (location.pathname === "/") {
      // Already on landing page, attempt immediate scroll with retries
      tryScrollWithRetries();
      setMobileMenuOpen(false);
    } else {
      // Navigate to landing page first then attempt to scroll
      navigate("/");
      // start retries slightly after navigation begins
      setTimeout(() => tryScrollWithRetries(), 120);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  // Role-based navigation links
  const commonLinks = [
    { name: "Dashboard", to: "/dashboard", roles: ["admin", "teacher", "student"] },
    { name: "Announcements", to: "/announcements", roles: ["admin", "teacher", "student"] },
  ];
  const adminLinks = [
    { name: "Admin Panel", to: "/admin", roles: ["admin"] },
    { name: "Users", to: "/admin/users", roles: ["admin"] },
    { name: "Students", to: "/admin/students", roles: ["admin"] },
    { name: "Subjects", to: "/subjects", roles: ["admin"] },
    { name: "Semesters", to: "/semesters", roles: ["admin"] },
    { name: "Courses", to: "/courses", roles: ["admin"] },
  ];
  const teacherLinks = [
    { name: "My Courses", to: "/courses/my-courses", roles: ["teacher"] },
    { name: "Subjects", to: "/subjects", roles: ["teacher"] },
    { name: "Semesters", to: "/semesters", roles: ["teacher"] },
  ];
  const studentLinks = [
    { name: "My Enrollments", to: "/enrollments/my-enrollments", roles: ["student"] },
    { name: "Subjects", to: "/subjects", roles: ["student"] },
    { name: "Semesters", to: "/semesters", roles: ["student"] },
  ];

  // Combine links based on user role
  let navLinks = [];
  if (user) {
    navLinks = [
      ...commonLinks,
      ...(user.role === "admin" ? adminLinks : []),
      ...(user.role === "teacher" ? teacherLinks : []),
      ...(user.role === "user" ? studentLinks : []),
    ];
  } else {
    navLinks = [
      { name: "Home", to: "/", roles: [] },
      { name: "Features", action: () => handleSmoothScroll("features"), roles: [] },
      { name: "Pricing", action: () => handleSmoothScroll("pricing"), roles: [] },
      { name: "About", action: () => handleSmoothScroll("about"), roles: [] },
      { name: "Contact", action: () => handleSmoothScroll("footer"), roles: [] },
    ];
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/80 backdrop-blur-lg border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-4"
          >
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-white font-bold text-2xl">EduHub</span>
              <span className="text-white/70 text-xs">AI-Powered LMS</span>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07 }}
                whileHover={{ scale: 1.1 }}
              >
                {item.action ? (
                  <button
                    onClick={item.action}
                    className="text-neutral-300 hover:text-white transition-colors relative group px-4 py-2 rounded-md text-base font-medium cursor-pointer"
                  >
                    {item.name}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 group-hover:w-full transition-all duration-300"></span>
                  </button>
                ) : (
                  <Link
                    to={item.to}
                    className="text-neutral-300 hover:text-white transition-colors relative group px-4 py-2 rounded-md text-base font-medium"
                  >
                    {item.name}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                )}
              </motion.div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(168, 85, 247, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/dashboard')}
                  className="px-7 py-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  Dashboard
                </motion.button>
                {user.role === 'admin' && (
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(168, 85, 247, 0.5)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/admin')}
                    className="px-7 py-2 bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                  >
                    Admin Panel
                  </motion.button>
                )}
              </>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/login')}
                  className="px-5 py-2 text-white hover:text-blue-400 transition-colors"
                >
                  Sign In
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(168, 85, 247, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/signup')}
                  className="px-7 py-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  Get Started
                </motion.button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div
        initial={false}
        animate={{
          height: mobileMenuOpen ? "auto" : 0,
          opacity: mobileMenuOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="md:hidden overflow-hidden bg-black/95 backdrop-blur-lg border-t border-white/10"
      >
        <div className="px-4 py-4 space-y-3">
          {navLinks.map((item) => (
            <div key={item.name}>
              {item.action ? (
                <button
                  onClick={item.action}
                  className="w-full text-left px-4 py-2 text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  {item.name}
                </button>
              ) : (
                <Link
                  to={item.to}
                  className="block px-4 py-2 text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              )}
            </div>
          ))}
          <div className="pt-4 space-y-2 border-t border-white/10">
            {user ? (
              <>
                <button
                  onClick={() => {
                    navigate('/dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-lg font-medium"
                >
                  Dashboard
                </button>
                {user.role === 'admin' && (
                  <button
                    onClick={() => {
                      navigate('/admin');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 text-white rounded-lg font-medium"
                  >
                    Admin Panel
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    navigate('/login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    navigate('/signup');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-lg font-medium"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.nav>
  );
};

export default Navbar;