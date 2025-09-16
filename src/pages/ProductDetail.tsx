import { useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Heart, Share2, Star, Plus, Minus } from "lucide-react";
import { useState, useMemo } from "react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/contexts/StoreContext";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const { addItem } = useCart();
  const { toast } = useToast();
  const { store } = useStore();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", slug, store?.id],
    queryFn: async () => {
      if (!store?.id) return null;
      
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_images (
            id,
            image_url,
            alt_text,
            sort_order,
            is_primary
          ),
          categories (
            id,
            name,
            slug
          )
        `)
        .eq("slug", slug)
        .eq("organization_id", store.id)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      
      // Fetch related product options and variants separately
      const [optionsResult, variantsResult] = await Promise.all([
        supabase
          .from("product_options")
          .select("*")
          .eq("product_id", data?.id || "")
          .order("position"),
        supabase
          .from("product_variants")
          .select("*")
          .eq("product_id", data?.id || "")
          .eq("is_active", true)
          .order("position")
      ]);

      return {
        ...data,
        product_options: optionsResult.data || [],
        product_variants: variantsResult.data || []
      };
    },
    enabled: !!slug && !!store?.id,
  });

  // Memoized calculations for variants
  const activeVariants = useMemo(() => {
    return product?.product_variants?.filter(v => v.is_active) || [];
  }, [product?.product_variants]);

  const currentVariant = useMemo(() => {
    if (!selectedVariant || !activeVariants.length) return null;
    return activeVariants.find(v => v.id === selectedVariant) || null;
  }, [selectedVariant, activeVariants]);

  const availableVariantsForOptions = useMemo(() => {
    if (!activeVariants.length) return [];
    return activeVariants.filter(variant => {
      return Object.entries(selectedOptions).every(([optionName, value]) => 
        variant.option_values[optionName] === value
      );
    });
  }, [activeVariants, selectedOptions]);

  // Auto-select variant when all options are selected
  useMemo(() => {
    if (availableVariantsForOptions.length === 1 && !selectedVariant) {
      setSelectedVariant(availableVariantsForOptions[0].id);
    }
  }, [availableVariantsForOptions, selectedVariant]);

  const displayPrice = currentVariant?.price || product?.price || 0;
  const displayImage = currentVariant?.image_url || (product?.product_images?.[selectedImage]?.image_url);
  const availableStock = currentVariant?.inventory_quantity || product?.stock_quantity || 0;

  if (error) {
    console.error("Error loading product:", error);
    return <Navigate to="/404" replace />;
  }

  if (!product) {
    return <Navigate to="/404" replace />;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const handleAddToCart = async () => {
    if (!store?.id) {
      toast({
        title: "Error",
        description: "Store not found",
        variant: "destructive",
      });
      return;
    }

    try {
      await addItem(product.id, quantity);
      toast({
        title: "Added to Cart",
        description: `${quantity} × ${product.name} ${currentVariant ? `(${Object.values(currentVariant.option_values).join(', ')})` : ''} added to your cart`,
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  };

  const handleOptionChange = (optionName: string, value: string) => {
    const newSelectedOptions = { ...selectedOptions, [optionName]: value };
    setSelectedOptions(newSelectedOptions);
    
    // Clear selected variant to force reselection
    setSelectedVariant(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  // Prepare images for display
  const productImages = product.product_images?.length > 0 
    ? product.product_images.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    : [];

  const displayImages = displayImage 
    ? [{ image_url: displayImage, alt_text: product.name }, ...productImages.filter(img => img.image_url !== displayImage)]
    : productImages;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden border">
              <img
                src={displayImages[selectedImage]?.image_url || product.product_images?.[0]?.image_url}
                alt={displayImages[selectedImage]?.alt_text || product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {displayImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {displayImages.slice(0, 4).map((image, i) => (
                  <button
                    key={i}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      selectedImage === i ? 'border-primary' : 'border-border'
                    }`}
                    onClick={() => setSelectedImage(i)}
                  >
                    <img
                      src={image.image_url}
                      alt={image.alt_text || `${product.name} ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <div className="text-2xl font-semibold text-primary">
                {formatPrice(displayPrice)}
              </div>
              {product.sku && (
                <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
              )}
            </div>

            {product.description && (
              <div>
                <p className="text-muted-foreground">{product.description}</p>
              </div>
            )}

            {/* Product Options */}
            {product.product_options && product.product_options.length > 0 && (
              <div className="space-y-4">
                {product.product_options
                  .sort((a, b) => (a.position || 0) - (b.position || 0))
                  .map((option) => (
                    <div key={option.id} className="space-y-2">
                      <label className="text-sm font-medium">{option.name}:</label>
                      <Select
                        value={selectedOptions[option.name] || ""}
                        onValueChange={(value) => handleOptionChange(option.name, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Choose ${option.name.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {option.values.map((value) => (
                            <SelectItem key={value} value={value}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
              </div>
            )}

            {/* Quantity & Stock */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Quantity:</label>
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-2 min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={availableStock > 0 && quantity >= availableStock}
                    className="px-3"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {availableStock > 0 && (
                <p className="text-sm text-green-600">
                  {availableStock} in stock
                </p>
              )}
            </div>

            {/* Add to Cart */}
            <div className="space-y-3">
              <Button
                className="w-full"
                size="lg"
                onClick={handleAddToCart}
                disabled={
                  availableStock <= 0 || 
                  (product.product_options?.length > 0 && 
                    product.product_options.some(opt => !selectedOptions[opt.name]))
                }
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
              
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1">
                  <Heart className="mr-2 h-4 w-4" />
                  Wishlist
                </Button>
                <Button variant="outline" className="flex-1">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}