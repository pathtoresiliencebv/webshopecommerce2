import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  ExternalLink,
  Copy
} from "lucide-react";

interface ShoppingFeed {
  id: string;
  platform: 'google' | 'facebook' | 'tiktok';
  is_active: boolean;
  last_sync_at: string | null;
  product_count: number;
  error_count: number;
  config: any;
  created_at: string;
}

interface FeedStats {
  activeFeeds: number;
  totalProducts: number;
  totalErrors: number;
}

export function AdminShoppingFeeds() {
  const { currentOrganization } = useOrganization();
  const [feeds, setFeeds] = useState<ShoppingFeed[]>([]);
  const [stats, setStats] = useState<FeedStats>({ activeFeeds: 0, totalProducts: 0, totalErrors: 0 });
  const [syncProgress, setSyncProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');

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

  useEffect(() => {
    if (currentOrganization) {
      fetchFeeds();
    }
  }, [currentOrganization]);

  const fetchFeeds = async () => {
    if (!currentOrganization) return;
    
    try {
      const { data: feedsData, error: feedsError } = await supabase
        .from('shopping_feeds')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (feedsError) throw feedsError;

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('organization_id', currentOrganization.id)
        .eq('is_active', true);

      if (productsError) throw productsError;

      setFeeds(feedsData as ShoppingFeed[] || []);
      setStats({
        activeFeeds: feedsData?.filter(f => f.is_active).length || 0,
        totalProducts: productsData?.length || 0,
        totalErrors: feedsData?.reduce((sum, f) => sum + f.error_count, 0) || 0
      });
    } catch (error) {
      console.error('Error fetching feeds:', error);
      toast.error('Fout bij laden van feeds');
    } finally {
      setLoading(false);
    }
  };

  const createFeed = async () => {
    if (!currentOrganization || !selectedPlatform) return;

    try {
      const { error } = await supabase
        .from('shopping_feeds')
        .insert({
          organization_id: currentOrganization.id,
          platform: selectedPlatform,
          is_active: true,
          config: {}
        });

      if (error) throw error;

      toast.success(`${selectedPlatform.toUpperCase()} feed aangemaakt`);
      setShowCreateDialog(false);
      setSelectedPlatform('');
      fetchFeeds();
    } catch (error) {
      console.error('Error creating feed:', error);
      toast.error('Fout bij aanmaken feed');
    }
  };

  const toggleFeed = async (feedId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('shopping_feeds')
        .update({ is_active: !isActive })
        .eq('id', feedId);

      if (error) throw error;

      toast.success(isActive ? 'Feed gepauzeerd' : 'Feed geactiveerd');
      fetchFeeds();
    } catch (error) {
      console.error('Error toggling feed:', error);
      toast.error('Fout bij wijzigen feed status');
    }
  };

  const handleSync = async (feedId?: string) => {
    if (!currentOrganization) return;
    
    setIsSyncing(true);
    setSyncProgress(0);
    
    try {
      const feedsToSync = feedId ? feeds.filter(f => f.id === feedId) : feeds.filter(f => f.is_active);
      
      for (let i = 0; i < feedsToSync.length; i++) {
        const feed = feedsToSync[i];
        const format = feed.platform === 'google' ? 'xml' : 'csv';
        
        // Call the edge function to generate/sync the feed
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-shopping-feed/${currentOrganization.slug}/${feed.platform}-shopping.${format}`, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Feed sync failed for ${feed.platform}`);
        }
        
        setSyncProgress(((i + 1) / feedsToSync.length) * 100);
      }
      
      toast.success('Feeds succesvol gesynchroniseerd');
      fetchFeeds();
    } catch (error) {
      console.error('Error syncing feeds:', error);
      toast.error('Fout bij synchroniseren van feeds');
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  };

  const getFeedUrl = (platform: string) => {
    if (!currentOrganization) return '';
    
    const format = platform === 'google' ? 'xml' : 'csv';
    const domain = currentOrganization.domain || `${currentOrganization.subdomain || currentOrganization.slug}.aurelioliving.nl`;
    
    return `https://${domain}/${platform}-shopping.${format}`;
  };

  const copyFeedUrl = (platform: string) => {
    const url = getFeedUrl(platform);
    navigator.clipboard.writeText(url);
    toast.success('Feed URL gekopieerd');
  };

  const platformIcons = {
    google: Globe,
    facebook: Globe,
    tiktok: Zap
  };

  const platformNames = {
    google: 'Google Shopping',
    facebook: 'Facebook Catalog',
    tiktok: 'TikTok Shop'
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Laden...</div>;
  }

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
          <Button variant="outline" onClick={() => handleSync()} disabled={isSyncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Synchroniseren...' : 'Sync Alle Feeds'}
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nieuwe Feed
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nieuwe Shopping Feed</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google Shopping</SelectItem>
                      <SelectItem value="facebook">Facebook Catalog</SelectItem>
                      <SelectItem value="tiktok">TikTok Shop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Annuleren
                </Button>
                <Button onClick={createFeed} disabled={!selectedPlatform}>
                  Feed Aanmaken
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
            <div className="text-2xl font-bold">{stats.activeFeeds}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeFeeds === 0 ? 'Geen feeds geconfigureerd' : 'Actieve feeds'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Producten in Feeds</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalProducts === 0 ? 'Geen producten beschikbaar' : 'Beschikbare producten'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Impressions</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Nog niet beschikbaar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feed Fouten</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalErrors}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalErrors === 0 ? 'Geen fouten' : 'Fouten gevonden'}
            </p>
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
                    <TableHead>Platform</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Feed URL</TableHead>
                    <TableHead>Producten</TableHead>
                    <TableHead>Laatste Sync</TableHead>
                    <TableHead>Fouten</TableHead>
                    <TableHead>Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeds.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        Geen shopping feeds geconfigureerd. Klik op "Nieuwe Feed" om te beginnen.
                      </TableCell>
                    </TableRow>
                  ) : (
                    feeds.map((feed) => {
                      const IconComponent = platformIcons[feed.platform];
                      return (
                        <TableRow key={feed.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              {platformNames[feed.platform]}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(feed.is_active ? 'active' : 'paused')}
                              <Switch 
                                checked={feed.is_active} 
                                onCheckedChange={() => toggleFeed(feed.id, feed.is_active)}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 max-w-xs">
                              <span className="text-sm truncate">{getFeedUrl(feed.platform)}</span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => copyFeedUrl(feed.platform)}
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>{feed.product_count || stats.totalProducts}</TableCell>
                          <TableCell>
                            {feed.last_sync_at 
                              ? new Date(feed.last_sync_at).toLocaleDateString('nl-NL')
                              : 'Nog niet gesynchroniseerd'
                            }
                          </TableCell>
                          <TableCell>
                            {feed.error_count > 0 ? (
                              <Badge variant="destructive">{feed.error_count}</Badge>
                            ) : (
                              <Badge variant="secondary">0</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleSync(feed.id)}
                                disabled={isSyncing}
                              >
                                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => window.open(getFeedUrl(feed.platform), '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(['google', 'facebook', 'tiktok'] as const).map((platform) => {
              const IconComponent = platformIcons[platform];
              const feed = feeds.find(f => f.platform === platform);
              const isConnected = !!feed;
              
              return (
                <Card key={platform}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <IconComponent className="h-5 w-5" />
                        <CardTitle className="text-lg">{platformNames[platform]}</CardTitle>
                      </div>
                      <Switch 
                        checked={isConnected && feed.is_active} 
                        onCheckedChange={() => {
                          if (isConnected) {
                            toggleFeed(feed.id, feed.is_active);
                          }
                        }}
                        disabled={!isConnected}
                      />
                    </div>
                    <CardDescription>
                      {platform === 'google' && 'Exporteer producten naar Google Shopping'}
                      {platform === 'facebook' && 'Sync producten met Facebook Catalog'}
                      {platform === 'tiktok' && 'Promoot producten op TikTok Shop'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isConnected ? (
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Feed URL:</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => copyFeedUrl(platform)}
                            className="h-auto p-0 text-xs"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Kopiëren
                          </Button>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Producten:</span>
                          <span className="font-medium">{feed.product_count || stats.totalProducts}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Laatste sync:</span>
                          <span className="font-medium">
                            {feed.last_sync_at 
                              ? new Date(feed.last_sync_at).toLocaleDateString('nl-NL')
                              : 'Nog niet'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Fouten:</span>
                          <span className="font-medium">{feed.error_count || 0}</span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleSync(feed.id)}
                            disabled={isSyncing}
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                            Sync
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(getFeedUrl(platform), '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Nog niet geconfigureerd
                        </p>
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            setSelectedPlatform(platform);
                            setShowCreateDialog(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Feed Aanmaken
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
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
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      {stats.totalErrors === 0 
                        ? 'Geen fouten gevonden - alle feeds werken correct!' 
                        : 'Foutdetails worden binnenkort beschikbaar gesteld'
                      }
                    </TableCell>
                  </TableRow>
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
                    value={currentOrganization?.domain 
                      ? `https://${currentOrganization.domain}/`
                      : `https://${currentOrganization?.subdomain || currentOrganization?.slug}.aurelioliving.nl/`
                    }
                    placeholder="https://feeds.example.com/"
                    readOnly
                  />
                  <p className="text-xs text-muted-foreground">
                    Feed URLs worden automatisch gegenereerd op basis van jouw domein
                  </p>
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