# Performance Guide

## Performance Targets
- **Health Check**: < 10ms | **Auth**: < 100ms | **CRUD**: < 200ms | **Complex**: < 500ms | **Bulk**: < 2s
- **Memory**: < 256MB | **CPU**: < 30% | **DB Pool**: 10-50 | **Concurrent**: 1000+ | **Throughput**: 5K+ req/min
- **Query Time**: < 50ms (95th percentile) | **Index Usage**: 100% | **Connection Timeout**: 30s

## Database Optimization

### Prisma Connection Pooling
```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(configService: ConfigService) {
    super({
      datasources: { db: { url: configService.get('DATABASE_URL') } },
      log: [{ level: 'query', emit: 'event' }, { level: 'error', emit: 'stdout' }],
    });
    this.$connect();
  }

  async onModuleInit() {
    await this.$connect();
    if (process.env.NODE_ENV === 'development') {
      this.$on('query', (e) => {
        if (e.duration > 100) console.log('Slow query:', e.query, `${e.duration}ms`);
      });
    }
  }

  async onModuleDestroy() { await this.$disconnect(); }
  async healthCheck(): Promise<boolean> {
    try { await this.$queryRaw`SELECT 1`; return true; }
    catch { return false; }
  }
}
```

### Query Optimization
```typescript
@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaService) {}

  async findMany(filters?: UserFilters): Promise<User[]> {
    const where: any = { deletedAt: null };
    if (filters?.role) where.role = filters.role;
    if (filters?.status) where.status = filters.status;
    if (filters?.search) where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } }
    ];

    const users = await this.prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
      take: Math.min(filters?.limit || 50, 100),
      skip: filters?.offset || 0,
      orderBy: { createdAt: 'desc' },
    });
    return users.map(u => this.toDomain(u));
  }

  async createMany(users: User[]): Promise<User[]> {
    await this.prisma.user.createMany({ data: users.map(u => ({...u})), skipDuplicates: true });
    return this.findByIds(users.map(u => u.id));
  }
}
```

## Caching Strategies

### Redis Integration
```typescript
// src/frameworks/cache/redis.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB', 0),
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      // Connection pool settings
      family: 4,
      keepAlive: 30000,
    });

    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async flush(): Promise<void> {
    await this.client.flushdb();
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      const response = await this.client.ping();
      return response === 'PONG';
    } catch (error) {
      return false;
    }
  }
}
```

### Caching Use Case
```typescript
// src/usecases/user/get-user-cached.usecase.ts
import { Injectable } from '@nestjs/common';
import { UserRepository } from '@/usecases/interfaces/user-repository.interface';
import { RedisService } from '@/frameworks/cache/redis.service';
import { User } from '@/entities/user.entity';

@Injectable()
export class GetUserCachedUseCase {
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'user:';

  constructor(
    private readonly userRepository: UserRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute(id: string): Promise<User | null> {
    const cacheKey = `${this.CACHE_PREFIX}${id}`;

    // Try cache first
    const cached = await this.redisService.get<any>(cacheKey);
    if (cached) {
      return User.reconstruct(cached);
    }

    // Fallback to database
    const user = await this.userRepository.findById(id);
    if (user) {
      // Cache the result
      await this.redisService.set(
        cacheKey,
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        this.CACHE_TTL,
      );
    }

    return user;
  }

  async invalidateCache(id: string): Promise<void> {
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    await this.redisService.del(cacheKey);
  }
}
```

## Memory Management

### Efficient Object Pooling
```typescript
// src/shared/utils/object-pool.ts
export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (item: T) => void;

  constructor(
    createFn: () => T,
    resetFn: (item: T) => void,
    initialSize: number = 10,
  ) {
    this.createFn = createFn;
    this.resetFn = resetFn;

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }

  release(item: T): void {
    this.resetFn(item);
    this.pool.push(item);
  }

  size(): number {
    return this.pool.length;
  }
}

// Usage example
const bufferPool = new ObjectPool<Buffer>(
  () => Buffer.allocUnsafe(1024),
  (buffer) => buffer.fill(0),
  20,
);

// In your service
export class DataProcessingService {
  processData(data: string): string {
    const buffer = bufferPool.acquire();
    try {
      // Use buffer for processing
      buffer.write(data);
      return buffer.toString('base64');
    } finally {
      bufferPool.release(buffer);
    }
  }
}
```

### Memory Monitoring
```typescript
// src/frameworks/monitoring/memory.service.ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MemoryMonitoringService {
  private readonly MAX_MEMORY_USAGE = 256 * 1024 * 1024; // 256MB

  @Cron(CronExpression.EVERY_MINUTE)
  checkMemoryUsage(): void {
    const memoryUsage = process.memoryUsage();
    
    console.log('Memory Usage:', {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
    });

    // Alert if memory usage is too high
    if (memoryUsage.heapUsed > this.MAX_MEMORY_USAGE) {
      console.warn('High memory usage detected!', {
        current: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        limit: `${Math.round(this.MAX_MEMORY_USAGE / 1024 / 1024)} MB`,
      });

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }
  }

  getMemoryStats() {
    const memoryUsage = process.memoryUsage();
    return {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
      percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
    };
  }
}
```

## Application Optimization

### Graceful Shutdown
```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Graceful shutdown
  app.enableShutdownHooks();
  
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
```

### Performance Middleware
```typescript
// src/shared/middleware/performance.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const method = req.method;
      const url = req.url;
      const statusCode = res.statusCode;

      // Log slow requests
      if (duration > 1000) {
        console.warn('Slow request detected:', {
          method,
          url,
          statusCode,
          duration: `${duration}ms`,
          userAgent: req.get('User-Agent'),
        });
      }

      // Set performance headers
      res.setHeader('X-Response-Time', `${duration}ms`);
    });

    next();
  }
}
```

