import { Navigation } from "@/components/Navigation";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, Truck, Shield, Headphones } from "lucide-react";
import { Link } from "react-router-dom";

// Import images
import heroWorkspace from "@/assets/hero-workspace.jpg";
import chairOffice from "@/assets/chair-office.jpg";
import deskStanding from "@/assets/desk-standing.jpg";
import cabinetStorage from "@/assets/cabinet-storage.jpg";

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
    isSale: true,
  },
  {
    id: "2",
    name: "Adjustable Standing Desk Premium",
    price: 599,
    image: deskStanding,
    rating: 4.6,
    reviewCount: 89,
    category: "Desks",
    isNew: true,
  },
  {
    id: "3",
    name: "Modern Storage Cabinet White",
    price: 199,
    image: cabinetStorage,
    rating: 4.4,
    reviewCount: 67,
    category: "Storage",
  },
];

const features = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "On orders over €100"
  },
  {
    icon: Shield,
    title: "2 Year Warranty",
    description: "On all office furniture"
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Expert advice when you need it"
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-hero-gradient">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="w-fit">New Collection 2024</Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                  Modern Workspace,
                  <span className="text-primary"> Maximum Productivity</span>
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Discover our premium collection of office furniture. From ergonomic chairs 
                  to high-quality desks - everything for the perfect workplace.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/products">
                  <Button size="lg" className="w-full sm:w-auto">
                    Shop Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  View Catalog
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">1000+</p>
                  <p className="text-sm text-muted-foreground">Satisfied Customers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">500+</p>
                  <p className="text-sm text-muted-foreground">Products</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">24/7</p>
                  <p className="text-sm text-muted-foreground">Support</p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-large">
                <img
                  src={heroWorkspace}
                  alt="Modern workspace setup"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-card border border-border rounded-xl p-4 shadow-medium">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-semibold text-sm">Premium Quality</p>
                    <p className="text-xs text-muted-foreground">2 year warranty</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center border-0 shadow-soft hover:shadow-medium transition-shadow">
                <CardContent className="p-8">
                  <div className="h-12 w-12 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-accent/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Featured Products
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover our most popular office furniture, chosen by our experts
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/products">
              <Button variant="outline" size="lg">
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
