import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { EmailBuilder } from './email/EmailBuilder';
import { WorkflowManager } from './email/WorkflowManager';
import { SubscriberManager } from './email/SubscriberManager';
import { WorkflowScheduler } from './email/WorkflowScheduler';
import { CampaignManager } from './email/CampaignManager';
import { FixExistingWorkflows } from './FixExistingWorkflows';
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
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingWorkflowId, setDeletingWorkflowId] = useState(null);
  const [showCampaignManager, setShowCampaignManager] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchEmailData();
    }
  }, [currentOrganization]);

  const fetchEmailData = async () => {
    setLoading(true);
    try {
      const [workflowsRes, templatesRes, subscribersRes, campaignsRes, sendsRes] = await Promise.all([
        supabase.from('email_workflows').select(`
          *,
          campaigns:email_campaigns(*)
        `).eq('organization_id', currentOrganization.id),
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
      const { createCampaigns, ...workflowInsertData } = workflowData;
      
      // Create workflow first
      const { data: workflow, error } = await supabase
        .from('email_workflows')
        .insert({
          ...workflowInsertData,
          organization_id: currentOrganization.id
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-create campaigns if requested
      if (createCampaigns) {
        await createCampaignsForWorkflow(workflow);
      }

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

  const createCampaignsForWorkflow = async (workflow) => {
    const workflowTemplates = getWorkflowEmailTemplates(workflow.workflow_type);
    
    try {
      for (const [index, template] of workflowTemplates.entries()) {
        // Create email template first
        const { data: templateData, error: templateError } = await supabase
          .from('email_templates')
          .insert({
            organization_id: currentOrganization.id,
            name: `${workflow.name} - ${template.name}`,
            subject: template.subject,
            html_content: template.htmlContent,
            content: { blocks: [] },
            template_type: 'workflow'
          })
          .select()
          .single();

        if (templateError) throw templateError;

        // Create campaign
        const { error: campaignError } = await supabase
          .from('email_campaigns')
          .insert({
            organization_id: currentOrganization.id,
            workflow_id: workflow.id,
            template_id: templateData.id,
            name: template.name,
            subject: template.subject,
            delay_hours: template.delay,
            sequence_order: index + 1,
            is_active: true
          });

        if (campaignError) throw campaignError;
      }
    } catch (error) {
      console.error('Error creating campaigns:', error);
      // Don't throw here as workflow is already created
    }
  };

  const getWorkflowEmailTemplates = (workflowType: string) => {
    const templates = {
      welcome_series: [
        {
          name: "Welcome Email",
          subject: "Welkom bij {{store_name}}! Hier is je 10% korting",
          delay: 0,
          htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Welkom bij {{store_name}}!</h1>
            <p>Bedankt voor je inschrijving. Hier is je welkomstkorting van 10%!</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{shop_url}}" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">Shop Nu</a>
            </div>
          </div>`
        },
        {
          name: "Bestsellers Showcase", 
          subject: "Ontdek onze bestsellers",
          delay: 24,
          htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Onze Bestsellers</h1>
            <p>Ontdek wat andere klanten het meest kopen!</p>
          </div>`
        },
        {
          name: "Design Tips",
          subject: "Design tips voor je perfecte werkplek", 
          delay: 168,
          htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Design Tips</h1>
            <p>Maak je werkplek perfect met deze tips!</p>
          </div>`
        },
        {
          name: "Special Offer",
          subject: "Speciale aanbieding alleen voor jou",
          delay: 336,
          htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Speciale Aanbieding</h1>
            <p>Exclusief voor jou: 15% korting op je volgende bestelling!</p>
          </div>`
        }
      ],
      cart_abandonment: [
        {
          name: "Cart Reminder",
          subject: "Je vergat iets moois in je winkelwagen",
          delay: 1,
          htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Je hebt iets laten staan...</h1>
            <p>Kom terug en voltooi je bestelling!</p>
          </div>`
        },
        {
          name: "Incentive Offer",
          subject: "Nog steeds geïnteresseerd? 5% extra korting!",
          delay: 24,
          htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">5% Extra Korting!</h1>
            <p>Krijg extra korting op je winkelwagen items.</p>
          </div>`
        },
        {
          name: "Final Notice",
          subject: "Laatste kans - je favorieten wachten nog",
          delay: 72,
          htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Laatste Kans!</h1>
            <p>Je items zijn bijna uitverkocht...</p>
          </div>`
        }
      ],
      post_purchase: [
        {
          name: "Order Confirmation",
          subject: "Bedankt voor je bestelling #{{order_number}}!",
          delay: 0,
          htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Bedankt voor je bestelling!</h1>
            <p>We pakken je bestelling met zorg in en verzenden zo snel mogelijk.</p>
          </div>`
        },
        {
          name: "Shipping Notification",
          subject: "Je bestelling is onderweg!",
          delay: 24,
          htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Je bestelling is onderweg!</h1>
            <p>Track je bestelling met de bijgevoegde trackingcode.</p>
          </div>`
        },
        {
          name: "Review Request",
          subject: "Hoe bevalt je nieuwe {{product_name}}?",
          delay: 120,
          htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Hoe bevalt je aankoop?</h1>
            <p>Deel je ervaring en help andere klanten!</p>
          </div>`
        },
        {
          name: "Upsell Campaign",
          subject: "Tijd voor een upgrade? Bekijk onze nieuwste collectie",
          delay: 720,
          htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Nieuwe Collectie!</h1>
            <p>Ontdek onze nieuwste producten voor jou geselecteerd.</p>
          </div>`
        }
      ],
      winback_campaign: [
        {
          name: "We Miss You",
          subject: "We missen je! Kom terug met 20% korting",
          delay: 0,
          htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">We missen je!</h1>
            <p>Kom terug met 20% korting op alles.</p>
          </div>`
        },
        {
          name: "New Collection",
          subject: "Nieuwe collectie speciaal voor jou",
          delay: 168,
          htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Nieuwe Collectie</h1>
            <p>Bekijk wat er nieuw is sinds je laatste bezoek.</p>
          </div>`
        },
        {
          name: "Last Chance",
          subject: "Laatste kans: 25% korting vervalt binnenkort",
          delay: 336,
          htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Laatste Kans!</h1>
            <p>Je 25% korting vervalt binnenkort - gebruik hem nu!</p>
          </div>`
        }
      ]
    };

    return templates[workflowType] || [];
  };

  const editWorkflow = async (workflowData) => {
    try {
      const { error } = await supabase
        .from('email_workflows')
        .update({
          name: workflowData.name,
          workflow_type: workflowData.workflow_type,
          trigger_event: workflowData.trigger_event,
          trigger_conditions: workflowData.trigger_conditions
        })
        .eq('id', workflowData.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Workflow updated successfully"
      });
      
      fetchEmailData();
      setShowEditDialog(false);
      setEditingWorkflow(null);
    } catch (error) {
      console.error('Error updating workflow:', error);
      toast({
        title: "Error",
        description: "Failed to update workflow",
        variant: "destructive"
      });
    }
  };

  const deleteWorkflow = async (workflowId) => {
    try {
      const { error } = await supabase
        .from('email_workflows')
        .delete()
        .eq('id', workflowId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Workflow deleted successfully"
      });
      
      fetchEmailData();
      setShowDeleteDialog(false);
      setDeletingWorkflowId(null);
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast({
        title: "Error",
        description: "Failed to delete workflow",
        variant: "destructive"
      });
    }
  };

  const handleEditWorkflow = (workflow) => {
    setEditingWorkflow(workflow);
    setShowEditDialog(true);
  };

  const handleDeleteWorkflow = (id) => {
    setDeletingWorkflowId(id);
    setShowDeleteDialog(true);
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

  const handleManageCampaigns = (workflow: any) => {
    setSelectedWorkflow(workflow);
    setShowCampaignManager(true);
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

  if (showCampaignManager && selectedWorkflow) {
    return (
      <CampaignManager
        workflow={selectedWorkflow}
        organizationId={currentOrganization.id}
        onBack={() => {
          setShowCampaignManager(false);
          setSelectedWorkflow(null);
        }}
      />
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

      {/* Show fix workflows component if there are workflows without campaigns */}
      {workflows.length > 0 && workflows.some(w => !w.campaigns || w.campaigns.length === 0) && (
        <FixExistingWorkflows />
      )}

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
        <TabsList className="grid w-full grid-cols-6">
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
          <TabsTrigger value="scheduler" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Scheduler</span>
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
                    onEdit={handleEditWorkflow}
                    onDelete={handleDeleteWorkflow}
                    onCreate={createWorkflow}
                    onManageCampaigns={handleManageCampaigns}
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

        <TabsContent value="scheduler">
          <WorkflowScheduler onRefresh={fetchEmailData} />
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

      {/* Edit Workflow Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Workflow</DialogTitle>
          </DialogHeader>
          {editingWorkflow && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Workflow Name</label>
                <Input
                  value={editingWorkflow.name}
                  onChange={(e) => setEditingWorkflow({ ...editingWorkflow, name: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Workflow Type</label>
                <Select 
                  value={editingWorkflow.workflow_type} 
                  onValueChange={(value) => setEditingWorkflow({ ...editingWorkflow, workflow_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome_series">Welcome Series</SelectItem>
                    <SelectItem value="cart_abandonment">Cart Abandonment</SelectItem>
                    <SelectItem value="browse_abandonment">Browse Abandonment</SelectItem>
                    <SelectItem value="post_purchase">Post Purchase</SelectItem>
                    <SelectItem value="winback_campaign">Win-back Campaign</SelectItem>
                    <SelectItem value="restock_notification">Restock Notification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Trigger Event</label>
                <Select 
                  value={editingWorkflow.trigger_event} 
                  onValueChange={(value) => setEditingWorkflow({ ...editingWorkflow, trigger_event: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newsletter_signup">Newsletter Signup</SelectItem>
                    <SelectItem value="order_placed">Order Placed</SelectItem>
                    <SelectItem value="cart_add">Cart Add</SelectItem>
                    <SelectItem value="cart_abandon">Cart Abandon</SelectItem>
                    <SelectItem value="product_view">Product View</SelectItem>
                    <SelectItem value="browse_abandon">Browse Abandon</SelectItem>
                    <SelectItem value="order_status_changed">Order Status Changed</SelectItem>
                    <SelectItem value="customer_inactive">Customer Inactive</SelectItem>
                    <SelectItem value="product_restock">Product Restock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => editWorkflow(editingWorkflow)}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workflow? This action cannot be undone and will stop all related automated emails.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteWorkflow(deletingWorkflowId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Workflow
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}