import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useOrganization } from '@/contexts/OrganizationContext';
import { 
  CreditCard, 
  FileText, 
  Download, 
  MapPin,
  Building,
  Mail,
  Phone
} from 'lucide-react';

export function AdminBilling() {
  const { currentOrganization } = useOrganization();
  const [billingData, setBillingData] = useState({
    company_name: currentOrganization?.name || '',
    email: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    postal_code: '',
    country: 'Netherlands',
    vat_number: '',
    tax_exempt: false
  });

  const handleInputChange = (field: string, value: string) => {
    setBillingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveBillingInfo = async () => {
    // Implementation for saving billing info
    console.log('Saving billing info:', billingData);
  };

  if (!currentOrganization) {
    return <div>Geen organisatie geselecteerd</div>;
  }

  const recentInvoices: any[] = [];

  const paymentMethods = [
    {
      id: '1',
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expires: '12/25',
      isDefault: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Factureren</h1>
        <p className="text-muted-foreground mt-1">
          Beheer je betalingsmethoden en factuurgegevens
        </p>
      </div>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Betalingsmethoden
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentMethods.map((method) => (
            <div key={method.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center text-white text-xs font-bold">
                    {method.brand.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">•••• •••• •••• {method.last4}</p>
                    <p className="text-sm text-muted-foreground">Verloopt {method.expires}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {method.isDefault && <Badge variant="secondary">Standaard</Badge>}
                  <Button variant="outline" size="sm">Bewerken</Button>
                </div>
              </div>
            </div>
          ))}
          
          <Button variant="outline" className="w-full">
            <CreditCard className="h-4 w-4 mr-2" />
            Nieuwe Betalingsmethode Toevoegen
          </Button>
        </CardContent>
      </Card>

      {/* Billing Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Factuuradres
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company_name">Bedrijfsnaam</Label>
              <Input
                id="company_name"
                value={billingData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="vat_number">BTW Nummer</Label>
              <Input
                id="vat_number"
                value={billingData.vat_number}
                onChange={(e) => handleInputChange('vat_number', e.target.value)}
                placeholder="NL123456789B01"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={billingData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefoon</Label>
              <Input
                id="phone"
                value={billingData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address_line1">Adres</Label>
            <Input
              id="address_line1"
              value={billingData.address_line1}
              onChange={(e) => handleInputChange('address_line1', e.target.value)}
              placeholder="Straatnaam en huisnummer"
            />
          </div>

          <div>
            <Label htmlFor="address_line2">Adres regel 2 (optioneel)</Label>
            <Input
              id="address_line2"
              value={billingData.address_line2}
              onChange={(e) => handleInputChange('address_line2', e.target.value)}
              placeholder="Appartement, suite, etc."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="postal_code">Postcode</Label>
              <Input
                id="postal_code"
                value={billingData.postal_code}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="city">Stad</Label>
              <Input
                id="city"
                value={billingData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="country">Land</Label>
              <Input
                id="country"
                value={billingData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
              />
            </div>
          </div>

          <Button onClick={saveBillingInfo} className="w-full">
            Factuurgegevens Opslaan
          </Button>
        </CardContent>
      </Card>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recente Facturen
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentInvoices.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nog geen facturen</h3>
              <p>Je facturen verschijnen hier zodra je een betaald abonnement hebt.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{invoice.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.period} • {new Date(invoice.date).toLocaleDateString('nl-NL')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">{invoice.amount}</p>
                      <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                        {invoice.status === 'paid' ? 'Betaald' : 'Open'}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}