import { Navigation } from "@/components/Navigation";
import { ProductCard } from "@/components/ProductCard";
import { CollectionSlider } from "@/components/CollectionSlider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, CheckCircle, Truck, Shield, Headphones, Percent, RotateCcw, Clock, Star, ShoppingCart, Calendar, User, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Import images
import heroWorkspace from "@/assets/hero-workspace.jpg";
import chairOffice from "@/assets/chair-office.jpg";
import deskStanding from "@/assets/desk-standing.jpg";
import cabinetStorage from "@/assets/cabinet-storage.jpg";

// Hero Product Spotlight
const heroProduct = {
  id: "hero-1",
  name: "Modern Computer Desk with Sleek, Space-Saving Design",
  price: 507.95,
  originalPrice: 649.95,
  image: deskStanding,
  brand: "STOCKMART",
  category: "Electronics & Office",
  inStock: true,
  description: "Transform your workspace with this premium computer desk featuring cable management, adjustable height, and modern aesthetics perfect for any professional environment."
};


const features = [
  {
    icon: Truck,
    title: "Free Shipping & Returns",
    description: "Fast delivery worldwide"
  },
  {
    icon: RotateCcw,
    title: "Money Back Guarantee", 
    description: "30-day return policy"
  },
  {
    icon: Headphones,
    title: "Online Support 24/7",
    description: "Expert assistance anytime"
  },
  {
    icon: Percent,
    title: "Regular Sales",
    description: "Exclusive member discounts"
  }
];

// Countdown Timer Component
const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 5,
    hours: 12,
    minutes: 30,
    seconds: 45
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex justify-center gap-6 my-6">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="text-center">
          <div className="bg-white text-black rounded-lg p-3 min-w-[60px]">
            <div className="text-2xl font-bold">{value.toString().padStart(2, '0')}</div>
          </div>
          <div className="text-sm mt-1 capitalize">{unit}</div>
        </div>
      ))}
    </div>
  );
};

