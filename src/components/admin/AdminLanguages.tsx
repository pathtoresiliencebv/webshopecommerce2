import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Languages, Globe, Plus, Settings } from 'lucide-react';

export function AdminLanguages() {
  const languages = [
    {
      code: 'nl',
      name: 'Nederlands',
      nativeName: 'Nederlands',
      flag: '🇳🇱',
      isDefault: true,
      isActive: true,
      completeness: 100
    },
    {
      code: 'en',
      name: 'Engels',
      nativeName: 'English',
      flag: '🇬🇧',
      isDefault: false,
      isActive: true,
      completeness: 85
    },
    {
      code: 'de',
      name: 'Duits',
      nativeName: 'Deutsch',
      flag: '🇩🇪',
      isDefault: false,
      isActive: false,
      completeness: 60
    },
    {
      code: 'fr',
      name: 'Frans',
      nativeName: 'Français',
      flag: '🇫🇷',
      isDefault: false,
      isActive: false,
      completeness: 45
    }
  ];

  const getCompletenessBadge = (completeness: number) => {
    if (completeness === 100) return <Badge variant="default">Compleet</Badge>;
    if (completeness >= 80) return <Badge variant="secondary">Bijna compleet</Badge>;
    if (completeness >= 50) return <Badge variant="outline">In uitvoering</Badge>;
    return <Badge variant="destructive">Niet gestart</Badge>;
  };

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
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Taal Toevoegen
        </Button>
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
                <p className="text-2xl font-bold">{languages.filter(l => l.isActive).length}</p>
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
                <p className="text-2xl font-bold">{languages.filter(l => l.completeness < 100 && l.isActive).length}</p>
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
          <div className="space-y-4">
            {languages.map((language) => (
              <div key={language.code} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{language.flag}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{language.name}</p>
                      <span className="text-sm text-muted-foreground">({language.nativeName})</span>
                      {language.isDefault && <Badge variant="default">Standaard</Badge>}
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
                      checked={language.isActive}
                      disabled={language.isDefault}
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    Bewerken
                  </Button>
                </div>
              </div>
            ))}
          </div>
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