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
import * as React from "react";

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
  const { currentUser, checkMembershipStatus } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLibraryClick = async (e) => {
    e.preventDefault();
    
    if (currentUser) {
      // Force a membership status check before navigating
      console.log('Header: Checking membership status before navigation');
      const status = await checkMembershipStatus();
      console.log('Header: Membership status updated to', status);
      
      // Add a small delay to ensure the status update has propagated
      setTimeout(() => {
        navigate('/library');
        if (isMobile) {
          closeMobileMenu();
        }
      }, 300);
    } else {
      navigate('/library');
      if (isMobile) {
        closeMobileMenu();
      }
    }
  };

  return (
    <a 
      href="/library"
      onClick={handleLibraryClick}
      className={cn(
        isMobile ? 
          "py-4 text-[22px] font-normal transition-colors hover:text-primary" :
          "text-sm font-medium transition-colors hover:text-primary",
        location.pathname === "/library" ? "text-primary" : "text-foreground/70"
      )}
    >
      {t('nav.library')}
    </a>
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
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 py-5 md:py-4 px-5 md:px-6 transition-all duration-300 ease-in-out",
        scrolled ? "glass-panel subtle-shadow backdrop-blur-md" : "bg-transparent"
      )}
    >
      <div className="w-full md:container md:mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 text-primary transition-opacity hover:opacity-90">
          <span className="font-bold text-xl md:text-2xl tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">{t('app.title')}</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link 
            to="/" 
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              location.pathname === "/" ? "text-primary" : "text-foreground/70"
            )}
          >
            {t('nav.home')}
          </Link>
          <HeaderLibraryLink />
          <Link 
            to="/about" 
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              location.pathname === "/about" ? "text-primary" : "text-foreground/70"
            )}
          >
            {t('nav.about')}
          </Link>
        </nav>
        
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-full w-9 h-9 flex items-center justify-center md:mr-3"
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
          <div className="md:hidden ml-3">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full flex items-center justify-center">
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
                      <span className="font-bold text-xl md:text-2xl tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">{t('app.title')}</span>
                    </Link>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="rounded-full border border-border bg-transparent hover:bg-accent h-10 w-10 flex items-center justify-center"
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
                        className="rounded-full border border-border bg-transparent hover:bg-accent h-12 w-12 flex items-center justify-center"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <XMarkIcon className="h-5 w-5 text-foreground" />
                      </Button>
                    </div>
                  </div>
                  
                  <nav className="flex flex-col pt-8 px-5">
                    <Link 
                      to="/" 
                      className={cn(
                        "py-4 text-[22px] font-normal transition-colors hover:text-primary",
                        location.pathname === "/" ? "text-primary" : "text-foreground/70"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t('nav.home')}
                    </Link>
                    <HeaderLibraryLink isMobile={true} closeMobileMenu={() => setIsMobileMenuOpen(false)} />
                    <Link 
                      to="/about" 
                      className={cn(
                        "py-4 text-[22px] font-normal transition-colors hover:text-primary",
                        location.pathname === "/about" ? "text-primary" : "text-foreground/70"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t('nav.about')}
                    </Link>
                    
                    {/* Auth Buttons (Mobile) */}
                    <AuthButtons isMobile />
                  </nav>
                </div>
              </CustomSheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
