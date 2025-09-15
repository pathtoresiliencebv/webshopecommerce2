import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Clock, Phone } from 'lucide-react';

export function AdminLocations() {
  const locations = [
    {
      id: '1',
      name: 'Hoofdvestiging Amsterdam',
      address: 'Museumstraat 1, 1071 XX Amsterdam',
      phone: '+31 20 123 4567',
      hours: 'Ma-Vr: 9:00-18:00, Za: 10:00-17:00',
      type: 'store',
      isActive: true
    },
    {
      id: '2',
      name: 'Warehouse Rotterdam',
      address: 'Logistiekweg 25, 3045 AB Rotterdam', 
      phone: '+31 10 987 6543',
      hours: 'Ma-Vr: 8:00-17:00',
      type: 'warehouse',
      isActive: true
    }
  ];

  const getLocationBadge = (type: string) => {
    const config = {
      store: { variant: 'default' as const, label: 'Winkel' },
      warehouse: { variant: 'secondary' as const, label: 'Magazijn' },
      pickup: { variant: 'outline' as const, label: 'Ophaallocatie' }
    };
    
    const typeConfig = config[type as keyof typeof config] || config.store;
    return <Badge variant={typeConfig.variant}>{typeConfig.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Locaties</h1>
          <p className="text-muted-foreground mt-1">
            Beheer je winkels, magazijnen en ophaallocaties
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Locatie Toevoegen
        </Button>
      </div>

      {/* Location Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{locations.length}</p>
                <p className="text-sm text-muted-foreground">Totaal Locaties</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{locations.filter(l => l.type === 'store').length}</p>
                <p className="text-sm text-muted-foreground">Winkels</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{locations.filter(l => l.type === 'warehouse').length}</p>
                <p className="text-sm text-muted-foreground">Magazijnen</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Locations List */}
      <Card>
        <CardHeader>
          <CardTitle>Locatie Overzicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {locations.map((location) => (
              <div key={location.id} className="border rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{location.name}</h3>
                      {getLocationBadge(location.type)}
                      {location.isActive && <Badge variant="outline" className="text-green-600 border-green-600">Actief</Badge>}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Bewerken
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Adres</p>
                      <p className="text-muted-foreground">{location.address}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Telefoon</p>
                      <p className="text-muted-foreground">{location.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Openingstijden</p>
                      <p className="text-muted-foreground">{location.hours}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pickup Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Ophaal Instellingen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">In-store ophalen inschakelen</h4>
              <p className="text-sm text-muted-foreground">
                Klanten kunnen hun bestelling ophalen bij een van je locaties
              </p>
            </div>
            <Button variant="outline">Configureren</Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Automatische voorraadinventarisatie</h4> 
              <p className="text-sm text-muted-foreground">
                Voorraad automatisch verdelen over locaties
              </p>
            </div>
            <Button variant="outline">Instellen</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}