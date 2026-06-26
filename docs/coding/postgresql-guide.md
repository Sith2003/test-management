# PostgreSQL Database Programming Guide

## Overview

คู่มือการเขียนโปรแกรมและจัดการ PostgreSQL Database รวมถึง features, optimization, security และ best practices

---

## Naming Conventions

### Database Objects Naming Rules

| Object | Convention | Examples |
|--------|-----------|----------|
| **Database** | snake_case | `ecommerce_db`, `user_service` |
| **Schema** | snake_case | `public`, `analytics`, `audit_logs` |
| **Tables** | snake_case (plural) | `users`, `roles`, `order_items`, `audit_logs` |
| **Columns** | snake_case | `first_name`, `email_address`, `created_at`, `user_id` |
| **Primary Keys** | `id` | `id` (UUID or SERIAL) |
| **Foreign Keys** | `<table_singular>_id` | `user_id`, `role_id`, `order_id` |
| **Indexes** | `idx_<table>_<columns>` | `idx_users_email`, `idx_orders_user_id_status` |
| **Unique Constraints** | `uq_<table>_<columns>` | `uq_users_email`, `uq_roles_name` |
| **Check Constraints** | `chk_<table>_<condition>` | `chk_users_age`, `chk_orders_amount` |
| **Foreign Key Constraints** | `fk_<table>_<ref_table>` | `fk_users_roles`, `fk_orders_users` |
| **Functions** | snake_case | `calculate_total`, `get_user_score` |
| **Procedures** | snake_case | `cleanup_old_logs`, `process_orders` |
| **Triggers** | `trg_<table>_<action>` | `trg_users_updated_at`, `trg_orders_audit` |
| **Views** | snake_case with `_view` | `active_users_view`, `order_summary_view` |

### Naming Best Practices

✅ **ต้องทำ:**
- ใช้ชื่อที่บ่งบอกความหมาย (descriptive names)
- ใช้ snake_case สำหรับทุกอย่างใน database
- ใช้ตัวพิมพ์เล็กทั้งหมด (lowercase)
- ใช้ชื่อพหูพจน์ (plural) สำหรับ tables: `users` ไม่ใช่ `user`
- ใช้ singular สำหรับ foreign keys: `user_id` ไม่ใช่ `users_id`
- ตั้งชื่อที่สั้นกระชับแต่ชัดเจน

✗ **ห้ามทำ:**
- ใช้ camelCase หรือ PascalCase: ❌ `firstName`, `UserRole`
- ใช้คำย่อที่ไม่ชัดเจน: ❌ `usr`, `ord`, `amt`
- ใช้ SQL reserved keywords: ❌ `user`, `order`, `select`
- ใช้ตัวพิมพ์ใหญ่: ❌ `Users`, `EMAIL`
- ตั้งชื่อยาวเกินไป: ❌ `user_profile_information_table`

### Examples

```sql
-- ✅ Good naming
CREATE TABLE users (
    id UUID PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email_address VARCHAR(255),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY,
    order_id UUID,
    product_id UUID,
    quantity INTEGER,
    unit_price DECIMAL(10, 2),
    CONSTRAINT fk_order_items_orders FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT fk_order_items_products FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX idx_users_email ON users(email_address);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- ❌ Bad naming
CREATE TABLE User (  -- Wrong: PascalCase and singular
    ID serial,  -- Wrong: uppercase
    FirstName varchar(100),  -- Wrong: camelCase
    emailAddr varchar(255),  -- Wrong: unclear abbreviation
    createdDt timestamp  -- Wrong: unclear abbreviation
);
```

---

## PostgreSQL Data Types

### Commonly Used Types

