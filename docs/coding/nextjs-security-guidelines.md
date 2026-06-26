# Security Guidelines
*OWASP Top 10 2021 Compliance*

## Overview
This document outlines comprehensive security best practices following the OWASP Top 10 security risks for web applications. Every implementation must prioritize security from the ground up, with special focus on data export security and access control.

---

## A01:2021 – Broken Access Control

### Authentication Requirements
```typescript
// Always verify authentication in API routes
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json(
      { 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
        timestamp: new Date().toISOString(),
        path: request.nextUrl.pathname
      },
      { status: 401 }
    );
  }
  
  // Continue with authenticated logic
}
```

### Authorization & Resource Ownership
```typescript
// Verify resource ownership before allowing operations
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  
  const exportJob = await prisma.export.findUnique({
    where: { id: params.id },
    include: { user: true }
  });
  
  if (!export) {
    return NextResponse.json({ error: 'Export not found' }, { status: 404 });
  }
  
  // Check ownership or admin privileges
  if (export.user.id !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { 
        error: 'Access denied',
        code: 'INSUFFICIENT_PERMISSIONS',
        details: { required: 'owner or admin', current: session.user.role }
      },
      { status: 403 }
    );
  }
  
  // Continue with update logic
}
```

### Role-Based Access Control (RBAC)
```typescript
// Middleware for role-based access
async function requireRole(allowedRoles: string[]) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new Error('Authentication required');
  }
  
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
  }
  
  return session.user;
}

// Usage in API routes
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireRole(['ADMIN', 'EDITOR']);
    // Continue with admin/editor logic
  } catch (error) {
    return NextResponse.json(
      { error: error.message, code: 'ACCESS_DENIED' },
      { status: 403 }
    );
  }
}
```

### Prevent Direct Object References
```typescript
// Use UUIDs instead of sequential IDs
// ✅ Good: /api/exports/clp123abc-def456-ghi789
// ❌ Bad: /api/exports/1, /api/exports/2

// Validate user can access specific resource
async function validateExportAccess(exportId: string, userId: string) {
  const export = await prisma.export.findFirst({
    where: {
      id: exportId,
      OR: [
        { userId: userId },           // User owns the export
        { status: 'PUBLISHED' },       // Export is public
        { 
          collaborators: {             // User is a collaborator
            some: { userId: userId }
          }
        }
      ],
      deletedAt: null                  // Export is not deleted
    },
    include: {
      user: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } }
    }
  });
  
  if (!export) {
    throw new Error('Export not found or access denied');
  }
  
  return export;
}
```

---

## A02:2021 – Cryptographic Failures

### Environment Variable Security
```bash
# .env.local - Never commit to version control
DATABASE_URL="exportgresql://..."
NEXTAUTH_SECRET="minimum-32-characters-random-string-here"
NEXTAUTH_URL="https://yourdomain.com"

# Use different keys per environment
ENCRYPTION_KEY_DEV="dev-key-32-chars-minimum-length"
ENCRYPTION_KEY_PROD="prod-key-32-chars-minimum-length"
WEBHOOK_SECRET="webhook-secret-for-stripe-github-etc"

# Validate at startup
REQUIRED_ENV_VARS="DATABASE_URL,NEXTAUTH_SECRET,NEXTAUTH_URL"
```

### Sensitive Data Encryption
```typescript
// Encrypt sensitive user data at rest
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const ALGORITHM = 'aes-256-gcm';

export const encrypt = (text: string): string => {
  if (!text) return '';
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
};

export const decrypt = (encryptedText: string): string => {
  if (!encryptedText) return '';
  
  const parts = encryptedText.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted format');
  
  const [ivHex, authTagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// Usage for sensitive fields
const user = await prisma.user.create({
  data: {
    email: email,
    // Encrypt sensitive personal data
    phoneNumber: phoneNumber ? encrypt(phoneNumber) : null,
    address: address ? encrypt(address) : null,
  }
});
```

### HTTPS Enforcement
```typescript
// middleware.ts - Force HTTPS in production
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Force HTTPS in production
  if (
    process.env.NODE_ENV === 'production' && 
    request.headers.get('x-forwarded-proto') !== 'https'
  ) {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.nextUrl.pathname}${request.nextUrl.search}`
    );
  }
  
  // Continue with request
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/webhooks|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

---

## A03:2021 – Injection

