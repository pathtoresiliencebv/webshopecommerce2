import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Palette, 
  Monitor, 
  CreditCard, 
  Truck, 
  Globe, 
  ShoppingBag,
  Eye,
  Save
} from "lucide-react";

export function AdminOnlineStore() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Online Store</h1>
          <p className="text-muted-foreground">Customize your store appearance and settings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            Preview Store
          </Button>
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Theme Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Theme & Branding
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logo">Store Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-sm font-medium">Logo</span>
                    </div>
                    <Button variant="outline" size="sm">Upload Logo</Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="store-name">Store Name</Label>
                  <Input id="store-name" defaultValue="FurniStore" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input id="tagline" defaultValue="Premium Office Furniture" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-16 bg-primary rounded border"></div>
                    <Input id="primary-color" defaultValue="#000000" className="flex-1" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="font">Font Family</Label>
                  <Select defaultValue="figtree">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="figtree">Figtree</SelectItem>
                      <SelectItem value="inter">Inter</SelectItem>
                      <SelectItem value="poppins">Poppins</SelectItem>
                      <SelectItem value="dm-sans">DM Sans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Homepage Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Homepage Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hero-title">Hero Title</Label>
                  <Input id="hero-title" defaultValue="Modern Workspace, Maximum Productivity" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero-subtitle">Hero Subtitle</Label>
                  <Textarea 
                    id="hero-subtitle" 
                    defaultValue="Discover our premium collection of office furniture. From ergonomic chairs to high-quality desks - everything for the perfect workplace."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero-image">Hero Image</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-24 bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-xs">Hero</span>
                    </div>
                    <Button variant="outline" size="sm">Change Image</Button>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Featured Products</Label>
                    <p className="text-xs text-muted-foreground">Display featured products section on homepage</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Newsletter Signup</Label>
                    <p className="text-xs text-muted-foreground">Display newsletter subscription form</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Stripe</p>
                        <p className="text-xs text-muted-foreground">Credit & Debit Cards</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">PP</span>
                      </div>
                      <div>
                        <p className="font-medium">PayPal</p>
                        <p className="text-xs text-muted-foreground">PayPal & Pay Later</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold text-green-600">iD</span>
                      </div>
                      <div>
                        <p className="font-medium">iDEAL</p>
                        <p className="text-xs text-muted-foreground">Dutch Bank Transfer</p>
                      </div>
                    </div>
                    <Switch />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Payment Settings</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select defaultValue="eur">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eur">EUR - Euro</SelectItem>
                        <SelectItem value="usd">USD - US Dollar</SelectItem>
                        <SelectItem value="gbp">GBP - British Pound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                    <Input id="tax-rate" defaultValue="21" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-calculate taxes</Label>
                      <p className="text-xs text-muted-foreground">Automatically calculate taxes based on location</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Tab */}
        <TabsContent value="shipping" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium">Standard Shipping</p>
                      <p className="text-xs text-muted-foreground">5-7 business days</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Price</Label>
                      <Input defaultValue="€9.99" />
                    </div>
                    <div className="space-y-2">
                      <Label>Free shipping threshold</Label>
                      <Input defaultValue="€100" />
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium">Express Shipping</p>
                      <p className="text-xs text-muted-foreground">1-2 business days</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Price</Label>
                      <Input defaultValue="€19.99" />
                    </div>
                    <div className="space-y-2">
                      <Label>Free shipping threshold</Label>
                      <Input defaultValue="€200" />
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium">Local Pickup</p>
                      <p className="text-xs text-muted-foreground">Available at store location</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="space-y-2">
                    <Label>Pickup Address</Label>
                    <Textarea defaultValue="123 Main Street, Amsterdam, Netherlands" rows={2} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Store Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="store-url">Store URL</Label>
                  <Input id="store-url" defaultValue="furnistore.com" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-email">Contact Email</Label>
                  <Input id="contact-email" defaultValue="info@furnistore.com" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" defaultValue="+1 555 123 4567" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Business Address</Label>
                  <Textarea id="address" defaultValue="123 Main Street, Amsterdam, Netherlands" rows={3} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="europe/amsterdam">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="europe/amsterdam">Europe/Amsterdam</SelectItem>
                      <SelectItem value="america/new_york">America/New_York</SelectItem>
                      <SelectItem value="america/los_angeles">America/Los_Angeles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Store Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Store Status</Label>
                    <p className="text-xs text-muted-foreground">Make store accessible to customers</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Guest Checkout</Label>
                    <p className="text-xs text-muted-foreground">Let customers checkout without account</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Reviews</Label>
                    <p className="text-xs text-muted-foreground">Allow customers to leave product reviews</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">Send order confirmation emails</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Inventory Tracking</Label>
                    <p className="text-xs text-muted-foreground">Track product stock levels</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Low Stock Alerts</Label>
                    <p className="text-xs text-muted-foreground">Get notified when stock is low</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}