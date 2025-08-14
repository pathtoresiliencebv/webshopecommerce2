import { Navigation } from "@/components/Navigation";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, Truck, Shield, Headphones, Percent, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";

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

const featuredProducts = [
  {
    id: "1",
    name: "Ergonomic Office Chair Pro",
    price: 299,
    originalPrice: 399,
    image: chairOffice,
    rating: 4.8,
    reviewCount: 124,
    category: "Chairs",
    brand: "STOCKMART",
    isSale: true,
    soldOut: false,
    colors: ["#000000", "#8B4513", "#808080"]
  },
  {
    id: "2",
    name: "Premium Standing Desk Electric",
    price: 599,
    image: deskStanding,
    rating: 4.6,
    reviewCount: 89,
    category: "Desks", 
    brand: "STOCKMART",
    isNew: true,
    soldOut: false,
    colors: ["#FFFFFF", "#000000"]
  },
  {
    id: "3",
    name: "Modern Storage Cabinet White",
    price: 199,
    image: cabinetStorage,
    rating: 4.4,
    reviewCount: 67,
    category: "Storage",
    brand: "STOCKMART",
    soldOut: false
  },
  {
    id: "4",
    name: "Executive Leather Chair",
    price: 450,
    originalPrice: 599,
    image: chairOffice,
    rating: 4.9,
    reviewCount: 156,
    category: "Chairs",
    brand: "STOCKMART",
    soldOut: true,
    colors: ["#8B4513", "#000000"]
  },
  {
    id: "5",
    name: "Minimalist Work Desk",
    price: 349,
    image: deskStanding,
    rating: 4.5,
    reviewCount: 78,
    category: "Desks",
    brand: "STOCKMART",
    soldOut: false,
    colors: ["#F5F5DC", "#8B4513"]
  },
  {
    id: "6",
    name: "Smart Storage Solution",
    price: 275,
    image: cabinetStorage,
    rating: 4.7,
    reviewCount: 92,
    category: "Storage",
    brand: "STOCKMART",
    soldOut: false
  },
  {
    id: "7",
    name: "Conference Room Chair",
    price: 189,
    originalPrice: 249,
    image: chairOffice,
    rating: 4.3,
    reviewCount: 45,
    category: "Chairs", 
    brand: "STOCKMART",
    isSale: true,
    soldOut: false,
    colors: ["#000000", "#808080"]
  },
  {
    id: "8",
    name: "Mobile Workstation Cart",
    price: 159,
    image: cabinetStorage,
    rating: 4.1,
    reviewCount: 23,
    category: "Storage",
    brand: "STOCKMART",
    soldOut: false,
    colors: ["#FFFFFF", "#000000"]
  }
];

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

const Index = () => {
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
