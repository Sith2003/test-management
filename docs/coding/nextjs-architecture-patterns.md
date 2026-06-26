# Architecture Patterns

## 1. Feature-Based Architecture

### Overview
จัดระเบียบโค้ดตาม business domain แทนการแบ่งตาม technical layers เพื่อให้โค้ดมีความเป็นระเบียบและง่ายต่อการบำรุงรักษา สำหรับระบบ data export ที่มีการจัดการการส่งออกข้อมูลหลากหลาย

### Structure
```
src/
├── features/           # Feature-based modules
│   ├── auth/          # Authentication & Authorization
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── dashboard/     # Dashboard & Analytics
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── exports/       # Export Management
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── data-sources/  # Data Source Configuration
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── templates/     # Export Template Management
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── history/       # Export History & Logs
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   └── settings/      # System Settings
│       ├── components/
│       ├── hooks/
│       └── services/
└── shared/            # Shared resources
    ├── components/    # Common UI components
    ├── hooks/         # Common hooks
    ├── services/      # Shared API services
    ├── types/         # TypeScript types
    └── utils/         # Utility functions
```

### Benefits
- **Clear separation of concerns** by business domain
- **Easier to maintain and test** individual features
- **Team collaboration** - members can work on different features independently
- **Easier to remove or refactor** entire features
- **Better code organization** and discoverability

## 2. Service Layer Pattern (API-Only)

### Purpose
แยก business logic จาก UI components โดยการเรียก API เท่านั้น ไม่มีการเข้าถึง database โดยตรง เพื่อให้โค้ดมีความยืดหยุ่น ปลอดภัย และทดสอบได้ง่าย

### Implementation
```typescript
// features/exports/services/exportService.ts
export class ExportService {
  private static readonly BASE_URL = '/api/exports';
  
  static async getExports(options: ExportListOptions): Promise<ExportListResponse> {
    const params = new URLSearchParams();
    if (options.page) params.set('page', options.page.toString());
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.search) params.set('search', options.search);
    if (options.status) params.set('status', options.status);
    if (options.template) params.set('template', options.template);
    
    const response = await this.apiCall(`${this.BASE_URL}?${params}`, 'GET');
    return response;
  }
  
  static async getExportById(id: string): Promise<Export> {
    const response = await this.apiCall(`${this.BASE_URL}/${id}`, 'GET');
    return response;
  }
  
  static async createExport(exportData: CreateExportData): Promise<Export> {
    return await this.apiCall(this.BASE_URL, 'POST', exportData);
  }
  
  static async updateExport(id: string, exportData: UpdateExportData): Promise<Export> {
    return await this.apiCall(`${this.BASE_URL}/${id}`, 'PATCH', exportData);
  }
  
  static async deleteExport(id: string): Promise<void> {
    await this.apiCall(`${this.BASE_URL}/${id}`, 'DELETE');
  }
  
  static async startExport(id: string): Promise<Export> {
    return await this.apiCall(`${this.BASE_URL}/${id}/start`, 'POST');
  }
  
  static async cancelExport(id: string): Promise<void> {
    await this.apiCall(`${this.BASE_URL}/${id}/cancel`, 'POST');
  }
  
  static async downloadExport(id: string): Promise<Blob> {
    const response = await fetch(`${this.BASE_URL}/${id}/download`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }
    
    return response.blob();
  }
  
  private static async apiCall(url: string, method: string, data?: any) {
    const response = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}` // ใช้ token สำหรับ auth
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API call failed: ${method} ${url}`);
    }
    
    // DELETE requests อาจไม่มี response body
    if (method === 'DELETE' && response.status === 204) {
      return undefined;
    }
    
    return response.json();
  }
  
  private static getToken(): string {
    // ดึง token จาก localStorage หรือ cookie
    return localStorage.getItem('authToken') || '';
  }
}
```

### Benefits
- **Centralized business logic**
- **Reusable across components**
- **Easy to test independently**
- **Consistent API handling**

## 3. Custom Hooks Pattern (API-Based)

### Purpose
เก็บ stateful logic และ side effects ใน reusable hooks เพื่อให้ components มุ่งเน้นการ render โดยเรียกใช้ API services เท่านั้น

### Implementation
```typescript
// features/exports/hooks/useExports.ts
export function useExports(options: ExportListOptions = {}) {
  const [exports, setExports] = useState<Export[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  
  const fetchExports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // เรียก API service เท่านั้น - ไม่เรียก database โดยตรง
      const response = await ExportService.getExports(options);
      
      setExports(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล export');
    } finally {
      setLoading(false);
    }
  }, [options]);
  
  useEffect(() => {
    fetchExports();
  }, [fetchExports]);
  
  const refetch = useCallback(() => {
    fetchExports();
  }, [fetchExports]);
  
  const createExport = useCallback(async (exportData: CreateExportData) => {
    try {
      const newExport = await ExportService.createExport(exportData);
      setExports(prev => [newExport, ...prev]);
      return newExport;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถสร้าง export ได้');
      throw err;
    }
  }, []);
  
  const updateExport = useCallback(async (id: string, exportData: UpdateExportData) => {
    try {
      const updatedExport = await ExportService.updateExport(id, exportData);
      setExports(prev => prev.map(exportItem => 
        exportItem.id === id ? updatedExport : exportItem
      ));
      return updatedExport;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถอัปเดต export ได้');
      throw err;
    }
  }, []);
  
  const deleteExport = useCallback(async (id: string) => {
    try {
      await ExportService.deleteExport(id);
      setExports(prev => prev.filter(exportItem => exportItem.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถลบ export ได้');
      throw err;
    }
  }, []);
  
  const startExport = useCallback(async (id: string) => {
    try {
      const startedExport = await ExportService.startExport(id);
      setExports(prev => prev.map(exportItem => 
        exportItem.id === id ? startedExport : exportItem
      ));
      return startedExport;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถเริ่ม export ได้');
      throw err;
    }
  }, []);
  
  const downloadExport = useCallback(async (id: string, filename?: string) => {
    try {
      const blob = await ExportService.downloadExport(id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `export-${id}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถดาวน์โหลด export ได้');
      throw err;
    }
  }, []);
  
  return {
    exports,
    loading,
    error,
    pagination,
    refetch,
    createExport,
    updateExport,
    deleteExport,
    startExport,
    downloadExport
  };
}

