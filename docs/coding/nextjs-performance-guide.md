# Performance Guide

## Overview
This guide outlines performance optimization strategies for the Web Frontend platform, focusing on Core Web Vitals, loading performance, and user experience optimization for data import operations.

## Performance Targets

### Core Web Vitals
- **Largest Contentful Paint (LCP)**: < 2.5 seconds
- **First Input Delay (FID)**: < 100 milliseconds  
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Contentful Paint (FCP)**: < 1.8 seconds
- **Time to Interactive (TTI)**: < 3.8 seconds

### Lighthouse Scores
- **Performance**: 95+ 
- **Accessibility**: 100
- **Best Practices**: 100
- **SEO**: 100

### Additional Metrics
- **Time to First Byte (TTFB)**: < 200ms
- **Speed Index**: < 3.0 seconds
- **Total Blocking Time (TBT)**: < 200ms

## Image Optimization

### Next.js Image Component
```typescript
// Always use Next.js Image component for optimal performance
import Image from 'next/image';

// Basic usage with responsive sizing
<Image
  src="/images/export-dashboard.jpg"
  alt="Export dashboard interface"
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  priority={isAboveFold} // Only for above-the-fold images
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..." // Low-quality placeholder
/>

// Responsive images with multiple sizes
<Image
  src="/images/hero-image.jpg"
  alt="Hero section image"
  fill
  sizes="100vw"
  style={{ objectFit: 'cover' }}
  priority
/>
```

### Image Optimization Configuration
```typescript
// next.config.js
module.exports = {
  images: {
    // Optimize images from external domains
    domains: ['example.com', 'cdn.example.com'],
    
    // Define custom image sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Image formats (modern formats first)
    formats: ['image/webp', 'image/avif'],
    
    // Quality settings
    quality: 85, // Default quality (1-100)
    
    // Enable blur placeholders
    placeholder: 'blur',
    
    // Minimize layout shift
    minimumCacheTTL: 60, // Cache images for 60 seconds minimum
  },
};
```

### Image Processing Best Practices
```typescript
// Utility for generating blur data URLs
export const generateBlurDataURL = (width: number, height: number): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Create a simple gradient placeholder
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f3f4f6');
  gradient.addColorStop(1, '#e5e7eb');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL('image/jpeg', 0.1);
};

// Dynamic image loading with intersection observer
export const LazyImage = ({ src, alt, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={imgRef} className="relative">
      {isInView && (
        <Image
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          {...props}
        />
      )}
    </div>
  );
};
```

## Database Optimization

### Query Optimization
```typescript
// Always use select to limit returned fields
const exports = await prisma.export.findMany({
  select: {
    id: true,
    title: true,
    slug: true,
    excerpt: true,
    publishedAt: true,
    viewCount: true,
    author: {
      select: {
        id: true,
        name: true,
        avatar: true
      }
    },
    category: {
      select: {
        id: true,
        name: true,
        slug: true
      }
    },
    _count: {
      select: {
        comments: true,
        likes: true
      }
    }
  },
  where: {
    status: 'PUBLISHED',
    publishedAt: { lte: new Date() }
  },
  orderBy: { publishedAt: 'desc' },
  take: 20
});

// Use transactions for multiple operations
await prisma.$transaction([
  prisma.export.update({
    where: { id: exportId },
    data: { viewCount: { increment: 1 } }
  }),
  prisma.exportView.create({
    data: {
      exportId: exportId,
      userId: userId,
      ipAddress: request.ip
    }
  })
]);
```

### Connection Pooling
```typescript
// lib/prisma.ts - Optimized Prisma configuration
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Connection pool configuration (in DATABASE_URL)
// exportgresql://user:password@host:port/db?connection_limit=20&pool_timeout=20&schema=public
```

### Database Indexes
```prisma
// Ensure proper indexes for frequently queried fields
model Export {
  // Single column indexes
  @@index([status])
  @@index([publishedAt])
  @@index([authorId])
  @@index([categoryId])
  
  // Composite indexes for common query patterns
  @@index([status, publishedAt]) // List published exports
  @@index([authorId, status, publishedAt]) // Author's exports
  @@index([categoryId, status, publishedAt]) // Category exports
  @@index([slug, status]) // Slug lookup with status check
  
  // Full-text search index (ExportgreSQL)
  @@index([title, content], type: Gin) // For search functionality
}

model Comment {
  @@index([exportId, status, createdAt]) // Export comments
  @@index([authorId, createdAt]) // User's comments
  @@index([parentId]) // Nested comments
}
```

## React Performance Optimization

