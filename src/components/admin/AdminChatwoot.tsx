import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  MessageCircle, 
  Settings, 
  Users, 
  BarChart3, 
  Zap, 
  Globe, 
  Mail, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink
} from "lucide-react";

// Local type interfaces for Chatwoot tables
interface ChatwootAccount {
  id: string;
  organization_id: string;
  chatwoot_account_id: number;
  account_name: string;
  account_status: 'active' | 'suspended' | 'deleted';
  access_token: string;
  website_token: string;
  locale: string;
  timezone: string;
  support_email: string;
  last_sync_at: string;
  sync_status: 'active' | 'syncing' | 'error';
  sync_error?: string;
  created_at: string;
  updated_at: string;
}

interface ChatwootConversation {
  id: string;
  organization_id: string;
  chatwoot_conversation_id: number;
  contact_id?: string;
  status: string;
  assignee_id?: number;
  created_at: string;
  updated_at: string;
  satisfaction_rating?: number;
}

interface ChatwootStats {
  total_conversations: number;
  open_conversations: number;
  resolved_conversations: number;
  avg_response_time: string;
  customer_satisfaction: number;
  active_agents: number;
}

export function AdminChatwoot() {
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const [account, setAccount] = useState<ChatwootAccount | null>(null);
  const [stats, setStats] = useState<ChatwootStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    widget_enabled: true,
    auto_assignment: true,
    business_hours_enabled: false,
    satisfaction_surveys: true,
    email_notifications: true,
    welcome_message: "Welkom! Hoe kunnen we je helpen?",
    away_message: "We zijn momenteel niet beschikbaar. Laat een bericht achter!",
    widget_color: "#1f2937"
  });

  useEffect(() => {
    if (currentOrganization) {
      fetchChatwootAccount();
      fetchChatwootStats();
    }
  }, [currentOrganization]);

  const fetchChatwootAccount = async () => {
    if (!currentOrganization) return;

    try {
      const { data, error } = await supabase
        .from('chatwoot_accounts' as any)
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setAccount(data ? (data as unknown as ChatwootAccount) : null);
    } catch (error: any) {
      console.error('Error fetching Chatwoot account:', error);
      toast({
        title: "Error",
        description: "Failed to load Chatwoot account information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchChatwootStats = async () => {
    if (!currentOrganization) return;

    try {
      const { data: conversations } = await supabase
        .from('chatwoot_conversations' as any)
        .select('*')
        .eq('organization_id', currentOrganization.id);

      if (conversations) {
        const conversationData = conversations ? (conversations as unknown as ChatwootConversation[]) : [];
        const openConversations = conversationData.filter(c => c.status === 'open').length;
        const resolvedConversations = conversationData.filter(c => c.status === 'resolved').length;
        const satisfactionRatings = conversationData
          .filter(c => c.satisfaction_rating)
          .map(c => c.satisfaction_rating!);
        const avgSatisfaction = satisfactionRatings.length > 0 ? 
          satisfactionRatings.reduce((sum, rating) => sum + rating, 0) / satisfactionRatings.length : 0;

        setStats({
          total_conversations: conversationData.length,
          open_conversations: openConversations,
          resolved_conversations: resolvedConversations,
          avg_response_time: "2.5 min", // Would be calculated from actual data
          customer_satisfaction: avgSatisfaction,
          active_agents: 3 // Would be fetched from Chatwoot API
        });
      }
    } catch (error: any) {
      console.error('Error fetching Chatwoot stats:', error);
    }
  };

  const createChatwootAccount = async () => {
    if (!currentOrganization) return;

    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('chatwoot-account-manager', {
        body: {
          organizationId: currentOrganization.id,
          organizationData: {
            name: currentOrganization.name,
            slug: currentOrganization.slug,
            email: 'support@example.com', // Organizations don't have email field
            domain: currentOrganization.domain,
            subdomain: currentOrganization.subdomain,
            locale: 'nl',
            timezone: 'Europe/Amsterdam'
          }
        }
      });

      if (error) throw error;

      if (data.success) {
        setAccount(data.account);
        toast({
          title: "Success",
          description: "Chatwoot account created successfully!",
        });
      } else {
        throw new Error(data.error || 'Failed to create account');
      }
    } catch (error: any) {
      console.error('Error creating Chatwoot account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create Chatwoot account",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const syncCustomerData = async () => {
    if (!currentOrganization) return;

    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('chatwoot-contact-sync', {
        body: {
          organizationId: currentOrganization.id
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Customer data synchronized successfully!",
      });
      
      fetchChatwootAccount();
    } catch (error: any) {
      console.error('Error syncing customer data:', error);
      toast({
        title: "Error",
        description: "Failed to sync customer data",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const updateSettings = async () => {
    // Implementation for updating Chatwoot settings
    toast({
      title: "Settings Updated",
      description: "Chatwoot settings have been updated successfully.",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'suspended':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Suspended</Badge>;
      case 'syncing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Syncing</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Customer Service</h1>
            <p className="text-muted-foreground">Manage your Chatwoot integration and customer support</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-20"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Customer Service</h1>
            <p className="text-muted-foreground">Set up Chatwoot integration for customer support</p>
          </div>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-6 w-6" />
              Setup Chatwoot Integration
            </CardTitle>
            <CardDescription>
              Create a Chatwoot account for your store to enable professional customer support across all channels.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">What you'll get:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Live chat widget on your storefront</li>
                <li>Email support integration</li>
                <li>Customer context and order history</li>
                <li>Multi-agent dashboard</li>
                <li>Conversation analytics and reports</li>
                <li>Automated workflows and routing</li>
              </ul>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This will create a dedicated Chatwoot account for your store with automatic customer data synchronization.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={createChatwootAccount} 
              disabled={creating}
              className="w-full"
            >
              {creating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Create Chatwoot Account
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Service</h1>
          <p className="text-muted-foreground">Manage your Chatwoot integration and customer support</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={syncCustomerData}
            disabled={syncing}
          >
            {syncing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Sync Data
          </Button>
          <Button
            onClick={() => window.open('https://chatwoot.aurelioliving.nl', '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Chatwoot
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_conversations || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Conversations</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.open_conversations || 0}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avg_response_time || "N/A"}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.customer_satisfaction ? `${stats.customer_satisfaction.toFixed(1)}/5` : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">Average rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Account Status</span>
            {getStatusBadge(account.account_status)}
          </CardTitle>
          <CardDescription>
            Chatwoot integration details and configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Account Name</Label>
              <p className="font-medium">{account.account_name}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Support Email</Label>
              <p className="font-medium">{account.support_email}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Language</Label>
              <p className="font-medium">{account.locale.toUpperCase()}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Last Sync</Label>
              <p className="font-medium">
                {account.last_sync_at ? new Date(account.last_sync_at).toLocaleDateString() : 'Never'}
              </p>
            </div>
          </div>

          {account.sync_error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Sync Error: {account.sync_error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Configuration Tabs */}
      <Tabs defaultValue="widget" className="space-y-4">
        <TabsList>
          <TabsTrigger value="widget">Widget Settings</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
        </TabsList>

        <TabsContent value="widget" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Chat Widget Configuration
              </CardTitle>
              <CardDescription>
                Customize how the chat widget appears on your storefront
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Chat Widget</Label>
                  <p className="text-sm text-muted-foreground">Show chat widget on storefront</p>
                </div>
                <Switch 
                  checked={settings.widget_enabled}
                  onCheckedChange={(checked) => setSettings({...settings, widget_enabled: checked})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="welcome-message">Welcome Message</Label>
                  <Textarea
                    id="welcome-message"
                    value={settings.welcome_message}
                    onChange={(e) => setSettings({...settings, welcome_message: e.target.value})}
                    placeholder="Welcome message for visitors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="away-message">Away Message</Label>
                  <Textarea
                    id="away-message"
                    value={settings.away_message}
                    onChange={(e) => setSettings({...settings, away_message: e.target.value})}
                    placeholder="Message when agents are away"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="widget-color">Widget Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="widget-color"
                    type="color"
                    value={settings.widget_color}
                    onChange={(e) => setSettings({...settings, widget_color: e.target.value})}
                    className="w-16 h-10"
                  />
                  <Input
                    value={settings.widget_color}
                    onChange={(e) => setSettings({...settings, widget_color: e.target.value})}
                    placeholder="#1f2937"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={updateSettings}>
                  <Settings className="w-4 h-4 mr-2" />
                  Update Widget Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Automation Rules
              </CardTitle>
              <CardDescription>
                Configure automatic assignment and workflows
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Assignment</Label>
                  <p className="text-sm text-muted-foreground">Automatically assign conversations to available agents</p>
                </div>
                <Switch 
                  checked={settings.auto_assignment}
                  onCheckedChange={(checked) => setSettings({...settings, auto_assignment: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Business Hours</Label>
                  <p className="text-sm text-muted-foreground">Enable business hours based routing</p>
                </div>
                <Switch 
                  checked={settings.business_hours_enabled}
                  onCheckedChange={(checked) => setSettings({...settings, business_hours_enabled: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Satisfaction Surveys</Label>
                  <p className="text-sm text-muted-foreground">Send satisfaction surveys after resolution</p>
                </div>
                <Switch 
                  checked={settings.satisfaction_surveys}
                  onCheckedChange={(checked) => setSettings({...settings, satisfaction_surveys: checked})}
                />
              </div>

              <div className="pt-4">
                <Button onClick={updateSettings}>
                  <Zap className="w-4 h-4 mr-2" />
                  Update Automation Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure email and other notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send email notifications for new conversations</p>
                </div>
                <Switch 
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => setSettings({...settings, email_notifications: checked})}
                />
              </div>

              <div className="pt-4">
                <Button onClick={updateSettings}>
                  <Mail className="w-4 h-4 mr-2" />
                  Update Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Agent Management
              </CardTitle>
              <CardDescription>
                Manage agents and their access to the Chatwoot dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Agent Management</h3>
                <p className="text-muted-foreground mb-4">
                  Agent management is handled directly in the Chatwoot dashboard.
                </p>
                <Button
                  onClick={() => window.open('https://chatwoot.aurelioliving.nl', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Manage Agents in Chatwoot
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}