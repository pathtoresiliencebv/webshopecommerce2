import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, ShoppingBag, CreditCard, Truck } from "lucide-react";
import { Link } from "react-router-dom";

const checkoutSchema = z.object({
  // Shipping Information
  shipping_first_name: z.string().min(2, "First name is required"),
  shipping_last_name: z.string().min(2, "Last name is required"),
  shipping_address_line1: z.string().min(5, "Address is required"),
  shipping_address_line2: z.string().optional(),
  shipping_city: z.string().min(2, "City is required"),
  shipping_postal_code: z.string().min(4, "Postal code is required"),
  shipping_country: z.string().min(2, "Country is required"),
  shipping_phone: z.string().optional(),
  
  // Billing Information
  billing_first_name: z.string().min(2, "First name is required"),
  billing_last_name: z.string().min(2, "Last name is required"),
  billing_address_line1: z.string().min(5, "Address is required"),
  billing_address_line2: z.string().optional(),
  billing_city: z.string().min(2, "City is required"),
  billing_postal_code: z.string().min(4, "Postal code is required"),
  billing_country: z.string().min(2, "Country is required"),
  billing_phone: z.string().optional(),
  
  // Order notes
  notes: z.string().optional(),
  
  // Same as shipping checkbox
  same_as_shipping: z.boolean().default(true),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const [loading, setLoading] = useState(false);
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const formatPrice = (price: number) => `€${price.toLocaleString()}`;

  // Calculate totals
  const subtotal = total;
  const shippingCost = subtotal > 500 ? 0 : 25; // Free shipping over €500
  const taxRate = 0.21; // 21% VAT in Netherlands
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + shippingCost + taxAmount;

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shipping_first_name: "",
      shipping_last_name: "",
      shipping_address_line1: "",
      shipping_address_line2: "",
      shipping_city: "",
      shipping_postal_code: "",
      shipping_country: "Netherlands",
      shipping_phone: "",
      billing_first_name: "",
      billing_last_name: "",
      billing_address_line1: "",
      billing_address_line2: "",
      billing_city: "",
      billing_postal_code: "",
      billing_country: "Netherlands",
      billing_phone: "",
      notes: "",
      same_as_shipping: true,
    },
  });

  // Redirect if not logged in or cart is empty
  if (!user) {
    navigate("/login", { state: { from: { pathname: "/checkout" } } });
    return null;
  }

  if (items.length === 0) {
    navigate("/products");
    return null;
  }

  const onSubmit = async (data: CheckoutFormData) => {
    setLoading(true);
    try {
      // If same as shipping, copy shipping data to billing
      if (sameAsShipping) {
        data.billing_first_name = data.shipping_first_name;
        data.billing_last_name = data.shipping_last_name;
        data.billing_address_line1 = data.shipping_address_line1;
        data.billing_address_line2 = data.shipping_address_line2;
        data.billing_city = data.shipping_city;
        data.billing_postal_code = data.shipping_postal_code;
        data.billing_country = data.shipping_country;
        data.billing_phone = data.shipping_phone;
      }

      // Create order
      const orderData = {
        user_id: user.id,
        order_number: `ORD-${Date.now()}`,
        status: 'pending' as const,
        subtotal: subtotal,
        tax_amount: taxAmount,
        shipping_amount: shippingCost,
        total_amount: totalAmount,
        shipping_first_name: data.shipping_first_name,
        shipping_last_name: data.shipping_last_name,
        shipping_address_line1: data.shipping_address_line1,
        shipping_address_line2: data.shipping_address_line2 || null,
        shipping_city: data.shipping_city,
        shipping_postal_code: data.shipping_postal_code,
        shipping_country: data.shipping_country,
        shipping_phone: data.shipping_phone || null,
        billing_first_name: sameAsShipping ? data.shipping_first_name : data.billing_first_name,
        billing_last_name: sameAsShipping ? data.shipping_last_name : data.billing_last_name,
        billing_address_line1: sameAsShipping ? data.shipping_address_line1 : data.billing_address_line1,
        billing_address_line2: sameAsShipping ? (data.shipping_address_line2 || null) : (data.billing_address_line2 || null),
        billing_city: sameAsShipping ? data.shipping_city : data.billing_city,
        billing_postal_code: sameAsShipping ? data.shipping_postal_code : data.billing_postal_code,
        billing_country: sameAsShipping ? data.shipping_country : data.billing_country,
        billing_phone: sameAsShipping ? (data.shipping_phone || null) : (data.billing_phone || null),
        notes: data.notes || null,
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
        product_name: item.product.name,
        product_sku: item.product.sku,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      await clearCart();

      toast({
        title: "Order placed successfully!",
        description: `Your order ${order.order_number} has been received.`,
      });

      // Navigate to success page or order confirmation
      navigate("/dashboard", { 
        state: { 
          orderSuccess: true, 
          orderNumber: order.order_number 
        } 
      });

    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/products" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continue Shopping
          </Link>
          <h1 className="text-3xl font-bold">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Shipping Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Shipping Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="shipping_first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="shipping_last_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="shipping_address_line1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 1</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="shipping_address_line2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 2 (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="shipping_city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="shipping_postal_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="shipping_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Billing Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Billing Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="same_as_shipping"
                        checked={sameAsShipping}
                        onCheckedChange={(checked) => setSameAsShipping(checked as boolean)}
                      />
                      <label htmlFor="same_as_shipping" className="text-sm">
                        Same as shipping address
                      </label>
                    </div>

                    {!sameAsShipping && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="billing_first_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="billing_last_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="billing_address_line1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address Line 1</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="billing_address_line2"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address Line 2 (Optional)</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="billing_city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="billing_postal_code"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Postal Code</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Order Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Notes (Optional)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Special delivery instructions..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Processing..." : "Place Order"}
                </Button>
              </form>
            </Form>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="flex-shrink-0 w-16 h-16 bg-accent rounded-md overflow-hidden">
                        {item.product.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm line-clamp-2">{item.product.name}</h4>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
                          <span className="font-semibold">{formatPrice(item.product.price * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Order Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>
                      {shippingCost === 0 ? (
                        <Badge variant="secondary" className="text-xs">FREE</Badge>
                      ) : (
                        formatPrice(shippingCost)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (21% VAT)</span>
                    <span>{formatPrice(taxAmount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatPrice(totalAmount)}</span>
                  </div>
                </div>

                {shippingCost > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Add {formatPrice(500 - subtotal)} more for free shipping
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}