import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Image, 
  Type, 
  Layout, 
  Link, 
  Save, 
  Eye, 
  Trash2,
  Move,
  Settings
} from 'lucide-react';

interface EmailBlock {
  id: string;
  type: 'header' | 'text' | 'image' | 'button' | 'product' | 'footer';
  content: any;
  styles: any;
}

interface EmailBuilderProps {
  templateId?: string;
  onSave: (template: any) => void;
  onPreview: (html: string) => void;
}

export function EmailBuilder({ templateId, onSave, onPreview }: EmailBuilderProps) {
  const [blocks, setBlocks] = useState<EmailBlock[]>([
    {
      id: '1',
      type: 'header',
      content: { 
        logo: '/placeholder.svg', 
        title: 'Your Store Name',
        subtitle: 'Premium Products & Service'
      },
      styles: { backgroundColor: '#ffffff', padding: '40px 20px' }
    }
  ]);
  
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateSubject, setTemplateSubject] = useState('');

  const blockTypes = [
    { type: 'header', icon: Layout, label: 'Header', description: 'Logo en titel sectie' },
    { type: 'text', icon: Type, label: 'Text Block', description: 'Tekst en koppen' },
    { type: 'image', icon: Image, label: 'Image', description: 'Afbeelding met tekst' },
    { type: 'button', icon: Link, label: 'Button', description: 'Call-to-action knop' },
    { type: 'product', icon: Layout, label: 'Product', description: 'Product showcase' },
    { type: 'footer', icon: Layout, label: 'Footer', description: 'Contact en links' },
  ];

  const addBlock = (type: string) => {
    const newBlock: EmailBlock = {
      id: Date.now().toString(),
      type: type as any,
      content: getDefaultContent(type),
      styles: getDefaultStyles(type)
    };
    setBlocks([...blocks, newBlock]);
  };

  const getDefaultContent = (type: string) => {
    switch (type) {
      case 'header':
        return { 
          logo: '/placeholder.svg', 
          title: 'Your Store Name',
          subtitle: 'Premium Products & Service'
        };
      case 'text':
        return { 
          heading: 'Welcome to Our Store!', 
          body: 'Discover our amazing products and exclusive offers just for you.' 
        };
      case 'image':
        return { 
          src: '/placeholder.svg', 
          alt: 'Product Image', 
          caption: 'Our Featured Product' 
        };
      case 'button':
        return { 
          text: 'Shop Now', 
          url: 'https://yourstore.com/products',
          backgroundColor: '#000000',
          textColor: '#ffffff'
        };
      case 'product':
        return { 
          name: 'Featured Product', 
          price: '€99.99', 
          image: '/placeholder.svg',
          description: 'Amazing product description',
          url: 'https://yourstore.com/product/1'
        };
      case 'footer':
        return { 
          company: 'Your Store Name',
          address: '123 Store Street, City',
          unsubscribe: 'Unsubscribe from our emails',
          social: { facebook: '', instagram: '', twitter: '' }
        };
      default:
        return {};
    }
  };

  const getDefaultStyles = (type: string) => {
    return {
      backgroundColor: '#ffffff',
      padding: '20px',
      textAlign: 'left',
      fontSize: '16px',
      color: '#333333'
    };
  };

  const updateBlockContent = (blockId: string, content: any) => {
    setBlocks(blocks.map(block => 
      block.id === blockId ? { ...block, content } : block
    ));
  };

  const updateBlockStyles = (blockId: string, styles: any) => {
    setBlocks(blocks.map(block => 
      block.id === blockId ? { ...block, styles } : block
    ));
  };

  const removeBlock = (blockId: string) => {
    setBlocks(blocks.filter(block => block.id !== blockId));
    setSelectedBlock(null);
  };

  const generateHTML = () => {
    let html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${templateSubject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
    `;

    blocks.forEach(block => {
      html += generateBlockHTML(block);
    });

    html += `
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    return html;
  };

  const generateBlockHTML = (block: EmailBlock) => {
    const { content, styles } = block;
    const styleString = Object.entries(styles)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
      .join('; ');

    switch (block.type) {
      case 'header':
        return `
          <tr>
            <td style="${styleString}; text-align: center;">
              ${content.logo ? `<img src="${content.logo}" alt="Logo" style="max-width: 200px; margin-bottom: 20px;" />` : ''}
              <h1 style="margin: 0; font-size: 32px; color: #333;">${content.title}</h1>
              ${content.subtitle ? `<p style="margin: 10px 0 0; font-size: 16px; color: #666;">${content.subtitle}</p>` : ''}
            </td>
          </tr>
        `;
      
      case 'text':
        return `
          <tr>
            <td style="${styleString}">
              ${content.heading ? `<h2 style="margin: 0 0 20px; font-size: 24px; color: #333;">${content.heading}</h2>` : ''}
              <p style="margin: 0; line-height: 1.6; color: #555;">${content.body}</p>
            </td>
          </tr>
        `;

      case 'image':
        return `
          <tr>
            <td style="${styleString}; text-align: center;">
              <img src="${content.src}" alt="${content.alt}" style="max-width: 100%; height: auto; border-radius: 8px;" />
              ${content.caption ? `<p style="margin: 15px 0 0; font-size: 14px; color: #666;">${content.caption}</p>` : ''}
            </td>
          </tr>
        `;

      case 'button':
        return `
          <tr>
            <td style="${styleString}; text-align: center;">
              <a href="${content.url}" style="display: inline-block; padding: 15px 30px; background-color: ${content.backgroundColor}; color: ${content.textColor}; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">${content.text}</a>
            </td>
          </tr>
        `;

      case 'product':
        return `
          <tr>
            <td style="${styleString}">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="200" style="padding-right: 20px;">
                    <img src="${content.image}" alt="${content.name}" style="width: 180px; height: 180px; object-fit: cover; border-radius: 8px;" />
                  </td>
                  <td style="vertical-align: top;">
                    <h3 style="margin: 0 0 10px; font-size: 20px; color: #333;">${content.name}</h3>
                    <p style="margin: 0 0 15px; color: #666; line-height: 1.6;">${content.description}</p>
                    <p style="margin: 0 0 20px; font-size: 24px; font-weight: bold; color: #000;">${content.price}</p>
                    <a href="${content.url}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">View Product</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `;

      case 'footer':
        return `
          <tr>
            <td style="${styleString}; text-align: center; border-top: 1px solid #eee;">
              <p style="margin: 0 0 10px; font-weight: bold; color: #333;">${content.company}</p>
              <p style="margin: 0 0 20px; color: #666; font-size: 14px;">${content.address}</p>
              <div style="margin: 20px 0;">
                ${Object.entries(content.social || {}).map(([platform, url]) => 
                  url ? `<a href="${url}" style="color: #666; text-decoration: none; margin: 0 10px;">${platform}</a>` : ''
                ).join('')}
              </div>
              <p style="margin: 20px 0 0; font-size: 12px; color: #888;">${content.unsubscribe}</p>
            </td>
          </tr>
        `;

      default:
        return '';
    }
  };

  const handleSave = () => {
    const template = {
      name: templateName,
      subject: templateSubject,
      content: { blocks },
      htmlContent: generateHTML()
    };
    onSave(template);
  };

  const handlePreview = () => {
    onPreview(generateHTML());
  };

  return (
    <div className="flex h-full">
      {/* Block Library Sidebar */}
      <div className="w-80 border-r bg-muted/20 p-4 space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-4">Template Settings</h3>
          <div className="space-y-3">
            <Input
              placeholder="Template Name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
            <Input
              placeholder="Email Subject"
              value={templateSubject}
              onChange={(e) => setTemplateSubject(e.target.value)}
            />
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-4">Add Blocks</h3>
          <div className="space-y-2">
            {blockTypes.map(({ type, icon: Icon, label, description }) => (
              <Card 
                key={type} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => addBlock(type)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start space-x-3">
                    <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {selectedBlock && (
          <div>
            <h3 className="font-semibold text-lg mb-4">Block Settings</h3>
            <BlockEditor
              block={blocks.find(b => b.id === selectedBlock)!}
              onContentChange={(content) => updateBlockContent(selectedBlock, content)}
              onStyleChange={(styles) => updateBlockStyles(selectedBlock, styles)}
              onRemove={() => removeBlock(selectedBlock)}
            />
          </div>
        )}
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        <div className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Badge variant="outline">Visual Builder</Badge>
            <span className="text-sm text-muted-foreground">
              {blocks.length} blocks • {templateName || 'Untitled Template'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-muted/10">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border">
            {blocks.map((block, index) => (
              <BlockPreview
                key={block.id}
                block={block}
                isSelected={selectedBlock === block.id}
                onClick={() => setSelectedBlock(block.id)}
                onRemove={() => removeBlock(block.id)}
              />
            ))}
            
            {blocks.length === 0 && (
              <div className="p-20 text-center text-muted-foreground">
                <Layout className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2">Start Building Your Email</h3>
                <p className="text-sm">Add blocks from the sidebar to create your email template</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface BlockPreviewProps {
  block: EmailBlock;
  isSelected: boolean;
  onClick: () => void;
  onRemove: () => void;
}

function BlockPreview({ block, isSelected, onClick, onRemove }: BlockPreviewProps) {
  return (
    <div
      className={`relative border-2 transition-colors ${
        isSelected ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30'
      }`}
      onClick={onClick}
    >
      {isSelected && (
        <div className="absolute -top-2 right-2 flex items-center space-x-1 z-10">
          <Badge variant="default" className="text-xs">
            {block.type}
          </Badge>
          <Button
            size="sm"
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
      
      <div 
        className="p-4 cursor-pointer"
        style={block.styles}
        dangerouslySetInnerHTML={{ 
          __html: generateBlockPreviewHTML(block)
        }} 
      />
    </div>
  );
}

function generateBlockPreviewHTML(block: EmailBlock) {
  const { content } = block;
  
  switch (block.type) {
    case 'header':
      return `
        <div style="text-align: center;">
          ${content.logo ? `<img src="${content.logo}" alt="Logo" style="max-width: 150px; margin-bottom: 15px;" />` : ''}
          <h1 style="margin: 0; font-size: 24px; color: #333;">${content.title}</h1>
          ${content.subtitle ? `<p style="margin: 8px 0 0; font-size: 14px; color: #666;">${content.subtitle}</p>` : ''}
        </div>
      `;
    case 'text':
      return `
        ${content.heading ? `<h2 style="margin: 0 0 15px; font-size: 20px; color: #333;">${content.heading}</h2>` : ''}
        <p style="margin: 0; line-height: 1.5; color: #555;">${content.body}</p>
      `;
    case 'button':
      return `
        <div style="text-align: center;">
          <a href="#" style="display: inline-block; padding: 12px 24px; background-color: ${content.backgroundColor}; color: ${content.textColor}; text-decoration: none; border-radius: 6px; font-weight: bold;">${content.text}</a>
        </div>
      `;
    default:
      return `<div>Block: ${block.type}</div>`;
  }
}

interface BlockEditorProps {
  block: EmailBlock;
  onContentChange: (content: any) => void;
  onStyleChange: (styles: any) => void;
  onRemove: () => void;
}

function BlockEditor({ block, onContentChange, onStyleChange, onRemove }: BlockEditorProps) {
  const { content, styles } = block;

  return (
    <Tabs defaultValue="content" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="content">Content</TabsTrigger>
        <TabsTrigger value="style">Style</TabsTrigger>
      </TabsList>
      
      <TabsContent value="content" className="space-y-3">
        {block.type === 'text' && (
          <>
            <Input
              placeholder="Heading"
              value={content.heading || ''}
              onChange={(e) => onContentChange({ ...content, heading: e.target.value })}
            />
            <Textarea
              placeholder="Body text"
              value={content.body || ''}
              onChange={(e) => onContentChange({ ...content, body: e.target.value })}
            />
          </>
        )}
        
        {block.type === 'button' && (
          <>
            <Input
              placeholder="Button text"
              value={content.text || ''}
              onChange={(e) => onContentChange({ ...content, text: e.target.value })}
            />
            <Input
              placeholder="Button URL"
              value={content.url || ''}
              onChange={(e) => onContentChange({ ...content, url: e.target.value })}
            />
          </>
        )}
        
        {block.type === 'header' && (
          <>
            <Input
              placeholder="Store title"
              value={content.title || ''}
              onChange={(e) => onContentChange({ ...content, title: e.target.value })}
            />
            <Input
              placeholder="Subtitle"
              value={content.subtitle || ''}
              onChange={(e) => onContentChange({ ...content, subtitle: e.target.value })}
            />
          </>
        )}
      </TabsContent>
      
      <TabsContent value="style" className="space-y-3">
        <Input
          placeholder="Background Color"
          value={styles.backgroundColor || ''}
          onChange={(e) => onStyleChange({ ...styles, backgroundColor: e.target.value })}
        />
        <Input
          placeholder="Text Color"
          value={styles.color || ''}
          onChange={(e) => onStyleChange({ ...styles, color: e.target.value })}
        />
        <Input
          placeholder="Padding"
          value={styles.padding || ''}
          onChange={(e) => onStyleChange({ ...styles, padding: e.target.value })}
        />
      </TabsContent>
    </Tabs>
  );
}