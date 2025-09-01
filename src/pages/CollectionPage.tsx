import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { ProductCard } from "@/components/ProductCard";
import { ProductSidebar } from "@/components/shared/ProductSidebar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Grid3X3, 
  List, 
  SlidersHorizontal,
  ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useStore } from "@/contexts/StoreContext";

interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  description?: string;
  short_description?: string;
  sku?: string;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  is_sale: boolean;
  created_at: string;
  updated_at: string;
  product_images: Array<{
    image_url: string;
    alt_text?: string;
    is_primary: boolean;
  }>;
  product_attributes: Array<{
    attribute_type: string;
    name: string;
    value: string;
  }>;
  reviews: Array<{
    rating: number;
  }>;
}

interface Collection {
  id: string;
  name: string;
  description?: string;
  slug: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
}

const sortOptions = [
  { value: "best-selling", label: "Best Selling" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Highest Rated" },
];

export default function CollectionPage() {
  const { slug } = useParams<{ slug: string }>();
  const { store, loading: storeLoading, error: storeError } = useStore();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("best-selling");
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 1000]);

  // Fetch collection data (store-aware)
  const { data: collection, isLoading: collectionLoading } = useQuery({
    queryKey: ["collection", slug, store?.id],
    queryFn: async () => {
      if (!store?.id || !slug) return null;

      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .eq("organization_id", store.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Collection | null;
    },
    enabled: !!slug && !storeLoading && !!store?.id,
  });

  // Fetch products in collection (store-aware)
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["collection-products", collection?.id, store?.id],
    queryFn: async () => {
      if (!collection?.id || !store?.id) return [];
      
      // First get product IDs from the collection
      const { data: productCollections, error: pcError } = await supabase
        .from("product_collections")
        .select("product_id")
        .eq("collection_id", collection.id);

      if (pcError || !productCollections?.length) {
        return [];
      }

      const productIds = productCollections.map(pc => pc.product_id);

      // Then get the products with those IDs, filtered by organization
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_images(image_url, alt_text, is_primary),
          product_attributes(attribute_type, name, value),
          reviews(rating)
        `)
        .in("id", productIds)
        .eq("is_active", true)
        .eq("organization_id", store.id);
      
      if (error) throw error;
      return (data || []).map(product => ({
        ...product,
        product_images: product.product_images || [],
        product_attributes: product.product_attributes || [],
        reviews: product.reviews || []
      })) as Product[];
    },
    enabled: !!collection?.id && !!store?.id,
  });

  // Get unique filter options from products
  const filterOptions = {
    brands: [...new Set(products.map(p => 
      p.product_attributes?.find(attr => attr.attribute_type === "brand")?.value
    ).filter(Boolean))],
    types: [...new Set(products.map(p => 
      p.product_attributes?.find(attr => attr.attribute_type === "type")?.value
    ).filter(Boolean))],
    colors: [...new Set(products.map(p => 
      p.product_attributes?.find(attr => attr.attribute_type === "color")?.value
    ).filter(Boolean))],
    minPrice: Math.min(...products.map(p => p.price), 0),
    maxPrice: Math.max(...products.map(p => p.price), 1000),
    inStockCount: products.filter(p => p.stock_quantity > 0).length,
    outOfStockCount: products.filter(p => p.stock_quantity === 0).length,
  };

  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const brand = product.product_attributes?.find(attr => attr.attribute_type === "brand")?.value;
      const type = product.product_attributes?.find(attr => attr.attribute_type === "type")?.value;
      const color = product.product_attributes?.find(attr => attr.attribute_type === "color")?.value;
      
      const matchesBrand = selectedBrands.length === 0 || (brand && selectedBrands.includes(brand));
      const matchesType = selectedTypes.length === 0 || (type && selectedTypes.includes(type));
      const matchesColor = selectedColors.length === 0 || (color && selectedColors.includes(color));
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      
      const matchesAvailability = selectedAvailability.length === 0 || 
        (selectedAvailability.includes("in-stock") && product.stock_quantity > 0) ||
        (selectedAvailability.includes("out-of-stock") && product.stock_quantity === 0);
      
      return matchesSearch && matchesBrand && matchesType && matchesColor && matchesPrice && matchesAvailability;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "rating":
          const aAvgRating = a.reviews?.length > 0 ? a.reviews.reduce((sum, r) => sum + r.rating, 0) / a.reviews.length : 0;
          const bAvgRating = b.reviews?.length > 0 ? b.reviews.reduce((sum, r) => sum + r.rating, 0) / b.reviews.length : 0;
          return bAvgRating - aAvgRating;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedAvailability([]);
    setSelectedTypes([]);
    setSelectedColors([]);
    setPriceRange([0, 1000]);
    setSearchQuery("");
  };

  const activeFiltersCount = selectedBrands.length + selectedAvailability.length + selectedTypes.length + selectedColors.length + (priceRange[0] > 0 || priceRange[1] < 1000 ? 1 : 0);

  // Handle store loading
  if (storeLoading || collectionLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  // Handle store or collection not found
  if (storeError || !store || !collection) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold">
            {!store ? 'Store not found' : 'Collection not found'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {!store 
              ? 'The store you\'re looking for doesn\'t exist.' 
              : 'This collection doesn\'t exist in this store.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Collection Header */}
      <section className="bg-accent/20 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">{collection.name}</h1>
            {collection.description && (
              <p className="text-lg text-muted-foreground">{collection.description}</p>
            )}
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Enhanced Sidebar with Collections Navigation */}
          <ProductSidebar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedBrands={selectedBrands}
            onBrandsChange={setSelectedBrands}
            selectedAvailability={selectedAvailability}
            onAvailabilityChange={setSelectedAvailability}
            selectedTypes={selectedTypes}
            onTypesChange={setSelectedTypes}
            selectedColors={selectedColors}
            onColorsChange={setSelectedColors}
            priceRange={priceRange as [number, number]}
            onPriceRangeChange={setPriceRange}
            onClearFilters={clearFilters}
            filterOptions={filterOptions}
            className={`${showFilters ? 'block' : 'hidden'} lg:block`}
          />

          {/* Products Section */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="bg-card border border-border rounded-lg p-4 mb-6 shadow-soft">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden"
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                  
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredProducts.length} of {products.length} products
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Sort */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* View Mode */}
                  <div className="flex items-center border rounded-lg">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="rounded-r-none"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="rounded-l-none"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {productsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square bg-muted rounded-lg mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground mb-4">No products found matching your criteria</p>
                <Button onClick={clearFilters} variant="outline">
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className={`grid gap-6 ${
                viewMode === "grid" 
                  ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6" 
                  : "grid-cols-1"
              }`}>
                {filteredProducts.map((product) => {
                  const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0];
                  const avgRating = product.reviews?.length > 0 
                    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length 
                    : 0;

                  return (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      originalPrice={product.original_price}
                      image={primaryImage?.image_url || ""}
                      rating={avgRating}
                      reviewCount={product.reviews?.length || 0}
                      category={product.product_attributes?.find(attr => attr.attribute_type === "category")?.value || ""}
                      isNew={product.is_new}
                      isSale={product.is_sale}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}