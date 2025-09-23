import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ShoppingCart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getStoreAwarePath } from '@/lib/url-utils';

interface SlidingCartNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    price: number;
    image_url?: string;
  };
  quantity: number;
  storeSlug?: string;
}

export function SlidingCartNotification({ 
  isOpen, 
  onClose, 
  product, 
  quantity, 
  storeSlug 
}: SlidingCartNotificationProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  const formatPrice = (price: number) => `€${price.toLocaleString()}`;
  const cartUrl = getStoreAwarePath('/checkout', storeSlug);

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ease-out ${
      isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <Card className="w-80 p-4 shadow-lg border-2 border-primary/20 bg-background">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-accent rounded-md overflow-hidden">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">
                  ✓ Added to cart
                </p>
                <h4 className="font-medium text-sm line-clamp-2 mb-1">
                  {product.name}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {quantity} × {formatPrice(product.price)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex gap-2 mt-3">
              <Link to={cartUrl} className="flex-1">
                <Button size="sm" className="w-full text-xs">
                  View Cart
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onClose}
                className="text-xs"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}