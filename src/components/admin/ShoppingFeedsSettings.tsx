/**
 * SHOPPING FEEDS SETTINGS
 * Admin UI for managing Google Shopping, Facebook, TikTok feeds
 */

import React, { useState, useEffect } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  ShoppingCart, Copy, ExternalLink, RefreshCw, 
  Loader2, Check, AlertCircle 
} from 'lucide-react';

interface ShoppingFeed {
  id: string;
  platform: string;
  feed_name: string;
  feed_url?: string;
  is_active: boolean;
  auto_update: boolean;
  update_frequency: string;
  last_generated_at?: string;
  total_products: number;
}

export function ShoppingFeedsSettings() {
  const { store, tenantDb } = useStore();
  const [feeds, setFeeds] = useState<ShoppingFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    if (tenantDb && store) {
      loadFeeds();
    }
  }, [tenantDb, store]);

  const loadFeeds = async () => {
    try {
      if (!tenantDb) return;

      const { data, error } = await tenantDb
        .from('shopping_feeds')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFeeds(data || []);
    } catch (error) {
      console.error('Error loading feeds:', error);
      toast.error('Failed to load shopping feeds');
    } finally {
      setLoading(false);
    }
  };

  const createFeed = async (platform: string) => {
    if (!store || !tenantDb) return;

    try {
      const feedName = `${store.name} ${platform.charAt(0).toUpperCase() + platform.slice(1)} Feed`;

      const { data, error } = await tenantDb
        .from('shopping_feeds')
        .insert({
          platform,
          feed_name: feedName,
          is_active: false,
          auto_update: true,
          update_frequency: 'daily',
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`${platform} feed created!`);
      await loadFeeds();
      
      // Generate feed immediately
      await generateFeed(data.id, platform);
    } catch (error: any) {
      console.error('Error creating feed:', error);
      toast.error(error.message || 'Failed to create feed');
    }
  };

  const generateFeed = async (feedId: string, platform: string) => {
    if (!store) return;

    setGenerating(feedId);

    try {
      const { data, error } = await supabase.functions.invoke('generate-shopping-feed', {
        body: {
          organizationId: store.id,
          feedId,
          platform,
        },
      });

      if (error) throw error;

      toast.success(`Feed generated! ${data.productsCount} products`);
      await loadFeeds();
    } catch (error: any) {
      console.error('Error generating feed:', error);
      toast.error(error.message || 'Failed to generate feed');
    } finally {
      setGenerating(null);
    }
  };

  const toggleFeedActive = async (feedId: string, isActive: boolean) => {
    if (!tenantDb) return;

    try {
      const { error } = await tenantDb
        .from('shopping_feeds')
        .update({ is_active: isActive })
        .eq('id', feedId);

      if (error) throw error;

      toast.success(isActive ? 'Feed activated' : 'Feed deactivated');
      await loadFeeds();
    } catch (error) {
      console.error('Error toggling feed:', error);
      toast.error('Failed to update feed');
    }
  };

  const copyFeedUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Feed URL copied to clipboard!');
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'google_shopping':
        return '🛒';
      case 'facebook':
      case 'instagram':
        return '📘';
      case 'tiktok':
        return '🎵';
      case 'pinterest':
        return '📌';
      default:
        return '📦';
    }
  };

  const platformFeeds = {
    google_shopping: feeds.find(f => f.platform === 'google_shopping'),
    facebook: feeds.find(f => f.platform === 'facebook'),
    tiktok: feeds.find(f => f.platform === 'tiktok'),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Shopping Feeds</h2>
        <p className="text-muted-foreground">
          Automatically sync your products to advertising platforms
        </p>
      </div>

      {/* Google Shopping */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{getPlatformIcon('google_shopping')}</div>
              <div>
                <CardTitle>Google Shopping</CardTitle>
                <CardDescription>XML feed for Google Merchant Center</CardDescription>
              </div>
            </div>
            {platformFeeds.google_shopping?.is_active && (
              <Badge className="bg-green-500">Active</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!platformFeeds.google_shopping ? (
            <Button onClick={() => createFeed('google_shopping')}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Create Google Shopping Feed
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Feed Active</Label>
                <Switch
                  checked={platformFeeds.google_shopping.is_active}
                  onCheckedChange={(checked) => toggleFeedActive(platformFeeds.google_shopping!.id, checked)}
                />
              </div>

              {platformFeeds.google_shopping.feed_url && (
                <div className="space-y-2">
                  <Label>Feed URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={platformFeeds.google_shopping.feed_url}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyFeedUrl(platformFeeds.google_shopping!.feed_url!)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(platformFeeds.google_shopping!.feed_url!, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Products in feed</span>
                <Badge variant="outline">{platformFeeds.google_shopping.total_products || 0}</Badge>
              </div>

              {platformFeeds.google_shopping.last_generated_at && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last generated</span>
                  <span>{new Date(platformFeeds.google_shopping.last_generated_at).toLocaleString()}</span>
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => generateFeed(platformFeeds.google_shopping!.id, 'google_shopping')}
                disabled={generating === platformFeeds.google_shopping.id}
              >
                {generating === platformFeeds.google_shopping.id ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><RefreshCw className="w-4 h-4 mr-2" /> Regenerate Feed</>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Similar cards for Facebook and TikTok... */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{getPlatformIcon('facebook')}</div>
              <div>
                <CardTitle>Facebook & Instagram</CardTitle>
                <CardDescription>CSV feed for Facebook Catalog</CardDescription>
              </div>
            </div>
            {platformFeeds.facebook?.is_active && (
              <Badge className="bg-green-500">Active</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!platformFeeds.facebook ? (
            <Button onClick={() => createFeed('facebook')}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Create Facebook Feed
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Feed Active</Label>
                <Switch
                  checked={platformFeeds.facebook.is_active}
                  onCheckedChange={(checked) => toggleFeedActive(platformFeeds.facebook!.id, checked)}
                />
              </div>
              {/* Similar content as Google Shopping */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
