import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/contexts/StoreContext";
import { useEffect } from "react";
import { toast } from "sonner";
import { ArrowLeft, Store } from "lucide-react";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { store, loading: storeLoading } = useStore();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!store) {
      toast.error("Store niet gevonden. Probeer het opnieuw.");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Wachtwoorden komen niet overeen");
      return;
    }

    if (password.length < 6) {
      toast.error("Wachtwoord moet minimaal 6 karakters bevatten");
      return;
    }

    setLoading(true);
    
    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            store_id: store.id,
            store_name: store.name
          }
        },
      });

      if (authError) {
        if (authError.message.includes("already_registered")) {
          toast.error("Dit e-mailadres is al geregistreerd. Probeer in te loggen.");
        } else {
          toast.error(authError.message);
        }
        setLoading(false);
        return;
      }

      // Step 2: Create customer record for this store
      if (authData.user) {
        const { error: customerError } = await supabase
          .from('customers')
          .insert({
            id: authData.user.id,
            email: email,
            organization_id: store.id,
            first_name: email.split('@')[0], // Use email prefix as first name initially
            accepts_marketing: true
          });

        if (customerError) {
          console.error('Error creating customer record:', customerError);
          // Don't fail the signup, just log it
        }
      }

      toast.success(`Welkom bij ${store.name}! Je account is aangemaakt.`);
      navigate("/");
    } catch (error) {
      console.error('Signup error:', error);
      toast.error("Er ging iets mis bij het aanmaken van je account.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!store) {
      toast.error("Store niet gevonden. Probeer het opnieuw.");
      return;
    }
    
    setLoading(true);
    
    try {
      // Step 1: Authenticate user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes("Invalid login credentials")) {
          toast.error("Ongeldige inloggegevens. Controleer je e-mail en wachtwoord.");
        } else {
          toast.error(authError.message);
        }
        setLoading(false);
        return;
      }

      // Step 2: Check if user has access to this store
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id, organization_id')
        .eq('id', authData.user.id)
        .eq('organization_id', store.id)
        .maybeSingle();

      if (customerError || !customer) {
        // User doesn't have access to this store
        await supabase.auth.signOut();
        toast.error(`Je hebt geen toegang tot ${store.name}. Registreer je eerst voor deze winkel.`);
        setLoading(false);
        return;
      }

      toast.success(`Welkom terug bij ${store.name}!`);
      navigate("/");
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error("Er ging iets mis bij het inloggen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug naar winkel
            </Button>
          </Link>
        </div>

        <div className="text-center space-y-2">
          {store?.logo_url ? (
            <div className="flex justify-center mb-4">
              <img src={store.logo_url} alt={store.name} className="h-16 object-contain" />
            </div>
          ) : (
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Store className="h-8 w-8 text-primary" />
              </div>
            </div>
          )}
          <h1 className="text-3xl font-bold">Welkom bij {storeLoading ? '...' : store?.name || 'onze winkel'}</h1>
          <p className="text-muted-foreground">
            Log in of maak een account aan om door te gaan met winkelen
          </p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Inloggen</TabsTrigger>
            <TabsTrigger value="signup">Registreren</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>Inloggen</CardTitle>
                <CardDescription>
                  Voer je gegevens in om in te loggen bij je account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">E-mailadres</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="jouw@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Wachtwoord</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Bezig met inloggen..." : "Inloggen"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Account aanmaken</CardTitle>
                <CardDescription>
                  Maak een nieuw account aan om te beginnen met winkelen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">E-mailadres</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="jouw@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Wachtwoord</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Bevestig wachtwoord</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Account wordt aangemaakt..." : "Account aanmaken"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}