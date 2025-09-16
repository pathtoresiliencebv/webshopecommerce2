import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Languages, Globe, Plus, Settings, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const availableLanguages = [
  { code: 'nl', name: 'Nederlands', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'en', name: 'Engels', nativeName: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Duits', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Frans', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Spaans', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italiaans', nativeName: 'Italiano', flag: '🇮🇹' }
];

export function AdminLanguages() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('');

  const { data: languages = [], isLoading } = useQuery({
    queryKey: ['language-settings', currentOrganization?.id],
    queryFn: async () => {
      // For now return mock data until database migration is approved and run
      return [
        {
          id: '1',
          language_code: 'nl',
          name: 'Nederlands',
          nativeName: 'Nederlands',
          flag: '🇳🇱',
          is_default: true,
          is_active: true,
          completeness: 100
        },
        {
          id: '2',
          language_code: 'en',
          name: 'Engels',
          nativeName: 'English',
          flag: '🇬🇧',
          is_default: false,
          is_active: true,
          completeness: 85
        }
      ];
    },
    enabled: !!currentOrganization?.id
  });

  const addLanguageMutation = useMutation({
    mutationFn: async () => {
      // Mock implementation until database migration is approved
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({
        title: "Taal toegevoegd",
        description: "De nieuwe taal is succesvol toegevoegd"
      });
      queryClient.invalidateQueries({ queryKey: ['language-settings'] });
      setAddDialogOpen(false);
      setSelectedLanguage('');
    }
  });

  const toggleLanguageMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string, isActive: boolean }) => {
      // Mock implementation until database migration is approved
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['language-settings'] });
    }
  });

  const getCompletenessBadge = (completeness: number) => {
    if (completeness === 100) return <Badge variant="default">Compleet</Badge>;
    if (completeness >= 80) return <Badge variant="secondary">Bijna compleet</Badge>;
    if (completeness >= 50) return <Badge variant="outline">In uitvoering</Badge>;
    return <Badge variant="destructive">Niet gestart</Badge>;
  };

  if (!currentOrganization) {
    return <div className="text-center py-8">Geen organisatie geselecteerd</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Talen</h1>
          <p className="text-muted-foreground mt-1">
            Beheer meertalige ondersteuning voor je store
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Taal Toevoegen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nieuwe Taal Toevoegen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Selecteer taal</label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kies een taal" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLanguages
                      .filter(lang => !languages.some(l => l.language_code === lang.code))
                      .map(lang => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <div className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <span>{lang.name} ({lang.nativeName})</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => addLanguageMutation.mutate()}
                disabled={!selectedLanguage || addLanguageMutation.isPending}
                className="w-full"
              >
                {addLanguageMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Toevoegen...</>
                ) : (
                  'Taal Toevoegen'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Language Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Languages className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{languages.filter(l => l.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Actieve Talen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Globe className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{languages.filter(l => l.completeness === 100).length}</p>
                <p className="text-sm text-muted-foreground">Complete Vertalingen</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Settings className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{languages.filter(l => l.completeness < 100 && l.is_active).length}</p>
                <p className="text-sm text-muted-foreground">In Bewerking</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Languages List */}
      <Card>
        <CardHeader>
          <CardTitle>Beschikbare Talen</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : languages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Languages className="h-8 w-8 mx-auto mb-2" />
              <p>Nog geen talen geconfigureerd</p>
            </div>
          ) : (
            <div className="space-y-4">
              {languages.map((language) => (
                <div key={language.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{language.flag}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{language.name}</p>
                        <span className="text-sm text-muted-foreground">({language.nativeName})</span>
                        {language.is_default && <Badge variant="default">Standaard</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        {getCompletenessBadge(language.completeness)}
                        <span className="text-sm text-muted-foreground">
                          {language.completeness}% compleet
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Actief</span>
                      <Switch 
                        checked={language.is_active}
                        disabled={language.is_default}
                        onCheckedChange={(checked) => 
                          toggleLanguageMutation.mutate({ id: language.id, isActive: checked })
                        }
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      Bewerken
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Translation Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Vertaal Instellingen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Automatische URL vertaling</h4>
              <p className="text-sm text-muted-foreground">
                Genereer automatisch vertaalde URLs voor elke taal
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Taal detectie via browser</h4>
              <p className="text-sm text-muted-foreground">
                Detecteer automatisch de voorkeurstaal van bezoekers
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">SEO per taal</h4>
              <p className="text-sm text-muted-foreground">
                Aparte meta titels en beschrijvingen per taal
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Translation Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Vertaal Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Bulk Vertaling</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Vertaal meerdere producten of pagina's tegelijk
              </p>
              <Button variant="outline" size="sm">
                Starten
              </Button>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Ontbrekende Vertalingen</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Bekijk welke content nog vertaald moet worden
              </p>
              <Button variant="outline" size="sm">
                Bekijken
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}