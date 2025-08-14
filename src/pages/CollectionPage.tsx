import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  X, 
  ChevronDown,
  SlidersHorizontal
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

  // Fetch collection data
  const { data: collection, isLoading: collectionLoading } = useQuery({
    queryKey: ["collection", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();
      
      if (error) throw error;
      return data as Collection;
    },
    enabled: !!slug,
  });

  // Fetch products in collection
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["collection-products", collection?.id],
    queryFn: async () => {
      if (!collection?.id) return [];
      
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_images(image_url, alt_text, is_primary),
          product_attributes(attribute_type, name, value),
          reviews(rating)
        `)
        .eq("is_active", true)
        .in("id", 
          await supabase
            .from("product_collections")
            .select("product_id")
            .eq("collection_id", collection.id)
            .then(({ data }) => data?.map(pc => pc.product_id) || [])
        );
      
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!collection?.id,
  });

  // Get unique filter options from products
  const filterOptions = {
    brands: [...new Set(products.map(p => 
      p.product_attributes.find(attr => attr.attribute_type === "brand")?.value
    ).filter(Boolean))],
    types: [...new Set(products.map(p => 
      p.product_attributes.find(attr => attr.attribute_type === "type")?.value
    ).filter(Boolean))],
    colors: [...new Set(products.map(p => 
      p.product_attributes.find(attr => attr.attribute_type === "color")?.value
    ).filter(Boolean))],
  };

  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const brand = product.product_attributes.find(attr => attr.attribute_type === "brand")?.value;
      const type = product.product_attributes.find(attr => attr.attribute_type === "type")?.value;
      const color = product.product_attributes.find(attr => attr.attribute_type === "color")?.value;
      
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
          const aAvgRating = a.reviews.length > 0 ? a.reviews.reduce((sum, r) => sum + r.rating, 0) / a.reviews.length : 0;
          const bAvgRating = b.reviews.length > 0 ? b.reviews.reduce((sum, r) => sum + r.rating, 0) / b.reviews.length : 0;
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

  if (collectionLoading) {
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

  if (!collection) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold">Collection not found</h1>
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
          {/* Filters Sidebar */}
          <aside className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-80 space-y-6`}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Filters</h3>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear all ({activeFiltersCount})
                    </Button>
                  )}
                </div>

                {/* Search */}
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Separator />

                  {/* Availability Filter */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Availability</h4>
                    <div className="space-y-2">
                      {[
                        { id: "in-stock", label: `In Stock (${products.filter(p => p.stock_quantity > 0).length})` },
                        { id: "out-of-stock", label: `Out of Stock (${products.filter(p => p.stock_quantity === 0).length})` },
                      ].map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={option.id}
                            checked={selectedAvailability.includes(option.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedAvailability([...selectedAvailability, option.id]);
                              } else {
                                setSelectedAvailability(selectedAvailability.filter(id => id !== option.id));
                              }
                            }}
                          />
                          <label htmlFor={option.id} className="text-sm font-medium">
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Brand Filter */}
                  {filterOptions.brands.length > 0 && (
                    <>
                      <div className="space-y-3">
                        <h4 className="font-medium">Brand</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {filterOptions.brands.map((brand) => (
                            <div key={brand} className="flex items-center space-x-2">
                              <Checkbox
                                id={`brand-${brand}`}
                                checked={selectedBrands.includes(brand)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedBrands([...selectedBrands, brand]);
                                  } else {
                                    setSelectedBrands(selectedBrands.filter(b => b !== brand));
                                  }
                                }}
                              />
                              <label htmlFor={`brand-${brand}`} className="text-sm font-medium">
                                {brand}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Product Type Filter */}
                  {filterOptions.types.length > 0 && (
                    <>
                      <div className="space-y-3">
                        <h4 className="font-medium">Product Type</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {filterOptions.types.map((type) => (
                            <div key={type} className="flex items-center space-x-2">
                              <Checkbox
                                id={`type-${type}`}
                                checked={selectedTypes.includes(type)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedTypes([...selectedTypes, type]);
                                  } else {
                                    setSelectedTypes(selectedTypes.filter(t => t !== type));
                                  }
                                }}
                              />
                              <label htmlFor={`type-${type}`} className="text-sm font-medium">
                                {type}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Color Filter */}
                  {filterOptions.colors.length > 0 && (
                    <>
                      <div className="space-y-3">
                        <h4 className="font-medium">Color</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {filterOptions.colors.map((color) => (
                            <div key={color} className="flex items-center space-x-2">
                              <Checkbox
                                id={`color-${color}`}
                                checked={selectedColors.includes(color)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedColors([...selectedColors, color]);
                                  } else {
                                    setSelectedColors(selectedColors.filter(c => c !== color));
                                  }
                                }}
                              />
                              <label htmlFor={`color-${color}`} className="text-sm font-medium">
                                {color}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Price Range Filter */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Price Range</h4>
                    <div className="px-2">
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={1000}
                        min={0}
                        step={10}
                        className="mb-4"
                      />
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>€{priceRange[0]}</span>
                        <span>€{priceRange[1]}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
                  : "grid-cols-1"
              }`}>
                {filteredProducts.map((product) => {
                  const primaryImage = product.product_images.find(img => img.is_primary) || product.product_images[0];
                  const avgRating = product.reviews.length > 0 
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
                      reviewCount={product.reviews.length}
                      category={product.product_attributes.find(attr => attr.attribute_type === "category")?.value || ""}
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