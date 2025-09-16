import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminDNSSetup = () => {
  const [copiedRecord, setCopiedRecord] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = async (text: string, recordType: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedRecord(recordType);
      toast({
        title: "Gekopieerd!",
        description: `${recordType} record waarde is gekopieerd naar het klembord.`,
      });
      setTimeout(() => setCopiedRecord(null), 2000);
    } catch (err) {
      toast({
        title: "Fout",
        description: "Kon niet kopiëren naar klembord. Kopieer handmatig.",
        variant: "destructive",
      });
    }
  };

  const dnsRecords = [
    {
      type: 'CNAME',
      name: 'aurelioliving',
      value: 'cname.lovable.app',
      description: 'Voor aurelioliving.myaurelio.com subdomain'
    },
    {
      type: 'CNAME', 
      name: '*',
      value: 'cname.lovable.app',
      description: 'Wildcard voor alle subdomains (optioneel, voor toekomstige stores)'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            DNS Configuratie Vereist
          </CardTitle>
          <CardDescription>
            Je subdomain aurelioliving.myaurelio.com werkt niet omdat de DNS records ontbreken.
            Voeg deze DNS records toe bij je domain provider (waar je myaurelio.com hebt geregistreerd).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Probleem:</strong> aurelioliving.myaurelio.com werkt niet, maar myaurelio.com wel.
              <br />
              <strong>Oplossing:</strong> Voeg de onderstaande DNS records toe om subdomains te activeren.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Benodigde DNS Records</h4>
            {dnsRecords.map((record, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{record.type} Record</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(record.value, `${record.type} ${record.name}`)}
                      className="flex items-center gap-1"
                    >
                      {copiedRecord === `${record.type} ${record.name}` ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      Kopieer waarde
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <label className="font-medium text-gray-600">Type:</label>
                      <div className="font-mono bg-gray-100 p-1 rounded">{record.type}</div>
                    </div>
                    <div>
                      <label className="font-medium text-gray-600">Name/Host:</label>
                      <div className="font-mono bg-gray-100 p-1 rounded">{record.name}</div>
                    </div>
                    <div>
                      <label className="font-medium text-gray-600">Value/Target:</label>
                      <div className="font-mono bg-gray-100 p-1 rounded">{record.value}</div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-2">{record.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Stappen om DNS te configureren:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Log in bij je domain provider (waar je myaurelio.com hebt geregistreerd)</li>
                <li>Ga naar DNS Management / DNS Settings</li>
                <li>Voeg de bovenstaande CNAME records toe</li>
                <li>Sla de wijzigingen op</li>
                <li>Wacht 15-60 minuten voor DNS propagatie</li>
              </ol>
            </AlertDescription>
          </Alert>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Test je configuratie:</strong> Na het toevoegen van de DNS records kun je testen of aurelioliving.myaurelio.com werkt door ernaar te navigeren in een nieuwe browser tab.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              asChild
            >
              <a href="https://dnschecker.org" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                DNS Status Controleren
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Huidige Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                myaurelio.com
              </Badge>
              <span className="text-sm">Werkt correct</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                aurelioliving.myaurelio.com
              </Badge>
              <span className="text-sm">DNS configuratie vereist</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDNSSetup;