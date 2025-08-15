import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Grid3X3, List } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const sortOptions = [
  { value: "name", label: "Name" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Rating" },
];

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch products from database
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
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
          category_id,
          categories (name),
          product_images (
            image_url,
            is_primary
          )
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
        rating: 4.5, // Default rating since reviews are not implemented yet
        reviewCount: 0,
        category: product.categories?.name || 'Uncategorized',
        isSale: product.is_sale,
        isNew: product.is_new,
      })) || [];
    }
  });

  // Fetch categories from database
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;

      const categoryNames = data?.map(cat => cat.name) || [];
      return ["All", ...categoryNames];
    }
  });

  const filteredProducts = products
    .filter((product) => {
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
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

        {/* Filters and Search */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8 shadow-soft">
          <div className="grid gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
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
            <div className="flex items-center gap-2">
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

            {/* Filter Button */}
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "secondary"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} of {products.length} products
          </p>
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
      </main>
    </div>
  );
}