import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="relative flex h-screen w-full flex-col bg-background-light overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 bg-neutral-light-gray overflow-y-auto relative scroll-smooth">
          {children}
        </main>
      </div>
      
      {/* Floating Action Button */}
      <button 
        className="absolute bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-full bg-corporate-blue text-white shadow-lg hover:bg-corporate-blue/90 hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-corporate-blue/30 z-40"
        title="AI Assistant"
      >
        <span className="material-symbols-outlined text-3xl">smart_toy</span>
      </button>
    </div>
  );
};

export default Layout;
