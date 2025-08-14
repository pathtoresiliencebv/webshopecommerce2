import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, MapPin, CreditCard, ShoppingBag } from "lucide-react";

interface CustomerFormProps {
  customer?: any;
  onSave: (customer: any) => void;
  onCancel: () => void;
}

export function CustomerForm({ customer, onSave, onCancel }: CustomerFormProps) {
  const [formData, setFormData] = useState({
    firstName: customer?.firstName || "",
    lastName: customer?.lastName || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    status: customer?.status || "active",
    notes: customer?.notes || "",
    billingAddress: {
      street: customer?.billingAddress?.street || "",
      city: customer?.billingAddress?.city || "",
      postalCode: customer?.billingAddress?.postalCode || "",
      country: customer?.billingAddress?.country || "Netherlands"
    },
    shippingAddress: {
      street: customer?.shippingAddress?.street || "",
      city: customer?.shippingAddress?.city || "",
      postalCode: customer?.shippingAddress?.postalCode || "",
      country: customer?.shippingAddress?.country || "Netherlands"
    },
    marketingConsent: customer?.marketingConsent ?? true,
    isVip: customer?.isVip ?? false
  });

  const [sameAsBilling, setSameAsBilling] = useState(true);

  const handleSave = () => {
    const customerData = {
      ...formData,
      shippingAddress: sameAsBilling ? formData.billingAddress : formData.shippingAddress
    };
    onSave(customerData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{customer ? 'Edit Customer' : 'Add New Customer'}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave}>Save Customer</Button>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="customer@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+31 6 12345678"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Customer Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any internal notes about this customer"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Billing Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="billing-street">Street Address</Label>
                  <Input
                    id="billing-street"
                    value={formData.billingAddress.street}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      billingAddress: { ...prev.billingAddress, street: e.target.value }
                    }))}
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="billing-city">City</Label>
                    <Input
                      id="billing-city"
                      value={formData.billingAddress.city}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        billingAddress: { ...prev.billingAddress, city: e.target.value }
                      }))}
                      placeholder="Amsterdam"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-postal">Postal Code</Label>
                    <Input
                      id="billing-postal"
                      value={formData.billingAddress.postalCode}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        billingAddress: { ...prev.billingAddress, postalCode: e.target.value }
                      }))}
                      placeholder="1012 AB"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billing-country">Country</Label>
                  <Select 
                    value={formData.billingAddress.country} 
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      billingAddress: { ...prev.billingAddress, country: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Netherlands">Netherlands</SelectItem>
                      <SelectItem value="Germany">Germany</SelectItem>
                      <SelectItem value="Belgium">Belgium</SelectItem>
                      <SelectItem value="France">France</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="same-as-billing"
                    checked={sameAsBilling}
                    onChange={(e) => setSameAsBilling(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="same-as-billing">Same as billing address</Label>
                </div>

                {!sameAsBilling && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="shipping-street">Street Address</Label>
                      <Input
                        id="shipping-street"
                        value={formData.shippingAddress.street}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          shippingAddress: { ...prev.shippingAddress, street: e.target.value }
                        }))}
                        placeholder="123 Main Street"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="shipping-city">City</Label>
                        <Input
                          id="shipping-city"
                          value={formData.shippingAddress.city}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            shippingAddress: { ...prev.shippingAddress, city: e.target.value }
                          }))}
                          placeholder="Amsterdam"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shipping-postal">Postal Code</Label>
                        <Input
                          id="shipping-postal"
                          value={formData.shippingAddress.postalCode}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            shippingAddress: { ...prev.shippingAddress, postalCode: e.target.value }
                          }))}
                          placeholder="1012 AB"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shipping-country">Country</Label>
                      <Select 
                        value={formData.shippingAddress.country} 
                        onValueChange={(value) => setFormData(prev => ({
                          ...prev,
                          shippingAddress: { ...prev.shippingAddress, country: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Netherlands">Netherlands</SelectItem>
                          <SelectItem value="Germany">Germany</SelectItem>
                          <SelectItem value="Belgium">Belgium</SelectItem>
                          <SelectItem value="France">France</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Customer Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Marketing Consent</Label>
                  <p className="text-xs text-muted-foreground">Allow sending marketing emails and newsletters</p>
                </div>
                <Switch
                  checked={formData.marketingConsent}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, marketingConsent: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>VIP Customer</Label>
                  <p className="text-xs text-muted-foreground">Mark as VIP for special treatment and offers</p>
                </div>
                <Switch
                  checked={formData.isVip}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVip: checked }))}
                />
              </div>

              {customer && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Customer Statistics</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold">{customer.orders || 0}</div>
                      <div className="text-xs text-muted-foreground">Total Orders</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold">{customer.totalSpent || "€0"}</div>
                      <div className="text-xs text-muted-foreground">Total Spent</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold">{customer.lastOrder || "Never"}</div>
                      <div className="text-xs text-muted-foreground">Last Order</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}