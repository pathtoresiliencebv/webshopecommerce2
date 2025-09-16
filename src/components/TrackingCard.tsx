import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, MapPin, Calendar, ExternalLink } from "lucide-react";

interface TrackingEvent {
  timestamp: string;
  status: string;
  location: string;
  description: string;
}

interface TrackingCardProps {
  trackingNumber: string;
  carrierCode: string;
  status: string;
  subStatus?: string;
  estimatedDelivery?: string;
  events?: TrackingEvent[];
  onViewDetails?: () => void;
}

const TrackingCard = ({ 
  trackingNumber, 
  carrierCode, 
  status, 
  subStatus, 
  estimatedDelivery,
  events = [],
  onViewDetails
}: TrackingCardProps) => {
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

  const latestEvent = events[0];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="w-4 h-4" />
              {trackingNumber}
            </CardTitle>
            <CardDescription>
              Carrier: {carrierCode}
            </CardDescription>
          </div>
          {getStatusBadge(status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {subStatus && (
            <div>
              <span className="font-medium">Sub Status:</span>
              <p className="text-muted-foreground">{subStatus}</p>
            </div>
          )}
          {estimatedDelivery && (
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <div>
                <span className="font-medium">Est. Delivery:</span>
                <p className="text-muted-foreground">
                  {new Date(estimatedDelivery).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Latest Event */}
        {latestEvent && (
          <div className="border-t pt-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{latestEvent.description}</p>
                {latestEvent.location && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3" />
                    {latestEvent.location}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(latestEvent.timestamp).toLocaleDateString('nl-NL', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        {onViewDetails && (
          <Button variant="outline" size="sm" onClick={onViewDetails} className="w-full">
            <ExternalLink className="w-3 h-3 mr-2" />
            View Full Details
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default TrackingCard;