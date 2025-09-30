/**
 * ADMIN THEMES - SHOPIFY-STYLE THEME EXPORT/IMPORT
 * Complete theme management system with export, import, and marketplace
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useStore } from '@/contexts/StoreContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Download,
  Upload,
  Save,
  Eye,
  Share2,
  Sparkles,
  Palette,
  Type,
  Layout,
  Loader2,
  Check,
  Star,
  ExternalLink
} from 'lucide-react';

interface ThemeConfig {
  name: string;
  version?: string;
  description?: string;
  category?: string;
  colors: Record<string, string>;
  typography: {
    headingFont: string;
    bodyFont: string;
    fontSize?: Record<string, string>;
    fontWeight?: Record<string, number>;
    lineHeight?: Record<string, number>;
  };
  layout: {
    borderRadius: string;
    maxWidth: string;
    containerPadding?: string;
    spacing?: Record<string, string>;
  };
  components?: any;
  animations?: any;
  custom_css?: string;
  metadata?: any;
}

interface ThemeTemplate {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  theme_config: ThemeConfig;
  preview_image_url?: string;
  is_public: boolean;
  download_count: number;
  rating: number;
}

export function AdminThemes() {
  const { store, tenantDb } = useStore();
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig | null>(null);
  const [templates, setTemplates] = useState<ThemeTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ThemeTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  // Load theme templates from database
  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('theme_templates')
        .select('*')
        .eq('is_public', true)
        .order('download_count', { ascending: false });

      if (error) throw error;

      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  // 1. CAPTURE CURRENT THEME
  const captureCurrentTheme = async () => {
    setLoading(true);

    try {
      // Get computed CSS variables from DOM
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);

      const capturedTheme: ThemeConfig = {
        name: `${store?.name} Theme`,
        version: '1.0.0',
        description: `Custom theme for ${store?.name}`,
        category: 'custom',
        colors: {
          primary: computedStyle.getPropertyValue('--primary').trim() || '#000000',
          secondary: computedStyle.getPropertyValue('--secondary').trim() || '#666666',
          accent: computedStyle.getPropertyValue('--accent').trim() || '#FF6B6B',
          background: computedStyle.getPropertyValue('--background').trim() || '#FFFFFF',
          surface: '#F5F5F5',
          text: '#1A1A1A',
          textSecondary: '#666666',
          border: '#E5E5E5',
        },
        typography: {
          headingFont: 'Inter',
          bodyFont: 'Inter',
          fontSize: {
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
          },
        },
        layout: {
          borderRadius: '0.5rem',
          maxWidth: '1280px',
          containerPadding: '1rem',
        },
        metadata: {
          capturedAt: new Date().toISOString(),
          store: store?.name,
        },
      };

      setCurrentTheme(capturedTheme);
      toast.success('Thema vastgelegd!');
    } catch (error) {
      console.error('Theme capture error:', error);
      toast.error('Fout bij vastleggen thema');
    } finally {
      setLoading(false);
    }
  };

  // 2. EXPORT AS FILE
  const exportTheme = async () => {
    const theme = currentTheme || (await captureCurrentTheme(), currentTheme);
    if (!theme) return;

    setExporting(true);

    try {
      // Create downloadable JSON file
      const themeData = {
        ...theme,
        metadata: {
          ...theme.metadata,
          exportedFrom: store?.name,
          exportedAt: new Date().toISOString(),
          platform: 'Aurelio Multi-Store',
        },
      };

      const blob = new Blob([JSON.stringify(themeData, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${store?.slug}-theme-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('✅ Thema geëxporteerd! Je kunt dit bestand delen voor verbetering.');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Fout bij exporteren thema');
    } finally {
      setExporting(false);
    }
  };

  // 3. IMPORT THEME FROM FILE
  const importTheme = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);

    try {
      const text = await file.text();
      const importedTheme: ThemeConfig = JSON.parse(text);

      // Validate theme structure
      if (!importedTheme.colors || !importedTheme.typography) {
        throw new Error('Ongeldig thema bestand - mist verplichte velden');
      }

      setCurrentTheme(importedTheme);
      toast.success('✅ Thema geïmporteerd! Preview beschikbaar.');
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || 'Fout bij importeren thema');
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // 4. APPLY TEMPLATE
  const applyTemplate = (template: ThemeTemplate) => {
    setCurrentTheme(template.theme_config as ThemeConfig);
    setSelectedTemplate(template);
    toast.success(`Template "${template.name}" geladen!`);
  };

  // 5. SAVE/PUBLISH TO MARKETPLACE
  const publishTemplate = async () => {
    if (!currentTheme) return;

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('theme_templates')
        .insert({
          name: currentTheme.name,
          slug: currentTheme.name.toLowerCase().replace(/\s+/g, '-'),
          description: currentTheme.description || `Custom theme from ${store?.name}`,
          category: currentTheme.category || 'custom',
          theme_config: currentTheme,
          is_public: false, // Can be made public later
          organization_id: store?.id,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('✅ Template opgeslagen in bibliotheek!');
      loadTemplates();
    } catch (error: any) {
      console.error('Publish error:', error);
      toast.error(error.message || 'Fout bij publiceren template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Thema's</h1>
          <p className="text-muted-foreground mt-1">
            Exporteer, importeer en beheer thema's voor {store?.name}
          </p>
        </div>
        <Button onClick={captureCurrentTheme} disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Eye className="w-4 h-4 mr-2" />
          )}
          Huidig Thema Vastleggen
        </Button>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Huidig Thema</TabsTrigger>
          <TabsTrigger value="templates">Thema Templates</TabsTrigger>
          <TabsTrigger value="import">Importeren</TabsTrigger>
        </TabsList>

        {/* CURRENT THEME TAB */}
        <TabsContent value="current" className="space-y-4">
          {currentTheme ? (
            <>
              {/* Theme Preview Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        {currentTheme.name}
                      </CardTitle>
                      <CardDescription>{currentTheme.description}</CardDescription>
                    </div>
                    {selectedTemplate && (
                      <Badge variant="secondary">
                        Template: {selectedTemplate.name}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Colors */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Palette className="w-4 h-4" />
                      <Label className="font-semibold">Kleuren</Label>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(currentTheme.colors).map(([name, color]) => (
                        <div key={name} className="text-center">
                          <div
                            className="w-16 h-16 rounded-lg border-2 border-border shadow-sm"
                            style={{ backgroundColor: color }}
                          />
                          <p className="text-xs mt-1 font-medium capitalize">{name}</p>
                          <p className="text-xs text-muted-foreground">{color}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Typography */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Type className="w-4 h-4" />
                      <Label className="font-semibold">Typografie</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-muted-foreground">Heading Font</Label>
                        <p className="font-medium">{currentTheme.typography.headingFont}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Body Font</Label>
                        <p className="font-medium">{currentTheme.typography.bodyFont}</p>
                      </div>
                    </div>
                  </div>

                  {/* Layout */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Layout className="w-4 h-4" />
                      <Label className="font-semibold">Layout</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-muted-foreground">Border Radius</Label>
                        <p className="font-medium">{currentTheme.layout.borderRadius}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Max Width</Label>
                        <p className="font-medium">{currentTheme.layout.maxWidth}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button onClick={exportTheme} variant="outline" disabled={exporting}>
                      {exporting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Exporteren als JSON
                    </Button>
                    <Button onClick={publishTemplate} variant="outline" disabled={loading}>
                      {loading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Opslaan in Bibliotheek
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    💡 Hoe te gebruiken
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    <li>Klik op "Exporteren als JSON" om het thema te downloaden</li>
                    <li>Deel het .json bestand met AI of developers voor verbetering</li>
                    <li>Vraag bijv: "Maak dit professioneler met betere kleuren en typografie"</li>
                    <li>Upload het verbeterde bestand via de "Importeren" tab</li>
                    <li>Klik op "Opslaan in Bibliotheek" om het thema te bewaren</li>
                  </ol>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Palette className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Geen thema vastgelegd
                </p>
                <Button onClick={captureCurrentTheme}>
                  <Eye className="w-4 h-4 mr-2" />
                  Huidig Thema Vastleggen
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TEMPLATES TAB */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {template.description}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {template.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Color Preview */}
                  <div className="flex gap-1">
                    {Object.entries((template.theme_config as ThemeConfig).colors)
                      .slice(0, 6)
                      .map(([name, color]) => (
                        <div
                          key={name}
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: color }}
                          title={name}
                        />
                      ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {template.download_count} downloads
                    </div>
                    {template.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {template.rating.toFixed(1)}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <Button
                    onClick={() => applyTemplate(template)}
                    variant="outline"
                    className="w-full"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Selecteer Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {templates.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Geen templates beschikbaar</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* IMPORT TAB */}
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Thema Importeren
              </CardTitle>
              <CardDescription>
                Upload een .json thema bestand om te importeren
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 hover:border-primary transition-colors">
                <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                <Label
                  htmlFor="theme-upload"
                  className="text-center cursor-pointer"
                >
                  <span className="text-primary font-medium">
                    Klik om een bestand te selecteren
                  </span>
                  <br />
                  <span className="text-sm text-muted-foreground">
                    of sleep een .json bestand hierheen
                  </span>
                </Label>
                <Input
                  id="theme-upload"
                  type="file"
                  accept=".json"
                  onChange={importTheme}
                  className="hidden"
                  disabled={importing}
                />
              </div>

              {importing && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importeren...
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
