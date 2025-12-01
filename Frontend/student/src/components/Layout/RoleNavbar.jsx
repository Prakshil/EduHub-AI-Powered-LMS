import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Home,
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  Megaphone,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Shield,
  Calendar,
  FileText,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const RoleNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileDropdownOpen && !e.target.closest('.profile-dropdown')) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [profileDropdownOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getInitials = (name) => {
    return name ? name.substring(0, 2).toUpperCase() : 'U';
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'teacher': return 'Teacher';
      case 'user': return 'Student';
      default: return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
    }
  };

  // Robust scroll-to-section helper for landing page links
  const handleSmoothScroll = (sectionId) => {
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

  // Navigation configuration based on roles
  const getNavLinks = () => {
    if (!user) {
      return [
        { name: "Home", to: "/", icon: Home },
        { name: "Features", action: () => handleSmoothScroll("features"), icon: FileText },
        { name: "Pricing", action: () => handleSmoothScroll("pricing"), icon: BookOpen },
        { name: "About", action: () => handleSmoothScroll("about"), icon: GraduationCap },
        { name: "Contact", action: () => handleSmoothScroll("footer"), icon: User },
      ];
    }

    const commonLinks = [
      { name: "Dashboard", to: getDashboardRoute(), icon: LayoutDashboard },
      { name: "Announcements", to: "/announcements", icon: Megaphone },
    ];

    const adminLinks = [
      { name: "Admin Panel", to: "/admin", icon: Shield },
      { name: "Courses", to: "/courses", icon: BookOpen },
    ];

    const teacherLinks = [
      { name: "My Courses", to: "/courses", icon: BookOpen },
    ];

    const studentLinks = [
      { name: "Courses", to: "/courses", icon: BookOpen },
    ];

    let roleLinks = [];
    switch (user.role) {
      case 'admin':
        roleLinks = adminLinks;
        break;
      case 'teacher':
        roleLinks = teacherLinks;
        break;
      case 'user':
      case 'student':
      default:
        roleLinks = studentLinks;
        break;
    }

    return [...commonLinks, ...roleLinks];
  };

  const getDashboardRoute = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'admin':
        return '/admin';
      case 'teacher':
        return '/teacher';
      default:
        return '/dashboard';
    }
  };

  const getRoleBadgeColor = () => {
    switch (user?.role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'teacher':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'user':
      case 'student':
      default:
        return 'bg-green-100 text-green-700 border-green-300';
    }
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navLinks = getNavLinks();
  const profileRoute = user ? `/users/${user._id}` : '/login';

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200"
            : "bg-white/80 backdrop-blur-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={user ? getDashboardRoute() : "/"}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">E</span>
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-bold text-lg text-gray-800">EduHub</span>
                  <span className="text-xs text-gray-600">AI-Powered LMS</span>
                </div>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((item) => (
                item.action ? (
                  <button
                    key={item.name}
                    onClick={item.action}
                    className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </button>
                ) : (
                  <Link
                    key={item.name}
                    to={item.to}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive(item.to)
                        ? "text-indigo-600 bg-indigo-50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                    {item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </Link>
                )
              ))}
            </div>

            {/* Right Side */}
            <div className="hidden md:flex items-center space-x-4">
              {user && (
                <Button
                  variant="outline"
                  onClick={() => navigate(profileRoute)}
                  className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                >
                  View Profile
                </Button>
              )}
              {user ? (
                <div className="relative profile-dropdown">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setProfileDropdownOpen(!profileDropdownOpen);
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Avatar className="h-8 w-8 border-2 border-indigo-200">
                      <AvatarImage src={user?.profileimage} alt={user?.username} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm">
                        {getInitials(user?.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-800">{user?.username}</p>
                      <Badge className={`text-xs py-0 px-2 ${getRoleBadgeColor()}`}>
                        {getRoleDisplayName(user?.role)}
                      </Badge>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {profileDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
                      >
                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                          <p className="text-sm font-semibold text-gray-800">{user?.username}</p>
                          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                        <div className="p-2">
                          <Link
                            to="/profile/edit"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Settings className="h-4 w-4" />
                            Edit Profile
                          </Link>
                        </div>
                        <div className="p-2 border-t border-gray-100">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => navigate('/login')}
                    variant="ghost"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => navigate('/signup')}
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 text-white shadow-md"
                  >
                    Get Started
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-600" />
              ) : (
                <Menu className="h-6 w-6 text-gray-600" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden bg-white border-t border-gray-200"
            >
              <div className="px-4 py-4 space-y-2">
                {user && (
                  <div className="flex items-center gap-3 p-3 mb-4 bg-gray-50 rounded-xl">
                    <Avatar className="h-10 w-10 border-2 border-indigo-200">
                      <AvatarImage src={user?.profileimage} alt={user?.username} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                        {getInitials(user?.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-800">{user?.username}</p>
                      <Badge className={`text-xs ${getRoleBadgeColor()}`}>
                        {getRoleDisplayName(user?.role)}
                      </Badge>
                    </div>
                  </div>
                )}

                {navLinks.map((item) => (
                  <Link
                    key={item.name}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive(item.to)
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                    {item.badge > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}

                <div className="pt-4 border-t border-gray-200 space-y-2">
                  {user ? (
                    <>
                      <Link
                        to={profileRoute}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                      >
                        <User className="h-5 w-5" />
                        View Profile
                      </Link>
                      <Link
                        to="/profile/edit"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                      >
                        <Settings className="h-5 w-5" />
                        Edit Profile
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <LogOut className="h-5 w-5" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          navigate('/login');
                          setMobileMenuOpen(false);
                        }}
                        className="w-full px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-all text-left"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => {
                          navigate('/signup');
                          setMobileMenuOpen(false);
                        }}
                        className="w-full px-4 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl font-medium"
                      >
                        Get Started
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
};

export default RoleNavbar;

