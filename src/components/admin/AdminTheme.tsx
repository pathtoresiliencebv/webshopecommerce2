import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Palette, Monitor, Settings, Eye, ExternalLink } from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ThemeSettings {
  id?: string;
  organization_id: string;
  theme_name: string;
  is_active: boolean;
  appearance_settings: any;
  seo_settings: any;
}

export function AdminTheme() {
  const { currentOrganization } = useOrganization();
  const [themeSettings, setThemeSettings] = useState<ThemeSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchThemeSettings();
    }
  }, [currentOrganization?.id]);

  const fetchThemeSettings = async () => {
    if (!currentOrganization?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('theme_settings')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setThemeSettings(data);
      } else {
        // Create default theme settings
        const defaultTheme = {
          organization_id: currentOrganization.id,
          theme_name: `${currentOrganization.name || 'Store'} 1.0`,
          is_active: true,
          appearance_settings: {},
          seo_settings: {}
        };

        const { data: newTheme, error: createError } = await supabase
          .from('theme_settings')
          .insert(defaultTheme)
          .select()
          .single();

        if (createError) throw createError;
        setThemeSettings(newTheme);
      }
    } catch (error) {
      console.error('Error fetching theme settings:', error);
      toast.error('Fout bij laden van thema-instellingen');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Thema</h1>
          <p className="text-muted-foreground">Beheer je store thema en verschijning</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            Preview Store
          </Button>
          <Button variant="outline">
            <ExternalLink className="mr-2 h-4 w-4" />
            Bezoek Store
          </Button>
        </div>
      </div>

      {/* Current Theme */}
      <Card>
        <CardHeader>
          <CardTitle>Huidig thema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              {/* Theme Screenshot */}
              <div className="relative">
                <div className="w-48 h-32 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border flex items-center justify-center">
                  <div className="text-center">
                    <Monitor className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Homepage Preview</p>
                  </div>
                </div>
                <Badge className="absolute -top-2 -right-2 bg-green-500 hover:bg-green-600">
                  Actief
                </Badge>
              </div>

              {/* Theme Info */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  {themeSettings?.theme_name || `${currentOrganization?.name || 'Store'} 1.0`}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Aangepast op {new Date().toLocaleDateString('nl-NL')}
                </p>
                <div className="flex gap-2 mt-4">
                  <Button size="sm">
                    <Palette className="mr-2 h-4 w-4" />
                    Customize
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Instellingen
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Library */}
      <Card>
        <CardHeader>
          <CardTitle>Thema Library</CardTitle>
          <p className="text-sm text-muted-foreground">
            Kies uit professionele thema's voor je store
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <div className="text-center">
              <Monitor className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Thema library komt binnenkort</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}