import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, Users, TrendingUp, Plus, Edit, Trash, Eye } from "lucide-react";

const mockCampaigns = [
  {
    id: 1,
    name: "Winter Sale 2024",
    subject: "❄️ Tot 50% korting op wintercollectie",
    status: "sent",
    recipients: 1247,
    openRate: 24.3,
    clickRate: 4.2,
    sentDate: "2024-01-15",
  },
  {
    id: 2,
    name: "Nieuwe Collectie Preview",
    subject: "Exclusieve preview van onze lente collectie",
    status: "draft",
    recipients: 0,
    openRate: 0,
    clickRate: 0,
    sentDate: "",
  },
  {
    id: 3,
    name: "Welcome Serie - Email 1",
    subject: "Welkom bij Aurelio Living! 🏡",
    status: "automated",
    recipients: 89,
    openRate: 68.5,
    clickRate: 12.4,
    sentDate: "2024-01-12",
  },
];

const mockSubscribers = [
  { id: 1, email: "maria@email.com", name: "Maria van der Berg", subscribed: "2024-01-10", status: "active" },
  { id: 2, email: "jan@email.com", name: "Jan Janssen", subscribed: "2024-01-08", status: "active" },
  { id: 3, email: "lisa@email.com", name: "Lisa de Vries", subscribed: "2024-01-05", status: "unsubscribed" },
];

const mockTemplates = [
  { id: 1, name: "Sale Template", description: "Voor promotionele e-mails", lastUsed: "2024-01-15" },
  { id: 2, name: "Newsletter Template", description: "Standaard nieuwsbrief layout", lastUsed: "2024-01-12" },
  { id: 3, name: "Welcome Email", description: "Welkom e-mail voor nieuwe klanten", lastUsed: "2024-01-10" },
];

export function AdminEmailMarketing() {
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    subject: "",
    content: "",
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge variant="secondary">Verzonden</Badge>;
      case "draft":
        return <Badge variant="outline">Concept</Badge>;
      case "automated":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Geautomatiseerd</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">E-mail Marketing</h1>
          <p className="text-muted-foreground">
            Beheer e-mail campagnes, templates en subscriber lijsten
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nieuwe Campagne
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">+12% deze maand</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gemiddelde Open Rate</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.8%</div>
            <p className="text-xs text-muted-foreground">+2.1% vs vorige maand</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Through Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2%</div>
            <p className="text-xs text-muted-foreground">+0.8% vs vorige maand</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">E-mails Verzonden</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18,429</div>
            <p className="text-xs text-muted-foreground">Deze maand</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="create">Nieuwe Campagne</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>E-mail Campagnes</CardTitle>
              <CardDescription>Overzicht van alle e-mail campagnes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campagne</TableHead>
                    <TableHead>Onderwerp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Open Rate</TableHead>
                    <TableHead>Click Rate</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCampaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>{campaign.subject}</TableCell>
                      <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                      <TableCell>{campaign.recipients.toLocaleString()}</TableCell>
                      <TableCell>{campaign.openRate}%</TableCell>
                      <TableCell>{campaign.clickRate}%</TableCell>
                      <TableCell>{campaign.sentDate || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscribers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscriber Lijst</CardTitle>
              <CardDescription>Beheer je e-mail subscriber lijst</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input placeholder="Zoek subscribers..." className="max-w-sm" />
                  <Button variant="outline">Import CSV</Button>
                  <Button variant="outline">Export</Button>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Naam</TableHead>
                      <TableHead>Gesubscribeerd</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockSubscribers.map((subscriber) => (
                      <TableRow key={subscriber.id}>
                        <TableCell>{subscriber.email}</TableCell>
                        <TableCell>{subscriber.name}</TableCell>
                        <TableCell>{subscriber.subscribed}</TableCell>
                        <TableCell>
                          <Badge variant={subscriber.status === "active" ? "default" : "secondary"}>
                            {subscriber.status === "active" ? "Actief" : "Uitgeschreven"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>E-mail Templates</CardTitle>
              <CardDescription>Herbruikbare e-mail templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {mockTemplates.map((template) => (
                  <Card key={template.id} className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Laatst gebruikt: {template.lastUsed}
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Bewerk
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nieuwe E-mail Campagne</CardTitle>
              <CardDescription>Maak een nieuwe e-mail campagne aan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Campagne Naam</label>
                  <Input
                    placeholder="Bijvoorbeeld: Lente Sale 2024"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-mail Onderwerp</label>
                  <Input
                    placeholder="Onderwerp van de e-mail"
                    value={newCampaign.subject}
                    onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">E-mail Inhoud</label>
                <Textarea
                  placeholder="Schrijf hier je e-mail inhoud..."
                  className="min-h-[200px]"
                  value={newCampaign.content}
                  onChange={(e) => setNewCampaign({ ...newCampaign, content: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  Verstuur Nu
                </Button>
                <Button variant="outline">Opslaan als Concept</Button>
                <Button variant="outline">Test Versturen</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}