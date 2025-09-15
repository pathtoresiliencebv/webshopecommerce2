import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, UserPlus, Settings, Mail } from 'lucide-react';

export function AdminUsers() {
  const teamMembers = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'owner',
      status: 'active',
      lastActive: '2 min geleden'
    },
    {
      id: '2', 
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'admin',
      status: 'active',
      lastActive: '1 uur geleden'
    }
  ];

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
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Gebruiker Uitnodigen
        </Button>
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