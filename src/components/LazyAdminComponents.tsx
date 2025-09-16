// Lazy-loaded admin components for code splitting and better performance
import { lazy } from "react";

// Since admin components use named exports, we need to access them correctly
export const LazyAdminProducts = lazy(() => 
  import("@/components/admin/AdminProducts").then(module => ({ 
    default: module.AdminProducts
  }))
);

export const LazyAdminOrders = lazy(() => 
  import("@/components/admin/AdminOrders").then(module => ({ 
    default: module.AdminOrders
  }))
);

export const LazyAdminCustomers = lazy(() => 
  import("@/components/admin/AdminCustomers").then(module => ({ 
    default: module.AdminCustomers
  }))
);

export const LazyAdminAnalytics = lazy(() => 
  import("@/components/admin/AdminAnalytics").then(module => ({ 
    default: module.AdminAnalytics
  }))
);

export const LazyAdminInventory = lazy(() => 
  import("@/components/admin/AdminInventory").then(module => ({ 
    default: module.AdminInventory
  }))
);

export const LazyAdminEmailMarketing = lazy(() => 
  import("@/components/admin/AdminEmailMarketing").then(module => ({ 
    default: module.AdminEmailMarketing
  }))
);

export const LazyAdminCollections = lazy(() => 
  import("@/components/admin/AdminCollections").then(module => ({ 
    default: module.AdminCollections
  }))
);

export const LazyAdminContent = lazy(() => 
  import("@/components/admin/AdminContent").then(module => ({ 
    default: module.AdminContent
  }))
);

export const LazyAdminPages = lazy(() => 
  import("@/components/admin/AdminPages").then(module => ({ 
    default: module.AdminPages
  }))
);

export const LazyAdminCustomerService = lazy(() => 
  import("@/components/admin/AdminCustomerService").then(module => ({ 
    default: module.AdminCustomerService
  }))
);