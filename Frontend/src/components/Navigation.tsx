import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, User, Trophy, Zap, List, LogOut, Menu, X, UserCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export default function Navigation({ currentPage, onPageChange }: NavigationProps) {
  const { isAuthenticated, logout } = useAuth();
  const navbarRef = useRef<HTMLElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const primaryTabs = [
    { id: 'home', label: 'Home', icon: List },
    { id: 'predict', label: 'Predict', icon: Zap },
    { id: 'betting', label: 'Betting', icon: Trophy },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
  ];

  const secondaryItems = [
    { id: 'driver', label: 'Drivers', icon: User },
    { id: 'teams', label: 'Teams', icon: Trophy },
    { id: 'results', label: 'Results', icon: List },
  ];

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  // Ripple effect function
  const createRipple = (event: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
    const button = event.currentTarget;
    const circle = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    circle.style.width = circle.style.height = `${size}px`;
    circle.style.left = `${x}px`;
    circle.style.top = `${y}px`;
    circle.classList.add('ripple');

    button.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
  };

  // Liquid distortion effect for navbar
  useEffect(() => {
    const navbar = navbarRef.current;
    if (!navbar) return;

    let animationFrameId: number;
    let isHovering = false;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isHovering) return;
      animationFrameId = requestAnimationFrame(() => {
        const rect = navbar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        navbar.style.setProperty('--x', `${x}px`);
        navbar.style.setProperty('--y', `${y}px`);
      });
    };

    const handleMouseEnter = () => isHovering = true;
    const handleMouseLeave = () => {
      isHovering = false;
      navbar.style.setProperty('--x', '0px');
      navbar.style.setProperty('--y', '0px');
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };

    navbar.addEventListener('mouseenter', handleMouseEnter);
    navbar.addEventListener('mousemove', handleMouseMove);
    navbar.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      navbar.removeEventListener('mouseenter', handleMouseEnter);
      navbar.removeEventListener('mousemove', handleMouseMove);
      navbar.removeEventListener('mouseleave', handleMouseLeave);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleButtonMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    requestAnimationFrame(() => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      button.style.setProperty('--btn-x', `${x}px`);
      button.style.setProperty('--btn-y', `${y}px`);
    });
  };

  const handleButtonMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    button.style.setProperty('--btn-x', '0px');
    button.style.setProperty('--btn-y', '0px');
  };

  const handleNavItemClick = (e: React.MouseEvent<HTMLButtonElement>, pageId: string) => {
    createRipple(e);
    onPageChange(pageId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav ref={navbarRef} className="glass-navbar liquid-flow fixed top-0 w-full z-[9999] bg-black/10 backdrop-blur-3xl border-b border-white/20 shadow-2xl shadow-red-500/10">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-5">
          <div className="flex items-center justify-between relative">

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-gray-300 hover:text-white transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            {/* Logo Section */}
            <div className="flex-shrink-0 flex items-center">
              <div
                className="flex items-center space-x-2 md:space-x-3 focus:outline-none group cursor-pointer"
                onClick={() => onPageChange('home')}
                aria-label="Go to homepage"
              >
                <div className="relative">
                  <Zap className="w-6 h-6 md:w-8 md:h-8 text-red-500 group-hover:text-red-400 transition-all duration-300" />
                  <div className="absolute inset-0 bg-red-500/20 rounded-full blur-lg"></div>
                </div>
                <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-red-500 to-red-400 bg-clip-text text-transparent group-hover:from-red-400 group-hover:to-red-300 transition-all duration-300" style={{ fontFamily: '"Orbitron", sans-serif' }}>
                  F1PREDICT
                </span>
              </div>
            </div>

            {/* Desktop Navigation Items */}
            <div className="hidden md:flex items-center justify-center flex-1 mx-8">
              <div className="flex items-center space-x-2">
                {[...primaryTabs, ...secondaryItems].map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  if (item.id === 'home' && item.label === 'Home') return null; // Skip redundant home in desktop
                  return (
                    <button
                      key={item.id}
                      onClick={(e) => handleNavItemClick(e, item.id)}
                      onMouseMove={handleButtonMouseMove}
                      onMouseLeave={handleButtonMouseLeave}
                      className={`relative group flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ripple-btn overflow-hidden ${isActive ? 'text-white' : 'text-gray-300 hover:text-white'
                        }`}
                    >
                      <div className={`absolute inset-0 transition-all duration-300 ${isActive
                        ? 'bg-red-600/20 border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                        : 'bg-white/5 border border-white/10 group-hover:border-red-500/30'
                        } rounded-xl`}></div>
                      <div className="relative z-10 flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        <span className="hidden lg:inline">{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Authentication Section */}
            <div className="flex items-center">
              {isAuthenticated ? (
                <button
                  onClick={() => onPageChange('profile')}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/20 bg-white/5 flex items-center justify-center hover:border-red-500/50 hover:bg-red-500/10 transition-all"
                >
                  <span className="text-xl">👤</span>
                </button>
              ) : (
                <button
                  onClick={() => onPageChange('signin')}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-2xl border-t border-white/10 md:hidden z-[9999] px-6 pt-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          {primaryTabs.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={(e) => handleNavItemClick(e, item.id)}
                className={`relative flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all duration-300 ${isActive ? 'text-red-500' : 'text-gray-400'
                  }`}
              >
                <motion.div
                  animate={isActive ? { scale: 1.1, y: -2 } : { scale: 1, y: 0 }}
                  className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : ''}`}
                >
                  <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                </motion.div>
                <span className={`text-[10px] font-bold uppercase tracking-wider transition-all ${isActive ? 'opacity-100 scale-105' : 'opacity-60'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-2 w-1 h-1 bg-red-500 rounded-full"
                  />
                )}
              </button>
            );
          })}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-1 min-w-[64px] text-gray-400"
          >
            <div className="p-2 rounded-xl">
              <Menu className="w-6 h-6 stroke-[1.5px]" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
              More
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000]"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-black/90 backdrop-blur-2xl border-r border-white/10 z-[10001] p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-10">
                <span className="text-xl font-bold bg-gradient-to-r from-red-500 to-red-400 bg-clip-text text-transparent">F1PREDICT</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar no-scrollbar relative min-h-0">
                <div className="mb-8">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest px-4 mb-4">Quick Access</p>
                  <div className="grid grid-cols-1 gap-2">
                    {primaryTabs.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentPage === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={(e) => handleNavItemClick(e, item.id)}
                          className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${isActive
                            ? 'bg-red-600/20 text-white border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                            : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                        >
                          <div className={`p-2 rounded-lg ${isActive ? 'bg-red-500/20' : 'bg-white/5'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="font-semibold">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest px-4 mb-4">Discover</p>
                  <div className="grid grid-cols-1 gap-2">
                    {secondaryItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentPage === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={(e) => handleNavItemClick(e, item.id)}
                          className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${isActive
                            ? 'bg-red-600/20 text-white border border-red-500/30'
                            : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                        >
                          <div className={`p-2 rounded-lg ${isActive ? 'bg-red-500/20' : 'bg-white/5'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="font-medium">{item.label}</span>
                          {(item.id === 'settings' || item.id === 'help') && (
                            <span className="ml-auto text-[10px] bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">Soon</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {isAuthenticated && (
                  <div className="pt-6 mt-6 border-t border-white/10">
                    <button
                      onClick={(e) => handleNavItemClick(e, 'profile')}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${currentPage === 'profile'
                        ? 'bg-red-600/20 text-white border border-red-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                    >
                      <UserCircle className="w-5 h-5" />
                      <span className="font-medium">My Profile</span>
                    </button>
                  </div>
                )}
              </div>

              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="mt-auto flex items-center gap-4 p-4 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}