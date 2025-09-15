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
          <h1 className="text-3xl font-bold text-foreground">Thema Aanpassen</h1>
          <p className="text-muted-foreground">Pas de verschijning en SEO van je thema aan</p>
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="appearance">Verschijning</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
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

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                SEO Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Global SEO</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="site-title">Site Title</Label>
                  <Input id="site-title" defaultValue="FurniStore - Premium Office Furniture" />
                  <p className="text-xs text-muted-foreground">Appears in browser tabs and search results</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="site-description">Site Description</Label>
                  <Textarea 
                    id="site-description" 
                    defaultValue="Discover premium office furniture for modern workspaces. Ergonomic chairs, standing desks, and storage solutions."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">Meta description for your homepage (max 160 characters)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">Focus Keywords</Label>
                  <Input id="keywords" defaultValue="office furniture, ergonomic chairs, standing desks, workspace solutions" />
                  <p className="text-xs text-muted-foreground">Comma-separated keywords</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Open Graph & Social Media</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="og-title">Social Media Title</Label>
                  <Input id="og-title" defaultValue="FurniStore - Premium Office Furniture" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="og-description">Social Media Description</Label>
                  <Textarea 
                    id="og-description" 
                    defaultValue="Transform your workspace with our premium office furniture collection."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Social Media Image</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-24 bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-xs">OG Image</span>
                    </div>
                    <Button variant="outline" size="sm">Upload Image</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Recommended size: 1200x630px</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Technical SEO</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>XML Sitemap</Label>
                    <p className="text-xs text-muted-foreground">Automatically generate and submit sitemap</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Robots.txt</Label>
                    <p className="text-xs text-muted-foreground">Allow search engines to crawl your site</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Structured Data</Label>
                    <p className="text-xs text-muted-foreground">Add JSON-LD schema markup for products</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}