import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";
import { 
  CreditCard, 
  Shield, 
  Truck, 
  RotateCcw, 
  MapPin, 
  ShoppingCart,
  Check,
  Clock,
  Plus,
  Minus
} from "lucide-react";

// Create a safe hook that doesn't throw when StoreProvider is missing
const useSafeStore = () => {
  try {
    const { useStore } = require("@/contexts/StoreContext");
    return useStore();
  } catch {
    return { store: null, loading: false, error: null };
  }
};


const checkoutSchema = z.object({
  email: z.string().email("Valid email is required"),
  shipping_first_name: z.string().min(2, "First name is required"),
  shipping_last_name: z.string().min(2, "Last name is required"),
  shipping_address_line1: z.string().min(5, "Address is required"),
  shipping_address_line2: z.string().optional(),
  shipping_city: z.string().min(2, "City is required"),
  shipping_postal_code: z.string().min(4, "Postal code is required"),
  shipping_country: z.string().min(2, "Country is required"),
  shipping_phone: z.string().optional(),
  email_marketing: z.boolean().default(false),
  save_info: z.boolean().default(false),
  sms_marketing: z.boolean().default(false),
  same_as_shipping: z.boolean().default(true),
  add_insurance: z.boolean().default(false),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(570); // 9:30 minutes in seconds
  const [discountCode, setDiscountCode] = useState("");
  const { items, total, clearCart, loading: cartLoading } = useCart();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { store } = useSafeStore();
  const navigate = useNavigate();

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPrice = (price: number) => `€${price.toFixed(2)}`;

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: user?.email || "",
      shipping_first_name: "",
      shipping_last_name: "",
      shipping_address_line1: "",
      shipping_address_line2: "",
      shipping_city: "",
      shipping_postal_code: "",
      shipping_country: "Netherlands",
      shipping_phone: "",
      email_marketing: false,
      save_info: false,
      sms_marketing: false,
      same_as_shipping: true,
      add_insurance: false,
    },
  });

  // Calculate totals
  const subtotal = total;
  const shippingCost = 0; // Free shipping
  const insuranceCost = form.watch("add_insurance") ? 2.95 : 0;
  const totalAmount = subtotal + shippingCost + insuranceCost;

  // Redirect if not logged in
  if (!user) {
    navigate("/auth", { state: { from: { pathname: "/checkout" } } });
    return null;
  }

  // Show loading state while cart is loading
  if (cartLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your cart...</p>
        </div>
      </div>
    );
  }

  // Redirect if cart is empty (only after loading is complete)
  if (items.length === 0) {
    navigate("/products");
    return null;
  }

  const handleStripeCheckout = async () => {
    const formData = form.getValues();
    
    if (!formData.shipping_first_name || !formData.shipping_last_name || !formData.shipping_address_line1) {
      toast({
        title: "Missing Information",
        description: "Please fill in your shipping address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          items: items,
          organizationId: currentOrganization?.id,
          shippingInfo: {
            firstName: formData.shipping_first_name,
            lastName: formData.shipping_last_name,
            email: formData.email,
            phone: formData.shipping_phone,
            address: formData.shipping_address_line1,
            city: formData.shipping_city,
            postalCode: formData.shipping_postal_code,
            country: formData.shipping_country,
          },
          addInsurance: formData.add_insurance,
        },
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Error",
        description: "Failed to create payment session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {store?.logo_url ? (
                <div className="flex items-center gap-3">
                  <img 
                    src={store.logo_url} 
                    alt={store.name} 
                    className="h-8 w-auto object-contain"
                  />
                  <div className="text-2xl font-bold text-black">{store.name}</div>
                </div>
              ) : (
                <div className="text-2xl font-bold text-black">
                  {store?.name || "AURELIO LIVING"}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <span className="font-medium">{items.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timer Alert */}
      <div className="bg-red-50 border-b border-red-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-2 text-red-800">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">
              Your order is reserved for {formatTime(timeLeft)} min! Hurry, sale items are selling fast.
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
          {/* Left Column - Checkout Form */}
          <div className="px-8 py-8 space-y-8">
            {/* Express Checkout */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Express checkout</h2>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-12 bg-yellow-400 hover:bg-yellow-500 border-yellow-400 text-black font-medium"
                  onClick={handleStripeCheckout}
                  disabled={loading}
                >
                  PayPal
                </Button>
                <Button
                  variant="outline"
                  className="h-12 bg-black hover:bg-gray-800 text-white font-medium"
                  onClick={handleStripeCheckout}
                  disabled={loading}
                >
                  G Pay
                </Button>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">OR</span>
                </div>
              </div>

              {/* Payment Icons */}
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <span className="text-xs">iDEAL</span>
                <span className="text-xs">VISA</span>
                <span className="text-xs">MASTERCARD</span>
                <span className="text-xs">MAESTRO</span>
                <span className="text-xs">AMEX</span>
                <span className="text-xs">UNIONPAY</span>
                <span className="text-xs">PAYPAL</span>
                <span className="text-xs">SOFORT</span>
              </div>
            </div>

            <Form {...form}>
              <div className="space-y-6">
                {/* Contact */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium">Contact</h3>
                    <button 
                      className="text-sm text-blue-600 hover:underline"
                      onClick={() => {
                        navigate("/auth", { state: { from: { pathname: "/checkout" } } });
                      }}
                    >
                      Log in
                    </button>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Email"
                            className="h-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email_marketing"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <label className="text-sm">Email me with news and offers</label>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Delivery */}
                <div className="space-y-4">
                  <h3 className="text-base font-medium">Delivery</h3>
                  
                  <FormField
                    control={form.control}
                    name="shipping_country"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Netherlands">Netherlands</SelectItem>
                            <SelectItem value="Belgium">Belgium</SelectItem>
                            <SelectItem value="Germany">Germany</SelectItem>
                            <SelectItem value="France">France</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="shipping_first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="First name"
                              className="h-12"
                            />
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
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Last name"
                              className="h-12"
                            />
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
                        <FormControl>
                          <div className="relative">
                            <Input 
                              {...field} 
                              placeholder="Address"
                              className="h-12 pr-10"
                            />
                            <MapPin className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                          </div>
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
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Apartment, suite, etc. (optional)"
                            className="h-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="shipping_postal_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Postal code"
                              className="h-12"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="shipping_city"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="City"
                              className="h-12"
                            />
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
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Phone"
                            className="h-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="save_info"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <label className="text-sm">Save this information for next time</label>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sms_marketing"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <label className="text-sm">Text me with news and offers</label>
                          <div className="text-xs text-gray-500">NL</div>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Shipping Method */}
                <div className="space-y-4">
                  <h3 className="text-base font-medium">Shipping method</h3>
                  <p className="text-sm text-gray-600">Enter your shipping address to view available shipping methods.</p>
                </div>

                {/* Insurance */}
                <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Add Insurance to your order? Just €2,95 extra!</p>
                    </div>
                    <FormField
                      control={form.control}
                      name="add_insurance"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Shipping insurance</p>
                      <p className="text-xs text-gray-600">from Damage, Loss & Theft for €2,95</p>
                      <p className="text-xs text-gray-600 mt-1">Get peace of mind with Aurora Amsterdam's Delivery Guarantee in the event your delivery is damaged, stolen or lost during transit.</p>
                    </div>
                  </div>
                </div>

                {/* Payment */}
                <div className="space-y-4">
                  <h3 className="text-base font-medium">Payment</h3>
                  <p className="text-xs text-gray-600">All transactions are secure and encrypted.</p>
                  
                  <div className="space-y-3">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Credit card</span>
                        <div className="flex gap-1">
                          <span className="text-xs text-gray-400">VISA MAESTRO MASTERCARD AMEX</span>
                        </div>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="same_as_shipping"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <label className="text-sm">Use shipping address as billing address</label>
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <div className="border border-gray-200 rounded-lg p-3 text-center">
                        <span className="text-sm">PayPal</span>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-3 text-center">
                        <span className="text-sm">GiroPay</span>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-3 text-center">
                        <span className="text-sm">Klarna</span>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-3 text-center">
                        <span className="text-sm">iDeal</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600">Additional payment methods</p>
                    <div className="flex gap-2 text-xs text-gray-400">
                      <span>bancontact</span>
                      <span>trustly</span>
                      <span>blik</span>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-3">
                      <span className="text-sm">Crypto: USDC</span>
                    </div>
                  </div>
                </div>

                {/* Upsells */}
                <div className="space-y-4">
                  <h3 className="text-base font-medium">You might also like these items</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-3">
                      <div className="aspect-square bg-gray-100 rounded mb-2"></div>
                      <p className="text-xs text-gray-600">Taupe / 40</p>
                      <p className="text-sm font-medium">THE CLASSIC SUEDE TRAINER</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-medium">€85.00</span>
                        <span className="text-xs text-gray-400 line-through">€120.00</span>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3">
                      <div className="aspect-square bg-gray-100 rounded mb-2"></div>
                      <p className="text-xs text-gray-600">Black / 30</p>
                      <p className="text-sm font-medium">THE MILANO TROUSERS</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-medium">€25.00</span>
                        <span className="text-xs text-gray-400 line-through">€90.00</span>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Pay Now Button */}
                <Button 
                  onClick={handleStripeCheckout}
                  disabled={loading}
                  className="w-full h-14 bg-black hover:bg-gray-800 text-white text-lg font-medium"
                >
                  {loading ? "Processing..." : `Pay now - ${formatPrice(totalAmount)}`}
                </Button>

                {/* Footer Links */}
                <div className="flex justify-center gap-4 text-xs text-gray-500">
                  <button className="hover:underline">Returns & Refunds</button>
                  <button className="hover:underline">Shipping</button>
                  <button className="hover:underline">Privacy policy</button>
                  <button className="hover:underline">Terms of service</button>
                </div>
              </div>
            </Form>
          </div>

          {/* Right Column - Order Summary */}
          <div className="bg-gray-50 px-8 py-8 border-l border-gray-200">
            <div className="space-y-6">
              {/* Shopping Cart Header */}
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <h2 className="text-lg font-medium">Shopping cart</h2>
              </div>

              {/* Cart Items */}
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0">
                      {item.product.image_url && (
                        <img 
                          src={item.product.image_url} 
                          alt={item.product.name}
                          className="w-full h-full object-cover rounded"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.product.name}</p>
                      <p className="text-xs text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-sm font-medium">{formatPrice(item.product.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}

                {form.watch("add_insurance") && (
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-green-100 rounded flex-shrink-0 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Insured Package - AURORA AMSTERDAM</p>
                      <p className="text-xs text-gray-600">Quantity: 1</p>
                      <p className="text-xs text-gray-600">Extra Priority when packing & 100% insurance</p>
                      <p className="text-sm font-medium">{formatPrice(2.95)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">In stock, ready to ship!</span>
              </div>

              {/* Discount Code */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Discount code or gift card"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="outline">Apply</Button>
                </div>
              </div>

              {/* Cost Summary */}
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal · {items.length} items</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{shippingCost === 0 ? "Free" : formatPrice(shippingCost)}</span>
                </div>
                {form.watch("add_insurance") && (
                  <div className="flex justify-between text-sm">
                    <span>Insurance</span>
                    <span>{formatPrice(insuranceCost)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-medium border-t pt-2">
                  <span>Total</span>
                  <span>EUR {formatPrice(totalAmount)}</span>
                </div>
              </div>

              {/* Trust Signals */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Express delivery</p>
                    <p className="text-xs text-gray-600">We deliver globally with DHL Express & FedEX</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <RotateCcw className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">14 days returns</p>
                    <p className="text-xs text-gray-600">You can always return or exchange</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}