## Monitoring & Metrics

### Health Check Implementation
```typescript
// src/frameworks/monitoring/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '@/frameworks/database/prisma/prisma.service';
import { RedisService } from '@/frameworks/cache/redis.service';
import { MemoryMonitoringService } from './memory.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly memoryService: MemoryMonitoringService,
  ) {}

  @Get()
  async getHealth() {
    const timestamp = new Date().toISOString();
    
    // Check database
    const dbHealth = await this.prisma.healthCheck();
    
    // Check Redis
    const redisHealth = await this.redis.ping();
    
    // Check memory
    const memoryStats = this.memoryService.getMemoryStats();
    
    const health = {
      status: dbHealth && redisHealth ? 'healthy' : 'unhealthy',
      timestamp,
      services: {
        database: dbHealth ? 'up' : 'down',
        redis: redisHealth ? 'up' : 'down',
      },
      memory: {
        usage: `${Math.round(memoryStats.heapUsed / 1024 / 1024)} MB`,
        percentage: `${memoryStats.percentage.toFixed(2)}%`,
      },
      uptime: process.uptime(),
    };

    return health;
  }

  @Get('ready')
  async getReadiness() {
    // More strict readiness check
    const dbHealth = await this.prisma.healthCheck();
    const redisHealth = await this.redis.ping();
    const memoryStats = this.memoryService.getMemoryStats();
    
    const isReady = dbHealth && 
                   redisHealth && 
                   memoryStats.percentage < 90;

    return {
      status: isReady ? 'ready' : 'not-ready',
      timestamp: new Date().toISOString(),
    };
  }
}
```

### Prometheus Metrics
```typescript
// src/frameworks/monitoring/metrics.service.ts
import { Injectable } from '@nestjs/common';
import { register, Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly httpRequestTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  });

  private readonly httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route'],
    buckets: [0.1, 0.5, 1, 2, 5],
  });

  private readonly activeConnections = new Gauge({
    name: 'active_connections',
    help: 'Number of active connections',
  });

  private readonly memoryUsage = new Gauge({
    name: 'memory_usage_bytes',
    help: 'Memory usage in bytes',
    labelNames: ['type'],
  });

  constructor() {
    // Update memory metrics periodically
    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      this.memoryUsage.set({ type: 'rss' }, memoryUsage.rss);
      this.memoryUsage.set({ type: 'heap_total' }, memoryUsage.heapTotal);
      this.memoryUsage.set({ type: 'heap_used' }, memoryUsage.heapUsed);
      this.memoryUsage.set({ type: 'external' }, memoryUsage.external);
    }, 10000);
  }

  incrementHttpRequests(method: string, route: string, statusCode: number) {
    this.httpRequestTotal.inc({ method, route, status_code: statusCode });
  }

  observeHttpDuration(method: string, route: string, duration: number) {
    this.httpRequestDuration.observe({ method, route }, duration);
  }

  setActiveConnections(count: number) {
    this.activeConnections.set(count);
  }

  getMetrics() {
    return register.metrics();
  }
}
```

## Load Testing

### Artillery Configuration
```yaml
# artillery.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Ramp up load"
    - duration: 300
      arrivalRate: 100
      name: "Sustained load"
  payload:
    path: "test-data.csv"
    fields:
      - "email"
      - "password"

scenarios:
  - name: "Authentication flow"
    weight: 70
    flow:
      - post:
          url: "/auth/login"
          json:
            email: "{{ email }}"
            password: "{{ password }}"
          capture:
            - json: "$.accessToken"
              as: "token"
      - get:
          url: "/users/me"
          headers:
            Authorization: "Bearer {{ token }}"

  - name: "User operations"
    weight: 30
    flow:
      - post:
          url: "/auth/login"
          json:
            email: "admin@example.com"
            password: "admin123"
          capture:
            - json: "$.accessToken"
              as: "token"
      - get:
          url: "/users"
          headers:
            Authorization: "Bearer {{ token }}"
      - post:
          url: "/users"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            name: "Test User {{ $randomString() }}"
            email: "test{{ $randomInt(1, 10000) }}@example.com"
            password: "testpass123"
            role: "user"
```

### Load Testing Commands
```bash
# Install Artillery
npm install -g artillery

# Run basic load test
artillery run artillery.yml

# Run with custom target
artillery run --target http://staging.api.com artillery.yml

# Generate test report
artillery run artillery.yml --output report.json
artillery report report.json
```

## Performance Best Practices

### 1. Database Optimization
- Use proper indexing for frequent queries
- Implement connection pooling
- Use batch operations when possible
- Monitor slow queries
- Optimize N+1 query problems

### 2. Caching Strategy
- Cache frequently accessed data
- Use appropriate TTL values
- Implement cache invalidation
- Monitor cache hit rates
- Use Redis for session storage

### 3. Memory Management
- Monitor memory usage
- Use object pooling for frequently created objects
- Implement proper cleanup
- Avoid memory leaks
- Use streams for large data processing

### 4. API Optimization
- Implement request/response compression
- Use pagination for large datasets
- Optimize payload sizes
- Implement proper error handling
- Use connection keep-alive

### 5. Monitoring
- Track response times
- Monitor resource usage
- Set up alerts for critical metrics
- Log performance metrics
- Use health checks

Remember: Performance optimization ควรทำ based on actual measurements และ profiling ไม่ใช่ assumptions โดยให้ monitor metrics อย่างสม่ำเสมอและ optimize เฉพาะจุดที่เป็น bottleneck จริงๆ