// Usage in export component
function ExportManagement() {
  const { exports, loading, error, refetch, deleteExport, startExport, downloadExport } = useExports({ 
    limit: 20,
    status: 'completed' 
  });
  
  if (loading) return <ExportListSkeleton />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;
  
  return (
    <div className="export-panel">
      <h1>การจัดการการส่งออกข้อมูล</h1>
      <ExportTable 
        exports={exports} 
        onDelete={deleteExport}
        onStart={startExport}
        onDownload={downloadExport}
        onRefresh={refetch}
      />
    </div>
  );
}
```

### Custom Hook Guidelines
- **Start with 'use'** prefix
- **Return object with descriptive names**
- **Handle loading and error states**
- **Provide refetch/retry capabilities**
- **Use useCallback for functions**

## 4. Component Composition Pattern

### Purpose
สร้าง UI ที่ซับซ้อนจากส่วนประกอบเล็กๆ ที่สามารถนำกลับมาใช้ได้

### Implementation
```typescript
// Composition example for blog post display
function PostDetail({ slug }: { slug: string }) {
  const { post, loading, error } = usePost(slug);
  
  if (loading) return <PostDetailSkeleton />;
  if (error) return <ErrorBoundary error={error} />;
  
  return (
    <article className="max-w-4xl mx-auto">
      <PostHeader 
        title={post.title}
        author={post.author}
        publishedAt={post.publishedAt}
        category={post.category}
        readingTime={post.readingTime}
      />
      
      <PostContent content={post.content} />
      
      <PostFooter>
        <PostTags tags={post.tags} />
        <PostActions 
          postId={post.id}
          onLike={handleLike}
          onShare={handleShare}
          onBookmark={handleBookmark}
        />
      </PostFooter>
      
      <PostComments postId={post.id} />
      <RelatedPosts categoryId={post.categoryId} currentPostId={post.id} />
    </article>
  );
}

// Individual components
function PostHeader({ title, author, publishedAt, category, readingTime }) {
  return (
    <header className="mb-8">
      <CategoryBadge category={category} />
      <h1 className="text-4xl font-bold mt-4 mb-4">{title}</h1>
      <div className="flex items-center text-gray-600">
        <AuthorAvatar author={author} />
        <span className="mx-2">•</span>
        <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
        <span className="mx-2">•</span>
        <span>{readingTime} min read</span>
      </div>
    </header>
  );
}
```

### Composition Benefits
- **Highly reusable components**
- **Easy to test individual parts**
- **Flexible layout arrangements**
- **Better separation of concerns**

## 5. Provider Pattern

### Purpose
ใช้ React Context สำหรับ global state management และ dependency injection

### Implementation
```typescript
// shared/contexts/AuthContext.tsx
interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Initialize authentication state
    const initAuth = async () => {
      try {
        const session = await getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);
  
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await signIn('credentials', { email, password });
      if (result?.user) {
        setUser(result.user);
      }
    } finally {
      setLoading(false);
    }
  }, []);
  
  const logout = useCallback(async () => {
    await signOut();
    setUser(null);
  }, []);
  
  const value = useMemo(() => ({
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  }), [user, login, logout, loading]);
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Provider Guidelines
- **Create typed contexts**
- **Provide custom hooks for consumption**
- **Handle loading states**
- **Memoize context values**
- **Throw errors for improper usage**

## 6. API Client Pattern

### Purpose
จัดการการเรียก API อย่างมีระบบและสม่ำเสมอ พร้อมการจัดการ error และ authentication

### Implementation
```typescript
// shared/services/ApiClient.ts
export class ApiClient {
  private static readonly BASE_URL = import.meta.env.VITE_API_URL || '/api';
  
  static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || 'เกิดข้อผิดพลาดในการเรียก API',
          response.status,
          errorData
        );
      }
      
      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }
      
      return response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        'เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย',
        0,
        { originalError: error }
      );
    }
  }
  
  static get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }
  
  static post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  static patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  static delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
  
  private static getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
  
  private static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }
}

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

## 7. Error Boundary Pattern

### Purpose
จัดการ errors อย่างสง่างามเพื่อป้องกันไม่ให้ app crash

### Implementation
```typescript
// shared/components/ErrorBoundary.tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Log to error reporting service
    this.props.onError?.(error, errorInfo);
    
    this.setState({ errorInfo });
  }
  
  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };
  
  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent 
          error={this.state.error!} 
          retry={this.handleRetry}
        />
      );
    }
    
    return this.props.children;
  }
}

// Default error fallback component
function DefaultErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <button 
          onClick={retry}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

// Usage
function App() {
  return (
    <ErrorBoundary 
      fallback={CustomErrorFallback}
      onError={(error, errorInfo) => {
        // Send to error reporting service
        console.error('App Error:', error, errorInfo);
      }}
    >
      <BlogLayout>
        <PostList />
      </BlogLayout>
    </ErrorBoundary>
  );
}
```

## 8. Factory Pattern

### Purpose
สร้าง objects ตาม conditions หรือ configurations

### Implementation
```typescript
// shared/factories/ComponentFactory.ts
export type ComponentType = 'post' | 'comment' | 'user' | 'category';

export class ComponentFactory {
  static createCard(type: ComponentType, data: any, options?: any) {
    switch (type) {
      case 'post':
        return <PostCard post={data} variant={options?.variant} />;
      case 'comment':
        return <CommentCard comment={data} showReplies={options?.showReplies} />;
      case 'user':
        return <UserCard user={data} showStats={options?.showStats} />;
      case 'category':
        return <CategoryCard category={data} showPostCount={options?.showPostCount} />;
      default:
        throw new Error(`Unknown component type: ${type}`);
    }
  }
  
  static createModal(type: string, props: any) {
    const modals = {
      'confirm': ConfirmModal,
      'edit-post': EditPostModal,
      'delete-comment': DeleteCommentModal,
      'user-profile': UserProfileModal,
    };
    
    const ModalComponent = modals[type as keyof typeof modals];
    if (!ModalComponent) {
      throw new Error(`Unknown modal type: ${type}`);
    }
    
    return <ModalComponent {...props} />;
  }
  
  static createForm(formType: string, initialData?: any) {
    const forms = {
      'post': PostForm,
      'comment': CommentForm,
      'contact': ContactForm,
      'newsletter': NewsletterForm,
    };
    
    const FormComponent = forms[formType as keyof typeof forms];
    if (!FormComponent) {
      throw new Error(`Unknown form type: ${formType}`);
    }
    
    return <FormComponent initialData={initialData} />;
  }
}
```

## 9. Observer Pattern

### Purpose
Implement event-driven architecture สำหรับ loose coupling ระหว่าง components

### Implementation
```typescript
// shared/utils/EventEmitter.ts
export class EventEmitter {
  private events: { [key: string]: Function[] } = {};
  
  on(event: string, callback: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }
  
  off(event: string, callback: Function) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }
  
  emit(event: string, data?: any) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(data));
  }
  
  once(event: string, callback: Function) {
    const onceCallback = (data: any) => {
      callback(data);
      this.off(event, onceCallback);
    };
    this.on(event, onceCallback);
  }
}

// Global event bus
export const blogEvents = new EventEmitter();

// Usage for cross-component communication
// In PostForm component
function PostForm() {
  const handleSubmit = async (post: Post) => {
    await PostService.createPost(post);
    blogEvents.emit('post:created', post);
  };
}