| Category | Type | Description | Example |
|----------|------|-------------|---------|
| **Numeric** | `INTEGER`, `BIGINT` | Whole numbers | `42`, `-100` |
| | `DECIMAL(p,s)`, `NUMERIC(p,s)` | Exact decimals | `123.45` |
| | `REAL`, `DOUBLE PRECISION` | Floating point | `3.14159` |
| | `SERIAL`, `BIGSERIAL` | Auto-increment | `1, 2, 3...` |
| **Text** | `VARCHAR(n)` | Variable length | `'Hello'` |
| | `TEXT` | Unlimited length | `'Long text...'` |
| | `CHAR(n)` | Fixed length | `'ABC  '` |
| **Boolean** | `BOOLEAN` | True/False | `TRUE`, `FALSE` |
| **Date/Time** | `DATE` | Date only | `'2025-01-01'` |
| | `TIME` | Time only | `'14:30:00'` |
| | `TIMESTAMP` | Date + Time | `'2025-01-01 14:30:00'` |
| | `TIMESTAMPTZ` | With timezone | `'2025-01-01 14:30:00+07'` |
| | `INTERVAL` | Time duration | `'2 days'`, `'3 hours'` |
| **UUID** | `UUID` | Unique identifier | `'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'` |
| **JSON** | `JSON` | JSON data | `'{"key": "value"}'` |
| | `JSONB` | Binary JSON (indexed) | `'{"key": "value"}'` |
| **Array** | `type[]` | Array of any type | `'{1,2,3}'`, `'{"a","b"}'` |

### UUID Generation

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Generate UUID v4
SELECT uuid_generate_v4();

-- Use in table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL
);
```

### JSONB Usage

```sql
-- Create table with JSONB
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    metadata JSONB
);

-- Insert JSONB data
INSERT INTO products (name, metadata) VALUES
    ('Product 1', '{"color": "red", "size": "L", "tags": ["new", "sale"]}');

-- Query JSONB
SELECT * FROM products WHERE metadata->>'color' = 'red';
SELECT * FROM products WHERE metadata @> '{"color": "red"}';
SELECT * FROM products WHERE metadata->'tags' @> '["sale"]';

-- Update JSONB
UPDATE products SET metadata = metadata || '{"price": 100}' WHERE id = 1;

-- Index JSONB
CREATE INDEX idx_products_metadata ON products USING GIN (metadata);
```

---

## Indexes

### Index Types

| Type | Use Case | Example |
|------|----------|---------|
| **B-tree** | Default, equality & range | `CREATE INDEX idx_name ON table(column);` |
| **Hash** | Equality only | `CREATE INDEX idx_name ON table USING HASH(column);` |
| **GIN** | Full-text, JSONB, arrays | `CREATE INDEX idx_name ON table USING GIN(column);` |
| **GiST** | Geometric, full-text | `CREATE INDEX idx_name ON table USING GIST(column);` |
| **BRIN** | Large tables, sequential | `CREATE INDEX idx_name ON table USING BRIN(column);` |

### Creating Indexes

```sql
-- Simple index
CREATE INDEX idx_users_email ON users(email);

-- Unique index
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);

-- Composite index
CREATE INDEX idx_users_name_status ON users(last_name, first_name, status);

-- Partial index (conditional)
CREATE INDEX idx_active_users ON users(email) WHERE status = 'ACTIVE';

-- Expression index
CREATE INDEX idx_users_lower_email ON users(LOWER(email));

-- Covering index (INCLUDE)
CREATE INDEX idx_users_email_cover ON users(email) INCLUDE (name, status);

-- Concurrent index (no table lock)
CREATE INDEX CONCURRENTLY idx_users_created_at ON users(created_at);
```

### Index Maintenance

```sql
-- View indexes
SELECT * FROM pg_indexes WHERE tablename = 'users';

-- Index size
SELECT pg_size_pretty(pg_relation_size('idx_users_email'));

-- Rebuild index
REINDEX INDEX idx_users_email;

-- Drop index
DROP INDEX idx_users_email;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;
```

---

## Query Optimization

### EXPLAIN and ANALYZE

```sql
-- Show query plan
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';

-- Show actual execution
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- Detailed analysis
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT u.*, r.name as role_name
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.status = 'ACTIVE';
```

### Common Optimizations

```sql
-- ✅ Use indexes
SELECT * FROM users WHERE email = 'test@example.com'; -- Uses idx_users_email

-- ✅ Select specific columns
SELECT id, name, email FROM users; -- Better than SELECT *

-- ✅ Use LIMIT for pagination
SELECT * FROM users ORDER BY created_at DESC LIMIT 20 OFFSET 0;

-- ✅ Use EXISTS instead of IN for large subqueries
SELECT * FROM users u
WHERE EXISTS (
    SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.status = 'completed'
);

