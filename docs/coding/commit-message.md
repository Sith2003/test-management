# Commit Message Standards

## Overview

มาตรฐานการเขียน commit message ที่ดีจะช่วยให้ทีมเข้าใจประวัติการเปลี่ยนแปลงของโค้ด ทำให้การ debug, code review และการทำงานร่วมกันมีประสิทธิภาพมากขึ้น

เอกสารนี้อ้างอิงจาก [Conventional Commits](https://www.conventionalcommits.org/) และ Secure Software Development Policy

---

## Commit Message Format

### รูปแบบมาตรฐาน

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### ตัวอย่าง

```
feat(auth): add OAuth2 authentication support

Implement OAuth2 login flow using Google and GitHub providers.
Add refresh token mechanism for enhanced security.

Fixes #123
```

---

## Commit Types

| Type | คำอธิบาย | ตัวอย่าง |
|------|----------|----------|
| **feat** | เพิ่มฟีเจอร์ใหม่ | `feat(user): add profile picture upload` |
| **fix** | แก้ไขบั๊ก | `fix(api): resolve null pointer in login endpoint` |
| **security** | แก้ไขช่องโหว่ด้านความปลอดภัย | `security: fix SQL injection in search query` |
| **refactor** | ปรับปรุงโค้ดโดยไม่เปลี่ยนพฤติกรรม | `refactor(database): optimize query performance` |
| **perf** | ปรับปรุงประสิทธิภาพ | `perf(api): reduce response time by 50%` |
| **docs** | อัพเดทเอกสาร | `docs(readme): update installation guide` |
| **test** | เพิ่มหรือแก้ไข tests | `test(auth): add unit tests for JWT validation` |
| **chore** | งานบำรุงรักษา | `chore: update dependencies` |
| **style** | แก้ไขรูปแบบโค้ด (formatting, semicolons) | `style: format code with prettier` |
| **ci** | เปลี่ยนแปลง CI/CD configuration | `ci: add SonarQube to pipeline` |
| **build** | เปลี่ยนแปลง build system | `build: upgrade webpack to v5` |
| **revert** | ย้อนกลับ commit ก่อนหน้า | `revert: revert commit abc1234` |

---

## Scope (ขอบเขต)

Scope ระบุส่วนของโปรเจคที่ได้รับผลกระทบ

### ตัวอย่าง Scopes

- `feat(auth): ...` - ระบบ authentication
- `fix(api): ...` - API endpoints
- `refactor(database): ...` - database layer
- `perf(ui): ...` - user interface
- `security(login): ...` - login system
- `test(payment): ...` - payment module

---

## Description (คำอธิบาย)

### หลักการเขียน Description

✅ **ควรทำ:**
- ใช้ imperative mood (คำสั่ง): "add", "fix", "update" (ไม่ใช่ "added", "fixed", "updated")
- เริ่มต้นด้วยตัวพิมพ์เล็ก
- ไม่ใช้จุด (.) ท้ายประโยค
- กระชับและชัดเจน (50 ตัวอักษรหรือน้อยกว่า)
- อธิบาย "อะไร" และ "ทำไม" มากกว่า "อย่างไร"

✗ **ไม่ควรทำ:**
- คำอธิบายที่คลุมเครือ: "fix bug", "update code"
- ใช้ประโยคยาวเกินไป
- ใช้ภาษาที่ไม่เป็นทางการ

### ตัวอย่างที่ดี

```
feat(user): add email verification on registration
fix(api): resolve race condition in order processing
security: prevent XSS in comment section
refactor(database): simplify user query logic
perf(api): add caching layer for product catalog
docs(api): update authentication endpoint documentation
```

### ตัวอย่างที่ไม่ดี

```
fix: bug fix                           // ไม่ชัดเจน
feat: Added new feature.               // ไม่ใช้ imperative mood, มีจุดท้าย
update: updated some files             // คลุมเครือ
Fix stuff                              // ไม่มี type, ไม่ชัดเจน
```

---

## Body (รายละเอียดเพิ่มเติม)

Body ใช้อธิบายรายละเอียดเพิ่มเติมเกี่ยวกับการเปลี่ยนแปลง

### เมื่อไหร่ควรใช้ Body

- อธิบาย motivation สำหรับการเปลี่ยนแปลง
- อธิบายความแตกต่างจากพฤติกรรมก่อนหน้า
- ให้ context เพิ่มเติมที่ไม่สามารถอธิบายใน description
- อธิบายวิธีแก้ไขปัญหา

### รูปแบบ Body

- แยกจาก description ด้วยบรรทัดว่าง
- ไม่จำกัดความยาวบรรทัด แต่แนะนำ 72 ตัวอักษรต่อบรรทัด
- สามารถใช้หลายย่อหน้าได้

### ตัวอย่าง

```
feat(payment): add Stripe payment integration

Implement Stripe payment gateway to support credit card payments.
This replaces the previous manual payment tracking system.

Changes include:
- Add Stripe SDK dependencies
- Create payment service layer
- Implement webhook handlers for payment events
- Add payment status tracking

Tested with sandbox environment and verified webhook delivery.
```

---

## Footer (ข้อมูลเพิ่มเติม)

Footer ใช้สำหรับข้อมูลเสริมเช่น issue references, breaking changes

### Breaking Changes

ถ้ามีการเปลี่ยนแปลงที่ไม่ compatible กับเวอร์ชันก่อนหน้า

```
feat(api): change authentication endpoint format

BREAKING CHANGE: Authentication endpoint now requires OAuth2 tokens
instead of API keys. All API key authentication will be deprecated
in version 2.0.0.

Migration guide: See docs/migration/v2-auth.md
```

หรือใช้ `!` ใน type:

```
feat(api)!: change authentication endpoint format
```

### Issue References

อ้างอิงถึง issues, tickets หรือ merge requests

```
fix(api): resolve timeout in payment processing

Increase timeout threshold and add retry mechanism.

Fixes #456
Closes #789
Refs #123
```

### รูปแบบ Footer ที่รองรับ

- `Fixes #123` - ปิด issue เมื่อ merge
- `Closes #123` - ปิด issue เมื่อ merge
- `Resolves #123` - แก้ไข issue
- `Refs #123` - อ้างอิงถึง issue
- `Related to #123` - เกี่ยวข้องกับ issue

---

## ข้อห้ามด้านความปลอดภัย

### ❌ ห้ามเด็ดขาด (NEVER COMMIT)

**ไม่ว่ากรณีใดก็ตาม ห้าม commit สิ่งต่อไปนี้:**

- Passwords
- API keys และ tokens
- Database credentials
- Private keys และ certificates
- Encryption keys
- OAuth client secrets
- AWS access keys
- ข้อมูล PII (Personally Identifiable Information)
- Configuration files ที่มี sensitive data

### ตัวอย่างที่ห้าม

```bash
# ❌ อย่าทำแบบนี้เด็ดขาด
DB_PASSWORD=MySecretPassword123
API_KEY=sk_live_abc123xyz789
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
```

### การป้องกัน

1. **ใช้ .gitignore:**
```gitignore
.env
.env.*
*.key
*.pem
secrets/
config/credentials.yml
```

2. **ใช้ Git Hooks:**
- ติดตั้ง pre-commit hooks เพื่อตรวจจับ secrets
- ใช้เครื่องมือ: `detect-secrets`, `git-secrets`, `gitleaks`

3. **ใช้ Environment Variables:**
```typescript
// ✅ ใช้แบบนี้
const apiKey = process.env.API_KEY;
```

4. **ถ้า commit ข้อมูลสำคัญไปแล้ว:**
- แจ้ง Security Architect และทีมความปลอดภัยทันที
- เปลี่ยน credentials/secrets ทันที
- ใช้เครื่องมือเช่น BFG Repo-Cleaner เพื่อลบออกจาก history
- ต้องได้รับการอนุมัติก่อน force push

---

## Best Practices

### 1. Atomic Commits

แต่ละ commit ควรมีการเปลี่ยนแปลงที่สมบูรณ์และสามารถทำงานได้เอง

✅ **ดี:**
```
feat(auth): add login endpoint
feat(auth): add logout endpoint
feat(auth): add password reset endpoint
```

✗ **ไม่ดี:**
```
feat(auth): add login, logout, and password reset endpoints
            plus fix some bugs and update docs
```

### 2. Test Before Commit

- รัน unit tests ก่อน commit
- รัน linting และ code formatting
- ใช้ SonarLint locally เพื่อตรวจสอบ code quality
- ทดสอบการทำงานของโค้ดในระบบ

### 3. Commit Frequently

- Commit บ่อยๆ เมื่อมีการเปลี่ยนแปลงที่มีความหมาย
- อย่ารอจนงานเสร็จหมดแล้วค่อย commit
- ง่ายต่อการ review และ revert

### 4. Use Meaningful Messages

แต่ละ commit message ควรบอกว่า:
- **อะไร**: เปลี่ยนแปลงอะไร
- **ทำไม**: ทำไมต้องเปลี่ยนแปลง
- **ส่งผลอย่างไร**: กระทบส่วนไหนของระบบ

### 5. Keep Commits Small

- แต่ละ commit ควรมีขนาดเล็กพอสมควร
- ง่ายต่อการ review
- ถ้ามีปัญหาสามารถ revert ได้ง่าย

---

## Git Hooks สำหรับ Commit Message Validation

### Commit Message Hook

สร้างไฟล์ `.git/hooks/commit-msg`:

```bash
#!/bin/bash
# .git/hooks/commit-msg

commit_msg=$(cat "$1")

# ตรวจสอบรูปแบบ commit message
if ! echo "$commit_msg" | grep -qE "^(feat|fix|security|refactor|perf|docs|test|chore|style|ci|build|revert)(\(.+\))?!?: .+"; then
    echo "❌ รูปแบบ commit message ไม่ถูกต้อง!"
    echo ""
    echo "รูปแบบที่ถูกต้อง: <type>[optional scope]: <description>"
    echo ""
    echo "Types: feat, fix, security, refactor, perf, docs, test, chore, style, ci, build, revert"
    echo ""
    echo "ตัวอย่าง:"
    echo "  feat(auth): add OAuth2 support"
    echo "  fix(api): resolve timeout issue"
    echo "  security: fix SQL injection vulnerability"
    echo ""
    exit 1
fi

echo "✅ รูปแบบ commit message ถูกต้อง!"
exit 0
```

ทำให้ executable:
```bash
chmod +x .git/hooks/commit-msg
```

---

## ตัวอย่าง Commit Messages ที่ดี

### Feature Development

```
feat(user): add profile picture upload

Implement profile picture upload functionality using AWS S3.
Users can now upload images up to 5MB in JPEG, PNG formats.

- Add file validation and size checks
- Implement S3 upload service
- Add image preview before upload
- Handle upload errors gracefully

Fixes #234
```

### Bug Fix

```
fix(payment): resolve race condition in order processing

Fixed race condition that occurred when multiple requests tried to
update the same order simultaneously. Implemented optimistic locking
using version numbers.

This bug caused duplicate charges in approximately 0.1% of orders.

Fixes #567
Refs #568
```

### Security Fix

```
security(api): fix SQL injection vulnerability in search endpoint

Replaced string concatenation with parameterized queries to prevent
SQL injection attacks in the product search endpoint.

Impact: All search endpoints (products, users, orders)
Severity: Critical
CVSS Score: 9.1

Fixes #789
```

### Performance Improvement

```
perf(api): add caching layer for product catalog

Implement Redis caching for product catalog API to reduce database load.
Cache invalidation happens on product updates.

Performance improvement:
- Average response time: 450ms → 45ms (90% faster)
- Database queries reduced by 85%

Refs #345
```

### Refactoring

```
refactor(auth): simplify JWT token validation logic

Extract token validation into separate service class for better
code organization and testability. No functional changes.

- Create TokenValidationService
- Add unit tests for edge cases
- Update documentation
```

### Breaking Change

```
feat(api)!: change authentication response format

BREAKING CHANGE: Authentication endpoint now returns tokens in a
different format for improved security.

Before:
{
  "token": "xxx",
  "refresh": "yyy"
}

After:
{
  "accessToken": "xxx",
  "refreshToken": "yyy",
  "expiresIn": 3600
}

Migration guide: See docs/migration/v3-auth.md
```

---

## CI/CD Integration

### GitLab CI Pipeline

ตัวอย่าง `.gitlab-ci.yml` ที่ validate commit messages:

```yaml
validate-commit-message:
  stage: validate
  script:
    - |
      COMMIT_MSG=$(git log -1 --pretty=%B)
      if ! echo "$COMMIT_MSG" | grep -qE "^(feat|fix|security|refactor|perf|docs|test|chore|style|ci|build|revert)(\(.+\))?!?: .+"; then
        echo "❌ Commit message does not follow conventional commits format"
        exit 1
      fi
      echo "✅ Commit message is valid"
  only:
    - merge_requests
```

---

## Tools และ Resources

### Recommended Tools

1. **Commitizen** - Interactive commit message helper
   ```bash
   npm install -g commitizen cz-conventional-changelog
   ```

2. **Commitlint** - Lint commit messages
   ```bash
   npm install -g @commitlint/cli @commitlint/config-conventional
   ```

3. **Husky** - Git hooks management
   ```bash
   npm install -g husky
   ```

4. **Conventional Changelog** - Generate changelog from commits
   ```bash
   npm install -g conventional-changelog-cli
   ```

### VS Code Extensions

- **Conventional Commits** - Commit message helper
- **GitLens** - Enhanced Git visualization

### Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/)
- [Angular Commit Message Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)

---

## Checklist ก่อน Commit

ก่อนทำการ commit ให้ตรวจสอบรายการต่อไปนี้:

- [ ] โค้ดทำงานได้และผ่าน tests
- [ ] รัน linting และ formatting แล้ว
- [ ] ไม่มี sensitive data (passwords, keys, tokens)
- [ ] ไม่มี debug code หรือ console.log ที่ไม่จำเป็น
- [ ] Commit message ตรงตามรูปแบบมาตรฐาน
- [ ] มี type และ description ที่ชัดเจน
- [ ] อ้างอิง issue/ticket (ถ้ามี)
- [ ] เพิ่ม BREAKING CHANGE (ถ้าจำเป็น)
- [ ] Commit มีขนาดเล็กและครอบคลุมเฉพาะเรื่องเดียว
- [ ] รัน SonarLint locally แล้ว

---

## ตัวอย่าง Workflow

### Basic Workflow

```bash
# 1. ทำการเปลี่ยนแปลงโค้ด
vim src/auth/login.ts

# 2. ตรวจสอบการเปลี่ยนแปลง
git diff

# 3. รัน tests
npm test

# 4. รัน linting
npm run lint

# 5. Stage การเปลี่ยนแปลง
git add src/auth/login.ts

# 6. Commit ด้วย message ที่ดี
git commit -m "feat(auth): add rate limiting to login endpoint

Implement rate limiting to prevent brute force attacks.
Maximum 5 login attempts per 15 minutes per IP address.

Fixes #123"

# 7. Push ไปยัง remote
git push origin feature/auth-rate-limiting
```

### Using Commitizen

```bash
# 1. Stage changes
git add .

# 2. Use commitizen
git cz

# 3. Follow interactive prompts
# - Select type
# - Enter scope
# - Write description
# - Write body
# - Add breaking changes
# - Reference issues

# 4. Push
git push
```

---

## Summary

การเขียน commit message ที่ดีจะช่วยให้:

1. **ทีมเข้าใจการเปลี่ยนแปลง** - รู้ว่าแต่ละ commit ทำอะไร
2. **Code Review ง่ายขึ้น** - Reviewers เข้าใจ context
3. **Debug ง่ายขึ้น** - หา commit ที่ทำให้เกิดบั๊กได้เร็ว
4. **Generate Changelog** - สร้าง release notes อัตโนมัติ
5. **ความปลอดภัย** - ป้องกันการ commit sensitive data

**จำไว้:** Commit message ที่ดีคือการลงทุนในอนาคต มันจะช่วยให้ทีมทำงานได้อย่างมีประสิทธิภาพมากขึ้น!