### Memoization Strategies
```typescript
// Memoize expensive computations
const ExportList = ({ exports, searchTerm, category }: ExportListProps) => {
  const filteredExports = useMemo(() => {
    let filtered = exports;
    
    if (searchTerm) {
      filtered = filtered.filter(export =>
        export.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        export.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (category) {
      filtered = filtered.filter(export => export.category?.slug === category);
    }
    
    return filtered;
  }, [exports, searchTerm, category]);
  
  const sortedExports = useMemo(() => {
    return [...filteredExports].sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }, [filteredExports]);
  
  return (
    <div className="grid gap-6">
      {sortedExports.map(export => (
        <ExportCard key={export.id} export={export} />
      ))}
    </div>
  );
};

// Memoize callbacks to prevent unnecessary re-renders
const ExportCard = ({ export, onLike, onShare }: ExportCardProps) => {
  const handleLike = useCallback(() => {
    onLike(export.id);
  }, [export.id, onLike]);
  
  const handleShare = useCallback(async () => {
    if (navigator.share) {
      await navigator.share({
        title: export.title,
        text: export.excerpt,
        url: `/exports/${export.slug}`
      });
    } else {
      onShare(export.slug);
    }
  }, [export.id, export.title, export.excerpt, export.slug, onShare]);
  
  return (
    <article className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-2">{export.title}</h2>
      <p className="text-gray-600 mb-4">{export.excerpt}</p>
      
      <div className="flex gap-2">
        <Button onClick={handleLike} variant="outline" size="sm">
          Like ({export._count.likes})
        </Button>
        <Button onClick={handleShare} variant="outline" size="sm">
          Share
        </Button>
      </div>
    </article>
  );
};

// Memoize expensive component renders
const ExportCard = memo(({ export }: ExportCardProps) => {
  return (
    <article>
      <h2>{export.title}</h2>
      <p>{export.excerpt}</p>
    </article>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function
  return prevProps.export.id === nextProps.export.id &&
         prevProps.export.updatedAt === nextProps.export.updatedAt;
});
```

### Code Splitting & Lazy Loading
```typescript
// Dynamic imports for code splitting
import dynamic from 'next/dynamic';
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const CommentSection = dynamic(() => import('@/features/comments/components/CommentSection'), {
  loading: () => <CommentSectionSkeleton />,
  ssr: false // Don't render on server if not needed
});

const AdminDashboard = dynamic(() => import('@/features/admin/components/AdminDashboard'), {
  loading: () => <div>Loading admin dashboard...</div>,
  ssr: false
});

// Lazy load with React.lazy
const HeavyChart = lazy(() => import('@/components/HeavyChart'));

function ExportExport({ export }: { export: Export }) {
  const [showComments, setShowComments] = useState(false);
  
  return (
    <article>
      <h1>{export.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: export.content }} />
      
      {/* Load comments only when requested */}
      {showComments ? (
        <Suspense fallback={<CommentSectionSkeleton />}>
          <CommentSection exportId={export.id} />
        </Suspense>
      ) : (
        <button 
          onClick={() => setShowComments(true)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Load Comments ({export._count.comments})
        </button>
      )}
    </article>
  );
}
```

### Virtual Scrolling for Large Lists
```typescript
// Virtual scrolling implementation for large export lists
import { FixedSizeList as List } from 'react-window';

interface VirtualizedExportListProps {
  exports: Export[];
  height: number;
  itemHeight: number;
}

const VirtualizedExportList = ({ exports, height, itemHeight }: VirtualizedExportListProps) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const export = exports[index];
    
    return (
      <div style={style}>
        <ExportCard export={export} />
      </div>
    );
  };
  
  return (
    <List
      height={height}
      itemCount={exports.length}
      itemSize={itemHeight}
      itemData={exports}
    >
      {Row}
    </List>
  );
};

// Infinite scrolling with virtual scrolling
const useInfiniteScroll = (fetchMore: () => void) => {
  const [isFetching, setIsFetching] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || isFetching) return;
      setIsFetching(true);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isFetching]);
  
  useEffect(() => {
    if (!isFetching) return;
    fetchMoreData();
  }, [isFetching]);
  
  const fetchMoreData = async () => {
    await fetchMore();
    setIsFetching(false);
  };
  
  return [isFetching, setIsFetching];
};
```

## Caching Strategies

