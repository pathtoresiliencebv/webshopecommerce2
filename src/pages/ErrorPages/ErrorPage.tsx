import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { 
  AlertTriangle, 
  Home, 
  RefreshCw, 
  ShieldAlert, 
  CreditCard, 
  WifiOff,
  ServerCrash
} from "lucide-react";

interface ErrorPageProps {
  type?: 'payment' | 'auth' | 'network' | 'server' | 'generic';
  title?: string;
  description?: string;
  showHomeButton?: boolean;
  showRetryButton?: boolean;
  onRetry?: () => void;
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  type = 'generic',
  title,
  description,
  showHomeButton = true,
  showRetryButton = false,
  onRetry
}) => {
  const navigate = useNavigate();

  const errorConfig = {
    payment: {
      icon: <CreditCard className="h-8 w-8 text-red-500" />,
      title: "Payment Error",
      description: "We couldn't process your payment. Please check your payment method and try again.",
      bgColor: "bg-red-50",
      iconBg: "bg-red-100"
    },
    auth: {
      icon: <ShieldAlert className="h-8 w-8 text-orange-500" />,
      title: "Authentication Required",
      description: "Please sign in to access this page.",
      bgColor: "bg-orange-50",
      iconBg: "bg-orange-100"
    },
    network: {
      icon: <WifiOff className="h-8 w-8 text-blue-500" />,
      title: "Connection Error",
      description: "Please check your internet connection and try again.",
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-100"
    },
    server: {
      icon: <ServerCrash className="h-8 w-8 text-purple-500" />,
      title: "Server Error",
      description: "Our servers are experiencing issues. Please try again in a few minutes.",
      bgColor: "bg-purple-50",
      iconBg: "bg-purple-100"
    },
    generic: {
      icon: <AlertTriangle className="h-8 w-8 text-red-500" />,
      title: "Something went wrong",
      description: "An unexpected error occurred. Please try again.",
      bgColor: "bg-red-50",
      iconBg: "bg-red-100"
    }
  };

  const config = errorConfig[type];
  const finalTitle = title || config.title;
  const finalDescription = description || config.description;

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${config.bgColor}`}>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${config.iconBg}`}>
            {config.icon}
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            {finalTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-gray-600">
            {finalDescription}
          </p>
          
          <div className="flex flex-col gap-3 pt-4">
            {showRetryButton && (
              <Button 
                onClick={onRetry} 
                className="w-full"
                variant="default"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
            
            {showHomeButton && (
              <Button 
                onClick={() => navigate("/")} 
                className="w-full"
                variant={showRetryButton ? "outline" : "default"}
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              If this problem persists, please contact our support team.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorPage;