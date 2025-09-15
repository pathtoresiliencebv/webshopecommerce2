import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Settings, Store, Globe } from 'lucide-react';

export function AdminGeneralSettings() {
  const { currentOrganization, updateOrganization } = useOrganization();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website_url: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    postal_code: '',
    country: 'Netherlands',
    timezone: 'Europe/Amsterdam',
    currency: 'EUR'
  });

  useEffect(() => {
    if (currentOrganization) {
      setFormData({
        name: currentOrganization.name || '',
        description: currentOrganization.description || '',
        website_url: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        postal_code: '',
        country: 'Netherlands',
        timezone: 'Europe/Amsterdam',
        currency: 'EUR'
      });
    }
  }, [currentOrganization]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveSettings = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    try {
      await updateOrganization(currentOrganization.id, formData);
      toast({
        title: "Instellingen opgeslagen",
        description: "De store instellingen zijn succesvol bijgewerkt.",
      });
    } catch (error: any) {
      toast({
        title: "Fout bij opslaan",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentOrganization) {
    return <div>Geen organisatie geselecteerd</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Algemene Instellingen</h1>
        <p className="text-muted-foreground mt-1">
          Beheer je store basis informatie en instellingen
        </p>
      </div>

      {/* Store Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Store Informatie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Store Naam</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Bijv. Aurélio Living"
            />
          </div>

          <div>
            <Label htmlFor="description">Beschrijving</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Korte beschrijving van je store..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="website_url">Website URL</Label>
            <Input
              id="website_url"
              value={formData.website_url}
              onChange={(e) => handleInputChange('website_url', e.target.value)}
              placeholder="https://www.example.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Informatie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="phone">Telefoon</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+31 6 12345678"
            />
          </div>

          <div>
            <Label htmlFor="address_line1">Adres</Label>
            <Input
              id="address_line1"
              value={formData.address_line1}
              onChange={(e) => handleInputChange('address_line1', e.target.value)}
              placeholder="Straatnaam en huisnummer"
            />
          </div>

          <div>
            <Label htmlFor="address_line2">Adres regel 2 (optioneel)</Label>
            <Input
              id="address_line2"
              value={formData.address_line2}
              onChange={(e) => handleInputChange('address_line2', e.target.value)}
              placeholder="Appartement, suite, etc."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="postal_code">Postcode</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                placeholder="1234 AB"
              />
            </div>
            <div>
              <Label htmlFor="city">Stad</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Amsterdam"
              />
            </div>
            <div>
              <Label htmlFor="country">Land</Label>
              <Select
                value={formData.country}
                onValueChange={(value) => handleInputChange('country', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Netherlands">Nederland</SelectItem>
                  <SelectItem value="Belgium">België</SelectItem>
                  <SelectItem value="Germany">Duitsland</SelectItem>
                  <SelectItem value="France">Frankrijk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regional Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Regionale Instellingen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="timezone">Tijdzone</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => handleInputChange('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Amsterdam">Europa/Amsterdam</SelectItem>
                  <SelectItem value="Europe/Brussels">Europa/Brussel</SelectItem>
                  <SelectItem value="Europe/Berlin">Europa/Berlijn</SelectItem>
                  <SelectItem value="Europe/Paris">Europa/Parijs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="currency">Valuta</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => handleInputChange('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                  <SelectItem value="USD">US Dollar ($)</SelectItem>
                  <SelectItem value="GBP">British Pound (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={loading}>
          {loading ? 'Opslaan...' : 'Instellingen Opslaan'}
        </Button>
      </div>
    </div>
  );
}