### API Response Caching
```typescript
// Next.js Route Handlers with caching
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get('page') || '1');
  const category = searchParams.get('category');
  
  // Create cache key
  const cacheKey = `exports:${page}:${category || 'all'}`;
  
  try {
    // Check cache first (Redis or in-memory)
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached), {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Cache': 'HIT'
        }
      });
    }
    
    // Fetch from database
    const exports = await prisma.export.findMany({
      where: {
        status: 'PUBLISHED',
        category: category ? { slug: category } : undefined
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        publishedAt: true,
        author: { select: { name: true, avatar: true } }
      },
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * 20,
      take: 20
    });
    
    const response = { data: exports, page, hasMore: exports.length === 20 };
    
    // Cache the response
    await redis.setex(cacheKey, 300, JSON.stringify(response)); // 5 minutes
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Cache': 'MISS'
      }
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Client-Side Caching
```typescript
// SWR configuration for client-side caching
import useSWR, { SWRConfig } from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Global SWR configuration
export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        refreshInterval: 5 * 60 * 1000, // 5 minutes
        dedupingInterval: 2000, // 2 seconds
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        loadingTimeout: 3000,
        focusThrottleInterval: 5000
      }}
    >
      {children}
    </SWRConfig>
  );
}

// Custom hook with caching
export function useExports(category?: string, page = 1) {
  const { data, error, mutate } = useSWR(
    `/api/exports?category=${category || ''}&page=${page}`,
    fetcher,
    {
      // Cache for 5 minutes
      refreshInterval: 5 * 60 * 1000,
      // Keep previous data while loading new data
      keepPreviousData: true
    }
  );
  
  return {
    exports: data?.data || [],
    isLoading: !error && !data,
    isError: error,
    hasMore: data?.hasMore || false,
    mutate
  };
}
```

### Static Generation & ISR
```typescript
// Static generation with ISR for export exports
export async function generateStaticParams() {
  const exports = await prisma.export.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true },
    orderBy: { publishedAt: 'desc' },
    take: 100 // Generate top 100 exports at build time
  });
  
  return exports.map(export => ({
    slug: export.slug
  }));
}

export const revalidate = 3600; // Revalidate every hour

export default async function ExportExport({ params }: { params: { slug: string } }) {
  const export = await prisma.export.findUnique({
    where: { slug: params.slug, status: 'PUBLISHED' },
    include: {
      author: { select: { name: true, avatar: true, bio: true } },
      category: { select: { name: true, slug: true } },
      tags: { select: { name: true, slug: true } },
      _count: { select: { comments: true, likes: true } }
    }
  });
  
  if (!export) {
    notFound();
  }
  
  // Increment view count (non-blocking)
  prisma.export.update({
    where: { id: export.id },
    data: { viewCount: { increment: 1 } }
  }).catch(console.error);
  
  return (
    <article>
      <h1>{export.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: export.content }} />
    </article>
  );
}
```

## Bundle Optimization

### Webpack Bundle Analysis
```bash
# Analyze bundle size
npm install --save-dev @next/bundle-analyzer

# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // Your Next.js config
});

# Run analysis
ANALYZE=true npm run build
```

### Tree Shaking & Dead Code Elimination
```typescript
// Import only what you need
import { format } from 'date-fns'; // ✅ Good
import * as dateFns from 'date-fns'; // ❌ Imports everything

// Use dynamic imports for large libraries
const loadChart = async () => {
  const { Chart } = await import('chart.js');
  return Chart;
};

// Conditional loading
const AdminPanel = dynamic(() => 
  import('@/components/AdminPanel').then(mod => mod.AdminPanel), 
  { 
    ssr: false,
    loading: () => <div>Loading admin panel...</div>
  }
);

// Use the loading prop to show loading states
function Dashboard() {
  const { user } = useAuth();
  
  if (user?.role !== 'admin') {
    return <div>Access denied</div>;
  }
  
  return <AdminPanel />;
}
```

### Compression & Minification
```typescript
// next.config.js
module.exports = {
  compress: true, // Enable gzip compression
  
  // Optimize CSS
  experimental: {
    optimizeCss: true,
  },
  
  // Custom webpack configuration
  webpack: (config, { isServer }) => {
    // Optimize for production
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
  
  // Enable SWC minifier (faster than Terser)
  swcMinify: true,
  
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
};
```

## Performance Monitoring

### Core Web Vitals Tracking
```typescript
// lib/analytics.ts
export function trackWebVital(metric: any) {
  const { name, value, id } = metric;
  
  // Send to analytics service
  gtag('event', name, {
    event_category: 'Web Vitals',
    event_label: id,
    value: Math.round(name === 'CLS' ? value * 1000 : value),
    non_interaction: true,
  });
  
  // Also send to custom analytics
  fetch('/api/analytics/web-vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      value,
      id,
      url: window.location.href,
      timestamp: Date.now()
    })
  }).catch(console.error);
}

// _app.tsx
export function reportWebVitals(metric: NextWebVitalsMetric) {
  trackWebVital(metric);
}
```

### Performance Monitoring API
```typescript
// app/api/analytics/web-vitals/route.ts
export async function POST(request: NextRequest) {
  try {
    const { name, value, id, url, timestamp } = await request.json();
    
    // Store performance metrics
    await prisma.performanceMetric.create({
      data: {
        name,
        value,
        id,
        url,
        timestamp: new Date(timestamp),
        userAgent: request.headers.get('user-agent'),
        ipAddress: request.ip
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Performance tracking error:', error);
    return NextResponse.json({ error: 'Failed to track metric' }, { status: 500 });
  }
}

// Performance dashboard query
export async function getPerformanceMetrics(timeframe: string = '24h') {
  const since = new Date(Date.now() - (timeframe === '24h' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000));
  
  const metrics = await prisma.performanceMetric.groupBy({
    by: ['name'],
    where: {
      timestamp: { gte: since }
    },
    _avg: { value: true },
    _count: { id: true }
  });
  
  return metrics;
}
```

## Loading Performance

### Skeleton Loading States
```typescript
// Loading skeletons for better perceived performance
export const ExportCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
    <div className="space-y-2 mb-4">
      <div className="h-3 bg-gray-200 rounded"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      <div className="h-3 bg-gray-200 rounded w-4/6"></div>
    </div>
    <div className="flex gap-2">
      <div className="h-8 bg-gray-200 rounded w-16"></div>
      <div className="h-8 bg-gray-200 rounded w-16"></div>
    </div>
  </div>
);

export const ExportListSkeleton = () => (
  <div className="grid gap-6">
    {Array.from({ length: 6 }, (_, i) => (
      <ExportCardSkeleton key={i} />
    ))}
  </div>
);
```

### Progressive Loading
```typescript
// Progressive image loading with blur-up effect
export const ProgressiveImage = ({ 
  src, 
  blurDataURL, 
  alt, 
  ...props 
}: ProgressiveImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  return (
    <div className="relative overflow-hidden">
      {/* Low-quality placeholder */}
      <Image
        src={blurDataURL}
        alt=""
        className={`absolute inset-0 transition-opacity duration-300 ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
        {...props}
      />
      
      {/* High-quality image */}
      <Image
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </div>
  );
};
```

## Performance Best Practices Checklist

### ✅ Images & Media
- [ ] Use Next.js Image component for all images
- [ ] Implement proper image sizing and responsive images
- [ ] Use modern image formats (WebP, AVIF)
- [ ] Add blur placeholders to prevent layout shift
- [ ] Lazy load images below the fold
- [ ] Optimize image quality (85% for photos, 100% for graphics)

### ✅ JavaScript & React
- [ ] Implement code splitting with dynamic imports
- [ ] Use React.memo for expensive components
- [ ] Memoize callbacks and expensive computations
- [ ] Implement virtual scrolling for large lists
- [ ] Remove unused dependencies and code
- [ ] Use tree shaking to eliminate dead code

### ✅ Database & API
- [ ] Use select to limit returned fields
- [ ] Implement proper database indexes
- [ ] Use connection pooling
- [ ] Cache API responses appropriately
- [ ] Implement pagination with soft limits
- [ ] Use transactions for multiple operations

### ✅ Caching
- [ ] Implement static generation where possible
- [ ] Use ISR for dynamic content
- [ ] Configure appropriate cache headers
- [ ] Implement client-side caching with SWR
- [ ] Use CDN for static assets
- [ ] Cache database queries with Redis

### ✅ Bundle Optimization
- [ ] Analyze bundle size regularly
- [ ] Implement proper code splitting
- [ ] Use dynamic imports for large libraries
- [ ] Enable compression (gzip/brotli)
- [ ] Minify CSS and JavaScript
- [ ] Remove unused CSS

### ✅ Loading & UX
- [ ] Implement skeleton loading states
- [ ] Use progressive loading for images
- [ ] Minimize layout shift (CLS)
- [ ] Optimize First Input Delay (FID)
- [ ] Reduce Largest Contentful Paint (LCP)
- [ ] Implement proper error boundaries

### ✅ Monitoring
- [ ] Track Core Web Vitals
- [ ] Monitor bundle size changes
- [ ] Set up performance alerts
- [ ] Regular performance audits
- [ ] Monitor real user metrics (RUM)
- [ ] Track loading performance

Remember: Performance is not a one-time optimization but an ongoing process. Regularly monitor, measure, and optimize based on real user data.
