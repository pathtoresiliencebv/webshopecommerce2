import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Package, Truck, CreditCard } from "lucide-react";

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order');

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-foreground">
              Bestelling succesvol geplaatst!
            </h1>
            <p className="text-lg text-muted-foreground">
              Bedankt voor je bestelling. Je ontvangt binnenkort een bevestigingsmail 
              met alle details van je aankoop.
            </p>
          </div>

          {/* Order Details Card */}
          <Card className="text-left">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Bestelgegevens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sessionId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Betaling ID:</span>
                  <span className="font-mono text-sm">{sessionId}</span>
                </div>
              )}
              {orderId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bestelnummer:</span>
                  <span className="font-mono text-sm">{orderId}</span>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Betaling verwerkt</p>
                    <p className="text-sm text-muted-foreground">
                      Je betaling is succesvol verwerkt
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Truck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Klaar voor verzending</p>
                    <p className="text-sm text-muted-foreground">
                      Je bestelling wordt binnenkort verzonden
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What's Next */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Wat gebeurt er nu?</h2>
            <div className="grid gap-4 text-left">
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">Bevestigingsmail</p>
                  <p className="text-sm text-muted-foreground">
                    Je ontvangt binnen enkele minuten een bevestigingsmail met je bestelgegevens.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">Voorbereiding</p>
                  <p className="text-sm text-muted-foreground">
                    We bereiden je bestelling zorgvuldig voor en pakken deze in.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">Verzending</p>
                  <p className="text-sm text-muted-foreground">
                    Je bestelling wordt binnen 2-3 werkdagen gratis bij je thuisbezorgd.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/products">
                Verder winkelen
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/dashboard">
                Mijn bestellingen
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}