### Input Validation & Sanitization
```typescript
// Comprehensive input validation using Zod
import { z } from 'zod';
import DOMPurify from 'dompurify';

const createExportSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title too long')
    .regex(/^[a-zA-Z0-9\s\-_.,!?()'"]+$/, 'Title contains invalid characters'),
  
  content: z.string()
    .min(10, 'Content too short')
    .max(50000, 'Content too long'),
    
  slug: z.string()
    .min(1, 'Slug is required')
    .max(100, 'Slug too long')
    .regex(/^[a-z0-9\-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
    
  excerpt: z.string()
    .max(500, 'Excerpt too long')
    .optional(),
    
  tags: z.array(z.string().max(50)).max(10, 'Too many tags'),
  
  categoryId: z.string().uuid('Invalid category ID').optional(),
  
  publishedAt: z.coerce.date().optional(),
  
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
});

export const validateAndSanitizeExport = (input: unknown) => {
  // Validate structure
  const validated = createExportSchema.parse(input);
  
  // Sanitize HTML content
  const sanitizedContent = DOMPurify.sanitize(validated.content, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|xxx):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  });
  
  return {
    ...validated,
    title: escapeHtml(validated.title),
    content: sanitizedContent,
    excerpt: validated.excerpt ? escapeHtml(validated.excerpt) : undefined,
  };
};

// HTML escape utility
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
```

### SQL Injection Prevention
```typescript
// ✅ Always use Prisma's parameterized queries - NO raw SQL
const exports = await prisma.export.findMany({
  where: {
    title: { contains: searchTerm, mode: 'insensitive' },
    status: 'PUBLISHED',
    publishedAt: { lte: new Date() }
  },
  orderBy: { publishedAt: 'desc' }
});

// ✅ If raw SQL is absolutely necessary, use parameterized queries
const results = await prisma.$queryRaw`
  SELECT p.*, u.name as user_name
  FROM "Export" p
  JOIN "User" u ON p."userId" = u.id
  WHERE p.title ILIKE ${'%' + searchTerm + '%'}
    AND p.status = ${status}
  ORDER BY p."publishedAt" DESC
  LIMIT ${limit}
`;

// ❌ NEVER use string concatenation with user input
// const query = `SELECT * FROM exports WHERE title LIKE '%${userInput}%'`;
```

### Command Injection Prevention
```typescript
// ❌ NEVER execute user input as shell commands
// const result = exec(`ls ${userProvidedPath}`);

// ✅ Use safe APIs and validate paths
import path from 'path';
import fs from 'fs/promises';

const readSafeFile = async (filename: string) => {
  // Validate filename against whitelist
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
    throw new Error('Invalid filename format');
  }
  
  // Prevent directory traversal
  const safePath = path.resolve(process.cwd(), 'safe-directory', filename);
  if (!safePath.startsWith(path.resolve(process.cwd(), 'safe-directory'))) {
    throw new Error('Path traversal attempt detected');
  }
  
  try {
    return await fs.readFile(safePath, 'utf8');
  } catch (error) {
    throw new Error('File not found or access denied');
  }
};
```

---

## A04:2021 – Insecure Design

### Rate Limiting Implementation
```typescript
// Progressive rate limiting with Redis
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyGenerator?: (request: NextRequest) => string;
}

const rateLimitConfigs = {
  login: { windowMs: 15 * 60 * 1000, max: 5 },     // 5 attempts per 15min
  register: { windowMs: 60 * 60 * 1000, max: 3 },  // 3 attempts per hour
  api: { windowMs: 15 * 60 * 1000, max: 100 },     // 100 requests per 15min
  password_reset: { windowMs: 60 * 60 * 1000, max: 3 }, // 3 per hour
  comment: { windowMs: 60 * 1000, max: 10 },       // 10 comments per minute
};

export async function checkRateLimit(
  request: NextRequest,
  type: keyof typeof rateLimitConfigs
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const config = rateLimitConfigs[type];
  const key = `rate_limit:${type}:${request.ip || 'anonymous'}`;
  
  const current = await redis.get(key);
  const count = current ? parseInt(current) : 0;
  
  if (count >= config.max) {
    const ttl = await redis.ttl(key);
    return { 
      allowed: false, 
      remaining: 0, 
      resetTime: Date.now() + (ttl * 1000) 
    };
  }
  
  // Increment counter
  const newCount = await redis.incr(key);
  if (newCount === 1) {
    await redis.expire(key, Math.ceil(config.windowMs / 1000));
  }
  
  return { 
    allowed: true, 
    remaining: config.max - newCount,
    resetTime: Date.now() + config.windowMs
  };
}

// Account lockout after failed attempts
export async function handleFailedLogin(userId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { 
      failedLoginAttempts: { increment: 1 },
      lastFailedLoginAt: new Date()
    }
  });
  
  // Lock account after 5 failed attempts
  if (user.failedLoginAttempts >= 5) {
    await prisma.user.update({
      where: { id: userId },
      data: { 
        lockedUntil: new Date(Date.now() + 30 * 60 * 1000), // 30min lockout
        failedLoginAttempts: 0 // Reset counter
      }
    });
    
    // Log security event
    await prisma.securityEventLog.create({
      data: {
        eventType: 'ACCOUNT_LOCKED',
        severity: 'HIGH',
        description: `Account locked due to ${user.failedLoginAttempts} failed login attempts`,
        userId: userId,
        ipAddress: request.ip,
        userAgent: request.headers.get('user-agent'),
      }
    });
  }
}
```

### Secure Password Reset Flow
```typescript
import crypto from 'crypto';

export async function initiatePasswordReset(email: string, request: NextRequest) {
  const user = await prisma.user.findUnique({ where: { email } });
  
  // Always return success to prevent email enumeration
  const response = { success: true, message: 'If the email exists, a reset link has been sent.' };
  
  if (!user || user.deletedAt) {
    // Log potential enumeration attempt
    await prisma.securityEventLog.create({
      data: {
        eventType: 'PASSWORD_RESET_INVALID_EMAIL',
        severity: 'LOW',
        description: `Password reset attempted for non-existent email: ${email}`,
        ipAddress: request.ip,
        userAgent: request.headers.get('user-agent'),
      }
    });
    return response;
  }
  
  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  
  // Store hashed token
  await prisma.passwordResetToken.create({
    data: {
      token: await bcrypt.hash(token, 10),
      userId: user.id,
      expires,
      createdIp: request.ip,
      userAgent: request.headers.get('user-agent'),
    }
  });
  
  // Send email with plain token (not hashed)
  await sendPasswordResetEmail(email, token, user.name);
  
  return response;
}
```

---

## A05:2021 – Security Misconfiguration

### Security Headers Configuration
```typescript
// next.config.js - Comprehensive security headers
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' https:",
      "connect-src 'self' https://api.github.com https://vitals.vercel-insights.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests"
    ].join('; ')
  },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { 
    key: 'Permissions-Policy', 
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' 
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

### Environment Validation
```typescript
// lib/env-validation.ts - Validate environment at startup
const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
];

const sensitivePatterns = [
  /secret/i, /key/i, /token/i, /password/i, /auth/i
];

