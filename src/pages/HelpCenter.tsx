import React, { useState, useEffect } from 'react';
import { Search, MessageCircle, BookOpen, Phone, Mail, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useStore } from '@/contexts/StoreContext';
import { supabase } from '@/integrations/supabase/client';
import ChatWidget from '@/components/ChatWidget';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
}

const HelpCenter: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeItem[]>([]);
  const [filteredResults, setFilteredResults] = useState<(FAQItem | KnowledgeItem)[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const { store } = useStore();

  useEffect(() => {
    loadHelpContent();
  }, [store?.id]);

  useEffect(() => {
    filterContent();
  }, [searchQuery, selectedCategory, faqs, knowledgeBase]);

  const loadHelpContent = async () => {
    if (!store?.id) return;

    // Load FAQs
    const { data: faqData } = await supabase
      .from('faqs')
      .select('*')
      .eq('organization_id', store.id)
      .eq('is_active', true)
      .order('sort_order');

    // Load knowledge base
    const { data: kbData } = await supabase
      .from('ai_knowledge_base')
      .select('*')
      .or(`organization_id.eq.${store.id},organization_id.is.null`)
      .eq('is_active', true)
      .order('usage_count', { ascending: false });

    setFaqs(faqData || []);
    setKnowledgeBase(kbData || []);
  };

  const filterContent = () => {
    let results: (FAQItem | KnowledgeItem)[] = [];
    
    // Combine FAQs and knowledge base
    const allContent = [
      ...faqs.map(faq => ({ ...faq, type: 'faq' })),
      ...knowledgeBase.map(kb => ({ ...kb, type: 'knowledge', question: kb.title, answer: kb.content }))
    ];

    // Filter by category
    if (selectedCategory !== 'all') {
      results = allContent.filter(item => item.category === selectedCategory);
    } else {
      results = allContent;
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(item => {
        const faqItem = item as FAQItem;
        const kbItem = item as KnowledgeItem;
        return (
          faqItem.question?.toLowerCase().includes(query) ||
          faqItem.answer?.toLowerCase().includes(query) ||
          kbItem.title?.toLowerCase().includes(query) ||
          kbItem.tags?.some(tag => tag.toLowerCase().includes(query))
        );
      });
    }

    setFilteredResults(results);
  };

  const categories = [
    { id: 'all', name: 'All Topics', icon: BookOpen },
    { id: 'orders', name: 'Orders & Shipping', icon: ArrowRight },
    { id: 'products', name: 'Products', icon: BookOpen },
    { id: 'account', name: 'Account & Billing', icon: Phone },
    { id: 'returns', name: 'Returns & Refunds', icon: Mail },
    { id: 'technical', name: 'Technical Support', icon: MessageCircle },
  ];

  const popularTopics = [
    'How do I track my order?',
    'What is your return policy?',
    'How do I change my shipping address?',
    'When will my order arrive?',
    'How do I cancel an order?'
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              How can we help you?
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Search our help center or chat with our AI assistant
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 py-3 text-lg bg-background text-foreground border-0"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <MessageCircle className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Chat with AI</CardTitle>
              <CardDescription>
                Get instant answers from our AI assistant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Start Chat
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Phone className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Call Us</CardTitle>
              <CardDescription>
                Speak with our support team directly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                {(store as any)?.phone || '+31 (0) 20 123 4567'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Mail className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Email Support</CardTitle>
              <CardDescription>
                Send us a detailed message
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                {(store as any)?.email || 'support@store.com'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">Browse by Category</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center space-x-2"
              >
                <category.icon className="h-4 w-4" />
                <span>{category.name}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {searchQuery ? (
              /* Search Results */
              <div>
                <h2 className="text-2xl font-semibold mb-6">
                  Search Results ({filteredResults.length})
                </h2>
                
                {filteredResults.length > 0 ? (
                  <Accordion type="single" collapsible className="space-y-4">
                    {filteredResults.map((item) => (
                      <AccordionItem key={item.id} value={item.id}>
                        <Card>
                          <AccordionTrigger className="px-6 py-4 hover:no-underline">
                            <div className="flex items-start justify-between w-full">
                              <div className="text-left">
                              <h3 className="font-medium">
                                {(item as FAQItem).question || (item as KnowledgeItem).title}
                              </h3>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {item.category}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pb-4">
                            <div className="prose prose-sm max-w-none">
                              <p>{(item as FAQItem).answer || (item as KnowledgeItem).content}</p>
                            </div>
                          </AccordionContent>
                        </Card>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <Card className="p-8 text-center">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No results found</h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your search or browse our categories
                    </p>
                    <Button onClick={() => setSearchQuery('')}>
                      Clear Search
                    </Button>
                  </Card>
                )}
              </div>
            ) : (
              /* FAQ List */
              <div>
                <h2 className="text-2xl font-semibold mb-6">
                  {selectedCategory === 'all' ? 'Frequently Asked Questions' : 
                   categories.find(c => c.id === selectedCategory)?.name}
                </h2>
                
                <Accordion type="single" collapsible className="space-y-4">
                  {filteredResults.map((item) => (
                    <AccordionItem key={item.id} value={item.id}>
                      <Card>
                        <AccordionTrigger className="px-6 py-4 hover:no-underline">
                          <div className="flex items-start justify-between w-full">
                          <h3 className="font-medium text-left">
                            {(item as FAQItem).question || (item as KnowledgeItem).title}
                          </h3>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-4">
                          <div className="prose prose-sm max-w-none">
                            <p>{(item as FAQItem).answer || (item as KnowledgeItem).content}</p>
                          </div>
                        </AccordionContent>
                      </Card>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Popular Topics */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Topics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {popularTopics.map((topic, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => setSearchQuery(topic)}
                  >
                    {topic}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Still need help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Our support team is available 24/7 to assist you.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4" />
                    <span>{(store as any)?.phone || '+31 (0) 20 123 4567'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4" />
                    <span>{(store as any)?.email || 'support@store.com'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Chat Widget */}
      {store?.id && <ChatWidget organizationId={store.id} />}
    </div>
  );
};

export default HelpCenter;