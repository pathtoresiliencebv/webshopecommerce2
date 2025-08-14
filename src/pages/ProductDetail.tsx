import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Heart, 
  ShoppingCart, 
  Star, 
  ChevronLeft,
  Truck,
  Shield,
  ArrowLeft
} from "lucide-react";

// Import images
import chairOffice from "@/assets/chair-office.jpg";

export default function ProductDetail() {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);

  // In a real app, this would fetch from an API
  const product = {
    id: "1",
    name: "Ergonomische Kantoorstoel Pro",
    price: 299,
    originalPrice: 399,
    image: chairOffice,
    rating: 4.8,
    reviewCount: 124,
    category: "Stoelen",
    isSale: true,
    inStock: true,
    description: "Deze premium ergonomische kantoorstoel is ontworpen voor maximaal comfort en ondersteuning tijdens lange werkdagen. Met verstelbare lendensteun, armsteunen en zithoogte biedt deze stoel de perfecte basis voor productief werken.",
    features: [
      "Verstelbare lendensteun voor optimale rugondersteuning",
      "360° draaibare zitting met soepele wieltjes",
      "Ademend mesh materiaal voor optimale ventilatie",
      "Verstelbare armsteunen (hoogte en breedte)",
      "Gasveer mechanisme voor hoogte verstelling",
      "Maximaal draaggewicht: 120kg"
    ],
    specifications: {
      "Materiaal": "Mesh rugsteun, kunstleer zitting",
      "Afmetingen": "65 x 65 x 110-120 cm",
      "Gewicht": "18 kg",
      "Kleur": "Zwart/Grijs",
      "Garantie": "2 jaar",
      "Montage": "15 minuten"
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronLeft className="h-4 w-4 rotate-180" />
          <Link to="/products" className="hover:text-primary">Producten</Link>
          <ChevronLeft className="h-4 w-4 rotate-180" />
          <span className="text-foreground">{product.name}</span>
        </div>

        {/* Back Button */}
        <Link to="/products">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar Producten
          </Button>
        </Link>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-accent">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Thumbnail images would go here */}
            <div className="grid grid-cols-4 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-accent/50 border-2 border-transparent hover:border-primary cursor-pointer">
                  <img
                    src={product.image}
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
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{product.category}</Badge>
                {product.isSale && <Badge variant="destructive">Sale</Badge>}
                {product.inStock && <Badge className="bg-green-100 text-green-800">Op Voorraad</Badge>}
              </div>
              
              <h1 className="text-3xl font-bold text-foreground mb-4">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
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
                  {product.rating} ({product.reviewCount} beoordelingen)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl font-bold text-foreground">
                  €{product.price}
                </span>
                {product.originalPrice && (
                  <span className="text-lg text-muted-foreground line-through">
                    €{product.originalPrice}
                  </span>
                )}
                {product.isSale && (
                  <Badge variant="destructive">
                    -{Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)}%
                  </Badge>
                )}
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Quantity and Add to Cart */}
            <Card className="border-0 shadow-soft">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium">Aantal:</label>
                    <div className="flex items-center border border-border rounded-lg">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="rounded-r-none"
                      >
                        -
                      </Button>
                      <span className="px-4 py-2 text-sm font-medium min-w-[3rem] text-center">
                        {quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuantity(quantity + 1)}
                        className="rounded-l-none"
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button className="flex-1" size="lg">
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Toevoegen aan Winkelwagen
                    </Button>
                    <Button variant="outline" size="lg">
                      <Heart className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="h-4 w-4 text-primary" />
                      <span>Gratis verzending</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4 text-primary" />
                      <span>2 jaar garantie</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Details Tabs */}
            <Tabs defaultValue="features" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="features">Kenmerken</TabsTrigger>
                <TabsTrigger value="specs">Specificaties</TabsTrigger>
                <TabsTrigger value="reviews">Beoordelingen</TabsTrigger>
              </TabsList>
              
              <TabsContent value="features" className="mt-6">
                <Card className="border-0 shadow-soft">
                  <CardContent className="p-6">
                    <ul className="space-y-3">
                      {product.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="h-1.5 w-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="specs" className="mt-6">
                <Card className="border-0 shadow-soft">
                  <CardContent className="p-6">
                    <dl className="space-y-3">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-2 border-b border-border last:border-0">
                          <dt className="font-medium text-sm">{key}:</dt>
                          <dd className="text-sm text-muted-foreground">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="reviews" className="mt-6">
                <Card className="border-0 shadow-soft">
                  <CardContent className="p-6">
                    <p className="text-center text-muted-foreground">
                      Beoordelingen worden binnenkort toegevoegd.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}