export const validateEnvironment = () => {
  // Check required variables
  const missing = requiredEnvVars.filter(name => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate NEXTAUTH_SECRET length
  if (process.env.NEXTAUTH_SECRET!.length < 32) {
    throw new Error('NEXTAUTH_SECRET must be at least 32 characters long');
  }
  
  // Check for exposed sensitive variables in client bundle
  if (typeof window !== 'undefined') {
    const clientVars = Object.keys(process.env).filter(key => 
      key.startsWith('NEXT_PUBLIC_')
    );
    
    const dangerous = clientVars.filter(key =>
      sensitivePatterns.some(pattern => pattern.test(key))
    );
    
    if (dangerous.length > 0) {
      console.warn('⚠️  Potentially sensitive environment variables exposed to client:', dangerous);
    }
  }
  
  console.log('✅ Environment validation passed');
};

// Call at startup
validateEnvironment();
```

---

## A06:2021 – Vulnerable Components

### Dependency Security Management
```json
// package.json - Security-focused dependency management
{
  "scripts": {
    "audit": "npm audit --audit-level high",
    "audit:fix": "npm audit fix",
    "security-check": "npm audit && npm outdated",
    "deps:update": "npx npm-check-updates -u",
    "deps:check": "npx depcheck"
  },
  "dependencies": {
    "next": "15.1.0",
    "react": "19.0.0",
    "next-auth": "5.0.0-beta.25",
    "@prisma/client": "6.13.0"
  }
}
```

### Automated Security Scanning
```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run npm audit
        run: npm audit --audit-level high
      
      - name: Run Snyk security scan
        run: npx snyk test --severity-threshold=high
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      
      - name: Check for outdated packages
        run: npm outdated --depth=0
```

---

## A07:2021 – Authentication Failures

### NextAuth.js Security Configuration
```typescript
// app/api/auth/[...nextauth]/route.ts
export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,   // 24 hours
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60,
  },
  cookies: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
  callbacks: {
    async session({ session, token }) {
      // Add security checks
      if (token.lastActivity && 
          Date.now() - (token.lastActivity as number) > 24 * 60 * 60 * 1000) {
        throw new Error('Session expired due to inactivity');
      }
      
      // Update last activity
      token.lastActivity = Date.now();
      
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub!,
          role: token.role as string,
          lastActivity: token.lastActivity
        }
      };
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role;
        token.lastActivity = Date.now();
        
        // Log successful login
        await prisma.securityEventLog.create({
          data: {
            eventType: 'USER_LOGIN',
            severity: 'LOW',
            description: `User logged in via ${account?.provider}`,
            userId: user.id,
            metadata: {
              provider: account?.provider,
              loginTime: new Date().toISOString()
            }
          }
        });
      }
      
      return token;
    }
  },
  events: {
    async signOut({ token }) {
      if (token?.sub) {
        await prisma.securityEventLog.create({
          data: {
            eventType: 'USER_LOGOUT',
            severity: 'LOW',
            description: 'User logged out',
            userId: token.sub,
          }
        });
      }
    }
  }
};
```

---

## A08:2021 – Software and Data Integrity

### File Upload Security
```typescript
// Secure file upload handling
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export async function validateFileUpload(file: File): Promise<{
  valid: boolean;
  error?: string;
  sanitizedName?: string;
}> {
  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' };
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large. Maximum size is 5MB.' };
  }
  
  // Validate file extension
  const extension = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { valid: false, error: 'Invalid file extension.' };
  }
  
  // Validate file signature (magic numbers)
  const buffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);
  
  const jpegSignature = [0xFF, 0xD8, 0xFF];
  const pngSignature = [0x89, 0x50, 0x4E, 0x47];
  const webpSignature = [0x52, 0x49, 0x46, 0x46]; // "RIFF"
  
  const hasValidSignature = 
    jpegSignature.every((byte, i) => uint8Array[i] === byte) ||
    pngSignature.every((byte, i) => uint8Array[i] === byte) ||
    (webpSignature.every((byte, i) => uint8Array[i] === byte) && 
     uint8Array[8] === 0x57 && uint8Array[9] === 0x45 && 
     uint8Array[10] === 0x42 && uint8Array[11] === 0x50); // "WEBP"
    
  if (!hasValidSignature) {
    return { valid: false, error: 'Invalid file signature. File may be corrupted or malicious.' };
  }
  
  // Sanitize filename
  const sanitizedName = sanitizeFilename(file.name);
  
  return { valid: true, sanitizedName };
}

