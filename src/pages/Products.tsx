import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Grid3X3, List } from "lucide-react";

// Import images
import chairOffice from "@/assets/chair-office.jpg";
import deskStanding from "@/assets/desk-standing.jpg";
import cabinetStorage from "@/assets/cabinet-storage.jpg";

const products = [
  {
    id: "1",
    name: "Ergonomische Kantoorstoel Pro",
    price: 299,
    originalPrice: 399,
    image: chairOffice,
    rating: 4.8,
    reviewCount: 124,
    category: "Stoelen",
    isSale: true,
  },
  {
    id: "2",
    name: "Verstelbare Sta-Bureau Premium",
    price: 599,
    image: deskStanding,
    rating: 4.6,
    reviewCount: 89,
    category: "Bureaus",
    isNew: true,
  },
  {
    id: "3",
    name: "Moderne Opbergkast wit",
    price: 199,
    image: cabinetStorage,
    rating: 4.4,
    reviewCount: 67,
    category: "Opslag",
  },
  {
    id: "4",
    name: "Executive Lederen Stoel",
    price: 449,
    originalPrice: 549,
    image: chairOffice,
    rating: 4.9,
    reviewCount: 156,
    category: "Stoelen",
    isSale: true,
  },
  {
    id: "5",
    name: "Minimalist Werkblad",
    price: 349,
    image: deskStanding,
    rating: 4.5,
    reviewCount: 78,
    category: "Bureaus",
  },
  {
    id: "6",
    name: "Modulaire Opbergunit",
    price: 279,
    image: cabinetStorage,
    rating: 4.3,
    reviewCount: 43,
    category: "Opslag",
    isNew: true,
  },
];

const categories = ["Alle", "Stoelen", "Bureaus", "Opslag", "Verlichting"];
const sortOptions = [
  { value: "name", label: "Naam" },
  { value: "price-low", label: "Prijs: Laag naar Hoog" },
  { value: "price-high", label: "Prijs: Hoog naar Laag" },
  { value: "rating", label: "Beoordeling" },
];

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState("Alle");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products
    .filter((product) => {
      const matchesCategory = selectedCategory === "Alle" || product.category === selectedCategory;
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Onze Producten</h1>
          <p className="text-muted-foreground">
            Ontdek onze collectie van hoogwaardige kantoormeubelen
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8 shadow-soft">
          <div className="grid gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek producten..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sorteer op" />
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
            {filteredProducts.length} van {products.length} producten
          </p>
        </div>

        {/* Products Grid */}
        <div className={`grid gap-6 ${
          viewMode === "grid" 
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
            : "grid-cols-1"
        }`}>
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>

        {/* Load More */}
        <div className="flex justify-center mt-12">
          <Button variant="outline" size="lg">
            Meer Producten Laden
          </Button>
        </div>
      </main>
    </div>
  );
}