// In PostList component
function PostList() {
  const { posts, setPosts } = usePosts();
  
  useEffect(() => {
    const handleNewPost = (post: Post) => {
      setPosts(prev => [post, ...prev]);
    };
    
    blogEvents.on('post:created', handleNewPost);
    
    return () => {
      blogEvents.off('post:created', handleNewPost);
    };
  }, [setPosts]);
}
```

## 10. Internationalization (i18n) Pattern

### Purpose
จัดการการแปลภาษาและ localization สำหรับ admin interface ที่รองรับภาษาลาวและอังกฤษ

### Implementation
```typescript
// shared/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation resources
import loCommon from './locales/lo/common.json';
import loAuth from './locales/lo/auth.json';
import loDashboard from './locales/lo/dashboard.json';
import loUsers from './locales/lo/users.json';
import loErrors from './locales/lo/errors.json';

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enDashboard from './locales/en/dashboard.json';
import enUsers from './locales/en/users.json';
import enErrors from './locales/en/errors.json';

const resources = {
  lo: {
    common: loCommon,
    auth: loAuth,
    dashboard: loDashboard,
    users: loUsers,
    errors: loErrors,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    users: enUsers,
    errors: enErrors,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    
    // Language detection settings
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // Namespace separation
    keySeparator: '.',
    nsSeparator: ':',
  });

export default i18n;
```

### Translation Hook Pattern
```typescript
// shared/hooks/useTranslation.ts
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useCallback } from 'react';

export function useTranslation(namespace?: string) {
  const { t, i18n } = useI18nTranslation(namespace);
  
  const changeLanguage = useCallback(async (lng: 'lo' | 'en') => {
    await i18n.changeLanguage(lng);
    
    // บันทึกภาษาที่เลือกไว้
    localStorage.setItem('preferred-language', lng);
    
    // อัปเดต HTML lang attribute
    document.documentElement.lang = lng;
    
    // อัปเดต document direction (สำหรับอนาคต)
    document.documentElement.dir = lng === 'lo' ? 'ltr' : 'ltr';
  }, [i18n]);
  
  const getCurrentLanguage = useCallback(() => {
    return i18n.language as 'lo' | 'en';
  }, [i18n]);
  
  const isLanguageSupported = useCallback((lng: string): lng is 'lo' | 'en' => {
    return ['lo', 'en'].includes(lng);
  }, []);
  
  return {
    t,
    changeLanguage,
    currentLanguage: getCurrentLanguage(),
    isLanguageSupported,
    isLoading: !i18n.isInitialized,
  };
}
```

### Language Context Pattern
```typescript
// shared/contexts/LanguageContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

interface LanguageContextValue {
  currentLanguage: 'lo' | 'en';
  changeLanguage: (lng: 'lo' | 'en') => Promise<void>;
  isLoading: boolean;
  supportedLanguages: Array<{
    code: 'lo' | 'en';
    name: string;
    nativeName: string;
  }>;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { currentLanguage, changeLanguage, isLoading } = useTranslation();
  
  const supportedLanguages = [
    { code: 'lo' as const, name: 'Lao', nativeName: 'ລາວ' },
    { code: 'en' as const, name: 'English', nativeName: 'English' },
  ];
  
  const value = {
    currentLanguage,
    changeLanguage,
    isLoading,
    supportedLanguages,
  };
  
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
```

### Component Usage Pattern
```typescript
// features/users/components/UserTable.tsx
import { useTranslation } from '@/shared/hooks/useTranslation';
import { useLanguage } from '@/shared/contexts/LanguageContext';

export default function UserTable() {
  const { t } = useTranslation('users'); // ใช้ namespace 'users'
  const { currentLanguage, changeLanguage } = useLanguage();
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">
          {t('title')} {/* users:title */}
        </h1>
        
        {/* Language Switcher */}
        <select 
          value={currentLanguage}
          onChange={(e) => changeLanguage(e.target.value as 'lo' | 'en')}
          className="border rounded px-2 py-1"
        >
          <option value="lo">ລາວ</option>
          <option value="en">English</option>
        </select>
      </div>
      
      <table className="w-full border">
        <thead>
          <tr>
            <th>{t('table.name')}</th> {/* users:table.name */}
            <th>{t('table.email')}</th> {/* users:table.email */}
            <th>{t('table.role')}</th> {/* users:table.role */}
            <th>{t('table.actions')}</th> {/* users:table.actions */}
          </tr>
        </thead>
        <tbody>
          {/* Table content */}
        </tbody>
      </table>
    </div>
  );
}
```

### Translation Files Structure
```json
// shared/i18n/locales/lo/users.json
{
  "title": "ການຈັດການຜູ້ໃຊ້",
  "table": {
    "name": "ຊື່",
    "email": "ອີເມລ",
    "role": "ບົດບາດ",
    "actions": "ການປະຕິບັດ"
  },
  "actions": {
    "create": "ສ້າງຜູ້ໃຊ້ໃໝ່",
    "edit": "ແກ້ໄຂ",
    "delete": "ລົບ",
    "view": "ເບິ່ງ"
  },
  "messages": {
    "created": "ສ້າງຜູ້ໃຊ້ສຳເລັດແລ້ວ",
    "updated": "ອັບເດດຜູ້ໃຊ້ສຳເລັດແລ້ວ",
    "deleted": "ລົບຜູ້ໃຊ້ສຳເລັດແລ້ວ"
  }
}

// shared/i18n/locales/en/users.json
{
  "title": "User Management",
  "table": {
    "name": "Name",
    "email": "Email",
    "role": "Role",
    "actions": "Actions"
  },
  "actions": {
    "create": "Create New User",
    "edit": "Edit",
    "delete": "Delete",
    "view": "View"
  },
  "messages": {
    "created": "User created successfully",
    "updated": "User updated successfully",
    "deleted": "User deleted successfully"
  }
}
```

## 11. MUI Theme Pattern

### Purpose
จัดการ MUI theming และ design system สำหรับ admin interface ที่สม่ำเสมอและปรับแต่งได้

### Implementation
```typescript
// shared/theme/index.ts
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { palette } from './palette';
import { typography } from './typography';
import { components } from './components';
import { breakpoints } from './breakpoints';

// สร้าง admin theme
export const adminTheme = createTheme({
  palette,
  typography,
  components,
  breakpoints,
  spacing: 8, // 8px grid system
  shape: {
    borderRadius: 8, // Rounded corners
  },
  zIndex: {
    appBar: 1200,
    drawer: 1100,
    modal: 1300,
    snackbar: 1400,
  },
});

