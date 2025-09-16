import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";
import { Search, Package, MapPin, Calendar, Truck } from "lucide-react";

interface TrackingEvent {
  timestamp: string;
  status: string;
  location: string;
  description: string;
}

interface TrackingData {
  trackingNumber: string;
  carrierCode: string;
  status: string;
  subStatus?: string;
  estimatedDelivery?: string;
  events: TrackingEvent[];
}

const TrackTrace = () => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [selectedCarrier, setSelectedCarrier] = useState<string>("");
  const [trackingResult, setTrackingResult] = useState<TrackingData | null>(null);
  const { currentOrganization } = useOrganization();

  // Fetch available carriers
  const { data: carriers, isLoading: carriersLoading } = useQuery({
    queryKey: ["carriers"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('track123-api', {
        body: { action: 'carriers' }
      });
      
      if (error) throw error;
      return data.carriers || [];
    }
  });

  // Track package mutation
  const trackMutation = useMutation({
    mutationFn: async ({ trackingNumber, carrierCode }: { trackingNumber: string; carrierCode?: string }) => {
      const { data, error } = await supabase.functions.invoke('track123-api', {
        body: {
          action: 'track',
          trackingNumber,
          carrierCode,
          organizationId: currentOrganization?.id
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success && data.tracking) {
        setTrackingResult(data.tracking);
        toast.success("Tracking information retrieved successfully!");
      } else {
        toast.error("No tracking information found for this number.");
        setTrackingResult(null);
      }
    },
    onError: (error: any) => {
      console.error('Tracking error:', error);
      toast.error(error.message || "Failed to retrieve tracking information");
      setTrackingResult(null);
    }
  });

  const handleTrack = () => {
    if (!trackingNumber.trim()) {
      toast.error("Please enter a tracking number");
      return;
    }

    trackMutation.mutate({
      trackingNumber: trackingNumber.trim(),
      carrierCode: selectedCarrier || undefined
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'DELIVERED': { variant: 'default' as const, color: 'bg-green-500' },
      'IN_TRANSIT': { variant: 'secondary' as const, color: 'bg-blue-500' },
      'WAITING_DELIVERY': { variant: 'outline' as const, color: 'bg-yellow-500' },
      'DELIVERY_FAILED': { variant: 'destructive' as const, color: 'bg-red-500' },
      'ABNORMAL': { variant: 'destructive' as const, color: 'bg-red-500' },
      'INFO_RECEIVED': { variant: 'outline' as const, color: 'bg-gray-500' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['INFO_RECEIVED'];
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Track & Trace
            </h1>
            <p className="text-muted-foreground text-lg">
              Enter your tracking number to get real-time package updates
            </p>
          </div>

          {/* Search Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Track Your Package
              </CardTitle>
              <CardDescription>
                Enter your tracking number and optionally select the carrier for more accurate results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Enter tracking number..."
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="text-lg"
                    onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
                  />
                </div>
                <div className="sm:w-48">
                  <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Auto-detect</SelectItem>
                      {carriers?.map((carrier: any) => (
                        <SelectItem key={carrier.courierCode} value={carrier.courierCode}>
                          {carrier.courierNameEN}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleTrack}
                  disabled={trackMutation.isPending || carriersLoading}
                  className="sm:w-32"
                >
                  {trackMutation.isPending ? "Tracking..." : "Track"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tracking Results */}
          {trackingResult && (
            <div className="space-y-6">
              {/* Status Overview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        {trackingResult.trackingNumber}
                      </CardTitle>
                      <CardDescription>
                        Carrier: {trackingResult.carrierCode}
                      </CardDescription>
                    </div>
                    {getStatusBadge(trackingResult.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {trackingResult.subStatus && (
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Sub Status</p>
                          <p className="text-sm text-muted-foreground">{trackingResult.subStatus}</p>
                        </div>
                      </div>
                    )}
                    {trackingResult.estimatedDelivery && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Estimated Delivery</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(trackingResult.estimatedDelivery).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tracking Timeline */}
              {trackingResult.events && trackingResult.events.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Tracking Timeline</CardTitle>
                    <CardDescription>Package journey and status updates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {trackingResult.events.map((event, index) => (
                        <div key={index} className="flex items-start gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-primary" />
                            {index < trackingResult.events.length - 1 && (
                              <div className="w-px h-12 bg-border mt-2" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pb-4">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium">{event.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(event.timestamp).toLocaleDateString('nl-NL', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                {event.location}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Popular Carriers */}
          {!trackingResult && (
            <Card>
              <CardHeader>
                <CardTitle>Supported Carriers</CardTitle>
                <CardDescription>We support tracking for major carriers worldwide</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {carriers?.slice(0, 8).map((carrier: any) => (
                    <div 
                      key={carrier.courierCode}
                      className="text-center p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedCarrier(carrier.courierCode)}
                    >
                      <p className="font-medium text-sm">{carrier.courierNameEN}</p>
                      <p className="text-xs text-muted-foreground">{carrier.courierCode}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackTrace;