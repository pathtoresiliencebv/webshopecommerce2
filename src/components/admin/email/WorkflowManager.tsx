import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Zap, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Plus,
  Settings,
  Users,
  Mail,
  Clock,
  Target
} from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  workflow_type: string;
  trigger_event: string;
  trigger_conditions: any;
  is_active: boolean;
  created_at: string;
  campaigns?: any[];
}

interface WorkflowManagerProps {
  workflows: Workflow[];
  onToggle: (id: string, isActive: boolean) => void;
  onEdit: (workflow: Workflow) => void;
  onDelete: (id: string) => void;
  onCreate: (workflow: any) => void;
  onManageCampaigns: (workflow: Workflow) => void;
}

export function WorkflowManager({ 
  workflows, 
  onToggle, 
  onEdit, 
  onDelete, 
  onCreate,
  onManageCampaigns 
}: WorkflowManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    workflow_type: 'custom',
    trigger_event: 'manual',
    trigger_conditions: {},
    description: ''
  });

const workflowTypes = [
  { 
    value: 'welcome_series', 
    label: 'Welcome Series', 
    description: 'Verwelkom nieuwe klanten met 4 emails over 2 weken',
    emails: [
      { delay: 0, subject: 'Welkom bij {{store_name}}! Hier is je 10% korting', content: 'welcome_email_1' },
      { delay: 24, subject: 'Ontdek onze bestsellers', content: 'welcome_email_2' },
      { delay: 168, subject: 'Design tips voor je perfecte werkplek', content: 'welcome_email_3' },
      { delay: 336, subject: 'Speciale aanbieding alleen voor jou', content: 'welcome_email_4' }
    ]
  },
  { 
    value: 'cart_abandonment', 
    label: 'Winkelwagen Verlaten', 
    description: 'Win verlaten winkelwagentjes terug met 3 gerichte emails',
    emails: [
      { delay: 1, subject: 'Je vergat iets moois in je winkelwagen', content: 'cart_abandon_1' },
      { delay: 24, subject: 'Nog steeds geïnteresseerd? 5% extra korting!', content: 'cart_abandon_2' },
      { delay: 72, subject: 'Laatste kans - je favorieten wachten nog', content: 'cart_abandon_3' }
    ]
  },
  { 
    value: 'browse_abandonment', 
    label: 'Browse Verlaten', 
    description: 'Heractiveer bezoekers die producten bekeken maar niet kochten',
    emails: [
      { delay: 2, subject: 'Nog aan het twijfelen over {{product_name}}?', content: 'browse_abandon_1' }
    ]
  },
  { 
    value: 'post_purchase', 
    label: 'Na Aankoop', 
    description: 'Begeleid klanten na hun aankoop met 4 nuttige emails',
    emails: [
      { delay: 0, subject: 'Bedankt voor je bestelling #{{order_number}}!', content: 'order_confirmation' },
      { delay: 24, subject: 'Je bestelling is onderweg!', content: 'order_shipped' },
      { delay: 120, subject: 'Hoe bevalt je nieuwe {{product_name}}?', content: 'review_request' },
      { delay: 720, subject: 'Tijd voor een upgrade? Bekijk onze nieuwste collectie', content: 'upsell_campaign' }
    ]
  },
  { 
    value: 'winback_campaign', 
    label: 'Win-back Campagne', 
    description: 'Heractiveer klanten die 60+ dagen niet actief waren',
    emails: [
      { delay: 0, subject: 'We missen je! Kom terug met 20% korting', content: 'winback_1' },
      { delay: 168, subject: 'Nieuwe collectie speciaal voor jou', content: 'winback_2' },
      { delay: 336, subject: 'Laatste kans: 25% korting vervalt binnenkort', content: 'winback_3' }
    ]
  },
  { 
    value: 'restock_notification', 
    label: 'Weer op Voorraad', 
    description: 'Informeer klanten wanneer uitverkochte producten terug zijn',
    emails: [
      { delay: 0, subject: 'Goed nieuws! {{product_name}} is weer beschikbaar', content: 'restock_notification' }
    ]
  },
];

