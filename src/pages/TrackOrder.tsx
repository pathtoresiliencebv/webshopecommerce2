/**
 * TRACK ORDER PAGE
 * Global Track & Trace with Store Branding
 * Shows order tracking with dynamic store logo and branding
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useStoreBranding } from '@/hooks/useStoreBranding';
import { 
  Package, Search, MapPin, Truck, CheckCircle, Clock,
  Calendar, ExternalLink, Mail, Phone 
} from 'lucide-react';
import { toast } from 'sonner';

interface TrackingEvent {
  id: string;
  status: string;
  description: string;
  location: string;
  timestamp: string;
}

interface OrderTracking {
  tracking_number: string;
  carrier_code: string;
  status: string;
  sub_status: string;
  estimated_delivery: string;
  events: TrackingEvent[];
  order_number: string;
  store: {
    name: string;
    logo_url: string;
    email: string;
    phone: string;
    website_url: string;
  };
}

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const initialTracking = searchParams.get('tracking') || '';
  
  const [trackingNumber, setTrackingNumber] = useState(initialTracking);
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<OrderTracking | null>(null);
  const branding = useStoreBranding();

  const searchTracking = async () => {
    if (!trackingNumber.trim()) {
      toast.error('Please enter a tracking number');
      return;
    }

    setLoading(true);

    try {
      // Search for order in central database
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          organization:organizations(
            name,
            logo_url,
            email,
            phone,
            website_url
          )
        `)
        .eq('tracking_number', trackingNumber.trim())
        .single();

      if (error || !order) {
        toast.error('Tracking number not found');
        setTrackingData(null);
        return;
      }

      // Mock tracking events (integrate with Track123 API later)
      const mockEvents: TrackingEvent[] = [
        {
          id: '1',
          status: 'DELIVERED',
          description: 'Package delivered',
          location: 'Amsterdam, Netherlands',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          status: 'OUT_FOR_DELIVERY',
          description: 'Out for delivery',
          location: 'Amsterdam Distribution Center',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          status: 'IN_TRANSIT',
          description: 'Package in transit',
          location: 'Rotterdam Hub',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
      ];

      setTrackingData({
        tracking_number: order.tracking_number,
        carrier_code: order.carrier_code || 'PostNL',
        status: order.status || 'IN_TRANSIT',
        sub_status: order.sub_status || 'Processing',
        estimated_delivery: order.estimated_delivery || new Date(Date.now() + 172800000).toISOString(),
        events: mockEvents,
        order_number: order.order_number,
        store: {
          name: order.organization?.name || 'Store',
          logo_url: order.organization?.logo_url || branding.logo,
          email: order.organization?.email || branding.email,
          phone: order.organization?.phone || branding.phone,
          website_url: order.organization?.website_url || branding.website,
        },
      });

      toast.success('Tracking information found!');
    } catch (error: any) {
      console.error('Tracking error:', error);
      toast.error('Failed to fetch tracking information');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'OUT_FOR_DELIVERY':
        return <Truck className="w-5 h-5 text-blue-500" />;
      case 'IN_TRANSIT':
        return <Package className="w-5 h-5 text-orange-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return <Badge className="bg-green-500">Delivered</Badge>;
      case 'OUT_FOR_DELIVERY':
        return <Badge className="bg-blue-500">Out for Delivery</Badge>;
      case 'IN_TRANSIT':
        return <Badge className="bg-orange-500">In Transit</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header with Store Branding */}
        <div className="text-center mb-8">
          <img
            src={trackingData?.store.logo_url || branding.logo}
            alt={trackingData?.store.name || branding.name}
            className="h-16 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
          <p className="text-muted-foreground">
            Enter your tracking number to see the latest updates
          </p>
        </div>

        {/* Search Box */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Enter tracking number..."
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchTracking()}
                  className="pl-10"
                />
              </div>
              <Button onClick={searchTracking} disabled={loading}>
                {loading ? 'Searching...' : 'Track'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tracking Results */}
        {trackingData && (
          <div className="space-y-6">
            {/* Status Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      {trackingData.tracking_number}
                    </CardTitle>
                    <CardDescription>
                      Order #{trackingData.order_number} • {trackingData.carrier_code}
                    </CardDescription>
                  </div>
                  {getStatusBadge(trackingData.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Estimated Delivery</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(trackingData.estimated_delivery).toLocaleDateString('nl-NL', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Current Location</p>
                      <p className="text-sm text-muted-foreground">
                        {trackingData.events[0]?.location || 'In transit'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tracking Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Tracking History</CardTitle>
                <CardDescription>Latest updates on your package</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trackingData.events.map((event, index) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                          {getStatusIcon(event.status)}
                        </div>
                        {index < trackingData.events.length - 1 && (
                          <div className="w-0.5 h-12 bg-border my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium">{event.description}</p>
                        <p className="text-sm text-muted-foreground">{event.location}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(event.timestamp).toLocaleString('nl-NL')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Store Contact Info */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
                <CardDescription>
                  Contact {trackingData.store.name} for support
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a href={`mailto:${trackingData.store.email}`} className="hover:underline">
                    {trackingData.store.email}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${trackingData.store.phone}`} className="hover:underline">
                    {trackingData.store.phone}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  <a 
                    href={trackingData.store.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    Visit Website
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!trackingData && !loading && (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                Enter a tracking number to see your order status
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
