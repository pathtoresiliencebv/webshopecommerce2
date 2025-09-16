import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Users, UserPlus, Settings, Mail, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function AdminUsers() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');

  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ['organization-users', currentOrganization?.id],
    queryFn: async () => {
      // Mock data until database migration is approved
      return [
        {
          id: '1',
          name: 'Admin Gebruiker',
          email: 'admin@example.com',
          role: 'owner',
          status: 'active',
          lastActive: new Date().toLocaleDateString('nl-NL')
        }
      ];
    },
    enabled: !!currentOrganization?.id
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      // In a real implementation, this would send an invitation email
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({
        title: "Uitnodiging verzonden",
        description: `Een uitnodiging is verzonden naar ${inviteEmail}`
      });
      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('staff');
    }
  });

  if (!currentOrganization) {
    return <div className="text-center py-8">Geen organisatie geselecteerd</div>;
  }

  const getRoleBadge = (role: string) => {
    const config = {
      owner: { variant: 'default' as const, label: 'Eigenaar' },
      admin: { variant: 'secondary' as const, label: 'Admin' },
      manager: { variant: 'outline' as const, label: 'Manager' },
      staff: { variant: 'outline' as const, label: 'Medewerker' },
      viewer: { variant: 'outline' as const, label: 'Kijker' }
    };
    
    const roleConfig = config[role as keyof typeof config] || config.viewer;
    return <Badge variant={roleConfig.variant}>{roleConfig.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gebruikers & Machtigingen</h1>
          <p className="text-muted-foreground mt-1">
            Beheer teamleden en hun toegangsrechten
          </p>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Gebruiker Uitnodigen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nieuwe Gebruiker Uitnodigen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email adres</label>
                <Input 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="gebruiker@example.com"
                  type="email"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Rol</label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Medewerker</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => inviteMutation.mutate()} 
                disabled={!inviteEmail || inviteMutation.isPending}
                className="w-full"
              >
                {inviteMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verzenden...</>
                ) : (
                  'Uitnodiging Verzenden'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{teamMembers.length}</p>
                <p className="text-sm text-muted-foreground">Totaal Gebruikers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Settings className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{teamMembers.filter(m => m.status === 'active').length}</p>
                <p className="text-sm text-muted-foreground">Actieve Gebruikers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Mail className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Uitnodigingen</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>Teamleden</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Laatst actief: {member.lastActive}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getRoleBadge(member.role)}
                  <Button variant="outline" size="sm">
                    Bewerken
                  </Button>
                </div>
              </div>
            ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Rol Machtigingen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="default">Eigenaar</Badge>
                </div>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Volledige toegang</li>
                  <li>• Gebruikers beheren</li>
                  <li>• Facturen en abonnement</li>
                  <li>• Store instellingen</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary">Admin</Badge>
                </div>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Store beheer</li>
                  <li>• Producten beheren</li>
                  <li>• Orders verwerken</li>
                  <li>• Klanten beheren</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline">Medewerker</Badge>
                </div>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Orders bekijken</li>
                  <li>• Klanten support</li>
                  <li>• Voorraad beheren</li>
                  <li>• Geen instellingen</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}