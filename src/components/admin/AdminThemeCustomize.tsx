import { useState, useEffect } from "react";
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
  Save,
  ArrowLeft,
  Upload,
  X
} from "lucide-react";
import type { AdminSection } from "@/pages/Admin";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminThemeCustomizeProps {
  onSectionChange: (section: AdminSection) => void;
}

interface ThemeSettings {
  // Appearance settings
  logo_url?: string;
  store_name?: string;
  tagline?: string;
  primary_color?: string;
  font_family?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_image_url?: string;
  show_featured_products?: boolean;
  show_newsletter_signup?: boolean;
  
  // SEO settings
  site_title?: string;
  site_description?: string;
  keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image_url?: string;
  xml_sitemap_enabled?: boolean;
  robots_txt_enabled?: boolean;
  structured_data_enabled?: boolean;
}

export function AdminThemeCustomize({ onSectionChange }: AdminThemeCustomizeProps) {
  const { currentOrganization } = useOrganization();
  const [settings, setSettings] = useState<ThemeSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Load existing theme settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (!currentOrganization?.id) return;

      try {
        const { data, error } = await supabase
          .from('theme_settings')
          .select('appearance_settings, seo_settings')
          .eq('organization_id', currentOrganization.id)
          .eq('is_active', true)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const appearance = (data.appearance_settings as any) || {};
          const seo = (data.seo_settings as any) || {};
          
          setSettings({
            ...(typeof appearance === 'object' && appearance !== null ? appearance : {}),
            ...(typeof seo === 'object' && seo !== null ? seo : {})
          });
        }
      } catch (error) {
        console.error('Error fetching theme settings:', error);
        toast.error('Failed to load theme settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [currentOrganization?.id]);

  // Save theme settings
  const saveSettings = async () => {
    if (!currentOrganization?.id) return;

    setSaving(true);
    try {
      const appearanceSettings = {
        logo_url: settings.logo_url,
        store_name: settings.store_name,
        tagline: settings.tagline,
        primary_color: settings.primary_color,
        font_family: settings.font_family,
        hero_title: settings.hero_title,
        hero_subtitle: settings.hero_subtitle,
        hero_image_url: settings.hero_image_url,
        show_featured_products: settings.show_featured_products,
        show_newsletter_signup: settings.show_newsletter_signup
      };

      const seoSettings = {
        site_title: settings.site_title,
        site_description: settings.site_description,
        keywords: settings.keywords,
        og_title: settings.og_title,
        og_description: settings.og_description,
        og_image_url: settings.og_image_url,
        xml_sitemap_enabled: settings.xml_sitemap_enabled,
        robots_txt_enabled: settings.robots_txt_enabled,
        structured_data_enabled: settings.structured_data_enabled
      };

      const { error } = await supabase
        .from('theme_settings')
        .upsert({
          organization_id: currentOrganization.id,
          theme_name: 'Custom Theme',
          appearance_settings: appearanceSettings,
          seo_settings: seoSettings,
          is_active: true
        });

      if (error) throw error;

      toast.success('Theme settings saved successfully');
    } catch (error) {
      console.error('Error saving theme settings:', error);
      toast.error('Failed to save theme settings');
    } finally {
      setSaving(false);
    }
  };

  // Upload image to storage
  const uploadImage = async (file: File, path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${currentOrganization?.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('theme-assets')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('theme-assets')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  // Handle logo upload
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) return;
      
      const file = event.target.files[0];
      const logoUrl = await uploadImage(file, 'logo');
      
      setSettings(prev => ({ ...prev, logo_url: logoUrl }));
      toast.success('Logo uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload logo');
      console.error('Error uploading logo:', error);
    } finally {
      setUploading(false);
    }
  };

  // Handle hero image upload
  const handleHeroImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) return;
      
      const file = event.target.files[0];
      const heroImageUrl = await uploadImage(file, 'hero');
      
      setSettings(prev => ({ ...prev, hero_image_url: heroImageUrl }));
      toast.success('Hero image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload hero image');
      console.error('Error uploading hero image:', error);
    } finally {
      setUploading(false);
    }
  };

  // Handle OG image upload
  const handleOgImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) return;
      
      const file = event.target.files[0];
      const ogImageUrl = await uploadImage(file, 'og-image');
      
      setSettings(prev => ({ ...prev, og_image_url: ogImageUrl }));
      toast.success('Social media image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload social media image');
      console.error('Error uploading OG image:', error);
    } finally {
      setUploading(false);
    }
  };

  const updateSetting = (key: keyof ThemeSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-muted-foreground">Loading theme settings...</div>
      </div>
    );
  }
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onSectionChange('theme')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug naar Thema
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Thema Aanpassen</h1>
            <p className="text-muted-foreground">Pas de verschijning en SEO van je thema aan</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            Preview Store
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
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
                    <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                      {settings.logo_url ? (
                        <img 
                          src={settings.logo_url} 
                          alt="Logo" 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-sm font-medium">Logo</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" asChild disabled={uploading}>
                        <label htmlFor="logo-upload" className="cursor-pointer">
                          <Upload className="mr-2 h-4 w-4" />
                          {uploading ? 'Uploading...' : 'Upload Logo'}
                        </label>
                      </Button>
                      {settings.logo_url && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateSetting('logo_url', '')}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      )}
                    </div>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="store-name">Store Name</Label>
                  <Input 
                    id="store-name" 
                    value={settings.store_name || ''} 
                    onChange={(e) => updateSetting('store_name', e.target.value)}
                    placeholder="Enter store name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input 
                    id="tagline" 
                    value={settings.tagline || ''} 
                    onChange={(e) => updateSetting('tagline', e.target.value)}
                    placeholder="Enter tagline"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-10 w-16 rounded border"
                      style={{ backgroundColor: settings.primary_color || '#000000' }}
                    ></div>
                    <Input 
                      id="primary-color" 
                      value={settings.primary_color || '#000000'} 
                      onChange={(e) => updateSetting('primary_color', e.target.value)}
                      className="flex-1" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="font">Font Family</Label>
                  <Select 
                    value={settings.font_family || 'figtree'}
                    onValueChange={(value) => updateSetting('font_family', value)}
                  >
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
                  <Input 
                    id="hero-title" 
                    value={settings.hero_title || ''} 
                    onChange={(e) => updateSetting('hero_title', e.target.value)}
                    placeholder="Enter hero title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero-subtitle">Hero Subtitle</Label>
                  <Textarea 
                    id="hero-subtitle" 
                    value={settings.hero_subtitle || ''} 
                    onChange={(e) => updateSetting('hero_subtitle', e.target.value)}
                    rows={3}
                    placeholder="Enter hero subtitle"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero-image">Hero Image</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-24 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                      {settings.hero_image_url ? (
                        <img 
                          src={settings.hero_image_url} 
                          alt="Hero" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs">Hero</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" asChild disabled={uploading}>
                        <label htmlFor="hero-image-upload" className="cursor-pointer">
                          <Upload className="mr-2 h-4 w-4" />
                          {uploading ? 'Uploading...' : 'Change Image'}
                        </label>
                      </Button>
                      {settings.hero_image_url && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateSetting('hero_image_url', '')}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      )}
                    </div>
                    <input
                      id="hero-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleHeroImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Featured Products</Label>
                    <p className="text-xs text-muted-foreground">Display featured products section on homepage</p>
                  </div>
                  <Switch 
                    checked={settings.show_featured_products ?? true}
                    onCheckedChange={(checked) => updateSetting('show_featured_products', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Newsletter Signup</Label>
                    <p className="text-xs text-muted-foreground">Display newsletter subscription form</p>
                  </div>
                  <Switch 
                    checked={settings.show_newsletter_signup ?? true}
                    onCheckedChange={(checked) => updateSetting('show_newsletter_signup', checked)}
                  />
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
                  <Input 
                    id="site-title" 
                    value={settings.site_title || ''} 
                    onChange={(e) => updateSetting('site_title', e.target.value)}
                    placeholder="Enter site title"
                  />
                  <p className="text-xs text-muted-foreground">Appears in browser tabs and search results</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="site-description">Site Description</Label>
                  <Textarea 
                    id="site-description" 
                    value={settings.site_description || ''} 
                    onChange={(e) => updateSetting('site_description', e.target.value)}
                    rows={3}
                    placeholder="Enter site description"
                  />
                  <p className="text-xs text-muted-foreground">Meta description for your homepage (max 160 characters)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">Focus Keywords</Label>
                  <Input 
                    id="keywords" 
                    value={settings.keywords || ''} 
                    onChange={(e) => updateSetting('keywords', e.target.value)}
                    placeholder="Enter keywords separated by commas"
                  />
                  <p className="text-xs text-muted-foreground">Comma-separated keywords</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Open Graph & Social Media</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="og-title">Social Media Title</Label>
                  <Input 
                    id="og-title" 
                    value={settings.og_title || ''} 
                    onChange={(e) => updateSetting('og_title', e.target.value)}
                    placeholder="Enter social media title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="og-description">Social Media Description</Label>
                  <Textarea 
                    id="og-description" 
                    value={settings.og_description || ''} 
                    onChange={(e) => updateSetting('og_description', e.target.value)}
                    rows={2}
                    placeholder="Enter social media description"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Social Media Image</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-24 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                      {settings.og_image_url ? (
                        <img 
                          src={settings.og_image_url} 
                          alt="OG Image" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs">OG Image</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" asChild disabled={uploading}>
                        <label htmlFor="og-image-upload" className="cursor-pointer">
                          <Upload className="mr-2 h-4 w-4" />
                          {uploading ? 'Uploading...' : 'Upload Image'}
                        </label>
                      </Button>
                      {settings.og_image_url && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateSetting('og_image_url', '')}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      )}
                    </div>
                    <input
                      id="og-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleOgImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
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
                  <Switch 
                    checked={settings.xml_sitemap_enabled ?? true}
                    onCheckedChange={(checked) => updateSetting('xml_sitemap_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Robots.txt</Label>
                    <p className="text-xs text-muted-foreground">Allow search engines to crawl your site</p>
                  </div>
                  <Switch 
                    checked={settings.robots_txt_enabled ?? true}
                    onCheckedChange={(checked) => updateSetting('robots_txt_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Structured Data</Label>
                    <p className="text-xs text-muted-foreground">Add JSON-LD schema markup for products</p>
                  </div>
                  <Switch 
                    checked={settings.structured_data_enabled ?? true}
                    onCheckedChange={(checked) => updateSetting('structured_data_enabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}