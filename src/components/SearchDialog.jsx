import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
    LayoutDashboard,
    BookOpen,
    Megaphone,
    FileText,
    User,
    Settings,
    Shield,
    Search,
    GraduationCap,
} from 'lucide-react';

const SearchDialog = ({ open, onOpenChange }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const navigate = useNavigate();
    const { user } = useAuth();

    const getDashboardRoute = () => {
        if (!user) return '/';
        switch (user.role) {
            case 'admin': return '/admin';
            case 'teacher': return '/teacher';
            default: return '/dashboard';
        }
    };

    const allItems = useMemo(() => {
        const common = [
            { name: 'Dashboard', description: 'Go to your dashboard', icon: LayoutDashboard, path: getDashboardRoute() },
            { name: 'Courses', description: 'Browse and manage courses', icon: BookOpen, path: '/courses' },
            { name: 'Announcements', description: 'View announcements', icon: Megaphone, path: '/announcements' },
            { name: 'Edit Profile', description: 'Update your profile settings', icon: Settings, path: '/profile/edit' },
        ];

        if (user) {
            common.push({ name: 'My Profile', description: 'View your profile', icon: User, path: `/users/${user._id}` });
        }

        if (user?.role === 'admin') {
            common.push(
                { name: 'Admin Panel', description: 'Manage users and system', icon: Shield, path: '/admin' },
            );
        }

        if (user?.role === 'teacher') {
            common.push(
                { name: 'Exam Generator', description: 'Generate AI-powered exams', icon: FileText, path: '/teacher/exam-generator' },
            );
        }

        if (user?.role === 'user' || user?.role === 'student') {
            common.push(
                { name: 'Assignments', description: 'View your assignments', icon: GraduationCap, path: '/assignments' },
            );
        }

        return common;
    }, [user]);

    const filteredItems = useMemo(() => {
        if (!query.trim()) return allItems;
        const lowerQuery = query.toLowerCase();
        return allItems.filter(
            (item) =>
                item.name.toLowerCase().includes(lowerQuery) ||
                item.description.toLowerCase().includes(lowerQuery)
        );
    }, [query, allItems]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [filteredItems]);

    const handleSelect = useCallback((item) => {
        navigate(item.path);
        onOpenChange(false);
        setQuery('');
    }, [navigate, onOpenChange]);

    // Keyboard navigation
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredItems[selectedIndex]) {
                    handleSelect(filteredItems[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                onOpenChange(false);
                setQuery('');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, filteredItems, selectedIndex, handleSelect, onOpenChange]);

    // Global Ctrl+K / Cmd+K shortcut
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                onOpenChange(!open);
                if (!open) setQuery('');
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [open, onOpenChange]);

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
                onClick={() => {
                    onOpenChange(false);
                    setQuery('');
                }}
            />

            {/* Dialog */}
            <div className="fixed inset-0 z-[61] flex items-start justify-center pt-[15vh]">
                <div
                    className="w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Search Input */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                        <Search className="h-5 w-5 text-gray-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Search pages..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                            className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder:text-gray-400 text-sm"
                        />
                        <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-xs text-gray-500">
                            ESC
                        </kbd>
                    </div>

                    {/* Results */}
                    <div className="max-h-72 overflow-y-auto p-2">
                        {filteredItems.length === 0 ? (
                            <div className="py-8 text-center text-gray-400 text-sm">
                                No results found for "{query}"
                            </div>
                        ) : (
                            filteredItems.map((item, index) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.path}
                                        onClick={() => handleSelect(item)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${index === selectedIndex
                                                ? 'bg-indigo-50 text-indigo-700'
                                                : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-lg shrink-0 ${index === selectedIndex ? 'bg-indigo-100' : 'bg-gray-100'
                                            }`}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{item.name}</p>
                                            <p className="text-xs text-gray-400 truncate">{item.description}</p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50">
                        <span className="text-xs text-gray-400">Navigate to page</span>
                        <div className="flex items-center gap-2">
                            <kbd className="inline-flex items-center rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-500">↑↓</kbd>
                            <span className="text-xs text-gray-400">navigate</span>
                            <kbd className="inline-flex items-center rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-500">↵</kbd>
                            <span className="text-xs text-gray-400">select</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SearchDialog;