// Theme Provider Wrapper
export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={adminTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
```

### Color Palette Configuration
```typescript
// shared/theme/palette.ts
import { PaletteOptions } from '@mui/material/styles';

export const palette: PaletteOptions = {
  mode: 'light', // Support dark mode later
  primary: {
    main: '#1976d2',     // Admin blue
    light: '#42a5f5',
    dark: '#1565c0',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#dc004e',     // Accent red
    light: '#ff5983',
    dark: '#9a0036',
    contrastText: '#ffffff',
  },
  error: {
    main: '#f44336',
    light: '#e57373',
    dark: '#d32f2f',
  },
  warning: {
    main: '#ff9800',
    light: '#ffb74d',
    dark: '#f57c00',
  },
  info: {
    main: '#2196f3',
    light: '#64b5f6',
    dark: '#1976d2',
  },
  success: {
    main: '#4caf50',
    light: '#81c784',
    dark: '#388e3c',
  },
  background: {
    default: '#f5f5f5',
    paper: '#ffffff',
  },
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    disabled: 'rgba(0, 0, 0, 0.38)',
  },
  divider: 'rgba(0, 0, 0, 0.12)',
};
```

### Component Overrides
```typescript
// shared/theme/components.ts
import { Components, Theme } from '@mui/material/styles';

export const components: Components<Theme> = {
  // Button overrides
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: 'none', // ไม่ใช้ uppercase
        fontWeight: 500,
        borderRadius: 8,
        padding: '8px 16px',
      },
      containedPrimary: {
        boxShadow: '0 2px 4px rgba(25, 118, 210, 0.25)',
        '&:hover': {
          boxShadow: '0 4px 8px rgba(25, 118, 210, 0.35)',
        },
      },
    },
  },
  
  // Card overrides
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        '&:hover': {
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
        },
      },
    },
  },
  
  // DataGrid overrides
  MuiDataGrid: {
    styleOverrides: {
      root: {
        border: 'none',
        borderRadius: 12,
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: '#f8f9fa',
          borderRadius: '12px 12px 0 0',
        },
        '& .MuiDataGrid-cell': {
          borderColor: '#e0e0e0',
        },
      },
    },
  },
  
  // TextField overrides
  MuiTextField: {
    defaultProps: {
      variant: 'outlined',
      size: 'medium',
    },
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
        },
      },
    },
  },
  
  // AppBar overrides
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#ffffff',
        color: '#333333',
      },
    },
  },
};
```

### MUI Hook Pattern
```typescript
// shared/hooks/useTheme.ts
import { useTheme as useMuiTheme, useMediaQuery } from '@mui/material';
import { Theme } from '@mui/material/styles';

export function useTheme() {
  const theme = useMuiTheme();
  
  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  
  // Helper functions
  const getSpacing = (multiplier: number) => theme.spacing(multiplier);
  const getPaletteColor = (color: keyof Theme['palette']) => theme.palette[color];
  
  return {
    theme,
    isMobile,
    isTablet,
    isDesktop,
    getSpacing,
    getPaletteColor,
    breakpoints: theme.breakpoints,
    palette: theme.palette,
    typography: theme.typography,
  };
}
```

## 12. MUI Component Composition Pattern

### Purpose
สร้าง reusable MUI components ที่ปรับแต่งแล้วสำหรับ admin interface

### Implementation
```typescript
// shared/components/ui/AdminCard.tsx
import { Card, CardProps, CardContent, CardHeader, Divider } from '@mui/material';
import { ReactNode } from 'react';

interface AdminCardProps extends Omit<CardProps, 'title'> {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  loading?: boolean;
}

export function AdminCard({ 
  title, 
  action, 
  children, 
  loading = false,
  ...cardProps 
}: AdminCardProps) {
  return (
    <Card {...cardProps}>
      {title && (
        <>
          <CardHeader
            title={title}
            action={action}
            sx={{
              pb: 1,
              '& .MuiCardHeader-title': {
                fontSize: '1.25rem',
                fontWeight: 600,
              },
            }}
          />
          <Divider />
        </>
      )}
      <CardContent sx={{ pt: title ? 2 : undefined }}>
        {loading ? (
          <AdminCardSkeleton />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

// Skeleton component
function AdminCardSkeleton() {
  return (
    <Box>
      <Skeleton variant="text" height={40} />
      <Skeleton variant="text" height={20} width="80%" />
      <Skeleton variant="text" height={20} width="60%" />
    </Box>
  );
}
```

### Form Components with MUI
```typescript
// shared/components/forms/AdminForm.tsx
import { 
  Box, 
  Button, 
  Stack, 
  Alert,
  CircularProgress 
} from '@mui/material';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from '@/shared/hooks/useTranslation';

interface AdminFormProps<T extends Record<string, any>> {
  schema: z.ZodSchema<T>;
  defaultValues?: Partial<T>;
  onSubmit: (data: T) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  children: ReactNode;
  submitText?: string;
  cancelText?: string;
  onCancel?: () => void;
}

export function AdminForm<T extends Record<string, any>>({
  schema,
  defaultValues,
  onSubmit,
  loading = false,
  error,
  children,
  submitText,
  cancelText,
  onCancel,
}: AdminFormProps<T>) {
  const { t } = useTranslation('common');
  const methods = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit = async (data: T) => {
    try {
      await onSubmit(data);
    } catch (err) {
      console.error('Form submission error:', err);
    }
  };

  return (
    <FormProvider {...methods}>
      <Box component="form" onSubmit={methods.handleSubmit(handleSubmit)}>
        <Stack spacing={3}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {children}
          
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            {onCancel && (
              <Button
                variant="outlined"
                onClick={onCancel}
                disabled={loading}
              >
                {cancelText || t('actions.cancel')}
              </Button>
            )}
            
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading && <CircularProgress size={16} />}
            >
              {submitText || t('actions.save')}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </FormProvider>
  );
}
```

## 13. React Context Reducer Pattern

### Purpose
จัดการ global state ด้วย React Context และ useReducer สำหรับ predictable state management

### Implementation
```typescript
// shared/contexts/AuthContext.tsx
import { createContext, useContext, useReducer, ReactNode } from 'react';
import { AuthApiClient } from '../services/api/authApi';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  permissions: string[];
  loading: boolean;
  error: string | null;
}

type AuthAction = 
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_PERMISSIONS'; payload: string[] }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  permissions: [],
  loading: false,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        permissions: action.payload.user.permissions,
        error: null,
      };
    
    case 'LOGIN_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
        user: null,
        token: null,
        isAuthenticated: false,
        permissions: [],
      };
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        permissions: [],
        error: null,
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    
    case 'UPDATE_PERMISSIONS':
      return {
        ...state,
        permissions: action.payload,
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    
    default:
      return state;
  }
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  updatePermissions: (permissions: string[]) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  const login = async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const result = await AuthApiClient.login({ email, password });
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { user: result.user, token: result.token } 
      });
      
      // Persist token
      localStorage.setItem('authToken', result.token);
    } catch (error) {
      dispatch({ 
        type: 'LOGIN_ERROR', 
        payload: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
      });
    }
  };
  
  const logout = () => {
    localStorage.removeItem('authToken');
    dispatch({ type: 'LOGOUT' });
  };
  
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };
  
  const updatePermissions = (permissions: string[]) => {
    dispatch({ type: 'UPDATE_PERMISSIONS', payload: permissions });
  };
  
  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    clearError,
    updatePermissions,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### UI State Context
