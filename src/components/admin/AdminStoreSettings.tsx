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
  CreditCard, 
  Truck, 
  ShoppingBag,
  Save
} from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StoreSettings {
  general?: any;
  payments?: any;
  shipping?: any;
}

export function AdminStoreSettings() {
  const { currentOrganization } = useOrganization();
  const [settings, setSettings] = useState<StoreSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchSettings();
    }
  }, [currentOrganization?.id]);

  const fetchSettings = async () => {
    if (!currentOrganization?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('organization_id', currentOrganization.id);

      if (error) throw error;

      const settingsObj: StoreSettings = {};
      data?.forEach(setting => {
        settingsObj[setting.setting_type as keyof StoreSettings] = setting.settings;
      });

      setSettings(settingsObj);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Fout bij laden van instellingen');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!currentOrganization?.id) return;
    
    setSaving(true);
    try {
      // Save each setting type
      for (const [type, data] of Object.entries(settings)) {
        await supabase
          .from('store_settings')
          .upsert({
            organization_id: currentOrganization.id,
            setting_type: type,
            settings: data || {}
          });
      }

      toast.success('Instellingen opgeslagen');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Fout bij opslaan van instellingen');
    } finally {
      setSaving(false);
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
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Beheer store instellingen en configuratie</p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Opslaan...' : 'Wijzigingen Opslaan'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">Algemeen</TabsTrigger>
          <TabsTrigger value="payments">Betalingen</TabsTrigger>
          <TabsTrigger value="shipping">Verzending</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Store Informatie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="store-name">Store Naam</Label>
                    <Input 
                      id="store-name" 
                      defaultValue={currentOrganization?.name || ''} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="store-description">Beschrijving</Label>
                    <Textarea 
                      id="store-description" 
                      defaultValue={currentOrganization?.description || ''} 
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Contact E-mail</Label>
                    <Input 
                      id="contact-email" 
                      type="email" 
                      defaultValue="" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefoonnummer</Label>
                    <Input 
                      id="phone" 
                      defaultValue="" 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Bedrijfsadres</Label>
                    <Textarea 
                      id="address" 
                      defaultValue=""
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Tijdzone</Label>
                    <Select defaultValue="Europe/Amsterdam">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Amsterdam">Europe/Amsterdam</SelectItem>
                        <SelectItem value="Europe/London">Europe/London</SelectItem>
                        <SelectItem value="Europe/Berlin">Europe/Berlin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Valuta</Label>
                    <Select defaultValue="EUR">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Betaalmethodes
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
                  <h3 className="font-medium">Betalingsinstellingen</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tax-rate">BTW Tarief (%)</Label>
                    <Input id="tax-rate" defaultValue="21" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-berekening BTW</Label>
                      <p className="text-xs text-muted-foreground">Automatisch BTW berekenen op basis van locatie</p>
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
                Verzendopties
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium">Standaard Verzending</p>
                      <p className="text-xs text-muted-foreground">5-7 werkdagen</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Prijs</Label>
                      <Input defaultValue="€9.99" />
                    </div>
                    <div className="space-y-2">
                      <Label>Gratis verzending vanaf</Label>
                      <Input defaultValue="€100" />
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium">Express Verzending</p>
                      <p className="text-xs text-muted-foreground">1-2 werkdagen</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Prijs</Label>
                      <Input defaultValue="€19.99" />
                    </div>
                    <div className="space-y-2">
                      <Label>Gratis verzending vanaf</Label>
                      <Input defaultValue="€200" />
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium">Afhalen in Store</p>
                      <p className="text-xs text-muted-foreground">Beschikbaar op winkellocatie</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="space-y-2">
                    <Label>Afhaaladres</Label>
                    <Textarea defaultValue="" rows={2} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}