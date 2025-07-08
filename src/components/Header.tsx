import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '@/contexts/LanguageContext';
import { AuthButtons } from '@/components/auth/AuthButtons';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import React from "react";
import { userProfileService } from '@/lib/services/userProfileService';
import { usePreload, preloadRoutes } from '@/hooks/use-preload';

// Create a custom SheetContent that doesn't include the automatic close button
const CustomSheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & {
    side?: "top" | "right" | "bottom" | "left";
    className?: string;
  }
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPrimitive.Portal>
    <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 gap-4 bg-background shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
        side === "left" && "inset-y-0 left-0 h-full border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
        side === "right" && "inset-y-0 right-0 h-full border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
        side === "top" && "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        side === "bottom" && "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        className
      )}
      {...props}
    >
      {children}
      {/* No close button here */}
    </SheetPrimitive.Content>
  </SheetPrimitive.Portal>
));
CustomSheetContent.displayName = "CustomSheetContent";

// Custom Library Link component that checks membership status before navigating
const HeaderLibraryLink = ({ isMobile = false, closeMobileMenu = () => {} }) => {
  const { t } = useLanguage();
  const { currentUser, checkMembershipStatus, membershipStatus } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { preloadComponent } = usePreload();

  const handleLibraryClick = async (e) => {
    e.preventDefault();
    
    if (currentUser) {
      try {
        const status = await checkMembershipStatus();
        
        if (status === 'contributor' || status === 'premium') {
          navigate('/library/pro');
        } else {
          navigate('/library');
        }
      } catch (error) {
        console.error('Error checking membership status:', error);
        navigate('/library');
      }
    } else {
      navigate('/library');
    }
    
    if (isMobile) {
      closeMobileMenu();
    }
  };

  return (
    <button
      onClick={handleLibraryClick}
      onMouseEnter={() => preloadComponent(preloadRoutes.library, 'library')}
      className={cn(
        isMobile ? 
          "py-4 text-[22px] font-normal transition-colors hover:text-primary w-full text-left" :
          "relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ease-out hover:text-primary hover:scale-105 hover:shadow-sm",
        (location.pathname === "/library" || location.pathname === "/library/pro") 
          ? (isMobile ? "text-primary" : "bg-white/90 dark:bg-white/20 text-primary shadow-sm border border-white/30 dark:border-white/10 backdrop-blur-sm")
          : (isMobile ? "text-foreground/70" : "text-foreground/80 hover:bg-white/30 dark:hover:bg-white/10 hover:text-foreground")
      )}
    >
      {t('nav.library')}
    </button>
  );
};