```typescript
// shared/contexts/UIContext.tsx
import { createContext, useContext, useReducer, ReactNode } from 'react';

interface UIState {
  sidebarOpen: boolean;
  activeModal: string | null;
  notifications: Notification[];
  theme: 'light' | 'dark';
  language: SupportedLanguage;
  loading: {
    global: boolean;
    [key: string]: boolean;
  };
}

type UIAction = 
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'OPEN_MODAL'; payload: string }
  | { type: 'CLOSE_MODAL' }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_LANGUAGE'; payload: SupportedLanguage }
  | { type: 'SET_LOADING'; payload: { key: string; loading: boolean } };

const initialState: UIState = {
  sidebarOpen: true,
  activeModal: null,
  notifications: [],
  theme: 'light',
  language: 'en',
  loading: {
    global: false,
  },
};

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen,
      };
    
    case 'SET_SIDEBAR_OPEN':
      return {
        ...state,
        sidebarOpen: action.payload,
      };
    
    case 'OPEN_MODAL':
      return {
        ...state,
        activeModal: action.payload,
      };
    
    case 'CLOSE_MODAL':
      return {
        ...state,
        activeModal: null,
      };
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, {
          ...action.payload,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
        }],
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.id !== action.payload
        ),
      };
    
    case 'SET_THEME':
      return {
        ...state,
        theme: action.payload,
      };
    
    case 'SET_LANGUAGE':
      return {
        ...state,
        language: action.payload,
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.loading,
        },
      };
    
    default:
      return state;
  }
}

interface UIContextValue extends UIState {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: SupportedLanguage) => void;
  setLoading: (key: string, loading: boolean) => void;
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(uiReducer, initialState);
  
  const value: UIContextValue = {
    ...state,
    toggleSidebar: () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
    setSidebarOpen: (open) => dispatch({ type: 'SET_SIDEBAR_OPEN', payload: open }),
    openModal: (modalId) => dispatch({ type: 'OPEN_MODAL', payload: modalId }),
    closeModal: () => dispatch({ type: 'CLOSE_MODAL' }),
    addNotification: (notification) => dispatch({ type: 'ADD_NOTIFICATION', payload: notification }),
    removeNotification: (id) => dispatch({ type: 'REMOVE_NOTIFICATION', payload: id }),
    setTheme: (theme) => dispatch({ type: 'SET_THEME', payload: theme }),
    setLanguage: (language) => dispatch({ type: 'SET_LANGUAGE', payload: language }),
    setLoading: (key, loading) => dispatch({ type: 'SET_LOADING', payload: { key, loading } }),
  };
  
  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
```

## 14. React Router Pattern

### Purpose
จัดการ routing และ navigation ด้วย React Router สำหรับ Single Page Application

### Router Configuration
```typescript
// shared/router/index.tsx
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthGuard } from './guards/AuthGuard';
import { RoleGuard } from './guards/RoleGuard';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Layout components
import { AdminLayout } from '../components/layout/AdminLayout';
import { AuthLayout } from '../components/layout/AuthLayout';

// Page components
import { LoginPage } from '../../pages/auth/LoginPage';
import { DashboardPage } from '../../pages/dashboard/DashboardPage';
import { UsersPage } from '../../pages/users/UsersPage';
import { ExportsPage } from '../../pages/exports/ExportsPage';
import { NotFoundPage } from '../../pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: '',
        element: <Navigate to="/auth/login" replace />,
      },
    ],
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <AdminLayout />
      </AuthGuard>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'users',
        element: (
          <RoleGuard requiredPermissions={['users.read']}>
            <UsersPage />
          </RoleGuard>
        ),
      },
      {
        path: 'exports',
        element: (
          <RoleGuard requiredPermissions={['exports.read']}>
            <ExportsPage />
          </RoleGuard>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
```

### Route Guards
```typescript
// shared/router/guards/AuthGuard.tsx
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <div>Loading...</div>; // Or your loading component
  }
  
  if (!isAuthenticated) {
    // Redirect to login with return url
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
}

// shared/router/guards/RoleGuard.tsx
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface RoleGuardProps {
  children: ReactNode;
  requiredPermissions: string[];
  requireAll?: boolean; // true = require ALL permissions, false = require ANY permission
}

export function RoleGuard({ 
  children, 
  requiredPermissions, 
  requireAll = false 
}: RoleGuardProps) {
  const { permissions, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }
  
  const hasPermission = requireAll
    ? requiredPermissions.every(permission => permissions.includes(permission))
    : requiredPermissions.some(permission => permissions.includes(permission));
  
  if (!hasPermission) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
}
```

### Navigation Hook
```typescript
// shared/hooks/useNavigation.ts
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useCallback } from 'react';

export function useNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  
  const goTo = useCallback((path: string, options?: { replace?: boolean; state?: any }) => {
    navigate(path, options);
  }, [navigate]);
  
  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);
  
  const reload = useCallback(() => {
    navigate(location.pathname, { replace: true });
  }, [navigate, location.pathname]);
  
  const isCurrentPath = useCallback((path: string) => {
    return location.pathname === path;
  }, [location.pathname]);
  
  const isActivePath = useCallback((path: string) => {
    return location.pathname.startsWith(path);
  }, [location.pathname]);
  
  return {
    navigate: goTo,
    goBack,
    reload,
    location,
    params,
    isCurrentPath,
    isActivePath,
    currentPath: location.pathname,
    search: location.search,
    state: location.state,
  };
}

## 15. Adapter Pattern

### Purpose
แปลง interfaces ระหว่าง APIs หรือ data formats ที่แตกต่างกัน

### Implementation
```typescript
// shared/adapters/ApiAdapter.ts
export class ApiAdapter {
  // Convert external API response to internal format
  static adaptPost(externalPost: ExternalPost): Post {
    return {
      id: externalPost._id,
      title: externalPost.title,
      slug: externalPost.slug,
      content: externalPost.body,
      excerpt: externalPost.summary,
      publishedAt: new Date(externalPost.published_date),
      createdAt: new Date(externalPost.created_at),
      updatedAt: new Date(externalPost.updated_at),
      author: {
        id: externalPost.author.id,
        name: externalPost.author.display_name,
        email: externalPost.author.email,
        avatar: externalPost.author.profile_image
      },
      category: {
        id: externalPost.category.id,
        name: externalPost.category.name,
        slug: externalPost.category.slug
      },
      tags: externalPost.tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug
      })),
      stats: {
        views: externalPost.view_count,
        likes: externalPost.like_count,
        comments: externalPost.comment_count
      }
    };
  }
  
  // Convert internal format to API request format
  static adaptCreatePost(post: CreatePostData): ExternalCreatePost {
    return {
      title: post.title,
      body: post.content,
      summary: post.excerpt,
      author_id: post.authorId,
      category_id: post.categoryId,
      tag_ids: post.tagIds,
      published_date: post.publishedAt?.toISOString(),
      status: post.status || 'draft'
    };
  }
  
  // Adapt pagination response
  static adaptPagination(externalPagination: ExternalPagination): PaginationInfo {
    return {
      page: externalPagination.current_page,
      limit: externalPagination.per_page,
      total: externalPagination.total,
      totalPages: externalPagination.last_page,
      hasNextPage: externalPagination.current_page < externalPagination.last_page,
      hasPreviousPage: externalPagination.current_page > 1
    };
  }
}
```

## Architecture Best Practices (API-First)

### 1. API Service Abstraction
```typescript
// แยก interface สำหรับ testability
interface UserServiceInterface {
  getUsers(options: UserListOptions): Promise<UserListResponse>;
  createUser(data: CreateUserData): Promise<User>;
  updateUser(id: string, data: UpdateUserData): Promise<User>;
  deleteUser(id: string): Promise<void>;
}

