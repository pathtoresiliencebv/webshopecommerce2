import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search, HelpCircle, MessageCircle } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'Algemeen',
  bestellen: 'Bestellen',
  verzending: 'Verzending',
  betaling: 'Betaling',
  retour: 'Retour & Ruil',
  account: 'Account',
  warranty: 'Garantie & Warranty'
};

export default function FAQ() {
  const { currentOrganization } = useOrganization();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Handle URL parameter for category filtering
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && CATEGORY_LABELS[categoryParam]) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  // Fetch active FAQs
  const { data: faqs, isLoading } = useQuery({
    queryKey: ['public-faqs', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as FAQ[];
    },
    enabled: !!currentOrganization?.id
  });

  // Filter FAQs based on search and selected category
  const filteredFAQs = faqs?.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group FAQs by category
  const faqsByCategory = filteredFAQs?.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  if (!currentOrganization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Geen winkel geselecteerd</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <HelpCircle className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Veelgestelde Vragen</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Vind snel antwoorden op de meest gestelde vragen
        </p>
        {selectedCategory && (
          <div className="flex justify-center">
            <Badge variant="secondary" className="text-sm">
              Gefilterd op: {CATEGORY_LABELS[selectedCategory]}
            </Badge>
          </div>
        )}
      </div>

      {/* Search */}
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek in veelgestelde vragen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p>Laden...</p>
            </CardContent>
          </Card>
        ) : faqsByCategory && Object.keys(faqsByCategory).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(faqsByCategory).map(([category, categoryFAQs]) => (
              <Card key={category}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-2xl">
                      {CATEGORY_LABELS[category] || category.charAt(0).toUpperCase() + category.slice(1)}
                    </CardTitle>
                    <Badge variant="secondary">
                      {categoryFAQs.length} {categoryFAQs.length === 1 ? 'vraag' : 'vragen'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {categoryFAQs.map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id}>
                        <AccordionTrigger className="text-left hover:no-underline">
                          <span className="font-medium">{faq.question}</span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pt-2 text-muted-foreground whitespace-pre-wrap">
                            {faq.answer}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <HelpCircle className="h-16 w-16 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Geen FAQ's gevonden</h3>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? 'Probeer een andere zoekterm'
                    : 'Er zijn momenteel geen veelgestelde vragen beschikbaar'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Contact Section - Enhanced Customer Service Integration */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Niet gevonden wat je zocht?</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Neem contact met ons op voor persoonlijke hulp
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link to="/help-center">
                <MessageCircle className="mr-2 h-4 w-4" />
                Help Center
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="#contact">
                Contact Opnemen
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Of bekijk onze andere service pagina's voor meer informatie
          </p>
        </CardContent>
      </Card>
    </div>
  );
}