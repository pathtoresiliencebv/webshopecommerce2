import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ShoppingBag, Users, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 to-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            MyAurelio
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Premium meubel platform voor moderne woonruimtes. Ontdek exclusieve collecties van topmerken.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Premium Merken</CardTitle>
              <CardDescription>
                Exclusieve collecties van de beste meubelmerken
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <ShoppingBag className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Curated Collections</CardTitle>
              <CardDescription>
                Handgeselecteerde meubels voor elke woonruimte
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />  
              </div>
              <CardTitle>Snelle Levering</CardTitle>
              <CardDescription>
                Gratis verzending en professionele montage
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Bezoek Aurelio Living</CardTitle>
              <CardDescription>
                Ontdek onze volledige collectie premium meubels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" asChild className="w-full sm:w-auto">
                <a href="https://aurelioliving.myaurelio.com">
                  Bekijk Collectie
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}