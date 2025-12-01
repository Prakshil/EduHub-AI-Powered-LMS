import React from 'react';
import RoleNavbar from './RoleNavbar';

const Layout = ({ children, showNavbar = true }) => {
  return (
    <div className="min-h-screen w-full bg-white relative">
      {/* Grid Pattern Background */}
      <div 
        className="fixed inset-0 z-0" 
        style={{
          backgroundImage: 'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Subtle gradient overlay for depth */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.03) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(236, 72, 153, 0.03) 0%, transparent 50%)'
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {showNavbar && <RoleNavbar />}
        <main className={showNavbar ? 'pt-16' : ''}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

