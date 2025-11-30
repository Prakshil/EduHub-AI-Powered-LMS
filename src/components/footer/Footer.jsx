import React from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";

const Footer = () => {
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
          setTimeout(() => {
            const headerOffset = 96;
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
      tryScrollWithRetries();
    } else {
      navigate("/");
      setTimeout(() => tryScrollWithRetries(), 120);
    }
  };

  const footerLinks = {
    Product: [
      { name: "Features", action: () => handleSmoothScroll("features"), href: null },
      { name: "Pricing", action: () => handleSmoothScroll("pricing"), href: null },
      { name: "Why EduHub", action: () => handleSmoothScroll("about"), href: null },
      { name: "Documentation", href: "https://github.com/Prakshil/student-Management-System-MERN.git" },
    ],
    Company: [
      { name: "About Us", action: () => handleSmoothScroll("about"), href: null },
      { name: "Blog", href: "#" },
      { name: "Careers", href: "#" },
      { name: "Press", href: "#" },
    ],
    Support: [
      { name: "Contact Us", action: () => handleSmoothScroll("footer"), href: null },
      { name: "Help Center", href: "#" },
      { name: "Status", href: "#" },
      { name: "Community", href: "#" },
    ],
    Legal: [
      { name: "Privacy Policy", href: "#privacy" },
      { name: "Terms of Service", href: "#terms" },
      { name: "Cookie Policy", href: "#cookies" },
      { name: "Compliance", href: "#" },
    ],
  };

  const socialLinks = [
    {
      name: "Twitter",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
        </svg>
      ),
      href: "#",
    },
    {
      name: "GitHub",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            clipRule="evenodd"
          />
        </svg>
      ),
      href: "https://github.com/Prakshil/",
    },
    {
      name: "LinkedIn",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
      href: "https://linkedin.com/in/prakshil-patel"
    }
  ];

  return (
    <footer id="footer" className="relative border-t border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-8">

          <div className="col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">E</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-900 font-bold text-xl">EduHub</span>
                  <span className="text-gray-600 text-xs">AI-Powered LMS</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-4 max-w-xs">
                Empowering educational institutions with modern, efficient, and
                secure student management solutions.
              </p>
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    whileHover={{ scale: 1.1 }}
                    className="text-gray-500 hover:text-indigo-600 transition-colors"
                  >
                    {social.icon}
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>

          {Object.entries(footerLinks).map(([category, links], categoryIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="text-gray-900 font-semibold mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    {link.action ? (
                      <button
                        onClick={link.action}
                        className="text-gray-600 hover:text-indigo-600 transition-colors text-sm cursor-pointer"
                      >
                        {link.name}
                      </button>
                    ) : (
                      <a
                        href={link.href}
                        className="text-gray-600 hover:text-indigo-600 transition-colors text-sm"
                      >
                        {link.name}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="border-t border-gray-200 pt-8 pb-8"
        >
          <div className="max-w-md">
            <h3 className="text-gray-900 font-semibold mb-2">
              In case of any Queries,
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Feel free to reach out to me , drop you mail 
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
              >
                connect
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-sm">
            © 2025 EduHub. All rights reserved.
          </p>
            <p className="text-gray-600 text-sm">
            Made with love , Patience & coffee by Prakshil Patel
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <a href="#" className="hover:text-indigo-600 transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-indigo-600 transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-indigo-600 transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
