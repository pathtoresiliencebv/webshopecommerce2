import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Heart, 
  ShoppingCart, 
  Star, 
  ChevronLeft,
  Truck,
  Shield,
  ArrowLeft,
  Plus,
  Minus,
  RotateCcw,
  MessageCircle,
  Phone,
  Check
} from "lucide-react";

// Import images
import chairOffice from "@/assets/chair-office.jpg";
import deskStanding from "@/assets/desk-standing.jpg";
import cabinetStorage from "@/assets/cabinet-storage.jpg";

export default function ProductDetail() {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  // In a real app, this would fetch from an API
  const product = {
    id: "1",
    name: "FlexiDesk Sit-Stand Table",
    price: 238.95,
    originalPrice: null,
    sku: "WS-FLEX-001",
    images: [deskStanding, chairOffice, cabinetStorage, deskStanding],
    rating: 4.8,
    reviewCount: 124,
    category: "Desks",
    isSale: false,
    inStock: true,
    stockLevel: "In Stock",
    shortDescription: "Transform your workspace with a level of productivity and comfort like never before. Whether you're looking for a routine change, a healthier workplace, or a new upgrade to your home office - we've got you covered.",
    description: `We think everyone has potential which should be unleashed. Creating an efficient and effective workspace that enables you to reach new career levels and offers motivation from the environment around you.

That's also what we love about our work. Allow us to share our workplace design experts with you through this collaborative environment we've created.`,
    features: [
      "Height adjustable mechanism",
      "Premium quality materials",
      "Easy assembly in 15 minutes",
      "2-year manufacturer warranty",
      "Ergonomic design certified",
      "Sustainable materials used"
    ],
    specifications: {
      "Material": "Steel frame with laminated wood top",
      "Dimensions": "120 x 60 x 72-122 cm",
      "Weight Capacity": "80 kg",
      "Height Range": "72-122 cm",
      "Color": "Black/Wood",
      "Assembly Time": "15 minutes"
    },
    shipping: {
      freeShipping: true,
      fastDelivery: true,
      returns: "Free returns within 30 days",
      warranty: "2 year warranty"
    }
  };

  const relatedProducts = [
    {
      id: "2",
      name: "Premium Writing Desk",
      price: 156.95,
      image: deskStanding,
      rating: 4.6
    },
    {
      id: "3", 
      name: "Executive Office Chair",
      price: 299.95,
      image: chairOffice,
      rating: 4.7
    },
    {
      id: "4",
      name: "Storage Cabinet Pro", 
      price: 189.95,
      image: cabinetStorage,
      rating: 4.5
    },
    {
      id: "5",
      name: "Adjustable Standing Desk",
      price: 349.95, 
      image: deskStanding,
      rating: 4.9
    }
  ];

  const youMightLike = [
    {
      id: "6",
      name: "Premium Writing Desk",
      price: 156.95,
      image: deskStanding
    },
    {
      id: "7",
      name: "Executive Office Desk", 
      price: 542.95,
      image: cabinetStorage
    },
    {
      id: "8",
      name: "Adjustable Standing Desk",
      price: 349.95,
      image: deskStanding
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronLeft className="h-4 w-4 rotate-180" />
          <Link to="/products" className="hover:text-primary">Working Tables</Link>
          <ChevronLeft className="h-4 w-4 rotate-180" />
          <Link to="/products" className="hover:text-primary">Desks</Link>
          <ChevronLeft className="h-4 w-4 rotate-180" />
          <span className="text-foreground">FlexiDesk Sit-Stand Table</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-accent border">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Thumbnail images */}
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, i) => (
                <div 
                  key={i} 
                  className={`aspect-square rounded-lg overflow-hidden bg-accent/50 border-2 cursor-pointer transition-colors ${
                    selectedImage === i ? 'border-primary' : 'border-transparent hover:border-border'
                  }`}
                  onClick={() => setSelectedImage(i)}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {product.name}
              </h1>
              
              <div className="flex items-center gap-4 mb-4">
                <span className="text-3xl font-bold text-foreground">
                  €{product.price}
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(product.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.reviewCount} reviews
                  </span>
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed mb-6">
                {product.shortDescription}
              </p>

              {/* Stock Status */}
              <div className="flex items-center gap-2 mb-6">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">In Stock</span>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">Quantity:</label>
                  <div className="flex items-center border border-border rounded">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="rounded-r-none px-3"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="px-4 py-2 text-sm font-medium min-w-[3rem] text-center border-x border-border">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                      className="rounded-l-none px-3"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mb-6">
                <Button className="w-full" size="lg">
                  Add to Cart
                </Button>
                <Button variant="outline" className="w-full" size="lg">
                  <Heart className="h-4 w-4 mr-2" />
                  Add to Wish List
                </Button>
              </div>

              {/* Shipping Info */}
              <div className="space-y-3 p-4 bg-accent/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="h-4 w-4 text-primary" />
                  <span className="font-medium">Free shipping</span>
                  <span className="text-muted-foreground">on this purchase</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <RotateCcw className="h-4 w-4 text-primary" />
                  <span className="font-medium">Free returns</span>
                  <span className="text-muted-foreground">return it within 30 days</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="font-medium">2 year warranty</span>
                  <span className="text-muted-foreground">get support when you need it</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">About</h2>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-xl font-semibold mb-4">Store Equipment for Success</h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We think everyone has potential which should be unleashed. Creating an efficient and effective workspace that enables you to reach new career levels and offers motivation from the environment around you.
                </p>
                <p>
                  Products must check a few key boxes to include them in our curated work site. We control and choose the features efficiently and professionally for each item for you.
                </p>
                <p>
                  If our words of this page have guided and what you're reading you will stick in order to give us recommendations.
                </p>
              </div>
            </div>
            <div className="aspect-video rounded-lg overflow-hidden">
              <img
                src={deskStanding}
                alt="Office workspace"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Similar Items You Might Like */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Similar Items You Might Like</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {youMightLike.map((item) => (
              <Card key={item.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="aspect-square bg-accent rounded-t-lg overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-sm mb-2">{item.name}</h3>
                    <p className="text-lg font-bold">€{item.price}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Shop For More Compatible Items */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Shop For More Compatible Items</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedProducts.slice(0, 3).map((item) => (
              <Card key={item.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="aspect-square bg-accent rounded-t-lg overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-sm mb-2">{item.name}</h3>
                    <p className="text-lg font-bold">€{item.price}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cashback Banner */}
        <div className="mb-16">
          <div className="bg-primary text-primary-foreground p-6 rounded-lg text-center">
            <h3 className="text-xl font-bold mb-2">Earn Cashback on Every Purchase</h3>
            <p className="text-sm opacity-90">Get a percentage back of all purchases</p>
          </div>
        </div>

        {/* Check Out These Related Products */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Check Out These Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {relatedProducts.map((item) => (
              <Card key={item.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="aspect-square bg-accent rounded-t-lg overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-xs mb-1 line-clamp-2">{item.name}</h3>
                    <p className="text-sm font-bold">€{item.price}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Guides Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Guides for Everything You Need</h2>
            <Link to="/guides" className="text-primary hover:underline text-sm">
              View All Guides
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[
              "Choosing the Right Ergonomic Office Chair",
              "10 Most Important Features Of A Better Office Chair",
              "The All Time Office Equipment Items List For Your Business",
              "5 Things You Need for an Ergonomically Correct Workplace",
              "How to Choose the Right Office Work Station Furniture",
              "Comparison of the 2023 Office Work Projects"
            ].map((guide, index) => (
              <Card key={index} className="group cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-medium text-xs leading-tight">{guide}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}