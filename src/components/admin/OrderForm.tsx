import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { X, Plus, Search, ShoppingCart } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

interface OrderFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface CustomerData {
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postal_code: string;
  country: string;
}

export function OrderForm({ onSuccess, onCancel }: OrderFormProps) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  // Form states
  const [customerData, setCustomerData] = useState<CustomerData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    postal_code: "",
    country: "Netherlands"
  });

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [shippingAmount, setShippingAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [orderStatus, setOrderStatus] = useState("processing");
  const [notes, setNotes] = useState("");
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [shippingData, setShippingData] = useState<Partial<CustomerData>>({});

  // Fetch products for selection
  const { data: products = [] } = useQuery({
    queryKey: ['products', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, stock_quantity, sku')
        .eq('organization_id', currentOrganization.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization?.id
  });

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + item.total_price, 0);
  const totalAmount = subtotal + shippingAmount + taxAmount - discountAmount;

  // Add product to order
  const addProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = orderItems.find(item => item.product_id === productId);
    if (existingItem) {
      setOrderItems(items =>
        items.map(item =>
          item.product_id === productId
            ? {
                ...item,
                quantity: item.quantity + 1,
                total_price: (item.quantity + 1) * item.unit_price
              }
            : item
        )
      );
    } else {
      setOrderItems(items => [
        ...items,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          unit_price: Number(product.price),
          total_price: Number(product.price)
        }
      ]);
    }
    setProductSearch("");
  };

  // Update item quantity
  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setOrderItems(items =>
      items.map(item =>
        item.product_id === productId
          ? {
              ...item,
              quantity,
              total_price: quantity * item.unit_price
            }
          : item
      )
    );
  };

  // Remove item
  const removeItem = (productId: string) => {
    setOrderItems(items => items.filter(item => item.product_id !== productId));
  };

  // Update shipping data when billing changes
  useEffect(() => {
    if (sameAsBilling) {
      setShippingData({
        first_name: customerData.first_name,
        last_name: customerData.last_name,
        address_line1: customerData.address_line1,
        address_line2: customerData.address_line2,
        city: customerData.city,
        postal_code: customerData.postal_code,
        country: customerData.country,
        phone: customerData.phone
      });
    }
  }, [customerData, sameAsBilling]);

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!currentOrganization?.id || !user?.id) {
        throw new Error("Missing organization or user");
      }

      // Generate order number
      const { data: orderNumber, error: orderNumberError } = await supabase
        .rpc('generate_order_number');

      if (orderNumberError) throw orderNumberError;

      // Create the order
      const finalShipping = sameAsBilling ? customerData : { ...customerData, ...shippingData };
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          organization_id: currentOrganization.id,
          user_id: user.id, // This will be updated when we have proper customer profiles
          order_number: orderNumber,
          status: orderStatus,
          subtotal,
          tax_amount: taxAmount,
          shipping_amount: shippingAmount,
          discount_amount: discountAmount,
          total_amount: totalAmount,
          billing_first_name: customerData.first_name,
          billing_last_name: customerData.last_name,
          billing_address_line1: customerData.address_line1,
          billing_address_line2: customerData.address_line2,
          billing_city: customerData.city,
          billing_postal_code: customerData.postal_code,
          billing_country: customerData.country,
          billing_phone: customerData.phone,
          shipping_first_name: finalShipping.first_name,
          shipping_last_name: finalShipping.last_name,
          shipping_address_line1: finalShipping.address_line1,
          shipping_address_line2: finalShipping.address_line2,
          shipping_city: finalShipping.city,
          shipping_postal_code: finalShipping.postal_code,
          shipping_country: finalShipping.country,
          shipping_phone: finalShipping.phone,
          notes
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItemsData = orderItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        product_sku: products.find(p => p.id === item.product_id)?.sku || null
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) throw itemsError;

      // Update product stock
      for (const item of orderItems) {
        const { error: stockError } = await supabase.rpc('decrement_product_stock', {
          _product_id: item.product_id,
          _quantity: item.quantity
        });

        if (stockError) {
          console.error("Error updating stock:", stockError);
        }
      }

      return order;
    },
    onSuccess: () => {
      toast.success("Order created successfully!");
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      onSuccess();
    },
    onError: (error) => {
      console.error("Error creating order:", error);
      toast.error("Failed to create order");
    }
  });

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerData.first_name || !customerData.last_name || !customerData.email) {
      toast.error("Please fill in customer information");
      return;
    }

    if (orderItems.length === 0) {
      toast.error("Please add at least one product");
      return;
    }

    createOrderMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Create New Order</h2>
          <p className="text-muted-foreground">Manually create an order for a customer</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createOrderMutation.isPending}
            className="min-w-24"
          >
            {createOrderMutation.isPending ? "Creating..." : "Create Order"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="new" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="new">New Customer</TabsTrigger>
                  <TabsTrigger value="existing" disabled>Existing Customer</TabsTrigger>
                </TabsList>
                <TabsContent value="new" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={customerData.first_name}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, first_name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={customerData.last_name}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, last_name: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerData.email}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={customerData.phone}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Products */}
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by name or SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Product Search Results */}
              {productSearch && (
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                      onClick={() => addProduct(product.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.sku && `${product.sku} • `}€{Number(product.price).toFixed(2)} • Stock: {product.stock_quantity}
                          </p>
                        </div>
                        <Plus className="h-4 w-4" />
                      </div>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="p-3 text-center text-muted-foreground">
                      No products found
                    </div>
                  )}
                </div>
              )}

              {/* Selected Products */}
              <div className="space-y-2">
                {orderItems.map((item) => (
                  <div key={item.product_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">€{item.unit_price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItemQuantity(item.product_id, parseInt(e.target.value) || 0)}
                        className="w-20"
                      />
                      <span className="w-20 text-right font-medium">€{item.total_price.toFixed(2)}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.product_id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {orderItems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No products added yet</p>
                    <p className="text-sm">Search and add products above</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Addresses */}
          <Card>
            <CardHeader>
              <CardTitle>Addresses</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="billing" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="billing">Billing Address</TabsTrigger>
                  <TabsTrigger value="shipping">Shipping Address</TabsTrigger>
                </TabsList>
                <TabsContent value="billing" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="address1">Address Line 1</Label>
                      <Input
                        id="address1"
                        value={customerData.address_line1}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, address_line1: e.target.value }))}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="address2">Address Line 2</Label>
                      <Input
                        id="address2"
                        value={customerData.address_line2}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, address_line2: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={customerData.city}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        value={customerData.postal_code}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, postal_code: e.target.value }))}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="country">Country</Label>
                      <Select
                        value={customerData.country}
                        onValueChange={(value) => setCustomerData(prev => ({ ...prev, country: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Netherlands">Netherlands</SelectItem>
                          <SelectItem value="Belgium">Belgium</SelectItem>
                          <SelectItem value="Germany">Germany</SelectItem>
                          <SelectItem value="France">France</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="shipping" className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sameAsBilling"
                      checked={sameAsBilling}
                      onCheckedChange={(checked) => setSameAsBilling(checked as boolean)}
                    />
                    <Label htmlFor="sameAsBilling">Same as billing address</Label>
                  </div>
                  {!sameAsBilling && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="shippingFirstName">First Name</Label>
                        <Input
                          id="shippingFirstName"
                          value={shippingData.first_name || ""}
                          onChange={(e) => setShippingData(prev => ({ ...prev, first_name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="shippingLastName">Last Name</Label>
                        <Input
                          id="shippingLastName"
                          value={shippingData.last_name || ""}
                          onChange={(e) => setShippingData(prev => ({ ...prev, last_name: e.target.value }))}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="shippingAddress1">Address Line 1</Label>
                        <Input
                          id="shippingAddress1"
                          value={shippingData.address_line1 || ""}
                          onChange={(e) => setShippingData(prev => ({ ...prev, address_line1: e.target.value }))}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="shippingAddress2">Address Line 2</Label>
                        <Input
                          id="shippingAddress2"
                          value={shippingData.address_line2 || ""}
                          onChange={(e) => setShippingData(prev => ({ ...prev, address_line2: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="shippingCity">City</Label>
                        <Input
                          id="shippingCity"
                          value={shippingData.city || ""}
                          onChange={(e) => setShippingData(prev => ({ ...prev, city: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="shippingPostalCode">Postal Code</Label>
                        <Input
                          id="shippingPostalCode"
                          value={shippingData.postal_code || ""}
                          onChange={(e) => setShippingData(prev => ({ ...prev, postal_code: e.target.value }))}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="shippingCountry">Country</Label>
                        <Select
                          value={shippingData.country || "Netherlands"}
                          onValueChange={(value) => setShippingData(prev => ({ ...prev, country: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Netherlands">Netherlands</SelectItem>
                            <SelectItem value="Belgium">Belgium</SelectItem>
                            <SelectItem value="Germany">Germany</SelectItem>
                            <SelectItem value="France">France</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Shipping</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={shippingAmount}
                    onChange={(e) => setShippingAmount(Number(e.target.value) || 0)}
                    className="w-20 h-8 text-right"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span>Tax</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(Number(e.target.value) || 0)}
                    className="w-20 h-8 text-right"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span>Discount</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                    className="w-20 h-8 text-right"
                  />
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>€{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Order Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Order Status</Label>
                <Select value={orderStatus} onValueChange={setOrderStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Internal notes about this order..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}