-- ✅ Use JOIN instead of subqueries when possible
SELECT u.*, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id;

-- ❌ Avoid functions on indexed columns
SELECT * FROM users WHERE LOWER(email) = 'test@example.com'; -- Doesn't use index
-- ✅ Use expression index or store lowercase
CREATE INDEX idx_users_lower_email ON users(LOWER(email));

-- ❌ Avoid SELECT *
SELECT * FROM users; -- Retrieves all columns
-- ✅ Select only needed columns
SELECT id, name, email FROM users;
```

### Pagination Best Practices

```sql
-- ❌ Bad - Slow for large offsets
SELECT * FROM users ORDER BY created_at DESC LIMIT 20 OFFSET 10000;

-- ✅ Good - Cursor-based pagination
SELECT * FROM users
WHERE created_at < '2025-01-01 00:00:00'
ORDER BY created_at DESC
LIMIT 20;

-- ✅ Good - Keyset pagination
SELECT * FROM users
WHERE (created_at, id) < ('2025-01-01 00:00:00', 'last-id')
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

---

## Functions and Stored Procedures

### User-Defined Functions

```sql
-- Simple function
CREATE OR REPLACE FUNCTION get_full_name(first_name TEXT, last_name TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN first_name || ' ' || last_name;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT get_full_name('John', 'Doe');

-- Function with complex logic
CREATE OR REPLACE FUNCTION calculate_user_score(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_orders INTEGER;
    total_spent DECIMAL;
    score INTEGER;
BEGIN
    -- Count orders
    SELECT COUNT(*) INTO total_orders
    FROM orders
    WHERE orders.user_id = user_id;

    -- Sum total spent
    SELECT COALESCE(SUM(total), 0) INTO total_spent
    FROM orders
    WHERE orders.user_id = user_id AND status = 'completed';

    -- Calculate score
    score := total_orders * 10 + (total_spent / 100)::INTEGER;

    RETURN score;
END;
$$ LANGUAGE plpgsql;
```

### Stored Procedures (PostgreSQL 11+)

```sql
-- Procedure for data cleanup
CREATE OR REPLACE PROCEDURE cleanup_old_logs(days INTEGER)
LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM audit_logs
    WHERE created_at < NOW() - INTERVAL '1 day' * days;

    RAISE NOTICE 'Deleted % rows', FOUND;
END;
$$;

-- Call procedure
CALL cleanup_old_logs(30);
```

---

## Triggers

### Automatic Timestamp Update

```sql
-- Function for updating timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

### Audit Trail Trigger

```sql
-- Audit log table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50),
    operation VARCHAR(10),
    old_data JSONB,
    new_data JSONB,
    user_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audit function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (table_name, operation, old_data)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD));
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (table_name, operation, old_data, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (table_name, operation, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to table
CREATE TRIGGER audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_func();
```

---

## Transactions and Concurrency

### Basic Transactions

```sql
-- Begin transaction
BEGIN;

-- Execute queries
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- Commit if successful
COMMIT;

-- Or rollback if error
ROLLBACK;
```

### Savepoints

```sql
BEGIN;

INSERT INTO users (name, email) VALUES ('User 1', 'user1@example.com');

SAVEPOINT sp1;

INSERT INTO users (name, email) VALUES ('User 2', 'user2@example.com');

-- Rollback to savepoint if needed
ROLLBACK TO SAVEPOINT sp1;

-- Or continue and commit
COMMIT;
```

### Isolation Levels

```sql
-- Set isolation level
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Check current isolation level
SHOW transaction_isolation;
```

### Advisory Locks

```sql
-- Session-level lock
SELECT pg_advisory_lock(12345);
-- Do work
SELECT pg_advisory_unlock(12345);

-- Transaction-level lock
BEGIN;
SELECT pg_advisory_xact_lock(12345);
-- Do work
COMMIT; -- Lock released automatically

-- Try lock (non-blocking)
SELECT pg_try_advisory_lock(12345);
```

---

## Performance Tuning

### Configuration Parameters

```sql
-- View configuration
SHOW shared_buffers;
SHOW effective_cache_size;
SHOW work_mem;

-- Common settings (postgresql.conf)
-- shared_buffers = 256MB (25% of RAM)
-- effective_cache_size = 1GB (50-75% of RAM)
-- work_mem = 4MB (per operation)
-- maintenance_work_mem = 64MB
-- max_connections = 100
```

### VACUUM and ANALYZE

```sql
-- Vacuum (reclaim space)
VACUUM users;

-- Vacuum full (locks table)
VACUUM FULL users;

-- Analyze (update statistics)
ANALYZE users;

-- Vacuum analyze (both)
VACUUM ANALYZE users;

-- Auto-vacuum status
SELECT schemaname, relname, last_vacuum, last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public';
```

### Connection Pooling

```sql
-- Use connection pooler (PgBouncer, pgpool-II)
-- Example connection string
postgresql://user:pass@localhost:6432/dbname

-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND state_change < NOW() - INTERVAL '1 hour';
```

---

## Full-Text Search

### Basic Full-Text Search

```sql
-- Create GIN index for full-text search
CREATE INDEX idx_posts_search ON posts USING GIN(to_tsvector('english', title || ' ' || content));

-- Search query
SELECT * FROM posts
WHERE to_tsvector('english', title || ' ' || content) @@ to_tsquery('english', 'postgresql & database');

-- With ranking
SELECT *, ts_rank(to_tsvector('english', title || ' ' || content), query) as rank
FROM posts, to_tsquery('english', 'postgresql & database') query
WHERE to_tsvector('english', title || ' ' || content) @@ query
ORDER BY rank DESC;
```

### Generated Column for Search

```sql
-- Add generated column
ALTER TABLE posts ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || content)) STORED;

-- Create index
CREATE INDEX idx_posts_search_vector ON posts USING GIN(search_vector);

-- Query
SELECT * FROM posts WHERE search_vector @@ to_tsquery('english', 'postgresql');
```

---

## Security Best Practices

### User and Role Management

```sql
-- Create role
CREATE ROLE readonly;

-- Grant privileges
GRANT CONNECT ON DATABASE mydb TO readonly;
GRANT USAGE ON SCHEMA public TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;

-- Create user
CREATE USER app_user WITH PASSWORD 'secure_password';

-- Assign role
GRANT readonly TO app_user;

-- Revoke privileges
REVOKE SELECT ON users FROM readonly;
```

### Row-Level Security (RLS)

```sql
-- Enable RLS on table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY user_documents ON documents
    FOR ALL
    TO authenticated_users
    USING (user_id = current_user_id());

-- Policy for specific operations
CREATE POLICY user_insert_documents ON documents
    FOR INSERT
    TO authenticated_users
    WITH CHECK (user_id = current_user_id());
```

### SQL Injection Prevention

```sql
-- ❌ Bad - Vulnerable to SQL injection
SELECT * FROM users WHERE email = '" + user_input + "'";

-- ✅ Good - Use parameterized queries
-- In application code:
-- PREPARE statement FROM 'SELECT * FROM users WHERE email = $1';
-- EXECUTE statement USING user_email;

-- ✅ Good - Use quote functions in dynamic SQL
SELECT * FROM users WHERE email = quote_literal(user_input);
```

### Encryption

```sql
-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Hash passwords
INSERT INTO users (email, password)
VALUES ('user@example.com', crypt('password123', gen_salt('bf')));

-- Verify password
SELECT * FROM users
WHERE email = 'user@example.com'
AND password = crypt('password123', password);

-- Encrypt data
UPDATE sensitive_data
SET ssn = pgp_sym_encrypt(ssn, 'encryption_key');

-- Decrypt data
SELECT pgp_sym_decrypt(ssn, 'encryption_key') FROM sensitive_data;
```

---

## Backup and Restore

### pg_dump

```bash
# Backup database
pg_dump -h localhost -U postgres -d mydb > backup.sql

# Backup with compression
pg_dump -h localhost -U postgres -d mydb | gzip > backup.sql.gz

# Backup specific tables
pg_dump -h localhost -U postgres -d mydb -t users -t roles > backup.sql

# Backup schema only
pg_dump -h localhost -U postgres -d mydb --schema-only > schema.sql

