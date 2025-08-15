import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { ProductCard } from "@/components/ProductCard";
import { ProductSidebar } from "@/components/shared/ProductSidebar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Grid3X3, List, SlidersHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const sortOptions = [
  { value: "name", label: "Name" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Rating" },
];

export default function Products() {
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 1000]);

  // Fetch products from database
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name),
          product_images (image_url, is_primary),
          product_attributes (attribute_type, name, value),
          reviews (rating)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(product => ({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        originalPrice: product.original_price ? Number(product.original_price) : null,
        image: product.product_images?.find(img => img.is_primary)?.image_url || '/placeholder.svg',
        rating: 4.5,
        reviewCount: 0,
        category: product.categories?.name || 'Uncategorized',
        isSale: product.is_sale,
        isNew: product.is_new,
        stock_quantity: product.stock_quantity || 0,
        product_attributes: product.product_attributes || [],
        reviews: product.reviews || []
      })) || [];
    }
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
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedAvailability([]);
    setSelectedTypes([]);
    setSelectedColors([]);
    setPriceRange([filterOptions.minPrice, filterOptions.maxPrice]);
    setSearchQuery("");
  };

  const activeFiltersCount = selectedBrands.length + selectedAvailability.length + selectedTypes.length + selectedColors.length + (priceRange[0] > filterOptions.minPrice || priceRange[1] < filterOptions.maxPrice ? 1 : 0);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Our Products</h1>
          <p className="text-muted-foreground">
            Discover our collection of high-quality office furniture
          </p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
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
                      <SelectValue placeholder="Sort by" />
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
                  <div className="flex items-center gap-1">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No products found</p>
              </div>
            ) : (
              <div className={`grid gap-6 ${
                viewMode === "grid" 
                  ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6" 
                  : "grid-cols-1"
              }`}>
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            )}

            {/* Load More */}
            <div className="flex justify-center mt-12">
              <Button variant="outline" size="lg">
                Load More Products
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}