function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts and dangerous characters
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .substring(0, 100); // Limit length
}
```

### Data Integrity Checks
```typescript
// Implement checksums for critical data
export const dataIntegrity = {
  generateChecksum: (data: string): string => {
    return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
  },
  
  verifyIntegrity: async (exportId: string): Promise<boolean> => {
    const export = await prisma.export.findUnique({
      where: { id: exportId },
      select: { content: true, checksum: true, updatedAt: true }
    });
    
    if (!export) return false;
    
    const currentChecksum = dataIntegrity.generateChecksum(export.content);
    return currentChecksum === export.checksum;
  },
  
  updateWithChecksum: async (exportId: string, content: string, userId: string) => {
    const checksum = dataIntegrity.generateChecksum(content);
    
    return await prisma.export.update({
      where: { id: exportId },
      data: { 
        content,
        checksum,
        updatedAt: new Date(),
        updatedBy: userId,
        revisionCount: { increment: 1 }
      }
    });
  }
};
```

---

## A09:2021 – Security Logging and Monitoring

### Comprehensive Security Logging
```typescript
// Security event logging system
export const securityLogger = {
  logAuthenticationAttempt: async (
    email: string, 
    success: boolean, 
    ip: string, 
    userAgent: string,
    additionalData?: Record<string, any>
  ) => {
    await prisma.securityEventLog.create({
      data: {
        eventType: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
        severity: success ? 'LOW' : 'MEDIUM',
        description: `Authentication attempt for ${email}`,
        ipAddress: ip,
        userAgent: userAgent,
        metadata: {
          email,
          success,
          timestamp: new Date().toISOString(),
          ...additionalData
        }
      }
    });
  },
  
  logSuspiciousActivity: async (
    userId: string | null, 
    activity: string, 
    details: Record<string, any>,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM'
  ) => {
    await prisma.securityEventLog.create({
      data: {
        eventType: 'SUSPICIOUS_ACTIVITY',
        severity,
        description: activity,
        userId,
        metadata: {
          activity,
          details,
          timestamp: new Date().toISOString()
        }
      }
    });
    
    // Alert for high/critical severity
    if (['HIGH', 'CRITICAL'].includes(severity)) {
      await sendSecurityAlert(activity, details, severity);
    }
  },
  
  logDataAccess: async (
    userId: string, 
    resource: string, 
    action: string,
    resourceId?: string,
    additionalData?: Record<string, any>
  ) => {
    await prisma.securityEventLog.create({
      data: {
        eventType: 'DATA_ACCESS',
        severity: 'LOW',
        description: `${action} on ${resource}`,
        userId,
        metadata: {
          resource,
          action,
          resourceId,
          timestamp: new Date().toISOString(),
          ...additionalData
        }
      }
    });
  }
};
```

### Anomaly Detection
```typescript
// Security monitoring and anomaly detection
export const securityMonitoring = {
  detectAnomalies: async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    
    // Check for unusual login patterns (last 24 hours)
    const recentLogins = await prisma.securityEventLog.findMany({
      where: {
        userId: userId,
        eventType: 'LOGIN_SUCCESS',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    });
    
    // Multiple countries in short time
    const countries = [...new Set(recentLogins.map(log => 
      log.metadata?.country || 'unknown'
    ))];
    
    if (countries.length > 2) {
      await securityLogger.logSuspiciousActivity(
        userId,
        'MULTIPLE_COUNTRIES_LOGIN',
        {
          countries: countries,
          timeframe: '24h',
          loginCount: recentLogins.length
        },
        'HIGH'
      );
    }
    
    // High frequency requests
    if (recentLogins.length > 10) {
      await securityLogger.logSuspiciousActivity(
        userId,
        'HIGH_FREQUENCY_LOGINS',
        {
          count: recentLogins.length,
          timeframe: '24h'
        },
        'MEDIUM'
      );
    }
  },
  
  checkFailedAttempts: async (ip: string) => {
    const failedAttempts = await prisma.securityEventLog.count({
      where: {
        eventType: 'LOGIN_FAILED',
        ipAddress: ip,
        createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } // Last 15 minutes
      }
    });
    
    if (failedAttempts > 10) {
      // Auto-ban IP
      await redis.setex(`banned_ip:${ip}`, 3600, '1'); // 1 hour ban
      
      await securityLogger.logSuspiciousActivity(
        null,
        'IP_AUTO_BANNED',
        {
          ip: ip,
          failedAttempts: failedAttempts,
          banDuration: '1 hour'
        },
        'HIGH'
      );
    }
  }
};
```

---

## A10:2021 – Server-Side Request Forgery (SSRF)

### URL Validation & SSRF Prevention
```typescript
// Comprehensive SSRF protection
export const ssrfProtection = {
  validateUrl: (url: string): { valid: boolean; error?: string } => {
    try {
      const parsed = new URL(url);
      
      // Only allow HTTP/HTTPS
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
      }
      
      // Block private IP ranges
      const privateRanges = [
        /^10\./,                    // 10.0.0.0/8
        /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
        /^192\.168\./,              // 192.168.0.0/16
        /^127\./,                   // 127.0.0.0/8 (localhost)
        /^169\.254\./,              // 169.254.0.0/16 (link-local)
        /^::1$/,                    // IPv6 loopback
        /^fc00:/,                   // IPv6 private
        /^fe80:/                    // IPv6 link-local
      ];
      
      const isPrivate = privateRanges.some(range => 
        range.test(parsed.hostname)
      );
      
      if (isPrivate) {
        return { valid: false, error: 'Private IP addresses are not allowed' };
      }
      
      // Block metadata services
      const blockedHosts = [
        '169.254.169.254',          // AWS metadata
        'metadata.google.internal', // Google Cloud metadata
        '100.100.100.200',          // Alibaba metadata
        'metadata.azure.com',       // Azure metadata
      ];
      
      if (blockedHosts.includes(parsed.hostname)) {
        return { valid: false, error: 'Metadata service access is blocked' };
      }
      
      // Block localhost variations
      const localhostVariations = [
        'localhost', '0.0.0.0', '[::]', '[::1]'
      ];
      
      if (localhostVariations.includes(parsed.hostname)) {
        return { valid: false, error: 'Localhost access is not allowed' };
      }
      
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }
  },
  
  safeFetch: async (
    url: string, 
    options: RequestInit = {},
    timeout: number = 5000
  ): Promise<Response> => {
    const validation = ssrfProtection.validateUrl(url);
    if (!validation.valid) {
      throw new Error(`SSRF Protection: ${validation.error}`);
    }
    
    // Set timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        // Limit redirects
        redirect: 'manual',
        // Set reasonable headers
        headers: {
          'User-Agent': 'SampleExport/1.0',
          ...options.headers
        }
      });
      
      clearTimeout(timeoutId);
      
      // Check for redirects to private IPs
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (location) {
          const redirectValidation = ssrfProtection.validateUrl(location);
          if (!redirectValidation.valid) {
            throw new Error(`SSRF Protection - Redirect: ${redirectValidation.error}`);
          }
        }
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Log SSRF attempt
      await securityLogger.logSuspiciousActivity(
        null,
        'SSRF_ATTEMPT',
        {
          url: url,
          error: error.message,
          timestamp: new Date().toISOString()
        },
        'HIGH'
      );
      
      throw error;
    }
  }
};
```

---

## Security Implementation Checklist

### Pre-deployment Security Audit
- [ ] **A01 - Access Control**
  - [ ] Authentication required on all protected routes
  - [ ] Authorization checks implemented for resource access
  - [ ] Role-based permissions configured
  - [ ] Direct object reference protection active

- [ ] **A02 - Cryptographic Failures**
  - [ ] HTTPS enforced in production
  - [ ] Strong password hashing implemented (if applicable)
  - [ ] Sensitive data encrypted at rest
  - [ ] Environment variables secured

- [ ] **A03 - Injection**
  - [ ] Parameterized queries used exclusively
  - [ ] Input validation on all endpoints
  - [ ] Output encoding implemented
  - [ ] Command injection prevention active

- [ ] **A04 - Insecure Design**
  - [ ] Rate limiting implemented
  - [ ] Account lockout mechanisms active
  - [ ] Secure password reset flow implemented
  - [ ] Security controls integrated into design

- [ ] **A05 - Security Misconfiguration**
  - [ ] Security headers configured
  - [ ] Environment variables validated
  - [ ] Error messages sanitized
  - [ ] Default configurations secured

- [ ] **A06 - Vulnerable Components**
  - [ ] Dependencies up to date
  - [ ] Security scanning automated
  - [ ] Vulnerability monitoring active
  - [ ] Update process documented

- [ ] **A07 - Authentication Failures**
  - [ ] Strong authentication mechanisms
  - [ ] Session management secure
  - [ ] Multi-factor authentication considered
  - [ ] Session timeout implemented

- [ ] **A08 - Data Integrity**
  - [ ] Input validation comprehensive
  - [ ] File upload restrictions active
  - [ ] Data integrity checks implemented
  - [ ] Checksums for critical data

- [ ] **A09 - Logging Failures**
  - [ ] Security events logged
  - [ ] Anomaly detection active
  - [ ] Incident response procedures documented
  - [ ] Log monitoring configured

- [ ] **A10 - SSRF**
  - [ ] URL validation implemented
  - [ ] Network access restrictions active
  - [ ] Metadata service blocking enabled
  - [ ] Request timeout limits set

### Ongoing Security Maintenance
1. **Daily**: Monitor security logs and alerts
2. **Weekly**: Review failed authentication attempts and anomalies
3. **Monthly**: Update dependencies and security patches
4. **Quarterly**: Conduct security assessments
5. **Annually**: Complete comprehensive security audit

Remember: Security is not a feature, it's a foundation. Every line of code should be written with security in mind.
