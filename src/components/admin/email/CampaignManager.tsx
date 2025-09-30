import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EmailBuilder } from './EmailBuilder';
import { 
  Mail, 
  Clock, 
  Edit, 
  Eye, 
  Trash2, 
  Plus,
  ArrowLeft,
  Send
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  delay_hours: number;
  sequence_order: number;
  template_id?: string;
  is_active: boolean;
  template?: {
    name: string;
    html_content: string;
  };
}

interface CampaignManagerProps {
  workflow: {
    id: string;
    name: string;
    workflow_type: string;
  };
  onBack: () => void;
  organizationId: string;
}

export function CampaignManager({ workflow, onBack, organizationId }: CampaignManagerProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, [workflow.id]);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select(`
          *,
          template:email_templates(name, html_content)
        `)
        .eq('workflow_id', workflow.id)
        .order('sequence_order');

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to load email campaigns",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultCampaigns = async () => {
    const workflowTemplates = getWorkflowEmailTemplates(workflow.workflow_type);
    
    try {
      for (const [index, template] of workflowTemplates.entries()) {
        // Create email template first
        const { data: templateData, error: templateError } = await supabase
          .from('email_templates')
          .insert({
            organization_id: organizationId,
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
            organization_id: organizationId,
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

      await fetchCampaigns();
      
      toast({
        title: "Success",
        description: `Created ${workflowTemplates.length} email campaigns for this workflow`
      });
    } catch (error) {
      console.error('Error creating campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to create default campaigns",
        variant: "destructive"
      });
    }
  };

  const editCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowBuilder(true);
  };

  const handleSaveTemplate = async (templateData: any) => {
    if (!selectedCampaign) return;

    try {
      let templateId = selectedCampaign.template_id;

      if (templateId) {
        // Update existing template
        const { error: updateError } = await supabase
          .from('email_templates')
          .update({
            name: templateData.name,
            subject: templateData.subject,
            html_content: templateData.htmlContent,
            content: templateData.content || { blocks: [] }
          })
          .eq('id', templateId);

        if (updateError) throw updateError;
      } else {
        // Create new template
        const { data: newTemplate, error: createError } = await supabase
          .from('email_templates')
          .insert({
            organization_id: organizationId,
            name: templateData.name,
            subject: templateData.subject,
            html_content: templateData.htmlContent,
            content: templateData.content || { blocks: [] },
            template_type: 'workflow'
          })
          .select()
          .single();

        if (createError) throw createError;
        templateId = newTemplate.id;
      }

      // Update campaign
      const { error: campaignError } = await supabase
        .from('email_campaigns')
        .update({
          subject: templateData.subject,
          template_id: templateId
        })
        .eq('id', selectedCampaign.id);

      if (campaignError) throw campaignError;

      setShowBuilder(false);
      setSelectedCampaign(null);
      await fetchCampaigns();

      toast({
        title: "Success",
        description: "Email template updated successfully"
      });
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive"
      });
    }
  };

  const previewCampaign = (campaign: Campaign) => {
    if (campaign.template?.html_content) {
      setPreviewHtml(campaign.template.html_content);
      setShowPreview(true);
    } else {
      toast({
        title: "No template",
        description: "This email doesn't have a template yet. Create one first.",
        variant: "destructive"
      });
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('email_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      await fetchCampaigns();
      
      toast({
        title: "Success",
        description: "Email campaign deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive"
      });
    }
  };

  if (showBuilder && selectedCampaign) {
    return (
      <EmailBuilder
        templateId={selectedCampaign.template_id}
        campaignId={selectedCampaign.id}
        workflowType={workflow.workflow_type}
        onSave={handleSaveTemplate}
        onPreview={setPreviewHtml}
        onBack={() => {
          setShowBuilder(false);
          setSelectedCampaign(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workflows
          </Button>
          <div>
            <h3 className="text-2xl font-semibold">Manage Email Sequence</h3>
            <p className="text-muted-foreground">
              {workflow.name} • {campaigns.length} emails in sequence
            </p>
          </div>
        </div>
        
        {campaigns.length === 0 && (
          <Button onClick={createDefaultCampaigns}>
            <Plus className="h-4 w-4 mr-2" />
            Create Default Emails
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-muted-foreground">Loading email campaigns...</div>
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Email Sequence</h3>
            <p className="text-muted-foreground mb-4">
              This workflow doesn't have any email campaigns yet. Create a default sequence based on the workflow type.
            </p>
            <Button onClick={createDefaultCampaigns}>
              <Plus className="h-4 w-4 mr-2" />
              Create Default Email Sequence
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Email Sequence</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Email Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Delay</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <Badge variant="outline">#{campaign.sequence_order}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{campaign.subject}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                        {campaign.delay_hours === 0 ? 'Immediate' : `${campaign.delay_hours}h`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={campaign.template_id ? "default" : "secondary"}>
                        {campaign.template_id ? "Ready" : "No Template"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={campaign.is_active ? "default" : "secondary"}>
                        {campaign.is_active ? "Active" : "Paused"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => editCampaign(campaign)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => previewCampaign(campaign)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCampaign(campaign.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          <div 
            className="overflow-auto border rounded-lg"
            style={{ maxHeight: '60vh' }}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Pre-built email templates for different workflow types
function getWorkflowEmailTemplates(workflowType: string) {
  const templates = {
    welcome_series: [
      {
        name: "Welcome Email",
        subject: "Welkom bij {{store_name}}! Hier is je 10% korting",
        delay: 0,
        htmlContent: generateWelcomeEmail1()
      },
      {
        name: "Bestsellers Showcase", 
        subject: "Ontdek onze bestsellers",
        delay: 24,
        htmlContent: generateBestsellersEmail()
      },
      {
        name: "Design Tips",
        subject: "Design tips voor je perfecte werkplek", 
        delay: 168,
        htmlContent: generateDesignTipsEmail()
      },
      {
        name: "Special Offer",
        subject: "Speciale aanbieding alleen voor jou",
        delay: 336,
        htmlContent: generateSpecialOfferEmail()
      }
    ],
    cart_abandonment: [
      {
        name: "Cart Reminder",
        subject: "Je vergat iets moois in je winkelwagen",
        delay: 1,
        htmlContent: generateCartAbandonEmail1()
      },
      {
        name: "Incentive Offer",
        subject: "Nog steeds geïnteresseerd? 5% extra korting!",
        delay: 24,
        htmlContent: generateCartAbandonEmail2()
      },
      {
        name: "Final Notice",
        subject: "Laatste kans - je favorieten wachten nog",
        delay: 72,
        htmlContent: generateCartAbandonEmail3()
      }
    ],
    post_purchase: [
      {
        name: "Order Confirmation",
        subject: "Bedankt voor je bestelling #{{order_number}}!",
        delay: 0,
        htmlContent: generateOrderConfirmationEmail()
      },
      {
        name: "Shipping Notification",
        subject: "Je bestelling is onderweg!",
        delay: 24,
        htmlContent: generateShippingEmail()
      },
      {
        name: "Review Request",
        subject: "Hoe bevalt je nieuwe {{product_name}}?",
        delay: 120,
        htmlContent: generateReviewRequestEmail()
      },
      {
        name: "Upsell Campaign",
        subject: "Tijd voor een upgrade? Bekijk onze nieuwste collectie",
        delay: 720,
        htmlContent: generateUpsellEmail()
      }
    ],
    winback_campaign: [
      {
        name: "We Miss You",
        subject: "We missen je! Kom terug met 20% korting",
        delay: 0,
        htmlContent: generateWinbackEmail1()
      },
      {
        name: "New Collection",
        subject: "Nieuwe collectie speciaal voor jou",
        delay: 168,
        htmlContent: generateWinbackEmail2()
      },
      {
        name: "Last Chance",
        subject: "Laatste kans: 25% korting vervalt binnenkort",
        delay: 336,
        htmlContent: generateWinbackEmail3()
      }
    ]
  };

  return templates[workflowType] || [];
}

// Email template generators
function generateWelcomeEmail1() {
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>Welcome</title></head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
                <tr>
                  <td style="padding: 40px 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 32px; color: #333;">Welkom bij {{store_name}}!</h1>
                    <p style="margin: 20px 0; font-size: 18px; color: #666;">Bedankt voor je inschrijving. Hier is je welkomstcadeau:</p>
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin: 30px 0;">
                      <h2 style="margin: 0; font-size: 24px;">10% KORTING</h2>
                      <p style="margin: 10px 0 0; font-size: 16px;">Code: WELKOM10</p>
                    </div>
                    <a href="{{store_url}}" style="display: inline-block; padding: 15px 30px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">Shop Nu</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function generateBestsellersEmail() {
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>Bestsellers</title></head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
                <tr>
                  <td style="padding: 40px 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px; color: #333;">Onze Bestsellers</h1>
                    <p style="margin: 20px 0; color: #666;">Ontdek waarom deze producten zo geliefd zijn bij onze klanten</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 20px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="48%" style="padding-right: 10px;">
                          <img src="/placeholder.svg" alt="Product 1" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;" />
                          <h3 style="margin: 15px 0 5px; color: #333;">Premium Desk Chair</h3>
                          <p style="margin: 0 0 10px; font-size: 20px; font-weight: bold;">€299.99</p>
                          <a href="#" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px;">Bekijk</a>
                        </td>
                        <td width="48%" style="padding-left: 10px;">
                          <img src="/placeholder.svg" alt="Product 2" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;" />
                          <h3 style="margin: 15px 0 5px; color: #333;">Standing Desk</h3>
                          <p style="margin: 0 0 10px; font-size: 20px; font-weight: bold;">€599.99</p>
                          <a href="#" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px;">Bekijk</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function generateDesignTipsEmail() {
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>Design Tips</title></head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
                <tr>
                  <td style="padding: 40px 20px;">
                    <h1 style="margin: 0; font-size: 28px; color: #333; text-align: center;">5 Tips voor je Perfecte Werkplek</h1>
                    <div style="margin: 30px 0;">
                      <h3 style="color: #333;">1. Ergonomie is Key</h3>
                      <p style="color: #666; line-height: 1.6;">Investeer in een goede bureaustoel en zorg dat je beeldscherm op ooghoogte staat.</p>
                      
                      <h3 style="color: #333;">2. Natuurlijk Licht</h3>
                      <p style="color: #666; line-height: 1.6;">Plaats je bureau bij een raam voor optimaal daglicht en betere productiviteit.</p>
                      
                      <h3 style="color: #333;">3. Organisatie</h3>
                      <p style="color: #666; line-height: 1.6;">Een opgeruimde werkplek helpt je gefocust te blijven en stress te verminderen.</p>
                    </div>
                    <div style="text-align: center;">
                      <a href="{{store_url}}" style="display: inline-block; padding: 15px 30px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px;">Shop Werkplek Essentials</a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function generateSpecialOfferEmail() {
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>Special Offer</title></head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
                <tr>
                  <td style="background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; font-size: 32px; color: white;">Exclusieve Aanbieding!</h1>
                    <p style="margin: 20px 0; font-size: 18px; color: white;">Alleen voor jou als nieuwe klant</p>
                    <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <h2 style="margin: 0; font-size: 36px; color: white;">15% KORTING</h2>
                      <p style="margin: 10px 0 0; color: white;">Op je eerste bestelling boven €150</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 20px; text-align: center;">
                    <p style="margin: 0 0 30px; color: #666; font-size: 16px;">Deze aanbieding is geldig tot {{expiry_date}}</p>
                    <a href="{{store_url}}?discount=NIEUW15" style="display: inline-block; padding: 15px 30px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 18px;">Profiteer Nu</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function generateCartAbandonEmail1() {
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>Cart Reminder</title></head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
                <tr>
                  <td style="padding: 40px 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px; color: #333;">Je vergat iets moois!</h1>
                    <p style="margin: 20px 0; color: #666;">De items in je winkelwagen wachten nog op je</p>
                    <div style="border: 1px solid #eee; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: left;">
                      <h3 style="margin: 0 0 15px; color: #333;">In je winkelwagen:</h3>
                      <div style="display: flex; align-items: center; padding: 10px 0;">
                        <img src="{{product_image}}" alt="{{product_name}}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; margin-right: 15px;" />
                        <div>
                          <h4 style="margin: 0; color: #333;">{{product_name}}</h4>
                          <p style="margin: 5px 0; color: #666;">Aantal: {{quantity}}</p>
                          <p style="margin: 0; font-weight: bold; color: #000;">{{price}}</p>
                        </div>
                      </div>
                    </div>
                    <a href="{{checkout_url}}" style="display: inline-block; padding: 15px 30px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">Bestelling Voltooien</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function generateCartAbandonEmail2() {
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>Special Discount</title></head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
                <tr>
                  <td style="padding: 40px 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px; color: #333;">Nog steeds geïnteresseerd?</h1>
                    <p style="margin: 20px 0; color: #666;">Krijg 5% extra korting op je winkelwagen</p>
                    <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; border-radius: 8px; margin: 30px 0;">
                      <h2 style="margin: 0; font-size: 32px;">5% EXTRA KORTING</h2>
                      <p style="margin: 15px 0 0; font-size: 18px;">Code: COMEBACK5</p>
                    </div>
                    <p style="margin: 20px 0; color: #888; font-size: 14px;">Deze korting is 24 uur geldig</p>
                    <a href="{{checkout_url}}?discount=COMEBACK5" style="display: inline-block; padding: 15px 30px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">Nu Bestellen met Korting</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function generateCartAbandonEmail3() {
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>Final Notice</title></head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
                <tr>
                  <td style="padding: 40px 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px; color: #333;">⏰ Laatste Kans</h1>
                    <p style="margin: 20px 0; color: #666;">Je winkelwagen wordt binnenkort leeggemaakt</p>
                    <div style="border: 1px solid #ff6b6b; background: #fff5f5; padding: 20px; border-radius: 8px; margin: 30px 0;">
                      <p style="margin: 0; color: #d63384; font-weight: bold;">⚠️ Je items worden over 2 uur uit je winkelwagen verwijderd</p>
                    </div>
                    <p style="margin: 20px 0; color: #666;">Mis deze geweldige producten niet!</p>
                    <a href="{{checkout_url}}" style="display: inline-block; padding: 15px 30px; background-color: #ff6b6b; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">Nu Bestellen</a>
                    <div style="margin: 30px 0; padding: 20px 0; border-top: 1px solid #eee;">
                      <p style="margin: 0; color: #888; font-size: 14px;">Of <a href="{{unsubscribe_url}}" style="color: #666;">schrijf je uit</a> voor dit type berichten</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function generateOrderConfirmationEmail() {
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>Order Confirmation</title></head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
                <tr>
                  <td style="padding: 40px 20px; text-align: center;">
                    <div style="background: #d4edda; color: #155724; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                      <h1 style="margin: 0; font-size: 28px;">✅ Bestelling Bevestigd!</h1>
                      <p style="margin: 10px 0 0; font-size: 18px;">Bedankt voor je bestelling #{{order_number}}</p>
                    </div>
                    <div style="text-align: left; border: 1px solid #eee; border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <h3 style="margin: 0 0 15px; color: #333;">Bestelling Details:</h3>
                      <p style="margin: 5px 0; color: #666;"><strong>Bestelnummer:</strong> {{order_number}}</p>
                      <p style="margin: 5px 0; color: #666;"><strong>Totaal:</strong> {{total_amount}}</p>
                      <p style="margin: 5px 0; color: #666;"><strong>Geschatte levering:</strong> {{estimated_delivery}}</p>
                    </div>
                    <p style="margin: 20px 0; color: #666;">Je bestelling wordt met liefde verpakt en zo snel mogelijk verzonden!</p>
                    <a href="{{track_order_url}}" style="display: inline-block; padding: 15px 30px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">Bestelling Volgen</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function generateShippingEmail() {
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>Order Shipped</title></head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
                <!-- Store Logo -->
                <tr>
                  <td style="padding: 30px 20px 0; text-align: center;">
                    <img src="{{store_logo}}" alt="{{store_name}}" style="max-height: 60px; max-width: 200px; height: auto;" />
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px; color: #333;">📦 Je bestelling is onderweg!</h1>
                    <p style="margin: 20px 0; color: #666;">Bestelling #{{order_number}} is verzonden</p>
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; margin: 30px 0;">
                      <h2 style="margin: 0; font-size: 24px;">Track & Trace</h2>
                      <p style="margin: 15px 0 0; font-size: 18px; font-family: monospace;">{{tracking_code}}</p>
                    </div>
                    <p style="margin: 20px 0; color: #666;">Geschatte levering: <strong>{{estimated_delivery}}</strong></p>
                    <a href="{{tracking_url}}" style="display: inline-block; padding: 15px 30px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">Track Je Pakket</a>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 20px; text-align: center; border-top: 1px solid #eee; color: #999; font-size: 12px;">
                    <p style="margin: 0;">{{store_name}} • {{store_address}}</p>
                    <p style="margin: 5px 0 0;">{{store_email}} • {{store_phone}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function generateReviewRequestEmail() {
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>Review Request</title></head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
                <tr>
                  <td style="padding: 40px 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px; color: #333;">Hoe bevalt je nieuwe aankoop?</h1>
                    <p style="margin: 20px 0; color: #666;">We hopen dat je blij bent met {{product_name}}!</p>
                    <div style="text-align: center; margin: 30px 0;">
                      <img src="{{product_image}}" alt="{{product_name}}" style="width: 200px; height: 200px; object-fit: cover; border-radius: 8px;" />
                    </div>
                    <p style="margin: 20px 0; color: #666;">Deel je ervaring met andere klanten en help hen bij hun keuze.</p>
                    <div style="margin: 30px 0;">
                      <a href="{{review_url}}" style="display: inline-block; padding: 15px 30px; background-color: #ffd700; color: #333; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 5px;">⭐ Schrijf een Review</a>
                    </div>
                    <p style="margin: 30px 0; color: #888; font-size: 14px;">Als je niet tevreden bent, neem dan <a href="mailto:{{support_email}}" style="color: #666;">contact met ons op</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function generateUpsellEmail() {
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>Upgrade Your Setup</title></head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
                <tr>
                  <td style="padding: 40px 20px;">
                    <h1 style="margin: 0; font-size: 28px; color: #333; text-align: center;">Tijd voor een upgrade?</h1>
                    <p style="margin: 20px 0; color: #666; text-align: center;">Ontdek onze nieuwste producten die perfect passen bij je recente aankoop</p>
                    <h3 style="margin: 30px 0 20px; color: #333; text-align: center;">Aanbevolen voor jou:</h3>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                      <tr>
                        <td width="48%" style="padding-right: 10px;">
                          <img src="/placeholder.svg" alt="Recommended Product 1" style="width: 100%; height: 180px; object-fit: cover; border-radius: 8px;" />
                          <h4 style="margin: 15px 0 5px; color: #333;">Desk Organizer Set</h4>
                          <p style="margin: 0 0 10px; color: #666; font-size: 14px;">Perfect voor een opgeruimde werkplek</p>
                          <p style="margin: 0 0 15px; font-weight: bold; color: #000;">€49.99</p>
                          <a href="#" style="display: inline-block; padding: 8px 16px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px; font-size: 14px;">Bekijk</a>
                        </td>
                        <td width="48%" style="padding-left: 10px;">
                          <img src="/placeholder.svg" alt="Recommended Product 2" style="width: 100%; height: 180px; object-fit: cover; border-radius: 8px;" />
                          <h4 style="margin: 15px 0 5px; color: #333;">Monitor Stand</h4>
                          <p style="margin: 0 0 10px; color: #666; font-size: 14px;">Ergonomisch en stijlvol</p>
                          <p style="margin: 0 0 15px; font-weight: bold; color: #000;">€79.99</p>
                          <a href="#" style="display: inline-block; padding: 8px 16px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px; font-size: 14px;">Bekijk</a>
                        </td>
                      </tr>
                    </table>
                    <div style="text-align: center; margin: 40px 0;">
                      <a href="{{store_url}}" style="display: inline-block; padding: 15px 30px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">Bekijk Alle Producten</a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function generateWinbackEmail1() {
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>We Miss You</title></head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
                <tr>
                  <td style="padding: 40px 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px; color: #333;">We missen je! 😢</h1>
                    <p style="margin: 20px 0; color: #666; font-size: 18px;">Het is een tijdje geleden sinds je laatste bezoek</p>
                    <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%); padding: 40px; border-radius: 12px; margin: 30px 0;">
                      <h2 style="margin: 0; color: #333; font-size: 32px;">20% KORTING</h2>
                      <p style="margin: 15px 0 0; color: #555; font-size: 18px;">Welkom terug cadeau!</p>
                    </div>
                    <p style="margin: 20px 0; color: #666;">Ontdek wat er nieuw is sinds je laatste bezoek</p>
                    <a href="{{store_url}}?discount=WELKOMTERUG20" style="display: inline-block; padding: 15px 30px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 18px;">Ontdek Nieuwe Producten</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function generateWinbackEmail2() {
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>New Collection</title></head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
                <tr>
                  <td style="padding: 40px 20px;">
                    <h1 style="margin: 0; font-size: 28px; color: #333; text-align: center;">Nieuwe Collectie is Live! 🎉</h1>
                    <p style="margin: 20px 0; color: #666; text-align: center;">Exclusieve nieuwe designs, speciaal voor jou geselecteerd</p>
                    <div style="margin: 30px 0;">
                      <img src="/placeholder.svg" alt="New Collection" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;" />
                    </div>
                    <h3 style="margin: 20px 0; color: #333; text-align: center;">Hoogtepunten uit de nieuwe collectie:</h3>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                      <tr>
                        <td width="48%" style="padding-right: 10px;">
                          <img src="/placeholder.svg" alt="New Product 1" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px;" />
                          <h4 style="margin: 15px 0 5px; color: #333;">Modern Office Chair</h4>
                          <p style="margin: 0 0 15px; font-weight: bold; color: #000;">€399.99</p>
                        </td>
                        <td width="48%" style="padding-left: 10px;">
                          <img src="/placeholder.svg" alt="New Product 2" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px;" />
                          <h4 style="margin: 15px 0 5px; color: #333;">Smart Desk Lamp</h4>
                          <p style="margin: 0 0 15px; font-weight: bold; color: #000;">€129.99</p>
                        </td>
                      </tr>
                    </table>
                    <div style="text-align: center; margin: 40px 0;">
                      <a href="{{store_url}}/collections/new" style="display: inline-block; padding: 15px 30px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">Bekijk Volledige Collectie</a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function generateWinbackEmail3() {
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>Last Chance</title></head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; font-size: 32px;">⏰ Laatste Kans!</h1>
                    <p style="margin: 20px 0; font-size: 18px;">Je 25% korting vervalt over 24 uur</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 20px; text-align: center;">
                    <div style="border: 2px dashed #ff6b6b; background: #fff5f5; padding: 30px; border-radius: 8px; margin: 30px 0;">
                      <h2 style="margin: 0; font-size: 36px; color: #ff6b6b;">25% KORTING</h2>
                      <p style="margin: 15px 0; color: #d63384; font-weight: bold;">Code: LAATSTEKANS25</p>
                      <p style="margin: 0; color: #666; font-size: 14px;">Geldig tot morgen 23:59</p>
                    </div>
                    <p style="margin: 20px 0; color: #666;">Dit is onze hoogste korting van het jaar!</p>
                    <a href="{{store_url}}?discount=LAATSTEKANS25" style="display: inline-block; padding: 15px 30px; background-color: #ff6b6b; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 18px;">Nu Shoppen</a>
                    <div style="margin: 40px 0; padding: 20px 0; border-top: 1px solid #eee;">
                      <p style="margin: 0; color: #888; font-size: 14px;">
                        Dit is onze laatste poging om je terug te winnen. 
                        <a href="{{unsubscribe_url}}" style="color: #666;">Klik hier</a> als je geen interesse meer hebt.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}