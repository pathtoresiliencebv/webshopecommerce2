import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  HelpCircle, 
  MessageCircle, 
  ExternalLink, 
  Book,
  Video,
  Phone,
  Mail
} from 'lucide-react';

export function AdminFAQ() {
  const faqCategories = [
    {
      title: 'Aan de slag',
      questions: [
        {
          question: 'Hoe stel ik mijn eerste product in?',
          answer: 'Ga naar Producten > Nieuw Product om je eerste product toe te voegen. Vul alle vereiste velden in zoals naam, beschrijving, prijs en upload afbeeldingen.'
        },
        {
          question: 'Hoe configureer ik betalingsmethoden?',
          answer: 'Ga naar Instellingen > Betalingen om verschillende betalingsmethoden zoals iDEAL, PayPal en creditcards in te stellen.'
        },
        {
          question: 'Hoe stel ik mijn domein in?',
          answer: 'Ga naar Instellingen > Domeinen om je custom domein toe te voegen en DNS records te configureren.'
        }
      ]
    },
    {
      title: 'Producten & Inventaris',
      questions: [
        {
          question: 'Hoe beheer ik product varianten?',
          answer: 'Bij het bewerken van een product kun je varianten toevoegen zoals maat en kleur. Elke variant kan zijn eigen prijs en voorraad hebben.'
        },
        {
          question: 'Hoe werk ik met collecties?',
          answer: 'Collecties helpen je producten te organiseren. Ga naar Producten > Collecties om nieuwe collecties aan te maken en producten toe te wijzen.'
        }
      ]
    },
    {
      title: 'Orders & Klanten',
      questions: [
        {
          question: 'Hoe verwerk ik orders?',
          answer: 'Ga naar Orders om alle bestellingen te bekijken. Je kunt order status bijwerken, verzendgegevens toevoegen en facturen genereren.'
        },
        {
          question: 'Hoe beheer ik klantgegevens?',
          answer: 'Onder Klanten vind je alle klantprofielen met ordergeschiedenis en contactgegevens. Je kunt notities toevoegen en klanten contacteren.'
        }
      ]
    }
  ];

  const helpResources = [
    {
      title: 'Video Tutorials',
      description: 'Stap-voor-stap video handleidingen',
      icon: Video,
      link: '#',
      badge: 'Populair'
    },
    {
      title: 'Kennisbank',
      description: 'Uitgebreide documentatie en gidsen',
      icon: Book,
      link: '#',
      badge: null
    },
    {
      title: 'Community Forum',
      description: 'Stel vragen aan andere gebruikers',
      icon: MessageCircle,
      link: '#',
      badge: null
    }
  ];

  const contactOptions = [
    {
      title: 'Email Support',
      description: 'support@platform.nl',
      icon: Mail,
      response: '< 24 uur'
    },
    {
      title: 'Telefoon Support',
      description: '+31 20 123 4567',
      icon: Phone,
      response: 'Ma-Vr 9-17'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">FAQ & Ondersteuning</h1>
        <p className="text-muted-foreground mt-1">
          Vind antwoorden op veelgestelde vragen en krijg hulp
        </p>
      </div>

      {/* Quick Help */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {helpResources.map((resource, index) => {
          const Icon = resource.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{resource.title}</h3>
                      {resource.badge && <Badge variant="secondary" className="text-xs">{resource.badge}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ Sections */}
      <div className="space-y-6">
        {faqCategories.map((category, categoryIndex) => (
          <Card key={categoryIndex}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                {category.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {category.questions.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${categoryIndex}-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Ondersteuning</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contactOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{option.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{option.description}</p>
                      <Badge variant="outline" className="text-xs">
                        Reactietijd: {option.response}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>Systeem Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">Platform Status</span>
              </div>
              <Badge variant="default" className="bg-green-500">Operationeel</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">Betalingen</span>
              </div>
              <Badge variant="default" className="bg-green-500">Operationeel</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">Email Delivery</span>
              </div>
              <Badge variant="default" className="bg-green-500">Operationeel</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}