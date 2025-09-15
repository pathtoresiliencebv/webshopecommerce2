import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Headphones, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  User,
  Filter,
  Search,
  Plus,
  ArrowUpRight,
  Star,
  Phone,
  Mail,
  MessageCircle
} from "lucide-react";

const mockTickets = [
  {
    id: "T-2024-001",
    customer: "Maria van der Berg",
    email: "maria@email.com",
    store: "Aurelio Living",
    subject: "Beschadigde levering - Eettafel Set",
    status: "open",
    priority: "high",
    created: "2024-01-15 14:30",
    lastResponse: "2024-01-15 16:45",
    assignee: "Sarah Johnson",
    category: "Levering",
  },
  {
    id: "T-2024-002", 
    customer: "Jan Janssen",
    email: "jan@email.com",
    store: "Modern Furniture Co.",
    subject: "Vraag over retourbeleid",
    status: "pending",
    priority: "medium",
    created: "2024-01-15 09:15",
    lastResponse: "2024-01-15 11:30",
    assignee: "Mike Chen",
    category: "Retour",
  },
  {
    id: "T-2024-003",
    customer: "Lisa de Vries", 
    email: "lisa@email.com",
    store: "Aurelio Living",
    subject: "Bestelling niet ontvangen",
    status: "resolved",
    priority: "high",
    created: "2024-01-14 16:20",
    lastResponse: "2024-01-15 08:45",
    assignee: "Sarah Johnson",
    category: "Levering",
  },
  {
    id: "T-2024-004",
    customer: "Tom Peters",
    email: "tom@email.com", 
    store: "Design Hub",
    subject: "Product informatie aanvragen",
    status: "open",
    priority: "low",
    created: "2024-01-14 11:10",
    lastResponse: "2024-01-14 13:25",
    assignee: "Emma Wilson",
    category: "Informatie",
  },
];

const mockKnowledgeBase = [
  {
    id: 1,
    title: "Retourbeleid en procedure",
    category: "Retour",
    views: 245,
    lastUpdated: "2024-01-10",
    helpful: 89,
  },
  {
    id: 2,
    title: "Levertijden en verzendkosten",
    category: "Levering", 
    views: 189,
    lastUpdated: "2024-01-08",
    helpful: 156,
  },
  {
    id: 3,
    title: "Productgarantie voorwaarden",
    category: "Garantie",
    views: 134,
    lastUpdated: "2024-01-05",
    helpful: 98,
  },
];

const mockTeamMembers = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Senior Support Agent",
    email: "sarah@aurelio.nl",
    activeTickets: 8,
    resolvedToday: 12,
    avgResponseTime: "1.2 uur",
    satisfaction: 4.8,
    status: "online",
  },
  {
    id: 2,
    name: "Mike Chen", 
    role: "Support Agent",
    email: "mike@aurelio.nl",
    activeTickets: 5,
    resolvedToday: 8,
    avgResponseTime: "2.1 uur",
    satisfaction: 4.6,
    status: "online",
  },
  {
    id: 3,
    name: "Emma Wilson",
    role: "Support Agent",
    email: "emma@aurelio.nl", 
    activeTickets: 3,
    resolvedToday: 6,
    avgResponseTime: "1.8 uur",
    satisfaction: 4.7,
    status: "away",
  },
];

export function AdminCustomerService() {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Open
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            Wachtend
          </Badge>
        );
      case "resolved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Opgelost
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">Hoog</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium</Badge>;
      case "low":
        return <Badge variant="secondary">Laag</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusIndicator = (status: string) => {
    const color = status === "online" ? "bg-green-500" : status === "away" ? "bg-yellow-500" : "bg-gray-400";
    return <div className={`w-2 h-2 rounded-full ${color}`} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Service</h1>
          <p className="text-muted-foreground">
            Centraal customer service dashboard voor alle stores
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nieuw Ticket
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">+3 vandaag</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gem. Reactietijd</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.4u</div>
            <p className="text-xs text-muted-foreground">-0.2u vs gisteren</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opgeloste Tickets</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">189</div>
            <p className="text-xs text-muted-foreground">Deze maand</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Klanttevredenheid</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.7</div>
            <p className="text-xs text-muted-foreground">van 5 sterren</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="tickets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
          <TabsTrigger value="team">Team Overzicht</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Support Tickets</CardTitle>
                  <CardDescription>Overzicht van alle customer service tickets</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Zoek tickets..." className="pl-10 w-[250px]" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Klant</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Onderwerp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioriteit</TableHead>
                    <TableHead>Toegewezen aan</TableHead>
                    <TableHead>Aangemaakt</TableHead>
                    <TableHead>Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTickets.map((ticket) => (
                    <TableRow 
                      key={ticket.id}
                      className={selectedTicket === ticket.id ? "bg-muted/50" : ""}
                    >
                      <TableCell className="font-medium">{ticket.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{ticket.customer}</div>
                          <div className="text-sm text-muted-foreground">{ticket.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{ticket.store}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{ticket.subject}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell>{ticket.assignee}</TableCell>
                      <TableCell>{ticket.created}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedTicket(ticket.id)}
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MessageCircle className="h-4 w-4" />
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

        <TabsContent value="team" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockTeamMembers.map((member) => (
              <Card key={member.id}>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src="" />
                        <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1">
                        {getStatusIndicator(member.status)}
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <CardDescription>{member.role}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Actieve tickets:</span>
                      <span className="font-medium">{member.activeTickets}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Opgelost vandaag:</span>
                      <span className="font-medium">{member.resolvedToday}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Gem. reactietijd:</span>
                      <span className="font-medium">{member.avgResponseTime}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tevredenheid:</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current text-yellow-500" />
                        <span className="font-medium">{member.satisfaction}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Chat
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Mail className="h-4 w-4 mr-1" />
                        E-mail
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Knowledge Base</CardTitle>
                  <CardDescription>Beheer support artikelen en FAQ's</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuw Artikel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input placeholder="Zoek in knowledge base..." className="max-w-sm" />
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Categorie
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Artikel Titel</TableHead>
                      <TableHead>Categorie</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Helpful Votes</TableHead>
                      <TableHead>Laatst Bijgewerkt</TableHead>
                      <TableHead>Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockKnowledgeBase.map((article) => (
                      <TableRow key={article.id}>
                        <TableCell className="font-medium">{article.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{article.category}</Badge>
                        </TableCell>
                        <TableCell>{article.views}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            {article.helpful}
                          </div>
                        </TableCell>
                        <TableCell>{article.lastUpdated}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              Bewerk
                            </Button>
                            <Button variant="ghost" size="sm">
                              Bekijk
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Ticket Volume</CardTitle>
                <CardDescription>Aantal tickets per dag (afgelopen 30 dagen)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  [Chart: Ticket volume over tijd]
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Times</CardTitle>
                <CardDescription>Gemiddelde reactietijden per agent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  [Chart: Response times per agent]
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ticket Categories</CardTitle>
                <CardDescription>Verdeling van ticket categorieën</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  [Chart: Pie chart van categorieën]
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Satisfaction</CardTitle>
                <CardDescription>Tevredenheidsscores per maand</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  [Chart: Satisfaction trends]
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}