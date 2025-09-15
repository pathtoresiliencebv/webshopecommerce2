import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { 
  Globe, 
  Plus, 
  Copy, 
  Check, 
  AlertCircle, 
  Shield,
  ExternalLink,
  Trash2
} from 'lucide-react';

interface CustomDomain {
  id: string;
  domain: string;
  is_primary: boolean;
  verification_status: string;
  ssl_status: string;
  dns_verified_at: string | null;
  ssl_issued_at: string | null;
  created_at: string;
}

export function AdminDomains() {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const [customDomains, setCustomDomains] = useState<CustomDomain[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedRecord, setCopiedRecord] = useState<string | null>(null);

  useEffect(() => {
    if (currentOrganization) {
      fetchCustomDomains();
    }
  }, [currentOrganization]);

  const fetchCustomDomains = async () => {
    if (!currentOrganization) return;

    const { data, error } = await supabase
      .from('custom_domains')
      .select('*')
      .eq('organization_id', currentOrganization.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Fout bij laden van domeinen",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setCustomDomains(data || []);
  };

  const addCustomDomain = async () => {
    if (!currentOrganization || !newDomain.trim()) return;

    setLoading(true);
    const { error } = await supabase
      .from('custom_domains')
      .insert({
        organization_id: currentOrganization.id,
        domain: newDomain.trim().toLowerCase(),
        is_primary: customDomains.length === 0
      });

    if (error) {
      toast({
        title: "Fout bij toevoegen domein",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Domein toegevoegd",
        description: "Het domein is toegevoegd en wacht op DNS verificatie.",
      });
      setNewDomain('');
      fetchCustomDomains();
    }
    setLoading(false);
  };

  const removeDomain = async (domainId: string) => {
    const { error } = await supabase
      .from('custom_domains')
      .delete()
      .eq('id', domainId);

    if (error) {
      toast({
        title: "Fout bij verwijderen domein",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Domein verwijderd",
        description: "Het domein is succesvol verwijderd.",
      });
      fetchCustomDomains();
    }
  };

  const copyToClipboard = async (text: string, recordType: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedRecord(recordType);
    setTimeout(() => setCopiedRecord(null), 2000);
    toast({
      title: "Gekopieerd",
      description: `${recordType} record gekopieerd naar klembord.`,
    });
  };

  const getStatusBadge = (status: string, type: 'verification' | 'ssl') => {
    const config = {
      verification: {
        pending: { variant: 'secondary' as const, label: 'Wachtend' },
        verified: { variant: 'default' as const, label: 'Geverifieerd' },
        failed: { variant: 'destructive' as const, label: 'Mislukt' }
      },
      ssl: {
        pending: { variant: 'secondary' as const, label: 'SSL Pending' },
        active: { variant: 'default' as const, label: 'SSL Actief' },
        failed: { variant: 'destructive' as const, label: 'SSL Mislukt' }
      }
    };

    const statusConfig = config[type][status as keyof typeof config[typeof type]];
    return <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>;
  };

  const dnsRecords = [
    {
      type: 'A',
      name: '@',
      value: '185.158.133.1',
      description: 'Voor root domein (bijv. example.com)'
    },
    {
      type: 'CNAME',
      name: 'www',
      value: 'cname.lovable.app',
      description: 'Voor www subdomain (bijv. www.example.com)'
    }
  ];

  if (!currentOrganization) {
    return <div>Geen organisatie geselecteerd</div>;
  }

  const defaultSubdomain = `${currentOrganization.slug}.aurelioliving.nl`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Domeinen</h1>
        <p className="text-muted-foreground mt-1">
          Beheer je store domeinen en DNS instellingen
        </p>
      </div>

      {/* Default Subdomain */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Standaard Subdomain
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">{defaultSubdomain}</p>
              <p className="text-sm text-muted-foreground">
                Je automatische subdomain - altijd actief
              </p>
            </div>
            <Badge variant="default">Actief</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Add Custom Domain */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Domein Toevoegen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="domain">Domein naam</Label>
              <Input
                id="domain"
                placeholder="example.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomDomain()}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={addCustomDomain} 
                disabled={loading || !newDomain.trim()}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Toevoegen
              </Button>
            </div>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Na toevoegen moet je de DNS records hieronder instellen bij je domain provider.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Custom Domains List */}
      {customDomains.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Domeinen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customDomains.map((domain) => (
                <div key={domain.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{domain.domain}</p>
                      {domain.is_primary && <Badge variant="secondary">Primair</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(domain.verification_status, 'verification')}
                      {getStatusBadge(domain.ssl_status, 'ssl')}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeDomain(domain.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* DNS Records Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            DNS Records Instellen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Voeg deze DNS records toe bij je domain provider om je custom domein te laten werken:
          </p>

          <div className="space-y-4">
            {dnsRecords.map((record, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div>
                    <Label className="text-xs text-muted-foreground">TYPE</Label>
                    <p className="font-mono font-semibold">{record.type}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">NAAM</Label>
                    <p className="font-mono">{record.name}</p>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">WAARDE</Label>
                    <p className="font-mono text-sm break-all">{record.value}</p>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(record.value, record.type)}
                      className="flex items-center gap-2"
                    >
                      {copiedRecord === record.type ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      Kopieer
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{record.description}</p>
              </div>
            ))}
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              DNS wijzigingen kunnen tot 48 uur duren om wereldwijd door te voeren. 
              SSL certificaten worden automatisch aangemaakt na DNS verificatie.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}