const triggerEvents = [
  { value: 'newsletter_signup', label: 'Nieuwsbrief Inschrijving' },
  { value: 'order_placed', label: 'Bestelling Geplaatst' },
  { value: 'cart_add', label: 'Product Toegevoegd aan Winkelwagen' },
  { value: 'cart_abandon', label: 'Winkelwagen Verlaten (1 uur)' },
  { value: 'product_view', label: 'Product Bekeken' },
  { value: 'browse_abandon', label: 'Browse Sessie Verlaten (2 uur)' },
  { value: 'order_status_changed', label: 'Bestelling Status Gewijzigd' },
  { value: 'customer_inactive', label: 'Klant Inactief (60 dagen)' },
  { value: 'product_restock', label: 'Product Weer op Voorraad' },
];

  const getWorkflowDescription = (type: string) => {
    const workflowType = workflowTypes.find(w => w.value === type);
    return workflowType?.description || 'Aangepaste workflow';
  };

  const getWorkflowEmails = (type: string) => {
    const workflowType = workflowTypes.find(w => w.value === type);
    return workflowType?.emails || [];
  };

  const getWorkflowStats = (workflow: Workflow) => {
    const workflowEmails = getWorkflowEmails(workflow.workflow_type);
    const campaigns = workflowEmails.length || workflow.campaigns?.length || 0;
    const subscribers = Math.floor(Math.random() * 500) + 50; // Mock data - in real implementation, calculate from email_subscribers
    const performance = Math.floor(Math.random() * 40) + 15; // Mock conversion rate - calculate from email_events
    
    return { campaigns, subscribers, performance };
  };

  const handleCreateWorkflow = async () => {
    if (!newWorkflow.name.trim()) return;
    
    const selectedWorkflowType = workflowTypes.find(w => w.value === newWorkflow.workflow_type);
    
    // Create the workflow with proper trigger conditions
    const workflowData = {
      ...newWorkflow,
      trigger_conditions: {
        delay_hours: selectedWorkflowType?.emails?.[0]?.delay || 24,
        emails_count: selectedWorkflowType?.emails?.length || 1,
        ...newWorkflow.trigger_conditions
      }
    };
    
    await onCreate(workflowData);
    
    setNewWorkflow({
      name: '',
      workflow_type: 'welcome_series',
      trigger_event: 'newsletter_signup', 
      trigger_conditions: {},
      description: ''
    });
    setShowCreateDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold">Email Workflows</h3>
          <p className="text-muted-foreground">Automated email sequences for customer engagement</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Workflow Name</label>
                <Input
                  placeholder="e.g. Welcome Series for New Customers"
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Workflow Type</label>
                <Select 
                  value={newWorkflow.workflow_type} 
                  onValueChange={(value) => setNewWorkflow({ ...newWorkflow, workflow_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {workflowTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Trigger Event</label>
                <Select 
                  value={newWorkflow.trigger_event} 
                  onValueChange={(value) => setNewWorkflow({ ...newWorkflow, trigger_event: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerEvents.map(event => (
                      <SelectItem key={event.value} value={event.value}>
                        {event.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Description (Optional)</label>
                <Textarea
                  placeholder="Describe what this workflow does..."
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWorkflow}>
                  Create Workflow
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {workflows.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Email Workflows</h3>
            <p className="text-muted-foreground mb-4">
              Create automated email sequences to engage customers throughout their journey.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {workflows.map((workflow) => {
            const stats = getWorkflowStats(workflow);
            return (
              <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">{workflow.name}</h3>
                        <Badge 
                          variant={workflow.is_active ? "default" : "secondary"}
                          className={workflow.is_active ? "bg-green-100 text-green-800" : ""}
                        >
                          {workflow.is_active ? (
                            <>
                              <Play className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <Pause className="h-3 w-3 mr-1" />
                              Paused
                            </>
                          )}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {workflow.workflow_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-4">
                        {getWorkflowDescription(workflow.workflow_type)}
                      </p>
                      
                      <div className="grid grid-cols-4 gap-4">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">{stats.campaigns}</div>
                            <div className="text-xs text-muted-foreground">Emails</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">{stats.subscribers}</div>
                            <div className="text-xs text-muted-foreground">Subscribers</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">{stats.performance}%</div>
                            <div className="text-xs text-muted-foreground">Conversion</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">
                              {workflow.trigger_conditions?.delay_hours || 24}h
                            </div>
                            <div className="text-xs text-muted-foreground">Delay</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onManageCampaigns(workflow)}
                        title="Manage Email Sequence"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggle(workflow.id, workflow.is_active)}
                      >
                        {workflow.is_active ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(workflow)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(workflow.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      
      {workflows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pre-Built Workflow Templates</CardTitle>
            <CardDescription>
              Quick-start templates for common e-commerce email sequences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflowTypes.filter(type => 
                !workflows.some(w => w.workflow_type === type.value)
              ).map(template => (
                <Card key={template.value} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">{template.label}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        setNewWorkflow({
                          name: template.label,
                          workflow_type: template.value,
                          trigger_event: template.value === 'welcome_series' ? 'newsletter_signup' : 
                                        template.value === 'cart_abandonment' ? 'cart_abandon' :
                                        template.value === 'browse_abandonment' ? 'browse_abandon' :
                                        template.value === 'post_purchase' ? 'order_placed' :
                                        template.value === 'winback_campaign' ? 'customer_inactive' :
                                        template.value === 'restock_notification' ? 'product_restock' : 'newsletter_signup',
                          trigger_conditions: {},
                          description: template.description
                        });
                        setShowCreateDialog(true);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}