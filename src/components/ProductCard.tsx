import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useStore } from "@/contexts/StoreContext";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating?: number;
  reviewCount?: number;
  category: string;
  isNew?: boolean;
  isSale?: boolean;
  colors?: string[];
}

export function ProductCard({
  id,
  name,
  price,
  originalPrice,
  image,
  rating = 4.5,
  reviewCount = 0,
  category,
  isNew = false,
  isSale = false,
  colors = [],
}: ProductCardProps) {
  const formatPrice = (price: number) => `€${price.toLocaleString()}`;
  const { addItem } = useCart();
  const { store } = useStore();

  const getProductUrl = () => {
    if (store) {
      return `/store/${store.slug}/products/${id}`;
    }
    return `/products/${id}`;
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(id, 1);
  };

  return (
    <Card className="group relative overflow-hidden border-0 shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-[1.02]">
      <div className="relative aspect-square overflow-hidden bg-accent">
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {isNew && (
            <Badge className="bg-primary text-primary-foreground">New</Badge>
          )}
          {isSale && (
            <Badge variant="destructive">Sale</Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button size="sm" variant="secondary" className="h-8 w-8 p-0 shadow-medium">
            <Heart className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="secondary" 
            className="h-8 w-8 p-0 shadow-medium"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick View Overlay */}
        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Link to={getProductUrl()}>
            <Button variant="secondary" size="sm" className="shadow-large">
              View Details
            </Button>
          </Link>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {category}
          </p>
          <Link to={getProductUrl()}>
            <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2">
              {name}
            </h3>
          </Link>
        </div>

        {/* Rating */}
        {reviewCount > 0 && (
          <div className="flex items-center gap-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              ({reviewCount})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">
            {formatPrice(price)}
          </span>
          {originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>

        {/* Color Palette */}
        {colors.length > 0 && (
          <div className="flex items-center gap-1">
            {colors.map((color, index) => (
              <div
                key={index}
                className="w-3 h-3 rounded-full border border-border/20 cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={`Color option ${index + 1}`}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}