# Backup data only
pg_dump -h localhost -U postgres -d mydb --data-only > data.sql

# Custom format (for pg_restore)
pg_dump -h localhost -U postgres -d mydb -Fc > backup.dump
```

### pg_restore

```bash
# Restore from SQL file
psql -h localhost -U postgres -d mydb < backup.sql

# Restore from custom format
pg_restore -h localhost -U postgres -d mydb backup.dump

# Restore specific tables
pg_restore -h localhost -U postgres -d mydb -t users backup.dump

# Parallel restore (faster)
pg_restore -h localhost -U postgres -d mydb -j 4 backup.dump
```

### Point-in-Time Recovery (PITR)

```sql
-- Enable WAL archiving (postgresql.conf)
-- wal_level = replica
-- archive_mode = on
-- archive_command = 'cp %p /path/to/archive/%f'

-- Create base backup
-- pg_basebackup -h localhost -U postgres -D /backup/base -Ft -z -P

-- Restore to specific point
-- Create recovery.conf:
-- restore_command = 'cp /path/to/archive/%f %p'
-- recovery_target_time = '2025-01-01 12:00:00'
```

---

## Monitoring and Diagnostics

### Performance Monitoring

```sql
-- Active queries
SELECT pid, usename, application_name, state, query, query_start
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;

-- Long-running queries
SELECT pid, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '5 minutes';

-- Table statistics
SELECT schemaname, relname, seq_scan, idx_scan,
       n_tup_ins, n_tup_upd, n_tup_del
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;

-- Index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Database size
SELECT pg_size_pretty(pg_database_size('mydb'));

-- Table sizes
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

### Slow Query Log

```sql
-- Enable slow query log (postgresql.conf)
-- log_min_duration_statement = 1000  # Log queries > 1 second

-- Or set for session
SET log_min_duration_statement = 1000;

-- View log file
-- tail -f /var/log/postgresql/postgresql-14-main.log
```

---

## Best Practices Summary

### Schema Design

✅ **ต้องทำ:**
- ใช้ UUID สำหรับ primary keys (distributed systems)
- ใช้ `TIMESTAMPTZ` แทน `TIMESTAMP`
- เพิ่ม audit fields (created_at, updated_at, created_by, etc.)
- ใช้ soft delete (deleted_at)
- กำหนด constraints (NOT NULL, CHECK, FOREIGN KEY)
- ใช้ indexes อย่างเหมาะสม

✗ **ห้ามทำ:**
- ใช้ VARCHAR ไม่จำกัดความยาว (ใช้ TEXT แทน)
- เก็บ sensitive data แบบ plain text
- ใช้ `SELECT *` ใน production code
- สร้าง index มากเกินไป (ลด write performance)

### Query Performance

✅ **ต้องทำ:**
- ใช้ EXPLAIN ANALYZE ตรวจสอบ query plan
- สร้าง index สำหรับ foreign keys
- ใช้ partial indexes สำหรับ filtered queries
- ใช้ connection pooling
- ใช้ prepared statements

✗ **ห้ามทำ:**
- ใช้ functions บน indexed columns
- ใช้ `OFFSET` สูงๆ สำหรับ pagination
- ทำ N+1 queries (ใช้ JOIN แทน)
- ละเลย VACUUM และ ANALYZE

### Security

✅ **ต้องทำ:**
- ใช้ parameterized queries
- Hash passwords (bcrypt, scrypt)
- ใช้ SSL/TLS สำหรับ connections
- จำกัด user privileges (principle of least privilege)
- Enable Row-Level Security ถ้าจำเป็น
- Backup database เป็นประจำ

✗ **ห้ามทำ:**
- Concatenate user input ใน queries
- เก็บ passwords แบบ plain text
- ใช้ superuser สำหรับ application
- เปิด PostgreSQL ให้ public internet โดยไม่จำเป็น

---

## Resources

- [PostgreSQL Official Documentation](https://www.postgresql.org/docs/)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [Use The Index, Luke](https://use-the-index-luke.com/)
- [pgAdmin](https://www.pgadmin.org/) - GUI tool
- [pgcli](https://www.pgcli.com/) - CLI with auto-completion

---

**AIDC Tech Engineering Standards** | อัพเดท: 2025
