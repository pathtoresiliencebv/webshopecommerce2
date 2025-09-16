import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Save, 
  AlertTriangle,
  MessageCircle,
  Clock,
  Shield,
  Zap
} from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface AISettings {
  model_preference: 'smart_routing' | 'gpt-4o-mini' | 'gpt-3.5-turbo';
  confidence_threshold: number;
  auto_escalation: boolean;
  business_hours: {
    enabled: boolean;
    timezone: string;
    schedule: {
      [key: string]: { start: string; end: string; enabled: boolean };
    };
  };
  response_tone: 'professional' | 'friendly' | 'casual' | 'formal';
  escalation_rules: {
    low_confidence: boolean;
    frustration_keywords: boolean;
    repeat_queries: boolean;
    urgent_keywords: boolean;
  };
  customization: {
    greeting_message: string;
    fallback_message: string;
    escalation_message: string;
  };
}

const defaultSettings: AISettings = {
  model_preference: 'smart_routing',
  confidence_threshold: 0.7,
  auto_escalation: true,
  business_hours: {
    enabled: true,
    timezone: 'Europe/Amsterdam',
    schedule: {
      monday: { start: '09:00', end: '18:00', enabled: true },
      tuesday: { start: '09:00', end: '18:00', enabled: true },
      wednesday: { start: '09:00', end: '18:00', enabled: true },
      thursday: { start: '09:00', end: '18:00', enabled: true },
      friday: { start: '09:00', end: '18:00', enabled: true },
      saturday: { start: '10:00', end: '16:00', enabled: true },
      sunday: { start: '10:00', end: '16:00', enabled: false }
    }
  },
  response_tone: 'friendly',
  escalation_rules: {
    low_confidence: true,
    frustration_keywords: true,
    repeat_queries: true,
    urgent_keywords: true
  },
  customization: {
    greeting_message: "Hi there! I'm here to help you with any questions about your orders, products, or account. How can I assist you today?",
    fallback_message: "I'm sorry, I'm having trouble understanding that. Let me connect you with a human agent who can help you better.",
    escalation_message: "I'm connecting you with one of our support specialists who will be able to help you better. Please hold on for just a moment."
  }
};