export const Header = () => {
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      // Check localStorage first
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      if (savedTheme) {
        return savedTheme;
      }
      // Then check if the dark class is already there
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { preloadComponent } = usePreload();
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save to localStorage
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    // Initialize theme based on localStorage, user preference or system preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    
    if (savedTheme) {
      // If there's a saved theme, use it
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      // Otherwise, use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
        setTheme('dark');
        localStorage.setItem('theme', 'dark');
      }
    }
  }, []);
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 py-3 md:px-6 md:py-4">
      <div className={cn(
        "max-w-4xl mx-auto flex items-center justify-between",
        "relative bg-white/20 dark:bg-black/20 backdrop-blur-xl rounded-full",
        "border border-white/30 dark:border-white/10",
        "px-6 py-3 transition-all duration-500 ease-out",
        "shadow-lg shadow-black/5 dark:shadow-black/20",
        // Glass morphism overlay
        "before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-b before:from-white/10 before:to-transparent before:pointer-events-none",
        // Adaptive background on scroll
        scrolled ? 
          "bg-white/30 dark:bg-black/30 backdrop-blur-2xl border-white/40 dark:border-white/20 shadow-xl shadow-black/10 dark:shadow-black/30" :
          "bg-white/20 dark:bg-black/20 backdrop-blur-xl border-white/30 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20"
      )}>
        
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 text-primary transition-all duration-200 hover:scale-105 relative z-10">
          <span className="font-bold text-xl md:text-2xl tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            {t('app.title')}
          </span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center relative z-10">
          <div className="flex items-center space-x-1 bg-black/10 dark:bg-white/10 backdrop-blur-sm rounded-full p-1 border border-white/20 dark:border-white/5">
            <Link 
              to="/"
              className={cn(
                "relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ease-out",
                "hover:text-primary hover:scale-105 hover:shadow-sm",
                location.pathname === "/" 
                  ? "bg-white/90 dark:bg-white/20 text-primary shadow-sm border border-white/30 dark:border-white/10 backdrop-blur-sm" 
                  : "text-foreground/80 hover:bg-white/30 dark:hover:bg-white/10 hover:text-foreground"
              )}
            >
              {t('nav.home')}
            </Link>
            
            <HeaderLibraryLink />
            
            <Link 
              to="/agora" 
              className={cn(
                "relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ease-out",
                "hover:text-primary hover:scale-105 hover:shadow-sm",
                location.pathname.startsWith("/agora") 
                  ? "bg-white/90 dark:bg-white/20 text-primary shadow-sm border border-white/30 dark:border-white/10 backdrop-blur-sm" 
                  : "text-foreground/80 hover:bg-white/30 dark:hover:bg-white/10 hover:text-foreground"
              )}
              onMouseEnter={() => preloadComponent(preloadRoutes.agora, 'agora')}
            >
              Agora
            </Link>
            
            <Link 
              to="/flash-deck" 
              className={cn(
                "relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ease-out",
                "hover:text-primary hover:scale-105 hover:shadow-sm",
                location.pathname === "/flash-deck" 
                  ? "bg-white/90 dark:bg-white/20 text-primary shadow-sm border border-white/30 dark:border-white/10 backdrop-blur-sm" 
                  : "text-foreground/80 hover:bg-white/30 dark:hover:bg-white/10 hover:text-foreground"
              )}
            >
              Flashdeck
            </Link>
            
            <Link 
              to="/research-grove" 
              className={cn(
                "relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ease-out",
                "hover:text-primary hover:scale-105 hover:shadow-sm",
                location.pathname === "/research-grove" 
                  ? "bg-white/90 dark:bg-white/20 text-primary shadow-sm border border-white/30 dark:border-white/10 backdrop-blur-sm" 
                  : "text-foreground/80 hover:bg-white/30 dark:hover:bg-white/10 hover:text-foreground"
              )}
              onMouseEnter={() => preloadComponent(preloadRoutes.researchGrove, 'researchGrove')}
            >
              Research
            </Link>
            
            <Link 
              to="/compose" 
              className={cn(
                "relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ease-out",
                "hover:text-primary hover:scale-105 hover:shadow-sm",
                location.pathname === "/compose" 
                  ? "bg-white/90 dark:bg-white/20 text-primary shadow-sm border border-white/30 dark:border-white/10 backdrop-blur-sm" 
                  : "text-foreground/80 hover:bg-white/30 dark:hover:bg-white/10 hover:text-foreground"
              )}
            >
              Compose
            </Link>
            
            <Link 
              to="/about" 
              className={cn(
                "relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ease-out",
                "hover:text-primary hover:scale-105 hover:shadow-sm",
                location.pathname === "/about" 
                  ? "bg-white/90 dark:bg-white/20 text-primary shadow-sm border border-white/30 dark:border-white/10 backdrop-blur-sm" 
                  : "text-foreground/80 hover:bg-white/30 dark:hover:bg-white/10 hover:text-foreground"
              )}
            >
              {t('nav.about')}
            </Link>
          </div>
        </nav>
        
        {/* Right Side Actions */}
        <div className="flex items-center space-x-2 relative z-10">
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-full w-10 h-10 transition-all duration-200 hover:scale-105 hover:bg-white/30 dark:hover:bg-white/10 backdrop-blur-sm"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <MoonIcon className="h-5 w-5" />
            ) : (
              <SunIcon className="h-5 w-5" />
            )}
          </Button>
          
          {/* Auth Buttons (Desktop) */}
          <div className="hidden md:flex">
            <AuthButtons />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full w-10 h-10 transition-all duration-200 hover:scale-105 hover:bg-white/30 dark:hover:bg-white/10 backdrop-blur-sm"
                >
                  <Bars3Icon className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
                <CustomSheetContent 
                  side="left" 
                  className="w-full p-0 border-0 bg-background text-foreground"
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-4">
                      <Link to="/" className="flex items-center space-x-2" onClick={() => setIsMobileMenuOpen(false)}>
                        <span className="font-bold text-xl md:text-2xl tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                          {t('app.title')}
                        </span>
                      </Link>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="rounded-full border border-white/30 dark:border-white/10 bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-white/10 h-10 w-10 flex items-center justify-center transition-all duration-200 hover:scale-105 backdrop-blur-sm"
                          onClick={toggleTheme}
                          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                        >
                          {theme === 'light' ? (
                            <MoonIcon className="h-4 w-4" />
                          ) : (
                            <SunIcon className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-full border border-white/30 dark:border-white/10 bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-white/10 h-12 w-12 flex items-center justify-center transition-all duration-200 hover:scale-105 backdrop-blur-sm"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <XMarkIcon className="h-5 w-5 text-foreground" />
                        </Button>
                      </div>
                    </div>
                    
                    <nav className="flex flex-col pt-8 px-5 space-y-2 w-full">
                      <Link 
                        to="/"
                        className={cn(
                          "py-4 text-[22px] font-normal transition-colors hover:text-primary w-full text-left",
                          location.pathname === "/" ? "text-primary" : "text-foreground/70"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {t('nav.home')}
                      </Link>
                      <div className="w-full">
                        <HeaderLibraryLink isMobile={true} closeMobileMenu={() => setIsMobileMenuOpen(false)} />
                      </div>
                      <Link 
                        to="/agora" 
                        className={cn(
                          "py-4 text-[22px] font-normal transition-colors hover:text-primary w-full text-left",
                          location.pathname.startsWith("/agora") ? "text-primary" : "text-foreground/70"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                        onMouseEnter={() => preloadComponent(preloadRoutes.agora, 'agora')}
                      >
                        Agora
                      </Link>
                      <Link 
                        to="/flash-deck" 
                        className={cn(
                          "py-4 text-[22px] font-normal transition-colors hover:text-primary w-full text-left",
                          location.pathname === "/flash-deck" ? "text-primary" : "text-foreground/70"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Flashdeck
                      </Link>
                      <Link 
                        to="/research-grove" 
                        className={cn(
                          "py-4 text-[22px] font-normal transition-colors hover:text-primary w-full text-left",
                          location.pathname === "/research-grove" ? "text-primary" : "text-foreground/70"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                        onMouseEnter={() => preloadComponent(preloadRoutes.researchGrove, 'researchGrove')}
                      >
                        Research
                      </Link>
                      <Link 
                        to="/compose" 
                        className={cn(
                          "py-4 text-[22px] font-normal transition-colors hover:text-primary w-full text-left",
                          location.pathname === "/compose" ? "text-primary" : "text-foreground/70"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Compose
                      </Link>
                      <Link 
                        to="/about" 
                        className={cn(
                          "py-4 text-[22px] font-normal transition-colors hover:text-primary w-full text-left",
                          location.pathname === "/about" ? "text-primary" : "text-foreground/70"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {t('nav.about')}
                      </Link>
                      {/* Auth Buttons (Mobile) */}
                      <div className="w-full flex flex-col space-y-2 mt-2">
                        <AuthButtons isMobile />
                      </div>
                    </nav>
                  </div>
                </CustomSheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    );
  };

export default Header;