class UserService implements UserServiceInterface {
  constructor(
    private apiClient: ApiClient,
    private cache: CacheService,
    private validator: ValidationService
  ) {}
  
  async getUsers(options: UserListOptions): Promise<UserListResponse> {
    const cacheKey = `users:${JSON.stringify(options)}`;
    
    // ตรวจสอบ cache ก่อน
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;
    
    // ตรวจสอบ input
    this.validator.validate(options, userListSchema);
    
    // เรียก API เท่านั้น - ไม่เรียก database โดยตรง
    const params = new URLSearchParams();
    if (options.page) params.set('page', options.page.toString());
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.search) params.set('search', options.search);
    
    const result = await this.apiClient.get<UserListResponse>(`/users?${params}`);
    
    // เก็บ cache
    await this.cache.set(cacheKey, result, 300); // 5 นาที
    
    return result;
  }
  
  async createUser(data: CreateUserData): Promise<User> {
    this.validator.validate(data, createUserSchema);
    
    // เรียก API เท่านั้น
    const result = await this.apiClient.post<User>('/users', data);
    
    // Clear related cache
    await this.cache.delete('users:*');
    
    return result;
  }
}
```

### 2. Interface Segregation
```typescript
// Split large interfaces into smaller, focused ones
interface PostReader {
  findById(id: string): Promise<Post | null>;
  findBySlug(slug: string): Promise<Post | null>;
  findAll(options: QueryOptions): Promise<Post[]>;
}

interface PostWriter {
  create(data: CreatePostData): Promise<Post>;
  update(id: string, data: UpdatePostData): Promise<Post>;
  delete(id: string): Promise<void>;
}

interface PostRepository extends PostReader, PostWriter {}
```

### 3. Single Responsibility
```typescript
// Each class/function should have one reason to change
class PostValidator {
  validateCreateData(data: CreatePostData): ValidationResult {
    // Only validation logic
  }
}

class PostTransformer {
  transformForDisplay(post: Post): DisplayPost {
    // Only transformation logic
  }
}

class PostService {
  constructor(
    private repository: PostRepository,
    private validator: PostValidator,
    private transformer: PostTransformer
  ) {}
  
  async createPost(data: CreatePostData): Promise<DisplayPost> {
    // Orchestrate the process
    const validationResult = this.validator.validateCreateData(data);
    if (!validationResult.isValid) {
      throw new ValidationError(validationResult.errors);
    }
    
    const post = await this.repository.create(data);
    return this.transformer.transformForDisplay(post);
  }
}
```

## 🚨 สำคัญ: หลักการ API-First Architecture

### ข้อกำหนดสำคัญ
1. **ห้ามเรียก Database โดยตรง**: Frontend จะเรียก API เท่านั้น ไม่มีการเชื่อมต่อ database โดยตรงเด็ดขาด
2. **ใช้ API Services**: ทุก data operation ต้องผ่าน API services
3. **Consistent Error Handling**: จัดการ error จาก API อย่างสม่ำเสมอ
4. **Authentication**: ส่ง token ใน header ทุกครั้งที่เรียก API
5. **Caching Strategy**: ใช้ cache เพื่อลด API calls ที่ไม่จำเป็น
6. **Internationalization**: รองรับการแปลภาษาลาวและอังกฤษในทุก component

### ประโยชน์ของ API-First Approach
- **ความปลอดภัย**: ลดความเสี่ยงจากการเข้าถึง database โดยตรง
- **Scalability**: แยก concerns ระหว่าง frontend และ backend ชัดเจน
- **Maintainability**: ง่ายต่อการแก้ไขและพัฒนา
- **Testability**: ทดสอบได้ง่ายด้วย mock API
- **Team Collaboration**: Frontend และ Backend teams ทำงานแยกกันได้

### ตัวอย่าง Architecture Flow
```
User Interface → Custom Hooks → API Services → API Client → Backend API → Database
```

**ห้ามทำ**: `Frontend → Database` (โดยตรง)
**ควรทำ**: `Frontend → API → Database`

## 16. Testing & Test ID Standards

### Purpose
จัดการการทดสอบใน Next.js/React applications ด้วย Test IDs ที่เป็นมาตรฐานสำหรับ E2E Testing และ Integration Testing

### Test ID Naming Convention
```typescript
/**
 * รูปแบบการตั้งชื่อ Test ID: [component-name]__[element-name]--[variant]
 *
 * - component-name: ชื่อ component (kebab-case)
 * - element-name: ชื่อ element ภายใน component (kebab-case)
 * - variant: (optional) variant หรือ state ของ element (kebab-case)
 *
 * ตัวอย่าง:
 * - user-card
 * - user-card__name
 * - user-card__edit-button
 * - user-card__status-badge--active
 */
```

### Component Test IDs
```typescript
// features/users/components/UserCard.tsx
import { useTranslation } from '@/shared/hooks/useTranslation';

interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  onDelete?: (id: string) => void;
}

export function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  const { t } = useTranslation('users');

  return (
    <div
      data-test-id="user-card"
      className="bg-white rounded-lg shadow-md p-4"
    >
      <div data-test-id="user-card__header" className="flex justify-between items-start">
        <div>
          <h3 data-test-id="user-card__name" className="text-lg font-semibold">
            {user.name}
          </h3>
          <p data-test-id="user-card__email" className="text-gray-600">
            {user.email}
          </p>
        </div>

        <span
          data-test-id={`user-card__status-badge--${user.status.toLowerCase()}`}
          className={`badge ${user.status === 'ACTIVE' ? 'badge-success' : 'badge-gray'}`}
        >
          {t(`status.${user.status.toLowerCase()}`)}
        </span>
      </div>

      <div data-test-id="user-card__info" className="mt-4 space-y-2">
        <div>
          <span data-test-id="user-card__role-label" className="text-sm text-gray-500">
            {t('labels.role')}:
          </span>
          <span data-test-id="user-card__role-value" className="ml-2 font-medium">
            {t(`roles.${user.role.toLowerCase()}`)}
          </span>
        </div>
      </div>

      <div data-test-id="user-card__actions" className="mt-4 flex gap-2">
        {onEdit && (
          <button
            data-test-id="user-card__edit-button"
            onClick={() => onEdit(user)}
            className="btn btn-primary"
          >
            {t('actions.edit')}
          </button>
        )}
        {onDelete && (
          <button
            data-test-id="user-card__delete-button"
            onClick={() => onDelete(user.id)}
            className="btn btn-danger"
          >
            {t('actions.delete')}
          </button>
        )}
      </div>
    </div>
  );
}
```

### Form Test IDs
```typescript
// features/users/components/UserForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from '@/shared/hooks/useTranslation';

