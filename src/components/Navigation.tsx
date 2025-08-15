import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Search, Menu, X, User, Heart, LayoutDashboard, Phone, ChevronDown, Globe, Moon, Sun } from "lucide-react";
export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const location = useLocation();

  // Fetch collections from database
  const {
    data: collections = []
  } = useQuery({
    queryKey: ['navigation-collections'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('collections').select(`
          id, name, slug,
          product_collections!left (
            product_id
          )
        `).eq('is_active', true).order('sort_order', {
        ascending: true
      });
      if (error) {
        console.error('Error fetching collections:', error);
        return [];
      }

      // Only return collections that have products
      return data?.filter(collection => collection.product_collections && collection.product_collections.length > 0) || [];
    }
  });
  const navItems = [{
    name: "Home",
    href: "/"
  }, {
    name: "All Products",
    href: "/products"
  }, ...collections.map(collection => ({
    name: collection.name,
    href: `/collections/${collection.slug}`
  })), {
    name: "About",
    href: "/about"
  }];
  const isActive = (path: string) => location.pathname === path;
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };
  return <>
      {/* Promo Banner */}
      <div className="bg-black text-white py-2 text-center text-sm font-body">
        <div className="container mx-auto px-4">
          Midseason Sale: 20% Off All Office Furniture | Free Shipping on Orders Over €500
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between gap-8">
            {/* Logo */}
            <Link to="/" className="flex items-center flex-shrink-0">
              <img 
                src="/lovable-uploads/5bed22df-c30a-4560-9108-fdc16061338b.png" 
                alt="Aurora Living" 
                className="h-12 w-auto"
              />
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="w-full pl-12 pr-4 h-12 rounded-none border-2 border-border focus:border-primary font-body" placeholder="Search for office furniture, chairs, desks..." />
                <Button variant="luxury" size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8">
                  Search
                </Button>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* Language & Theme Toggle - Desktop */}
              <div className="hidden lg:flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={toggleDarkMode}>
                  {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm" className="font-body">
                  <Globe className="h-4 w-4 mr-1" />
                  NL
                </Button>
              </div>

              {/* Help */}
              <div className="hidden xl:flex items-center space-x-2 text-sm font-body">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Need help?</span>
                <span className="font-semibold text-foreground">+31 20 123 4567</span>
              </div>

              {/* Action Buttons */}
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                <Heart className="h-4 w-4" />
              </Button>

              <Button variant="ghost" size="sm" className="relative">
                <ShoppingCart className="h-4 w-4" />
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs font-body">
                  3
                </Badge>
              </Button>

              <Link to="/dashboard">
                
              </Link>

              <Button variant="ghost" size="sm">
                <User className="h-4 w-4" />
              </Button>

              {/* Mobile menu button */}
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Navigation Menu - Desktop */}
          <div className="hidden lg:block border-t border-border">
            <nav className="flex items-center justify-center py-4 space-x-8">
              {navItems.map(item => <div key={item.name} className="relative group">
                  <Link to={item.href} className={`flex items-center text-sm font-heading font-medium transition-colors hover:text-primary ${isActive(item.href) ? "text-primary" : "text-muted-foreground"}`}>
                    {item.name}
                  </Link>
                </div>)}
            </nav>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden border-t border-border px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="w-full pl-10 pr-4 h-10 rounded-none border border-border font-body" placeholder="Search furniture..." />
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && <div className="lg:hidden border-t border-border bg-background">
            <nav className="px-4 py-4 space-y-2">
              {navItems.map(item => <div key={item.name}>
                  <Link to={item.href} className={`block px-3 py-3 text-sm font-heading font-medium rounded-none transition-colors ${isActive(item.href) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary hover:bg-muted"}`} onClick={() => setIsMenuOpen(false)}>
                    {item.name}
                  </Link>
                </div>)}
              
              {/* Mobile Actions */}
              <div className="pt-4 border-t border-border space-y-2">
                <Button variant="ghost" className="w-full justify-start font-body" onClick={toggleDarkMode}>
                  {isDarkMode ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </Button>
                <div className="flex items-center px-3 py-2 text-sm font-body">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">Need help? </span>
                  <span className="font-semibold text-foreground ml-1">+31 20 123 4567</span>
                </div>
              </div>
            </nav>
          </div>}
      </header>
    </>;
}