const Index = () => {
  // Fetch featured products from database
  const { data: featuredProducts = [], isLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          original_price,
          is_sale,
          is_new,
          stock_quantity,
          categories (name),
          product_images (
            image_url,
            is_primary
          )
        `)
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;

      return data?.map(product => ({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        originalPrice: product.original_price ? Number(product.original_price) : null,
        image: product.product_images?.find(img => img.is_primary)?.image_url || '/placeholder.svg',
        rating: 4.5, // Default rating
        reviewCount: Math.floor(Math.random() * 200) + 10, // Random for demo
        category: product.categories?.name || 'Uncategorized',
        brand: "STOCKMART",
        isSale: product.is_sale,
        isNew: product.is_new,
        soldOut: (product.stock_quantity || 0) === 0,
        colors: ["#000000", "#808080"] // Default colors for demo
      })) || [];
    }
  });

  // Fetch collections with products for the sliders
  const { data: collections = [] } = useQuery({
    queryKey: ['homepage-collections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select(`
          id, name, slug,
          product_collections!left (
            product_id
          )
        `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching collections:', error);
        return [];
      }

      // Only return collections that have products
      return data?.filter(collection => 
        collection.product_collections && collection.product_collections.length > 0
      ) || [];
    }
  });

  // Fetch collections with images for Popular Categories
  const { data: collectionsWithImages = [] } = useQuery({
    queryKey: ['collections-with-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select(`
          id, name, slug, image_url,
          product_collections!left (
            product_id
          )
        `)
        .eq('is_active', true)
        .not('image_url', 'is', null)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching collections with images:', error);
        return [];
      }

      return data?.map(collection => ({
        ...collection,
        product_count: collection.product_collections?.length || 0
      })) || [];
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section - Product Spotlight */}
      <section className="relative overflow-hidden bg-hero-gradient">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <Badge className="w-fit bg-green-500 text-white hover:bg-green-600">
                  IN STOCK NOW
                </Badge>
                <h1 className="text-3xl lg:text-5xl font-bold text-foreground leading-tight">
                  {heroProduct.name}
                </h1>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {heroProduct.description}
                </p>
                
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-foreground">
                    €{heroProduct.price}
                  </div>
                  <div className="text-lg text-muted-foreground line-through">
                    €{heroProduct.originalPrice}
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    SAVE €{Math.round(heroProduct.originalPrice - heroProduct.price)}
                  </Badge>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/products">
                  <Button size="lg" className="w-full sm:w-auto">
                    Add to Cart
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  View Details
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-lg bg-white p-8">
                <img
                  src={heroProduct.image}
                  alt={heroProduct.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground rounded-full px-4 py-2 font-semibold text-sm shadow-lg">
                €{heroProduct.price}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Features Bar */}
      <section className="py-8 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 text-center lg:text-left">
                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
              FEATURED ITEMS
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Top 10 Electronics & Bestsellers
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Discover the most popular business equipment and office solutions. 
              These premium products are trusted by professionals worldwide for their quality, 
              design, and reliability.
            </p>
          </div>
          
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading featured products...</p>
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No featured products available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <Card key={product.id} className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className="aspect-square bg-white p-4 relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.soldOut && (
                      <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                        Sold out
                      </Badge>
                    )}
                    {product.isSale && (
                      <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                        Sale
                      </Badge>
                    )}
                    {product.isNew && (
                      <Badge className="absolute top-2 left-2 bg-green-500 text-white">
                        New
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">{product.brand}</p>
                    <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-foreground">€{product.price}</span>
                      {product.originalPrice && (
                        <span className="text-xs text-muted-foreground line-through">
                          €{product.originalPrice}
                        </span>
                      )}
                    </div>
                    {product.colors && (
                      <div className="flex gap-1">
                        {product.colors.map((color, index) => (
                          <div
                            key={index}
                            className="w-3 h-3 rounded-full border border-gray-300"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link to="/products">
              <Button size="lg" className="px-8">
                View All Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Countdown Timer Section */}
      <section className="py-12 bg-red-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-500 text-white rounded-lg p-8 text-center">
            <h2 className="text-2xl lg:text-3xl font-bold mb-4">
              Limited Stock with 18% Off Modern Storage Cabinets - Order Now!
            </h2>
            <CountdownTimer />
            <Button variant="secondary" size="lg" className="mt-4">
              Shop Now
            </Button>
          </div>
        </div>
      </section>

      {/* Two-Column Banner Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="overflow-hidden">
              <div className="aspect-[4/3] bg-gradient-to-br from-blue-100 to-blue-200 p-8 flex flex-col justify-center">
                <h3 className="text-2xl font-bold mb-4">Everything for a Well-Equipped and Functional Office</h3>
                <p className="text-muted-foreground mb-6">Transform your workspace with premium solutions designed for productivity and comfort.</p>
                <div className="flex gap-4">
                  <Button>Shop Now</Button>
                  <Button variant="outline">Read More</Button>
                </div>
              </div>
            </Card>
            <Card className="overflow-hidden">
              <div className="aspect-[4/3] bg-gradient-to-br from-green-100 to-green-200 p-8 flex flex-col justify-center">
                <h3 className="text-2xl font-bold mb-4">Additional Services</h3>
                <p className="text-muted-foreground mb-6">Professional installation, setup assistance, and ongoing support for all your office needs.</p>
                <div className="flex gap-4">
                  <Button>Shop Now</Button>
                  <Button variant="outline">Read More</Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Product How-To Banners */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="overflow-hidden">
              <div className="grid md:grid-cols-2">
                <div className="p-8 flex flex-col justify-center">
                  <Badge className="w-fit mb-2">HOW TO</Badge>
                  <h3 className="text-xl font-bold mb-4">Maximize Your Productivity</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-4 h-4 rounded-full bg-black"></div>
                    <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                    <div className="w-4 h-4 rounded-full bg-brown-400"></div>
                  </div>
                  <Button variant="outline" size="sm">Shop More</Button>
                </div>
                <div className="aspect-square bg-gray-100">
                  <img src={deskStanding} alt="Desk" className="w-full h-full object-cover" />
                </div>
              </div>
            </Card>
            <Card className="overflow-hidden">
              <div className="grid md:grid-cols-2">
                <div className="p-8 flex flex-col justify-center">
                  <Badge className="w-fit mb-2">HOW TO</Badge>
                  <h3 className="text-xl font-bold mb-4">Take Comfort to the Next Level</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-4 h-4 rounded-full bg-black"></div>
                    <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  </div>
                  <Button variant="outline" size="sm">Shop More</Button>
                </div>
                <div className="aspect-square bg-gray-100">
                  <img src={chairOffice} alt="Chair" className="w-full h-full object-cover" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Video Banner Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="overflow-hidden">
            <div className="relative aspect-[21/9] bg-gray-900">
              <img 
                src="//stockmart-minimal.myshopify.com/cdn/shop/files/preview_images/121cc68758a744b0ba30d1f30070e1fe.thumbnail.0000000000_1100x.jpg?v=1684151164" 
                alt="Video Banner" 
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Button size="lg" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm">
                  <Play className="mr-2 h-6 w-6" />
                  Watch Video
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Collection-Based Product Sliders */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Recommended for You</h2>
            <p className="text-muted-foreground">Discover products from our carefully curated collections</p>
          </div>
          
          <div className="space-y-12">
            {collections.map((collection) => (
              <CollectionSlider
                key={collection.id}
                collectionId={collection.id}
                collectionName={collection.name}
                collectionSlug={collection.slug}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Office Tables Banner */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-6">OFFICE TABLES - Upgrade Your Workspace</h2>
            <p className="text-lg mb-8 opacity-90">
              Discover our collection of modern, ergonomic office tables designed to enhance productivity 
              and bring style to your workspace. From adjustable standing desks to executive workstations.
            </p>
            <Button size="lg" variant="secondary">
              Shop Now
            </Button>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Popular Categories</h2>
            <p className="text-muted-foreground">Shop by category to find exactly what you need</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {collectionsWithImages.map((collection) => (
              <Link key={collection.id} to={`/collections/${collection.slug}`}>
                <Card className="group cursor-pointer hover:shadow-lg transition-all">
                  <CardContent className="p-4 text-center">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
                      <img 
                        src={collection.image_url} 
                        alt={collection.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <h3 className="font-medium text-sm">{collection.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {collection.product_count} products
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Guides Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">HOW TO - Guides for Everything You Need</h2>
            <p className="text-muted-foreground">Expert tips and guides to help you make the most of your workspace</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "How to Choose the Perfect Office Chair",
              "Setting Up an Ergonomic Workspace",
              "Maximizing Storage in Small Offices",
              "Lighting Tips for Better Productivity",
              "Cable Management Solutions",
              "Creating a Comfortable Home Office"
            ].map((guide, index) => (
              <Card key={index} className="group cursor-pointer hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="aspect-[4/3] bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg mb-4"></div>
                  <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">{guide}</h3>
                  <Button variant="outline" size="sm">Read More</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Top Quality Equipment Banner */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-white text-primary">IN STOCK NOW</Badge>
            <h2 className="text-4xl font-bold mb-6">
              Top-Quality Equipment & Electronics for Productivity
            </h2>
            <p className="text-lg mb-8 opacity-90 max-w-3xl mx-auto">
              Discover our premium selection of office equipment designed to boost your productivity 
              and streamline your workflow.
            </p>
            <Button size="lg" variant="secondary">
              Shop More
            </Button>
          </div>
        </div>
      </section>

      {/* Latest News & Blog */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Latest News & Blog</h2>
            <p className="text-muted-foreground">Stay updated with the latest trends and tips</p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="overflow-hidden">
              <div className="aspect-[16/10] bg-gradient-to-br from-blue-100 to-blue-200"></div>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <User className="h-4 w-4" />
                  <span>Admin</span>
                  <Calendar className="h-4 w-4 ml-2" />
                  <span>December 14, 2024</span>
                </div>
                <h3 className="text-xl font-bold mb-3">
                  The Future of Office Design: Trends for 2025
                </h3>
                <p className="text-muted-foreground mb-4">
                  Explore the latest trends in office design that are shaping the way we work...
                </p>
                <Button variant="outline">Read More</Button>
              </CardContent>
            </Card>
            
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <User className="h-4 w-4" />
                    <span>Admin</span>
                    <Calendar className="h-4 w-4 ml-2" />
                    <span>December 12, 2024</span>
                  </div>
                  <h3 className="font-bold mb-2">Ergonomic Workspace Setup Guide</h3>
                  <p className="text-sm text-muted-foreground">Tips for creating a healthy workspace...</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <User className="h-4 w-4" />
                    <span>Admin</span>
                    <Calendar className="h-4 w-4 ml-2" />
                    <span>December 10, 2024</span>
                  </div>
                  <h3 className="font-bold mb-2">Best Office Chairs of 2024</h3>
                  <p className="text-sm text-muted-foreground">Our top picks for comfort and style...</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to transform your workspace?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Start creating your ideal workplace today. 
            Free shipping and professional advice included.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products">
              <Button variant="secondary" size="lg">
                Start Shopping
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              Contact Us
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">F</span>
                </div>
                <span className="text-xl font-bold text-foreground">FurniStore</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Premium office furniture for the modern workplace. 
                Quality and comfort in one.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Products</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/products" className="hover:text-primary">Chairs</Link></li>
                <li><Link to="/products" className="hover:text-primary">Desks</Link></li>
                <li><Link to="/products" className="hover:text-primary">Storage</Link></li>
                <li><Link to="/products" className="hover:text-primary">Accessories</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Service</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Customer Service</a></li>
                <li><a href="#" className="hover:text-primary">Shipping</a></li>
                <li><a href="#" className="hover:text-primary">Returns</a></li>
                <li><a href="#" className="hover:text-primary">Warranty</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>info@furnistore.com</li>
                <li>+1 555 123 4567</li>
                <li>Mon-Fri: 9:00-17:00</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 FurniStore. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
