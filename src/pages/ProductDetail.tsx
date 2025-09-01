import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { useCart } from "@/contexts/CartContext";
import { useStore } from "@/contexts/StoreContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
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

interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  sku?: string;
  description?: string;
  short_description?: string;
  stock_quantity?: number;
  is_active: boolean;
  product_images: {
    image_url: string;
    alt_text?: string;
    is_primary: boolean;
  }[];
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toast } = useToast();
  const { store, loading: storeLoading, error: storeError } = useStore();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id || !store) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            id,
            name,
            price,
            original_price,
            sku,
            description,
            short_description,
            stock_quantity,
            is_active,
            organization_id,
            product_images (
              image_url,
              alt_text,
              is_primary,
              sort_order
            )
          `)
          .eq('id', id)
          .eq('organization_id', store.id)
          .eq('is_active', true)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          // Sort images by primary first, then by sort_order
          const sortedImages = data.product_images?.sort((a, b) => {
            if (a.is_primary && !b.is_primary) return -1;
            if (!a.is_primary && b.is_primary) return 1;
            return (a.sort_order || 0) - (b.sort_order || 0);
          }) || [];
          
          setProduct({
            ...data,
            product_images: sortedImages
          });
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Product niet gevonden');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, store]);

  const handleAddToCart = async () => {
    if (!product) return;
    
    setAddingToCart(true);
    try {
      await addItem(product.id, quantity);
      toast({
        title: "Toegevoegd aan winkelwagen",
        description: `${quantity}x ${product.name} toegevoegd aan uw winkelwagen`,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    
    setAddingToCart(true);
    try {
      await addItem(product.id, quantity);
      navigate('/checkout');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Fout",
        description: "Kon product niet toevoegen aan winkelwagen",
        variant: "destructive"
      });
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading || storeLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="aspect-square w-full" />
              <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || storeError || !product || !store) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold mb-4">
              {storeError ? 'Store niet gevonden' : 'Product niet gevonden'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {storeError 
                ? 'De store die u zoekt bestaat niet of is niet beschikbaar.' 
                : 'Het product dat u zoekt bestaat niet of is niet beschikbaar in deze store.'}
            </p>
            <Button asChild>
              <Link to="/products">Terug naar producten</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Format price helper
  const formatPrice = (price: number) => `€${price.toLocaleString()}`;

  // Check if product has images
  const productImages = product.product_images?.length > 0 
    ? product.product_images 
    : [{ image_url: deskStanding, alt_text: product.name, is_primary: true }];

  const relatedProducts = [
    {
      id: "2",
      name: "Minimalistische Schrijfbureau",
      price: 126.95,
      image: deskStanding,
      rating: 5.0,
      reviewCount: 7,
      category: "Bureaus",
      badge: "GERELATEERD PRODUCT"
    }
  ];

  const similarProducts = [
    {
      id: "3",
      name: "Minimalistische Schrijfbureau", 
      price: 126.95,
      image: deskStanding
    },
    {
      id: "4",
      name: "Ergonomisch Kantoorbureau",
      price: 215.95,
      image: cabinetStorage
    },
    {
      id: "5",
      name: "Verstelbaar Sta-bureau",
      price: 506.95,
      image: deskStanding
    }
  ];

  const compatibleProducts = [
    {
      id: "6",
      name: "Executive Kantoorstoel",
      price: 299.95,
      image: chairOffice,
      category: "Stoelen"
    },
    {
      id: "7",
      name: "Opbergkast Pro", 
      price: 189.95,
      image: cabinetStorage,
      category: "Opslag"
    },
    {
      id: "8",
      name: "Moderne Kantoorstoel",
      price: 199.95,
      image: chairOffice,
      category: "Stoelen"
    },
    {
      id: "9",
      name: "Compacte Opbergeenheid",
      price: 129.95,
      image: cabinetStorage,
      category: "Opslag"
    },
    {
      id: "10",
      name: "Luxe Bureau Set",
      price: 549.95,
      image: deskStanding,
      category: "Bureaus"
    },
    {
      id: "11",
      name: "Draadloze Oplader",
      price: 49.95,
      image: chairOffice,
      category: "Accessoires"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary">Startpagina</Link>
          <ChevronLeft className="h-4 w-4 rotate-180" />
          <Link to="/products" className="hover:text-primary">Producten</Link>
          <ChevronLeft className="h-4 w-4 rotate-180" />
          <span className="text-foreground">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 mb-16">
          {/* Product Images - Left Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-accent border">
              <img
                src={productImages[selectedImage]?.image_url}
                alt={productImages[selectedImage]?.alt_text || product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Thumbnail images */}
            {productImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {productImages.map((image, i) => (
                  <div 
                    key={i} 
                    className={`aspect-square rounded-lg overflow-hidden bg-accent/50 border-2 cursor-pointer transition-colors ${
                      selectedImage === i ? 'border-primary' : 'border-transparent hover:border-border'
                    }`}
                    onClick={() => setSelectedImage(i)}
                  >
                    <img
                      src={image.image_url}
                      alt={image.alt_text || `${product.name} ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info - Right Column - Sticky */}
          <div className="lg:sticky lg:top-8 lg:self-start space-y-6">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              {store.name.toUpperCase()} door {store.name}
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-4">
                {product.name}
              </h1>
              
              <div className="flex items-center gap-2 mb-2">
                <div className="text-2xl font-bold text-foreground">
                  {formatPrice(product.price)}
                </div>
                {product.original_price && product.original_price > product.price && (
                  <div className="text-lg text-muted-foreground line-through">
                    {formatPrice(product.original_price)}
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground mb-6">
                Btw inbegrepen. {product.sku && `SKU: ${product.sku}`}
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {product.short_description || "Hoogwaardige kantooruitrusting voor uw werkplek."}
              </p>

              {/* Quantity Selector */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">Hoeveelheid:</label>
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
                      disabled={product.stock_quantity ? quantity >= product.stock_quantity : false}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mb-6">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={addingToCart || (product.stock_quantity !== null && product.stock_quantity <= 0)}
                >
                  {addingToCart ? "Bezig..." : "Voeg toe aan Winkelwagen"}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  size="lg"
                  onClick={handleBuyNow}
                  disabled={addingToCart || (product.stock_quantity !== null && product.stock_quantity <= 0)}
                >
                  {addingToCart ? "Bezig..." : "Koop het Nu"}
                </Button>
              </div>

              {/* Stock and Delivery Info */}
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="font-medium text-red-600">
                    {product.stock_quantity !== null 
                      ? `${product.stock_quantity} Op Voorraad` 
                      : "Op Voorraad"
                    }
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">
                  Handel snel om uw aankoop veilig te stellen — slechts beperkte items op voorraad bij onze online zakelijke uitrusting...{" "}
                  <button className="text-primary hover:underline">Lees meer</button>
                </p>

                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  <span className="font-medium">Volgende Dag Levering</span>
                </div>
                <p className="text-muted-foreground text-xs">
                  Bliksemsnelle verzending, gegarandeerd.
                </p>

                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  <span className="font-medium">Gratis 90-dagen retour</span>
                </div>
                <p className="text-muted-foreground text-xs">
                  Shop risicovrij met eenvoudige retouren.
                </p>
              </div>

              {/* Packaging Note */}
              <div className="mt-6 p-4 bg-accent/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="text-sm">
                    <div className="font-medium mb-1">Verpakkingsnota:</div>
                    <p className="text-muted-foreground text-xs">
                      Verpakt met zorg om veilige levering te garanderen. Uw zakelijke uitrusting is in goede handen.
                    </p>
                  </div>
                </div>
              </div>

              {/* Stockmart Promotion */}
              <div className="mt-6 p-4 bg-primary text-primary-foreground rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-sm font-bold">stockmart</div>
                </div>
                <div className="text-sm font-bold mb-1">
                  Korting & Gratis Verzending op Uw Eerste Aankoop
                </div>
                <div className="text-xs underline">
                  Eerste-Tijders Deal
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Over</h2>
          
          <Tabs defaultValue="description" className="w-full">
            <TabsList>
              <TabsTrigger value="description">BESCHRIJVING</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-6">
              <div className="grid lg:grid-cols-2 gap-12 items-start">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">{product.name}</h3>
                    <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
                      <p>
                        {product.description || "Hoogwaardige kantooruitrusting ontworpen voor uw werkplek. Gemaakt met premium materialen en zorgvuldige aandacht voor detail."}
                      </p>
                    </div>
                  </div>
                <div className="aspect-video rounded-lg overflow-hidden">
                  <img
                    src={productImages[0]?.image_url}
                    alt={productImages[0]?.alt_text || product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              <div className="mt-8 space-y-4 text-muted-foreground text-sm leading-relaxed">
                <p>
                  Print documenten en presentaties met gemak met onze selectie printers. We bieden printers voor elke behoefte, van eenvoudige inkjetprinters tot krachtige laserprinters. Onze printers zijn ontworpen om hoogwaardige afdrukken en efficiënte prestaties te leveren.
                </p>
                <p>
                  Organiseer uw werkruimte met onze selectie kasten en planken. Onze kasten en planken zijn ontworpen om voldoende opslagruimte te bieden voor bestanden, documenten en andere kantoorbenodigdheden. We bieden een verscheidenheid aan stijlen en maten om in elke werkruimte te passen.
                </p>
                <p>
                  Zorg voor comfort en productiviteit met onze selectie stoelen. We bieden ergonomische stoelen die zijn ontworpen om ondersteuning en comfort te bieden tijdens lange werkuren. Onze stoelen zijn verstelbaar en verkrijgbaar in verschillende maten en stijlen om in elke werkruimte te passen.
                </p>
                <p>
                  Maak presentaties en vergaderingen dynamischer met onze projectoren. Onze projectoren zijn ontworpen om hoogwaardige beeldprojectie en helderheid te bieden, waardoor ze ideaal zijn voor presentaties en trainingsessies.
                </p>
                <p>
                  Voorraad kantoorbenodigdheden met onze selectie briefpapier. We bieden alles van pennen en potloden tot notitieblokken en bestandsmappen. Ons briefpapier is ontworpen om hoogwaardige en betrouwbare prestaties te leveren.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Product Section */}
        {relatedProducts.length > 0 && (
          <div className="mb-16">
            <div className="text-right mb-6">
              <Badge variant="secondary" className="text-xs">
                {relatedProducts[0].badge}
              </Badge>
            </div>
            <div className="grid lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">
                    {relatedProducts[0].rating} ({relatedProducts[0].reviewCount} Reviews)
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-4">{relatedProducts[0].name}</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Voorraad Uitgerust voor Succes We slaan alles op van werktafels en printers tot kasten en planken, stoelen, projectoren, en...{" "}
                  <button className="text-primary hover:underline">Lees meer</button>
                </p>
                <div className="text-lg font-bold mb-4">€{relatedProducts[0].price}</div>
                <div className="text-xs text-muted-foreground mb-4">Btw inbegrepen.</div>
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="h-4 w-4" />
                  <span className="text-sm font-medium">2 Dagen Levering</span>
                </div>
              </div>
              <div className="bg-gray-100 rounded-lg p-8">
                <div className="aspect-square rounded-lg overflow-hidden mb-4">
                  <img
                    src={relatedProducts[0].image}
                    alt={relatedProducts[0].name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-lg font-bold mb-2">€{relatedProducts[0].price}</div>
                <div className="text-xs text-muted-foreground mb-4">Btw inbegrepen.</div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center border border-border rounded">
                    <Button variant="ghost" size="sm" className="rounded-r-none px-3">
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="px-4 py-2 text-sm font-medium min-w-[3rem] text-center border-x border-border">
                      1
                    </span>
                    <Button variant="ghost" size="sm" className="rounded-l-none px-3">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button className="flex-1">
                    Voeg toe aan Winkelwagen
                  </Button>
                </div>
                <Button variant="outline" className="w-full">
                  Koop het Nu
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Similar Items You Might Like */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-2">Vergelijkbare Items die U Zou Kunnen Bevallen</h2>
          <p className="text-muted-foreground text-sm mb-6">Gebaseerd op wat klanten kochten</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {similarProducts.map((item) => (
              <Card key={item.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="aspect-square bg-accent rounded-t-lg overflow-hidden relative">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {item.id === "4" && (
                      <div className="absolute bottom-4 left-4 flex gap-2">
                        <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-800"></div>
                        <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-400"></div>
                        <div className="w-6 h-6 rounded-full border-2 border-white bg-amber-600"></div>
                      </div>
                    )}
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

        {/* Shop For More Compatible Items - 6 Columns */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-2">Shop Voor Meer Compatibele Items</h2>
          <p className="text-muted-foreground text-sm mb-6">Items die goed samen gaan</p>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
            {compatibleProducts.map((item) => (
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
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                      {item.category}
                    </p>
                    <h3 className="font-medium text-sm mb-2 line-clamp-2">{item.name}</h3>
                    <p className="text-lg font-bold">€{item.price}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}