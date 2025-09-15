import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { 
  Rss, 
  Globe, 
  ShoppingBag, 
  Zap, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Plus, 
  Settings, 
  Download,
  RefreshCw,
  ExternalLink
} from "lucide-react";

const feeds: any[] = [];
const platforms: any[] = [];
const errors: any[] = [];

export function AdminShoppingFeeds() {
  const [syncProgress, setSyncProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Actief
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Fout
          </Badge>
        );
      case "paused":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Gepauzeerd
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    return (
      <Badge variant={severity === "error" ? "destructive" : "secondary"}>
        {severity === "error" ? "Kritiek" : "Waarschuwing"}
      </Badge>
    );
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncProgress(0);
    
    // Simulate sync progress
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSyncing(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shopping Feeds</h1>
          <p className="text-muted-foreground">
            Beheer product feeds voor verschillende shopping platforms
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Synchroniseren...' : 'Sync Alle Feeds'}
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nieuwe Feed
          </Button>
        </div>
      </div>

      {/* Sync Progress */}
      {isSyncing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Feeds synchroniseren...</span>
                <span>{syncProgress}%</span>
              </div>
              <Progress value={syncProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actieve Feeds</CardTitle>
            <Rss className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Geen feeds geconfigureerd</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Producten in Feeds</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Geen producten geëxporteerd</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Impressions</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Afgelopen 30 dagen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feed Fouten</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Geen fouten</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="feeds" className="space-y-4">
        <TabsList>
          <TabsTrigger value="feeds">Feed Overzicht</TabsTrigger>
          <TabsTrigger value="platforms">Platform Integraties</TabsTrigger>
          <TabsTrigger value="errors">Fouten & Waarschuwingen</TabsTrigger>
          <TabsTrigger value="settings">Instellingen</TabsTrigger>
        </TabsList>

        <TabsContent value="feeds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Feeds</CardTitle>
              <CardDescription>Overzicht van alle geconfigureerde shopping feeds</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feed Naam</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Producten</TableHead>
                    <TableHead>Laatste Sync</TableHead>
                    <TableHead>Frequentie</TableHead>
                    <TableHead>Fouten</TableHead>
                    <TableHead>Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeds.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                        Geen shopping feeds geconfigureerd
                      </TableCell>
                    </TableRow>
                  ) : (
                    feeds.map((feed) => (
                      <TableRow key={feed.id}>
                        <TableCell className="font-medium">{feed.name}</TableCell>
                        <TableCell>{feed.platform}</TableCell>
                        <TableCell>{getStatusBadge(feed.status)}</TableCell>
                        <TableCell>{feed.products.toLocaleString()}</TableCell>
                        <TableCell>{feed.lastSync}</TableCell>
                        <TableCell>{feed.syncFrequency}</TableCell>
                        <TableCell>
                          {feed.errors > 0 ? (
                            <Badge variant="destructive">{feed.errors}</Badge>
                          ) : (
                            <Badge variant="secondary">0</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-4">
          {platforms.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center">
                <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Geen platform integraties</h3>
                <p className="text-muted-foreground mb-4">
                  Verbind met shopping platforms om je producten te promoten
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Platform Verbinden
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {platforms.map((platform) => (
                <Card key={platform.name}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <platform.icon className="h-5 w-5" />
                        <CardTitle className="text-lg">{platform.name}</CardTitle>
                      </div>
                      <Switch checked={platform.connected} />
                    </div>
                    <CardDescription>{platform.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {platform.connected ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Producten:</span>
                          <span className="font-medium">{platform.products}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Clicks:</span>
                          <span className="font-medium">{platform.clicks.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Impressions:</span>
                          <span className="font-medium">{platform.impressions.toLocaleString()}</span>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-4">
                          <Settings className="h-4 w-4 mr-2" />
                          Configureren
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Nog niet verbonden
                        </p>
                        <Button size="sm" className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Verbinden
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fouten & Waarschuwingen</CardTitle>
              <CardDescription>Problemen die aandacht vereisen in je product feeds</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Feed</TableHead>
                    <TableHead>Fout Beschrijving</TableHead>
                    <TableHead>Ernst</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Geen fouten gevonden
                      </TableCell>
                    </TableRow>
                  ) : (
                    errors.map((error) => (
                      <TableRow key={error.id}>
                        <TableCell className="font-medium">{error.product}</TableCell>
                        <TableCell>{error.feed}</TableCell>
                        <TableCell>{error.error}</TableCell>
                        <TableCell>{getSeverityBadge(error.severity)}</TableCell>
                        <TableCell>{error.date}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              Oplossen
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feed Instellingen</CardTitle>
              <CardDescription>Algemene instellingen voor product feeds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Automatische synchronisatie</label>
                    <p className="text-xs text-muted-foreground">
                      Feeds automatisch synchroniseren volgens schema
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Standaard sync frequentie</label>
                  <select className="w-full p-2 border rounded-md">
                    <option>Elke uur</option>
                    <option>Elke 6 uur</option>
                    <option>Dagelijks</option>
                    <option>Wekelijks</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Base Feed URL</label>
                  <Input 
                    defaultValue="https://feeds.aurelio.nl/" 
                    placeholder="https://feeds.example.com/"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">E-mail notificaties bij fouten</label>
                    <p className="text-xs text-muted-foreground">
                      Ontvang een e-mail wanneer een feed fouten bevat
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="pt-4">
                <Button>Instellingen Opslaan</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}