import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@/contexts/OrganizationContext';
import { MapPin, Plus, Clock, Phone, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function AdminLocations() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: '',
    address_line1: '',
    city: '',
    postal_code: '',
    phone: '',
    is_warehouse: false,
    is_pickup_location: false
  });

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['locations', currentOrganization?.id],
    queryFn: async () => {
      // For now return mock data until database migration is approved and run
      return [
        {
          id: '1',
          name: 'Hoofdvestiging Amsterdam',
          address_line1: 'Museumstraat 1',
          city: 'Amsterdam',
          postal_code: '1071 XX',
          phone: '+31 20 123 4567',
          is_warehouse: false,
          is_pickup_location: true,
          is_active: true,
          type: 'store',
          address: 'Museumstraat 1, 1071 XX Amsterdam',
          hours: 'Ma-Vr: 9:00-18:00, Za: 10:00-17:00'
        },
        {
          id: '2',
          name: 'Warehouse Rotterdam',
          address_line1: 'Logistiekweg 25',
          city: 'Rotterdam',
          postal_code: '3045 AB',
          phone: '+31 10 987 6543',
          is_warehouse: true,
          is_pickup_location: false,
          is_active: true,
          type: 'warehouse',
          address: 'Logistiekweg 25, 3045 AB Rotterdam',
          hours: 'Ma-Vr: 8:00-17:00'
        }
      ];
    },
    enabled: !!currentOrganization?.id
  });

  const addLocationMutation = useMutation({
    mutationFn: async () => {
      // Mock implementation until database migration is approved
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({
        title: "Locatie toegevoegd",
        description: "De nieuwe locatie is succesvol aangemaakt"
      });
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setAddDialogOpen(false);
      setNewLocation({
        name: '',
        address_line1: '',
        city: '',
        postal_code: '',
        phone: '',
        is_warehouse: false,
        is_pickup_location: false
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Kon locatie niet toevoegen",
        variant: "destructive"
      });
    }
  });

  const getLocationBadge = (type: string) => {
    const config = {
      store: { variant: 'default' as const, label: 'Winkel' },
      warehouse: { variant: 'secondary' as const, label: 'Magazijn' },
      pickup: { variant: 'outline' as const, label: 'Ophaallocatie' }
    };
    
    const typeConfig = config[type as keyof typeof config] || config.store;
    return <Badge variant={typeConfig.variant}>{typeConfig.label}</Badge>;
  };

  if (!currentOrganization) {
    return <div className="text-center py-8">Geen organisatie geselecteerd</div>;
  }

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
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Locatie Toevoegen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nieuwe Locatie Toevoegen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Naam</Label>
                <Input 
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
                  placeholder="Winkel Amsterdam"
                />
              </div>
              <div>
                <Label>Adres</Label>
                <Input 
                  value={newLocation.address_line1}
                  onChange={(e) => setNewLocation({...newLocation, address_line1: e.target.value})}
                  placeholder="Straatnaam 123"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Stad</Label>
                  <Input 
                    value={newLocation.city}
                    onChange={(e) => setNewLocation({...newLocation, city: e.target.value})}
                    placeholder="Amsterdam"
                  />
                </div>
                <div>
                  <Label>Postcode</Label>
                  <Input 
                    value={newLocation.postal_code}
                    onChange={(e) => setNewLocation({...newLocation, postal_code: e.target.value})}
                    placeholder="1000 AB"
                  />
                </div>
              </div>
              <div>
                <Label>Telefoon</Label>
                <Input 
                  value={newLocation.phone}
                  onChange={(e) => setNewLocation({...newLocation, phone: e.target.value})}
                  placeholder="+31 20 123 4567"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="warehouse"
                    checked={newLocation.is_warehouse}
                    onChange={(e) => setNewLocation({...newLocation, is_warehouse: e.target.checked})}
                  />
                  <Label htmlFor="warehouse">Magazijn</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="pickup"
                    checked={newLocation.is_pickup_location}
                    onChange={(e) => setNewLocation({...newLocation, is_pickup_location: e.target.checked})}
                  />
                  <Label htmlFor="pickup">Ophaallocatie</Label>
                </div>
              </div>
              <Button 
                onClick={() => addLocationMutation.mutate()}
                disabled={!newLocation.name || !newLocation.address_line1 || addLocationMutation.isPending}
                className="w-full"
              >
                {addLocationMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Toevoegen...</>
                ) : (
                  'Locatie Toevoegen'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2" />
              <p>Nog geen locaties toegevoegd</p>
            </div>
          ) : (
            <div className="space-y-4">
              {locations.map((location) => (
                <div key={location.id} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{location.name}</h3>
                        {getLocationBadge(location.type)}
                        {location.is_active && <Badge variant="outline" className="text-green-600 border-green-600">Actief</Badge>}
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
          )}
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