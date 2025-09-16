import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useMemo, memo } from "react";
import { useStore } from "@/contexts/StoreContext";
import { getStoreAwarePath } from "@/lib/url-utils";

interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  is_sale?: boolean;
  is_new?: boolean;
  slug: string;
  image_url?: string;
}

interface CollectionSliderProps {
  collectionId: string;
  collectionName: string;
  collectionSlug: string;
}

const CollectionSlider = memo(function CollectionSlider({ collectionId, collectionName, collectionSlug }: CollectionSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { store, loading: storeLoading } = useStore();

  // Optimized query that eliminates N+1 problem by using JOIN
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['collection-products', collectionId, store?.id],
    queryFn: async () => {
      if (!store?.id) return [];

      // Single optimized query with JOIN to eliminate N+1
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, price, original_price, is_sale, is_new, slug,
          product_images!left (
            image_url, is_primary, sort_order
          ),
          product_collections!inner (
            collection_id
          )
        `)
        .eq('product_collections.collection_id', collectionId)
        .eq('is_active', true)
        .eq('organization_id', store.id)
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) {
        console.error('Error fetching collection products:', error);
        return [];
      }

      return data?.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        original_price: product.original_price,
        is_sale: product.is_sale,
        is_new: product.is_new,
        slug: product.slug,
        image: product.product_images?.find(img => img.is_primary)?.image_url || 
               product.product_images?.[0]?.image_url || 
               '/placeholder.svg',
        category: 'Kantoormeubel'
      })) || [];
    },
    enabled: !storeLoading && !!store?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - collections don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes cache (was cacheTime in v4)
  });

  const itemsPerPage = 6;
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const canGoLeft = currentIndex > 0;
  const canGoRight = currentIndex < totalPages - 1;

  const nextSlide = () => {
    if (canGoRight) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevSlide = () => {
    if (canGoLeft) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (storeLoading || isLoading) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">{collectionName}</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-muted animate-pulse h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null; // Don't render empty collections
  }

  // Memoized calculation for current products
  const currentProducts = useMemo(() => 
    products.slice(currentIndex * itemsPerPage, (currentIndex + 1) * itemsPerPage),
    [products, currentIndex, itemsPerPage]
  );

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">{collectionName}</h3>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevSlide}
              disabled={!canGoLeft}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextSlide}
              disabled={!canGoRight}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Link to={getStoreAwarePath(`/collections/${collectionSlug}`, store?.slug)}>
            <Button variant="outline" size="sm">
              Bekijk alle
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {currentProducts.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
    </div>
  );
});

export { CollectionSlider };