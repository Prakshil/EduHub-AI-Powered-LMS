import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFoundPage = () => {
    return (
        <div className="min-h-screen w-full bg-white relative overflow-hidden flex items-center justify-center">
            {/* Grid background */}
            <div
                className="fixed inset-0 z-0"
                style={{
                    backgroundImage: 'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Gradient blobs */}
            <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" />
            <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 text-center max-w-lg mx-4"
            >
                {/* 404 Number */}
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, type: 'spring' }}
                    className="mb-6"
                >
                    <h1 className="text-9xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 select-none">
                        404
                    </h1>
                </motion.div>

                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    Page Not Found
                </h2>
                <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
                    The page you're looking for doesn't exist or has been moved. Let's get you back on track.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link to="/">
                        <Button className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-90 transition-opacity text-white font-semibold px-6 py-5 rounded-xl shadow-lg shadow-indigo-500/25">
                            <Home className="mr-2 h-4 w-4" />
                            Go Home
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        onClick={() => window.history.back()}
                        className="border-gray-300 text-gray-700 px-6 py-5 rounded-xl hover:bg-gray-50"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Go Back
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};

export default NotFoundPage;
