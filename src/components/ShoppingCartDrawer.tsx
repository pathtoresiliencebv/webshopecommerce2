import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Plus, Minus, X, ArrowRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

export function ShoppingCartDrawer() {
  const { items, itemCount, total, loading, updateQuantity, removeItem, isOpen, openCart, closeCart } = useCart();
  const { user } = useAuth();

  const formatPrice = (price: number) => `€${price.toLocaleString()}`;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => open ? openCart() : closeCart()}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <ShoppingCart className="h-4 w-4" />
          {itemCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs font-body">
              {itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart ({itemCount})
          </SheetTitle>
        </SheetHeader>

        {!user ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <ShoppingCart className="h-16 w-16 text-muted-foreground" />
            <div className="text-center">
              <h3 className="font-semibold">Please log in</h3>
              <p className="text-sm text-muted-foreground">You need to be logged in to view your cart</p>
            </div>
            <Link to="/login" onClick={closeCart}>
              <Button>Log In</Button>
            </Link>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <ShoppingCart className="h-16 w-16 text-muted-foreground" />
            <div className="text-center">
              <h3 className="font-semibold">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground">Add some products to get started</p>
            </div>
            <Link to="/products" onClick={closeCart}>
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0 w-16 h-16 bg-accent rounded-md overflow-hidden">
                    {item.product.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm line-clamp-2">{item.product.name}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {item.product.sku && (
                      <p className="text-xs text-muted-foreground">SKU: {item.product.sku}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={loading}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={loading}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-sm font-semibold">
                        {formatPrice(item.product.price * item.quantity)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Subtotal</span>
                <span className="font-bold text-lg">{formatPrice(total)}</span>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Shipping and taxes will be calculated at checkout
              </p>
              
              <Separator />
              
              <div className="space-y-2">
                <Link to="/checkout" onClick={closeCart}>
                  <Button className="w-full" size="lg">
                    Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/products" onClick={closeCart}>
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}