const AISettingsManager: React.FC = () => {
  const [settings, setSettings] = useState<AISettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  useEffect(() => {
    if (currentOrganization) {
      loadSettings();
    }
  }, [currentOrganization]);

  const loadSettings = async () => {
    if (!currentOrganization?.id) return;

    const { data, error } = await supabase
      .from('store_settings')
      .select('settings')
      .eq('organization_id', currentOrganization.id)
      .eq('setting_type', 'ai_configuration')
      .single();

    if (error) {
      console.log('No AI settings found, using defaults');
      return;
    }

    if (data?.settings) {
      setSettings({ ...defaultSettings, ...(data.settings as Partial<AISettings>) });
    }
  };

  const handleSave = async () => {
    if (!currentOrganization?.id) return;

    setIsLoading(true);
    try {
      const { data: existing } = await supabase
        .from('store_settings')
        .select('id')
        .eq('organization_id', currentOrganization.id)
        .eq('setting_type', 'ai_configuration')
        .single();

      if (existing) {
        // Update existing settings
        const { error } = await supabase
          .from('store_settings')
          .update({
            settings: settings as any,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new settings
        const { error } = await supabase
          .from('store_settings')
          .insert({
            organization_id: currentOrganization.id,
            setting_type: 'ai_configuration',
            settings: settings as any
          });

        if (error) throw error;
      }

      setHasChanges(false);
      toast({
        title: "Settings Saved",
        description: "AI configuration has been updated successfully"
      });

    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save AI settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = (path: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current: any = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
    setHasChanges(true);
  };

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">AI Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Configure AI behavior, escalation rules, and customer experience
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || isLoading}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {hasChanges && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">You have unsaved changes</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Model Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            AI Model Configuration
          </CardTitle>
          <CardDescription>
            Configure which AI models to use and performance settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Model Preference</label>
            <select
              value={settings.model_preference}
              onChange={(e) => updateSettings('model_preference', e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              <option value="smart_routing">Smart Routing (Recommended)</option>
              <option value="gpt-4o-mini">GPT-4o Mini (Fast & Accurate)</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast & Cost-Effective)</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Smart routing automatically chooses the best model based on query complexity
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Confidence Threshold: {settings.confidence_threshold}
            </label>
            <input
              type="range"
              min="0.3"
              max="0.9" 
              step="0.1"
              value={settings.confidence_threshold}
              onChange={(e) => updateSettings('confidence_threshold', parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Lower values escalate more often, higher values keep more conversations with AI
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Response Tone</label>
            <select
              value={settings.response_tone}
              onChange={(e) => updateSettings('response_tone', e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Escalation Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Escalation Rules
          </CardTitle>
          <CardDescription>
            Configure when conversations should be escalated to human agents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Auto Escalation</h4>
              <p className="text-sm text-muted-foreground">Enable automatic escalation based on rules</p>
            </div>
            <Switch
              checked={settings.auto_escalation}
              onCheckedChange={(checked) => updateSettings('auto_escalation', checked)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Low Confidence</span>
              <Switch
                checked={settings.escalation_rules.low_confidence}
                onCheckedChange={(checked) => updateSettings('escalation_rules.low_confidence', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Frustration Keywords</span>
              <Switch
                checked={settings.escalation_rules.frustration_keywords}
                onCheckedChange={(checked) => updateSettings('escalation_rules.frustration_keywords', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Repeat Queries</span>
              <Switch
                checked={settings.escalation_rules.repeat_queries}
                onCheckedChange={(checked) => updateSettings('escalation_rules.repeat_queries', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Urgent Keywords</span>
              <Switch
                checked={settings.escalation_rules.urgent_keywords}
                onCheckedChange={(checked) => updateSettings('escalation_rules.urgent_keywords', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Business Hours
          </CardTitle>
          <CardDescription>
            Set business hours for human agent availability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Enable Business Hours</h4>
              <p className="text-sm text-muted-foreground">Auto-escalate outside business hours</p>
            </div>
            <Switch
              checked={settings.business_hours.enabled}
              onCheckedChange={(checked) => updateSettings('business_hours.enabled', checked)}
            />
          </div>

          {settings.business_hours.enabled && (
            <div className="space-y-3">
              {daysOfWeek.map(day => (
                <div key={day.key} className="flex items-center gap-4">
                  <div className="w-20">
                    <Switch
                      checked={settings.business_hours.schedule[day.key].enabled}
                      onCheckedChange={(checked) => 
                        updateSettings(`business_hours.schedule.${day.key}.enabled`, checked)
                      }
                    />
                  </div>
                  <div className="w-20 text-sm">{day.label}</div>
                  <Input
                    type="time"
                    value={settings.business_hours.schedule[day.key].start}
                    onChange={(e) => 
                      updateSettings(`business_hours.schedule.${day.key}.start`, e.target.value)
                    }
                    disabled={!settings.business_hours.schedule[day.key].enabled}
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={settings.business_hours.schedule[day.key].end}
                    onChange={(e) => 
                      updateSettings(`business_hours.schedule.${day.key}.end`, e.target.value)
                    }
                    disabled={!settings.business_hours.schedule[day.key].enabled}
                    className="w-32"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Customization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Message Customization
          </CardTitle>
          <CardDescription>
            Customize AI messages for your brand voice
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Greeting Message</label>
            <Textarea
              value={settings.customization.greeting_message}
              onChange={(e) => updateSettings('customization.greeting_message', e.target.value)}
              placeholder="Enter welcome message..."
              rows={2}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Fallback Message</label>
            <Textarea
              value={settings.customization.fallback_message}
              onChange={(e) => updateSettings('customization.fallback_message', e.target.value)}
              placeholder="Message when AI can't understand..."
              rows={2}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Escalation Message</label>
            <Textarea
              value={settings.customization.escalation_message}
              onChange={(e) => updateSettings('customization.escalation_message', e.target.value)}
              placeholder="Message when escalating to human agent..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AISettingsManager;