interface UserFormProps {
  initialData?: Partial<User>;
  onSubmit: (data: CreateUserData) => Promise<void>;
  onCancel?: () => void;
}

export function UserForm({ initialData, onSubmit, onCancel }: UserFormProps) {
  const { t } = useTranslation('users');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: initialData,
  });

  return (
    <form
      data-test-id="user-form"
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
    >
      <div data-test-id="user-form__name-field">
        <label
          data-test-id="user-form__name-label"
          htmlFor="name"
          className="block text-sm font-medium mb-1"
        >
          {t('labels.name')}
        </label>
        <input
          data-test-id="user-form__name-input"
          id="name"
          type="text"
          {...register('name')}
          className="input"
          placeholder={t('placeholders.name')}
        />
        {errors.name && (
          <span
            data-test-id="user-form__name-error"
            className="text-red-500 text-sm"
          >
            {errors.name.message}
          </span>
        )}
      </div>

      <div data-test-id="user-form__email-field">
        <label
          data-test-id="user-form__email-label"
          htmlFor="email"
        >
          {t('labels.email')}
        </label>
        <input
          data-test-id="user-form__email-input"
          id="email"
          type="email"
          {...register('email')}
          className="input"
          placeholder={t('placeholders.email')}
        />
        {errors.email && (
          <span data-test-id="user-form__email-error" className="text-red-500 text-sm">
            {errors.email.message}
          </span>
        )}
      </div>

      <div data-test-id="user-form__role-field">
        <label data-test-id="user-form__role-label" htmlFor="role">
          {t('labels.role')}
        </label>
        <select
          data-test-id="user-form__role-select"
          id="role"
          {...register('role')}
          className="select"
        >
          <option value="">-- {t('placeholders.selectRole')} --</option>
          <option value="ADMIN">{t('roles.admin')}</option>
          <option value="OPERATOR">{t('roles.operator')}</option>
          <option value="VIEWER">{t('roles.viewer')}</option>
        </select>
      </div>

      <div data-test-id="user-form__actions" className="flex gap-2 justify-end">
        {onCancel && (
          <button
            data-test-id="user-form__cancel-button"
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            {t('actions.cancel')}
          </button>
        )}
        <button
          data-test-id="user-form__submit-button"
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? t('actions.saving') : t('actions.save')}
        </button>
      </div>

      {errors.root && (
        <div
          data-test-id="user-form__error-message"
          className="text-red-500 text-center"
        >
          {errors.root.message}
        </div>
      )}
    </form>
  );
}
```

### List/Table Test IDs
```typescript
// features/users/components/UserTable.tsx
import { useTranslation } from '@/shared/hooks/useTranslation';

