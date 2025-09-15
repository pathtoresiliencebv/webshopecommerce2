import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Search, Plus, Trash2, Tag, Package } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku?: string;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address_line1?: string;
  city?: string;
  country?: string;
  postal_code?: string;
}

export default function CreateOrder() {
  const navigate = useNavigate();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [orderTags, setOrderTags] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [shippingAmount, setShippingAmount] = useState(0);

  // Fetch products for search
  const { data: products = [] } = useQuery({
    queryKey: ['products', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, sku, stock_quantity')
        .eq('organization_id', currentOrganization.id)
        .eq('is_active', true)
        .ilike('name', `%${productSearch}%`)
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization?.id
  });

  // Fetch customers for search
  const { data: customers = [] } = useQuery({
    queryKey: ['customers', currentOrganization?.id, customerSearch],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`first_name.ilike.%${customerSearch}%,last_name.ilike.%${customerSearch}%`)
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization?.id && customerSearch.length > 2
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      if (!currentOrganization?.id || !selectedCustomer) {
        throw new Error('Organization or customer not selected');
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now()}`;
      const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const totalAmount = subtotal + shippingAmount - discountAmount;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          organization_id: currentOrganization.id,
          user_id: selectedCustomer.id,
          order_number: orderNumber,
          status: 'pending',
          subtotal,
          shipping_amount: shippingAmount,
          discount_amount: discountAmount,
          total_amount: totalAmount,
          shipping_first_name: selectedCustomer.first_name,
          shipping_last_name: selectedCustomer.last_name,
          shipping_address_line1: selectedCustomer.address_line1 || '',
          shipping_city: selectedCustomer.city || '',
          shipping_postal_code: selectedCustomer.postal_code || '',
          shipping_country: selectedCustomer.country || 'Netherlands',
          billing_first_name: selectedCustomer.first_name,
          billing_last_name: selectedCustomer.last_name,
          billing_address_line1: selectedCustomer.address_line1 || '',
          billing_city: selectedCustomer.city || '',
          billing_postal_code: selectedCustomer.postal_code || '',
          billing_country: selectedCustomer.country || 'Netherlands',
          notes: orderNotes
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        product_sku: item.sku,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: () => {
      toast.success('Order created successfully');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      navigate('/admin');
    },
    onError: (error) => {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
    }
  });

  const addToCart = (product: any) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        sku: product.sku
      }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCartItems(cartItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(productId);
    } else {
      setCartItems(cartItems.map(item =>
        item.id === productId ? { ...item, quantity } : item
      ));
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + shippingAmount - discountAmount;

  const handleCreateOrder = () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }
    if (cartItems.length === 0) {
      toast.error('Please add products to the order');
      return;
    }
    
    createOrderMutation.mutate({});
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Orders
            </Button>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-xl font-semibold">Conceptbestelling aanmaken</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Product Search Sidebar - Left */}
          <div className="col-span-3">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-lg">Producten</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Producten zoeken"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="mr-2 h-4 w-4" />
                  Bladeren
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  Aangepast artikel toevoegen
                </Button>
                
                <Separator className="my-4" />
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="p-3 border rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => addToCart(product)}
                    >
                      <div className="font-medium text-sm">{product.name}</div>
                      <div className="text-xs text-muted-foreground">
                        €{product.price} • {product.sku}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Stock: {product.stock_quantity}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area - Center */}
          <div className="col-span-6 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Bestellingsartikelen</CardTitle>
              </CardHeader>
              <CardContent>
                {cartItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-2" />
                    <p>Geen artikelen toegevoegd</p>
                    <p className="text-sm">Zoek en voeg producten toe aan deze bestelling</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            €{item.price} • {item.sku}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                            className="w-20"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Billing */}
            <Card>
              <CardHeader>
                <CardTitle>Facturering</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotaal</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Korting</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    className="w-24 text-right"
                    placeholder="0.00"
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Verzending</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={shippingAmount}
                    onChange={(e) => setShippingAmount(parseFloat(e.target.value) || 0)}
                    className="w-24 text-right"
                    placeholder="0.00"
                  />
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold text-lg">
                  <span>Totaal</span>
                  <span>€{total.toFixed(2)}</span>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Notities</Label>
                  <Textarea
                    placeholder="Voeg notities toe aan deze bestelling..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Details Sidebar - Right */}
          <div className="col-span-3 space-y-4">
            {/* Customer */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Klant</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Klant zoeken"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {selectedCustomer ? (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="font-medium">
                      {selectedCustomer.first_name} {selectedCustomer.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedCustomer.phone || 'No phone'}
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setSelectedCustomer(null)}
                      className="p-0 h-auto"
                    >
                      Andere klant kiezen
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customers.map((customer) => (
                      <div
                        key={customer.id}
                        className="p-2 border rounded cursor-pointer hover:bg-muted"
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <div className="font-medium text-sm">
                          {customer.first_name} {customer.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {customer.phone || 'No phone'}
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Nieuwe klant
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Market & Currency */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label>Markten</Label>
                  <Select defaultValue="netherlands">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="netherlands">Netherlands</SelectItem>
                      <SelectItem value="belgium">Belgium</SelectItem>
                      <SelectItem value="germany">Germany</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Valuta</Label>
                  <Select defaultValue="eur">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eur">Euro EUR</SelectItem>
                      <SelectItem value="usd">US Dollar USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardContent className="pt-6">
                <Label>Tags</Label>
                <div className="relative mt-2">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tags toevoegen"
                    value={orderTags}
                    onChange={(e) => setOrderTags(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-2">
              <Button 
                onClick={handleCreateOrder}
                disabled={createOrderMutation.isPending}
                className="w-full"
              >
                {createOrderMutation.isPending ? 'Creating...' : 'Bestelling aanmaken'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/admin')}
                className="w-full"
              >
                Annuleren
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}