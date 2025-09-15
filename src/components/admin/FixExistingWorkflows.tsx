import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Zap, CheckCircle } from 'lucide-react';

export function FixExistingWorkflows() {
  const { currentOrganization } = useOrganization();
  const [isFixing, setIsFixing] = useState(false);
  const [isFixed, setIsFixed] = useState(false);

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

  const fixExistingWorkflows = async () => {
    setIsFixing(true);
    
    try {
      // Get all workflows without campaigns
      const { data: workflows, error: workflowError } = await supabase
        .from('email_workflows')
        .select(`
          *,
          campaigns:email_campaigns(count)
        `)
        .eq('organization_id', currentOrganization.id);

      if (workflowError) throw workflowError;

      const workflowsNeedingCampaigns = workflows.filter(w => !w.campaigns || w.campaigns.length === 0);

      for (const workflow of workflowsNeedingCampaigns) {
        const workflowTemplates = getWorkflowEmailTemplates(workflow.workflow_type);
        
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
      }

      setIsFixed(true);
      toast({
        title: "Success",
        description: `Fixed ${workflowsNeedingCampaigns.length} workflows with email campaigns`
      });
    } catch (error) {
      console.error('Error fixing workflows:', error);
      toast({
        title: "Error",
        description: "Failed to fix existing workflows",
        variant: "destructive"
      });
    } finally {
      setIsFixing(false);
    }
  };

  if (isFixed) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <h3 className="text-lg font-medium mb-2 text-green-700">Workflows Fixed!</h3>
          <p className="text-muted-foreground">
            All your existing workflows now have editable email campaigns.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5" />
          <span>Fix Existing Workflows</span>
        </CardTitle>
        <CardDescription>
          Your existing workflows need email campaigns to be editable. Click below to automatically create campaigns for all workflows.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={fixExistingWorkflows} disabled={isFixing}>
          {isFixing ? 'Fixing Workflows...' : 'Fix All Workflows'}
        </Button>
      </CardContent>
    </Card>
  );
}