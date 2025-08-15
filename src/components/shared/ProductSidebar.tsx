import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ColorSwatch } from "./ColorSwatch";
import { Search, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterOptions {
  brands: string[];
  types: string[];
  colors: string[];
  minPrice: number;
  maxPrice: number;
  inStockCount: number;
  outOfStockCount: number;
}

interface ProductSidebarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedBrands: string[];
  onBrandsChange: (brands: string[]) => void;
  selectedAvailability: string[];
  onAvailabilityChange: (availability: string[]) => void;
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
  selectedColors: string[];
  onColorsChange: (colors: string[]) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  onClearFilters: () => void;
  filterOptions: FilterOptions;
  className?: string;
}

export function ProductSidebar({
  searchQuery,
  onSearchChange,
  selectedBrands,
  onBrandsChange,
  selectedAvailability,
  onAvailabilityChange,
  selectedTypes,
  onTypesChange,
  selectedColors,
  onColorsChange,
  priceRange,
  onPriceRangeChange,
  onClearFilters,
  filterOptions,
  className
}: ProductSidebarProps) {
  const location = useLocation();

  // Fetch collections for navigation
  const { data: collections = [] } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data || [];
    }
  });

  const activeFiltersCount = 
    selectedBrands.length + 
    selectedAvailability.length + 
    selectedTypes.length + 
    selectedColors.length + 
    (priceRange[0] > filterOptions.minPrice || priceRange[1] < filterOptions.maxPrice ? 1 : 0);

  const handleBrandToggle = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      onBrandsChange(selectedBrands.filter(b => b !== brand));
    } else {
      onBrandsChange([...selectedBrands, brand]);
    }
  };

  const handleAvailabilityToggle = (availability: string) => {
    if (selectedAvailability.includes(availability)) {
      onAvailabilityChange(selectedAvailability.filter(a => a !== availability));
    } else {
      onAvailabilityChange([...selectedAvailability, availability]);
    }
  };

  const handleTypeToggle = (type: string) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter(t => t !== type));
    } else {
      onTypesChange([...selectedTypes, type]);
    }
  };

  const handleColorToggle = (color: string) => {
    if (selectedColors.includes(color)) {
      onColorsChange(selectedColors.filter(c => c !== color));
    } else {
      onColorsChange([...selectedColors, color]);
    }
  };

  return (
    <aside className={cn("w-full lg:w-80 space-y-6", className)}>
      {/* Collections Navigation */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Collections</h3>
          <div className="space-y-2">
            <Link
              to="/products"
              className={cn(
                "flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors",
                location.pathname === "/products" ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground"
              )}
            >
              <span>All Products</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
            {collections.map((collection) => (
              <Link
                key={collection.id}
                to={`/collections/${collection.slug}`}
                className={cn(
                  "flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors",
                  location.pathname === `/collections/${collection.slug}` 
                    ? "bg-accent text-accent-foreground font-medium" 
                    : "text-muted-foreground"
                )}
              >
                <span>{collection.name}</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Filters</h3>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onClearFilters}>
                Clear all ({activeFiltersCount})
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            <Separator />

            {/* Availability Filter */}
            <div className="space-y-3">
              <h4 className="font-medium">Availability</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="in-stock"
                    checked={selectedAvailability.includes("in-stock")}
                    onCheckedChange={() => handleAvailabilityToggle("in-stock")}
                  />
                  <label htmlFor="in-stock" className="text-sm font-medium">
                    In Stock ({filterOptions.inStockCount})
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="out-of-stock"
                    checked={selectedAvailability.includes("out-of-stock")}
                    onCheckedChange={() => handleAvailabilityToggle("out-of-stock")}
                  />
                  <label htmlFor="out-of-stock" className="text-sm font-medium">
                    Out of Stock ({filterOptions.outOfStockCount})
                  </label>
                </div>
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
                          onCheckedChange={() => handleBrandToggle(brand)}
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
                          onCheckedChange={() => handleTypeToggle(type)}
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

            {/* Color Filter with Swatches */}
            {filterOptions.colors.length > 0 && (
              <>
                <div className="space-y-3">
                  <h4 className="font-medium">Color</h4>
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {filterOptions.colors.map((color) => (
                      <ColorSwatch
                        key={color}
                        color={color}
                        isSelected={selectedColors.includes(color)}
                        onToggle={() => handleColorToggle(color)}
                      />
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
                  onValueChange={(value) => onPriceRangeChange(value as [number, number])}
                  max={filterOptions.maxPrice}
                  min={filterOptions.minPrice}
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
  );
}