interface UserTableProps {
  users: User[];
  onEdit?: (user: User) => void;
  onDelete?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

export function UserTable({ users, onEdit, onDelete, onViewDetails }: UserTableProps) {
  const { t } = useTranslation('users');

  if (users.length === 0) {
    return (
      <div
        data-test-id="user-table__empty-state"
        className="text-center py-8 text-gray-500"
      >
        {t('messages.noUsersFound')}
      </div>
    );
  }

  return (
    <div data-test-id="user-table">
      <table data-test-id="user-table__content" className="w-full">
        <thead data-test-id="user-table__header">
          <tr>
            <th data-test-id="user-table__header-name">{t('table.name')}</th>
            <th data-test-id="user-table__header-email">{t('table.email')}</th>
            <th data-test-id="user-table__header-role">{t('table.role')}</th>
            <th data-test-id="user-table__header-status">{t('table.status')}</th>
            <th data-test-id="user-table__header-actions">{t('table.actions')}</th>
          </tr>
        </thead>
        <tbody data-test-id="user-table__body">
          {users.map((user, index) => (
            <tr
              key={user.id}
              data-test-id={`user-table__row-${index}`}
              data-user-id={user.id}
              className="hover:bg-gray-50"
            >
              <td data-test-id={`user-table__row-${index}__name`}>
                {user.name}
              </td>
              <td data-test-id={`user-table__row-${index}__email`}>
                {user.email}
              </td>
              <td data-test-id={`user-table__row-${index}__role`}>
                {t(`roles.${user.role.toLowerCase()}`)}
              </td>
              <td data-test-id={`user-table__row-${index}__status`}>
                <span className={`badge badge-${user.status.toLowerCase()}`}>
                  {t(`status.${user.status.toLowerCase()}`)}
                </span>
              </td>
              <td data-test-id={`user-table__row-${index}__actions`}>
                <div className="flex gap-2">
                  {onViewDetails && (
                    <button
                      data-test-id={`user-table__row-${index}__view-button`}
                      onClick={() => onViewDetails(user.id)}
                      className="btn btn-sm btn-info"
                    >
                      {t('actions.view')}
                    </button>
                  )}
                  {onEdit && (
                    <button
                      data-test-id={`user-table__row-${index}__edit-button`}
                      onClick={() => onEdit(user)}
                      className="btn btn-sm btn-primary"
                    >
                      {t('actions.edit')}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      data-test-id={`user-table__row-${index}__delete-button`}
                      onClick={() => onDelete(user.id)}
                      className="btn btn-sm btn-danger"
                    >
                      {t('actions.delete')}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Modal Test IDs
```typescript
// shared/components/ui/Modal.tsx
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, ReactNode } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md'
}: ModalProps) {
  const { t } = useTranslation('common');

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        data-test-id="modal"
        className="relative z-50"
        onClose={onClose}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            data-test-id="modal__overlay"
            className="fixed inset-0 bg-black bg-opacity-25"
          />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                data-test-id="modal__content"
                className={`modal-${size} transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all`}
              >
                {title && (
                  <div data-test-id="modal__header" className="mb-4 flex justify-between items-center">
                    <Dialog.Title
                      data-test-id="modal__title"
                      as="h3"
                      className="text-lg font-medium"
                    >
                      {title}
                    </Dialog.Title>
                    <button
                      data-test-id="modal__close-button"
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-600"
                      aria-label={t('actions.close')}
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div data-test-id="modal__body" className="mt-2">
                  {children}
                </div>

                {footer && (
                  <div data-test-id="modal__footer" className="mt-4">
                    {footer}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
```

### Centralized Test IDs
```typescript
// shared/utils/testIds.ts
/**
 * Centralized Test ID constants for consistent testing
 */
export const testIds = {
  // Navigation
  navigation: {
    sidebar: 'navigation__sidebar',
    logo: 'navigation__logo',
    menuToggle: 'navigation__menu-toggle',
    menuItem: (name: string) => `navigation__menu-item--${name.toLowerCase()}`,
    userMenu: 'navigation__user-menu',
    logoutButton: 'navigation__logout-button',
  },

  // User Management
  users: {
    table: 'user-table',
    tableRow: (index: number) => `user-table__row-${index}`,
    createButton: 'users__create-button',
    searchInput: 'users__search-input',
    filterSelect: 'users__filter-select',
    emptyState: 'user-table__empty-state',
  },

  // User Form
  userForm: {
    container: 'user-form',
    nameInput: 'user-form__name-input',
    emailInput: 'user-form__email-input',
    roleSelect: 'user-form__role-select',
    submitButton: 'user-form__submit-button',
    cancelButton: 'user-form__cancel-button',
    errorMessage: 'user-form__error-message',
  },

  // Authentication
  auth: {
    loginForm: 'auth__login-form',
    emailInput: 'auth__email-input',
    passwordInput: 'auth__password-input',
    submitButton: 'auth__submit-button',
    errorMessage: 'auth__error-message',
    forgotPasswordLink: 'auth__forgot-password-link',
  },

  // Dashboard
  dashboard: {
    container: 'dashboard',
    statsCard: (name: string) => `dashboard__stats-card--${name}`,
    chart: (name: string) => `dashboard__chart--${name}`,
    recentActivityList: 'dashboard__recent-activity-list',
  },

  // Common UI Components
  common: {
    modal: 'modal',
    modalOverlay: 'modal__overlay',
    modalContent: 'modal__content',
    modalTitle: 'modal__title',
    modalCloseButton: 'modal__close-button',

    loading: 'common__loading-spinner',
    errorBoundary: 'common__error-boundary',

    notification: (index: number) => `notification-${index}`,
    notificationClose: (index: number) => `notification-${index}__close-button`,
  },
} as const;

/**
 * Dynamic test ID generator
 */
export function generateTestId(base: string, ...parts: (string | number)[]): string {
  return [base, ...parts.filter(p => p !== undefined && p !== null)].join('__');
}

/**
 * Test ID with variant generator
 */
export function generateTestIdWithVariant(
  base: string,
  element: string,
  variant?: string
): string {
  const testId = `${base}__${element}`;
  return variant ? `${testId}--${variant}` : testId;
}
```

### Test Utilities
```typescript
// shared/utils/testing/testUtils.ts
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/shared/contexts/AuthContext';
import { UIProvider } from '@/shared/contexts/UIContext';
import i18n from '@/shared/i18n/config';

/**
 * Custom render with all providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>
          <AuthProvider>
            <UIProvider>
              {children}
            </UIProvider>
          </AuthProvider>
        </BrowserRouter>
      </I18nextProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Test ID selectors
 */
export const testSelectors = {
  getByTestId: (testId: string) => `[data-test-id="${testId}"]`,

  getByTestIdPattern: (pattern: string) => `[data-test-id*="${pattern}"]`,

  getByTestIdStartsWith: (prefix: string) => `[data-test-id^="${prefix}"]`,

  getByTestIdEndsWith: (suffix: string) => `[data-test-id$="${suffix}"]`,
};

/**
 * Mock data generators
 */
export const mockData = {
  user: (overrides?: Partial<User>): User => ({
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  users: (count: number): User[] =>
    Array.from({ length: count }, (_, i) => mockData.user({
      id: `user-${i + 1}`,
      name: `Test User ${i + 1}`,
      email: `test${i + 1}@example.com`,
    })),
};
```

### E2E Testing Example (Playwright/Cypress)
```typescript
// e2e/users.spec.ts
import { test, expect } from '@playwright/test';
import { testIds } from '../shared/utils/testIds';

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill(`[data-test-id="${testIds.auth.emailInput}"]`, 'admin@example.com');
    await page.fill(`[data-test-id="${testIds.auth.passwordInput}"]`, 'password123');
    await page.click(`[data-test-id="${testIds.auth.submitButton}"]`);

    // Wait for redirect
    await page.waitForURL('/dashboard');

    // Navigate to users
    await page.click(`[data-test-id="${testIds.navigation.menuItem('users')}"]`);
  });

  test('should display users table', async ({ page }) => {
    // Check table exists
    await expect(page.locator(`[data-test-id="${testIds.users.table}"]`)).toBeVisible();

    // Check at least one row exists
    await expect(page.locator(`[data-test-id^="user-table__row-"]`)).toHaveCount(1, {
      timeout: 5000
    });
  });

  test('should create new user', async ({ page }) => {
    // Click create button
    await page.click(`[data-test-id="${testIds.users.createButton}"]`);

    // Fill form
    await page.fill(`[data-test-id="${testIds.userForm.nameInput}"]`, 'New User');
    await page.fill(`[data-test-id="${testIds.userForm.emailInput}"]`, 'newuser@example.com');
    await page.selectOption(`[data-test-id="${testIds.userForm.roleSelect}"]`, 'USER');

    // Submit
    await page.click(`[data-test-id="${testIds.userForm.submitButton}"]`);

    // Verify success
    await expect(page.locator('[data-test-id*="notification"]')).toContainText('สร้างผู้ใช้สำเร็จ');
  });

  test('should search users', async ({ page }) => {
    // Type in search
    await page.fill(`[data-test-id="${testIds.users.searchInput}"]`, 'john');

    // Wait for results
    await page.waitForTimeout(500); // Debounce

    // Verify filtered results
    const rows = page.locator(`[data-test-id^="user-table__row-"]`);
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('john', { ignoreCase: true });
  });

  test('should delete user', async ({ page }) => {
    // Click delete on first user
    await page.click(`[data-test-id="user-table__row-0__delete-button"]`);

    // Confirm deletion
    await page.click(`[data-test-id="modal__confirm-button"]`);

    // Verify success
    await expect(page.locator('[data-test-id*="notification"]')).toContainText('ลบผู้ใช้สำเร็จ');
  });
});
```

### Test ID Best Practices
1. **ใช้ data-test-id แทน class/id**: เพื่อแยก testing concerns จาก styling
2. **Naming Convention**: ใช้ kebab-case และมีโครงสร้างชัดเจน
3. **Centralized Constants**: เก็บ test IDs ไว้ที่เดียวใน testIds object
4. **Dynamic IDs**: ใช้ functions สำหรับ dynamic test IDs (เช่น index ใน loop)
5. **Accessibility**: ใช้ test IDs ร่วมกับ aria-label และ semantic HTML
6. **Internationalization**: Test IDs ไม่ควรขึ้นกับภาษา ใช้ key แทนข้อความ

Remember: เลือกใช้ patterns ตามความจำเป็น อย่า over-engineer features ง่ายๆ แต่ใช้ patterns เหล่านี้เมื่อมีประโยชน์ชัดเจนในด้าน maintainability, testability และ scalability

**หลักการสำคัญ**: ใน MTS Admin Frontend จะเรียก API เท่านั้น ไม่มีการเชื่อมต่อ database โดยตรงในทุกกรณี
