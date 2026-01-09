import React, { useState, useEffect, useRef } from 'react';
import { Calendar, User, Trophy, Zap, List, LogOut, LogIn, UserCircle } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export default function Navigation({ currentPage, onPageChange }: NavigationProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const navbarRef = useRef<HTMLElement>(null);
  
  const navItems = [
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'driver', label: 'Drivers', icon: User },
    { id: 'teams', label: 'Teams', icon: Trophy },
    { id: 'results', label: 'Results', icon: List },
    { id: 'predict', label: 'Predict', icon: Zap },
    { id: 'betting', label: 'Betting', icon: Trophy },
  ];

  const handleLogout = () => {
    logout();
  };

  // Ripple effect function
  const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
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

  // Liquid distortion effect for navbar - Optimized for performance
  useEffect(() => {
    const navbar = navbarRef.current;
    if (!navbar) return;

    let animationFrameId: number;
    let isHovering = false;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isHovering) return;
      
      // Use requestAnimationFrame for smooth performance
      animationFrameId = requestAnimationFrame(() => {
        const rect = navbar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        navbar.style.setProperty('--x', `${x}px`);
        navbar.style.setProperty('--y', `${y}px`);
      });
    };

    const handleMouseEnter = () => {
      isHovering = true;
    };

    const handleMouseLeave = () => {
      isHovering = false;
      navbar.style.setProperty('--x', '0px');
      navbar.style.setProperty('--y', '0px');
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };

    navbar.addEventListener('mouseenter', handleMouseEnter);
    navbar.addEventListener('mousemove', handleMouseMove);
    navbar.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      navbar.removeEventListener('mouseenter', handleMouseEnter);
      navbar.removeEventListener('mousemove', handleMouseMove);
      navbar.removeEventListener('mouseleave', handleMouseLeave);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);


  // Liquid distortion effect for buttons - Optimized for performance
  const handleButtonMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    
    // Use requestAnimationFrame for smooth performance
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

  // Enhanced click handler with red glassmorphism effect
  const handleNavItemClick = (e: React.MouseEvent<HTMLButtonElement>, pageId: string) => {
    createRipple(e);
    
    // Add red glassmorphism effect on click
    const button = e.currentTarget;
    const glassmorphismDiv = button.querySelector('.glassmorphism-bg') as HTMLElement;
    
    if (glassmorphismDiv) {
      // Store original styles
      const originalBackground = glassmorphismDiv.style.background;
      const originalBorder = glassmorphismDiv.style.border;
      const originalBoxShadow = glassmorphismDiv.style.boxShadow;
      const originalBackdropFilter = glassmorphismDiv.style.backdropFilter;
      
      // Apply enhanced red glassmorphism effect
      glassmorphismDiv.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(220, 38, 38, 0.4), rgba(185, 28, 28, 0.3))';
      glassmorphismDiv.style.border = '1px solid rgba(239, 68, 68, 0.6)';
      glassmorphismDiv.style.backdropFilter = 'blur(25px) saturate(1.5)';
      glassmorphismDiv.style.boxShadow = '0 8px 32px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
      glassmorphismDiv.style.transform = 'scale(1.02)';
      glassmorphismDiv.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      
      // Add pulsing glow effect
      const glowDiv = button.querySelector('.glow-effect') as HTMLElement;
      if (glowDiv) {
        glowDiv.style.background = 'radial-gradient(circle, rgba(239, 68, 68, 0.6) 0%, rgba(220, 38, 38, 0.4) 50%, transparent 70%)';
        glowDiv.style.opacity = '1';
        glowDiv.style.transform = 'scale(1.5)';
      }
      
      // Reset after animation
      setTimeout(() => {
        glassmorphismDiv.style.background = originalBackground;
        glassmorphismDiv.style.border = originalBorder;
        glassmorphismDiv.style.backdropFilter = originalBackdropFilter;
        glassmorphismDiv.style.boxShadow = originalBoxShadow;
        glassmorphismDiv.style.transform = 'scale(1)';
        
        if (glowDiv) {
          glowDiv.style.background = '';
          glowDiv.style.opacity = '';
          glowDiv.style.transform = 'scale(1)';
        }
      }, 400);
    }
    
    onPageChange(pageId);
  };

  return (
    <>
      <nav ref={navbarRef} className="glass-navbar liquid-flow fixed top-0 w-full z-[9999] bg-black/10 backdrop-blur-3xl border-b border-white/20 shadow-2xl shadow-red-500/10" style={{ position: 'fixed', top: 0, left: 0, right: 0 }}>
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-5">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex-shrink-0 flex items-center justify-start">
              <div
                className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 focus:outline-none group cursor-pointer"
                onClick={() => onPageChange('home')}
                aria-label="Go to homepage"
              >
                <div className="relative">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-red-500 group-hover:text-red-400 transition-all duration-300 transform group-hover:scale-110" />
                  <div className="absolute inset-0 bg-red-500/20 rounded-full blur-lg group-hover:bg-red-400/30 transition-all duration-300"></div>
                </div>
                <span className="text-sm sm:text-lg md:text-xl font-bold bg-gradient-to-r from-red-500 to-red-400 bg-clip-text text-transparent group-hover:from-red-400 group-hover:to-red-300 transition-all duration-300">F1PREDICT</span>
              </div>
            </div>
            
            {/* Navigation Items - Perfectly centered */}
            <div className="flex items-center justify-center flex-1 mx-1 sm:mx-2 md:mx-4">
              <div className="flex items-center space-x-0.5 sm:space-x-1 md:space-x-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={(e) => handleNavItemClick(e, item.id)}
                      onMouseMove={handleButtonMouseMove}
                      onMouseLeave={handleButtonMouseLeave}
                      className={`relative group flex items-center justify-center gap-0.5 sm:gap-1 md:gap-2 px-1 sm:px-2 md:px-3 lg:px-4 py-1.5 sm:py-2 md:py-3 lg:py-4 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm md:text-base transition-all duration-300 ripple-btn liquid-flow min-w-[50px] sm:min-w-[60px] md:min-w-[80px] lg:min-w-[100px] overflow-hidden ${
                        isActive ? 'text-white' : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      {/* Enhanced Glassmorphism background */}
                      <div className={`glassmorphism-bg absolute inset-0 backdrop-blur-2xl rounded-xl border transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-red-600/40 to-red-700/40 border-red-500/50 shadow-lg shadow-red-500/30'
                          : 'bg-black/10 border-white/20 group-hover:bg-black/20 group-hover:border-red-500/40'
                      }`}></div>
                      
                      {/* Enhanced Glow effect */}
                      <div className={`glow-effect absolute inset-0 rounded-xl blur-xl transition-all duration-500 ${
                        isActive 
                          ? 'bg-red-500/40 opacity-100' 
                          : 'bg-red-500/10 opacity-0 group-hover:opacity-100'
                      }`}></div>
                      
                      {/* Glassmorphism inner highlight */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

                      {/* Content */}
                      <div className="relative z-10 flex items-center justify-center gap-0.5 sm:gap-1 md:gap-2">
                        <Icon className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0" />
                        <span className="text-center hidden lg:inline">{item.label}</span>
                      </div>
                      
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 to-red-600/30 animate-pulse rounded-xl"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Authentication Section */}
            <div className="flex items-center justify-end flex-shrink-0">
              {isAuthenticated ? (
                <>
                  {/* User Menu - Click opens profile dropdown; right-click opens Sign In modal for consistency */}
                  <div className="relative">
                    <button 
                      onClick={(e) => { 
                        createRipple(e);
                        // Apply red glassmorphism effect on click
                        const button = e.currentTarget;
                        const glassmorphismDiv = button.querySelector('.glassmorphism-bg') as HTMLElement;
                        
                        if (glassmorphismDiv) {
                          // Store original styles
                          const originalBackground = glassmorphismDiv.style.background;
                          const originalBorder = glassmorphismDiv.style.border;
                          const originalBoxShadow = glassmorphismDiv.style.boxShadow;
                          const originalBackdropFilter = glassmorphismDiv.style.backdropFilter;
                          
                          // Apply enhanced red glassmorphism effect
                          glassmorphismDiv.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(220, 38, 38, 0.4), rgba(185, 28, 28, 0.3))';
                          glassmorphismDiv.style.border = '1px solid rgba(239, 68, 68, 0.6)';
                          glassmorphismDiv.style.backdropFilter = 'blur(25px) saturate(1.5)';
                          glassmorphismDiv.style.boxShadow = '0 8px 32px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                          glassmorphismDiv.style.transform = 'scale(1.02)';
                          glassmorphismDiv.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                          
                          // Add pulsing glow effect
                          const glowDiv = button.querySelector('.glow-effect') as HTMLElement;
                          if (glowDiv) {
                            glowDiv.style.background = 'radial-gradient(circle, rgba(239, 68, 68, 0.6) 0%, rgba(220, 38, 38, 0.4) 50%, transparent 70%)';
                            glowDiv.style.opacity = '1';
                            glowDiv.style.transform = 'scale(1.5)';
                          }
                          
                          // Reset after animation
                          setTimeout(() => {
                            glassmorphismDiv.style.background = originalBackground;
                            glassmorphismDiv.style.border = originalBorder;
                            glassmorphismDiv.style.backdropFilter = originalBackdropFilter;
                            glassmorphismDiv.style.boxShadow = originalBoxShadow;
                            glassmorphismDiv.style.transform = 'scale(1)';
                            
                            if (glowDiv) {
                              glowDiv.style.background = '';
                              glowDiv.style.opacity = '';
                              glowDiv.style.transform = 'scale(1)';
                            }
                          }, 400);
                        }
                        onPageChange('profile'); 
                      }}
                      onMouseMove={handleButtonMouseMove}
                      onMouseLeave={handleButtonMouseLeave}
                      className="relative group flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full text-sm sm:text-lg md:text-xl ripple-btn liquid-flow transition-all duration-300"
                      title={user?.username || user?.email?.split('@')[0] || 'User'}
                    >
                      {/* Enhanced Glassmorphism background */}
                      <div className="glassmorphism-bg absolute inset-0 backdrop-blur-2xl rounded-full border border-white/20 bg-black/10 group-hover:bg-black/20 group-hover:border-red-500/40 transition-all duration-300"></div>
                      
                      {/* Enhanced Glow effect */}
                      <div className="glow-effect absolute inset-0 rounded-full blur-xl bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                      
                      {/* Glassmorphism inner highlight */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                      
                      {/* Content */}
                      <div className="relative z-10">👤</div>
                    </button>
                    
                  </div>
                </>
              ) : (
                <button
                  onClick={(e) => {
                    createRipple(e);
                    // Apply red glassmorphism effect on click
                    const button = e.currentTarget;
                    const glassmorphismDiv = button.querySelector('.glassmorphism-bg') as HTMLElement;
                    
                    if (glassmorphismDiv) {
                      // Store original styles
                      const originalBackground = glassmorphismDiv.style.background;
                      const originalBorder = glassmorphismDiv.style.border;
                      const originalBoxShadow = glassmorphismDiv.style.boxShadow;
                      const originalBackdropFilter = glassmorphismDiv.style.backdropFilter;
                      
                      // Apply enhanced red glassmorphism effect
                      glassmorphismDiv.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(220, 38, 38, 0.4), rgba(185, 28, 28, 0.3))';
                      glassmorphismDiv.style.border = '1px solid rgba(239, 68, 68, 0.6)';
                      glassmorphismDiv.style.backdropFilter = 'blur(25px) saturate(1.5)';
                      glassmorphismDiv.style.boxShadow = '0 8px 32px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                      glassmorphismDiv.style.transform = 'scale(1.02)';
                      glassmorphismDiv.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                      
                      // Add pulsing glow effect
                      const glowDiv = button.querySelector('.glow-effect') as HTMLElement;
                      if (glowDiv) {
                        glowDiv.style.background = 'radial-gradient(circle, rgba(239, 68, 68, 0.6) 0%, rgba(220, 38, 38, 0.4) 50%, transparent 70%)';
                        glowDiv.style.opacity = '1';
                        glowDiv.style.transform = 'scale(1.5)';
                      }
                      
                      // Reset after animation
                      setTimeout(() => {
                        glassmorphismDiv.style.background = originalBackground;
                        glassmorphismDiv.style.border = originalBorder;
                        glassmorphismDiv.style.backdropFilter = originalBackdropFilter;
                        glassmorphismDiv.style.boxShadow = originalBoxShadow;
                        glassmorphismDiv.style.transform = 'scale(1)';
                        
                        if (glowDiv) {
                          glowDiv.style.background = '';
                          glowDiv.style.opacity = '';
                          glowDiv.style.transform = 'scale(1)';
                        }
                      }, 400);
                    }
                    onPageChange('signin');
                  }}
                  onMouseMove={handleButtonMouseMove}
                  onMouseLeave={handleButtonMouseLeave}
                  className="relative group px-1.5 sm:px-2 md:px-3 lg:px-4 py-1.5 sm:py-2 md:py-2.5 font-semibold text-white transition-all duration-300 ripple-btn liquid-flow rounded-lg sm:rounded-xl"
                >
                  {/* Enhanced Glassmorphism background */}
                  <div className="glassmorphism-bg absolute inset-0 backdrop-blur-2xl rounded-lg sm:rounded-xl bg-gradient-to-r from-red-600/40 to-red-700/40 border border-red-500/40 group-hover:from-red-700/50 group-hover:to-red-800/50 group-hover:border-red-400/50 transition-all duration-300"></div>
                  
                  {/* Enhanced Glow effect */}
                  <div className="glow-effect absolute inset-0 rounded-lg sm:rounded-xl blur-xl bg-red-500/20 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                  
                  {/* Glassmorphism inner highlight */}
                  <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                  
                  {/* Content */}
                  <div className="relative z-10 flex items-center">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 inline mr-0.5 sm:mr-1 md:mr-2" />
                    <span className="hidden lg:inline">Sign In</span>
                    <span className="lg:hidden text-xs sm:text-sm">Login</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

    </>
  );
}