import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { EmailBuilder } from './email/EmailBuilder';
import { WorkflowManager } from './email/WorkflowManager';
import { SubscriberManager } from './email/SubscriberManager';
import { 
  Mail, 
  Users, 
  TrendingUp, 
  Send, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Zap,
  Target,
  BarChart3,
  Settings,
  Palette
} from 'lucide-react';

export function AdminEmailMarketing() {
  const { currentOrganization } = useOrganization();
  const [workflows, setWorkflows] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalSubscribers: 0,
    openRate: 0,
    clickRate: 0,
    emailsSent: 0
  });
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [testEmail, setTestEmail] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchEmailData();
    }
  }, [currentOrganization]);

  const fetchEmailData = async () => {
    setLoading(true);
    try {
      const [workflowsRes, templatesRes, subscribersRes, campaignsRes, sendsRes] = await Promise.all([
        supabase.from('email_workflows').select('*').eq('organization_id', currentOrganization.id),
        supabase.from('email_templates').select('*').eq('organization_id', currentOrganization.id),
        supabase.from('email_subscribers').select('*').eq('organization_id', currentOrganization.id),
        supabase.from('email_campaigns').select('*, workflow:email_workflows(name), template:email_templates(name)').eq('organization_id', currentOrganization.id),
        supabase.from('email_sends').select('*, events:email_events(*)').eq('organization_id', currentOrganization.id)
      ]);

      setWorkflows(workflowsRes.data || []);
      setTemplates(templatesRes.data || []);
      setSubscribers(subscribersRes.data || []);
      setCampaigns(campaignsRes.data || []);

      // Calculate analytics
      const sends = sendsRes.data || [];
      const totalSent = sends.length;
      const opens = sends.filter(send => send.events?.some(e => e.event_type === 'open')).length;
      const clicks = sends.filter(send => send.events?.some(e => e.event_type === 'click')).length;
      
      setAnalytics({
        totalSubscribers: subscribersRes.data?.filter(s => s.is_active).length || 0,
        openRate: totalSent > 0 ? Math.round((opens / totalSent) * 100) : 0,
        clickRate: totalSent > 0 ? Math.round((clicks / totalSent) * 100) : 0,
        emailsSent: totalSent
      });
    } catch (error) {
      console.error('Error fetching email data:', error);
      toast({
        title: "Error",
        description: "Failed to load email marketing data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultWorkflows = async () => {
    const defaultWorkflows = [
      {
        organization_id: currentOrganization.id,
        name: 'Welcome Series',
        workflow_type: 'welcome_series',
        trigger_event: 'subscriber_added',
        trigger_conditions: { emails_count: 4, delay_hours: 24 },
        is_active: true
      },
      {
        organization_id: currentOrganization.id,
        name: 'Cart Abandonment',
        workflow_type: 'cart_abandonment',
        trigger_event: 'cart_abandoned',
        trigger_conditions: { delay_hours: 1, minimum_cart_value: 20 },
        is_active: true
      },
      {
        organization_id: currentOrganization.id,
        name: 'Browse Abandonment',
        workflow_type: 'browse_abandonment', 
        trigger_event: 'product_viewed',
        trigger_conditions: { delay_hours: 24 },
        is_active: true
      },
      {
        organization_id: currentOrganization.id,
        name: 'Post Purchase',
        workflow_type: 'post_purchase',
        trigger_event: 'order_placed',
        trigger_conditions: { emails_count: 4, delay_hours: 24 },
        is_active: true
      },
      {
        organization_id: currentOrganization.id,
        name: 'Winback Campaign',
        workflow_type: 'winback',
        trigger_event: 'customer_inactive',
        trigger_conditions: { inactive_days: 30, emails_count: 3 },
        is_active: true
      }
    ];

    try {
      const { error } = await supabase.from('email_workflows').insert(defaultWorkflows);
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Default email workflows created successfully"
      });
      fetchEmailData();
    } catch (error) {
      console.error('Error creating workflows:', error);
      toast({
        title: "Error",
        description: "Failed to create default workflows",
        variant: "destructive"
      });
    }
  };

  const saveTemplate = async (templateData) => {
    try {
      const { error } = await supabase.from('email_templates').insert({
        organization_id: currentOrganization.id,
        name: templateData.name,
        subject: templateData.subject,
        content: templateData.content,
        html_content: templateData.htmlContent,
        template_type: 'custom'
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Email template saved successfully"
      });
      
      setShowBuilder(false);
      fetchEmailData();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error", 
        description: "Failed to save template",
        variant: "destructive"
      });
    }
  };

  const sendTestEmail = async (templateId, recipientEmail) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) return;

      const { error } = await supabase.functions.invoke('send-marketing-email', {
        body: {
          type: 'single',
          organizationId: currentOrganization.id,
          templateId: template.id,
          subject: `TEST: ${template.subject}`,
          htmlContent: template.html_content,
          toEmail: recipientEmail,
          fromName: currentOrganization.name
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Test email sent successfully"
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive"
      });
    }
  };

  const toggleWorkflow = async (workflowId, isActive) => {
    try {
      const { error } = await supabase
        .from('email_workflows')
        .update({ is_active: !isActive })
        .eq('id', workflowId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Workflow ${!isActive ? 'activated' : 'paused'}`
      });
      
      fetchEmailData();
    } catch (error) {
      console.error('Error toggling workflow:', error);
      toast({
        title: "Error",
        description: "Failed to update workflow",
        variant: "destructive"
      });
    }
  };

  const createWorkflow = async (workflowData) => {
    try {
      const { error } = await supabase.from('email_workflows').insert({
        ...workflowData,
        organization_id: currentOrganization.id
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Workflow created successfully"
      });
      
      fetchEmailData();
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast({
        title: "Error",
        description: "Failed to create workflow",
        variant: "destructive"
      });
    }
  };

  const addSubscriber = async (subscriberData) => {
    try {
      const { error } = await supabase.from('email_subscribers').insert({
        ...subscriberData,
        organization_id: currentOrganization.id
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subscriber added successfully"
      });
      
      fetchEmailData();
    } catch (error) {
      console.error('Error adding subscriber:', error);
      toast({
        title: "Error",
        description: "Failed to add subscriber",
        variant: "destructive"
      });
    }
  };

  const handleBulkSubscriberAction = async (action, subscriberIds) => {
    try {
      let updateData = {};
      
      switch (action) {
        case 'activate':
          updateData = { is_active: true };
          break;
        case 'deactivate':
          updateData = { is_active: false };
          break;
        case 'delete':
          const { error } = await supabase
            .from('email_subscribers')
            .delete()
            .in('id', subscriberIds);
          
          if (error) throw error;
          toast({
            title: "Success",
            description: `${subscriberIds.length} subscriber(s) deleted`
          });
          fetchEmailData();
          return;
      }

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('email_subscribers')
          .update(updateData)
          .in('id', subscriberIds);

        if (error) throw error;

        toast({
          title: "Success",
          description: `${subscriberIds.length} subscriber(s) updated`
        });
        fetchEmailData();
      }
    } catch (error) {
      console.error('Error with bulk action:', error);
      toast({
        title: "Error",
        description: "Failed to perform bulk action",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="p-6">Loading email marketing data...</div>;
  }

  if (showBuilder) {
    return (
      <div className="h-[calc(100vh-200px)]">
        <EmailBuilder
          templateId={selectedTemplate?.id}
          onSave={saveTemplate}
          onPreview={(html) => {
            setPreviewHtml(html);
            setShowPreview(true);
          }}
        />
        <div className="fixed top-4 right-4 z-50">
          <Button onClick={() => setShowBuilder(false)}>
            Back to Email Marketing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Marketing</h1>
          <p className="text-muted-foreground">
            Complete email marketing automation with Resend integration
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setShowBuilder(true)}>
            <Palette className="h-4 w-4 mr-2" />
            Visual Builder
          </Button>
          {workflows.length === 0 && (
            <Button onClick={createDefaultWorkflows}>
              <Zap className="h-4 w-4 mr-2" />
              Setup Default Workflows
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSubscribers}</div>
            <p className="text-xs text-muted-foreground">Active subscribers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Open Rate</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.openRate}%</div>
            <p className="text-xs text-muted-foreground">Across all campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Through Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.clickRate}%</div>
            <p className="text-xs text-muted-foreground">Email engagement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.emailsSent}</div>
            <p className="text-xs text-muted-foreground">Total sent this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="workflows" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Workflows</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span>Templates</span>
          </TabsTrigger>
          <TabsTrigger value="subscribers" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Subscribers</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          <WorkflowManager
            workflows={workflows}
            onToggle={toggleWorkflow}
            onEdit={(workflow) => console.log('Edit workflow:', workflow)}
            onDelete={(id) => console.log('Delete workflow:', id)}
            onCreate={createWorkflow}
          />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-semibold">Email Templates</h3>
              <p className="text-muted-foreground">Create and manage reusable email templates</p>
            </div>
            <Button onClick={() => setShowBuilder(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
          
          {templates.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center">
                <Palette className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Templates Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create beautiful email templates with our visual builder.
                </p>
                <Button onClick={() => setShowBuilder(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{template.name}</h3>
                          <Badge variant="outline" className="text-xs mt-1">
                            {template.template_type}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        Subject: {template.subject}
                      </p>
                      
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(template.created_at).toLocaleDateString()}
                      </p>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1">
                              <Eye className="h-3 w-3 mr-1" />
                              Preview
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                            <DialogHeader>
                              <DialogTitle>{template.name} Preview</DialogTitle>
                            </DialogHeader>
                            <div
                              className="border rounded-lg p-4 bg-white"
                              dangerouslySetInnerHTML={{ __html: template.html_content }}
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <div className="flex items-center space-x-2">
                          <Input
                            placeholder="test@email.com"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            className="text-xs"
                          />
                          <Button 
                            size="sm" 
                            onClick={() => sendTestEmail(template.id, testEmail)}
                            disabled={!testEmail}
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="subscribers" className="space-y-4">
          <SubscriberManager
            subscribers={subscribers}
            onAdd={addSubscriber}
            onUpdate={(id, data) => console.log('Update subscriber:', id, data)}
            onDelete={(id) => console.log('Delete subscriber:', id)}
            onBulkAction={handleBulkSubscriberAction}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div>
            <h3 className="text-2xl font-semibold mb-4">Email Analytics</h3>
            
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Performance</CardTitle>
                  <CardDescription>Detailed analytics for your email campaigns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-20 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                    <p>Detailed analytics will appear here once you start sending campaigns.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div>
            <h3 className="text-2xl font-semibold mb-4">Email Settings</h3>
            
            <Card>
              <CardHeader>
                <CardTitle>Sender Settings</CardTitle>
                <CardDescription>Configure your email sender information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">From Name</label>
                    <Input placeholder={currentOrganization?.name} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">From Email</label>
                    <Input placeholder="noreply@yourstore.com" />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Reply-To Email</label>
                  <Input placeholder="support@yourstore.com" />
                </div>
                
                <Button>Save Settings</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          <div
            className="border rounded-lg p-4 bg-white"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}