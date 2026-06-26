# UI Testing with Playwright & Page Object Model

> คู่มือมาตรฐานการทดสอบ UI ด้วย Playwright พร้อมแนวปฏิบัติที่ดีที่สุดของ Page Object Model (POM) สำหรับทีมพัฒนาของเรา

## Table of Contents

1. [Overview](#overview)
2. [Setup & Configuration](#setup--configuration)
3. [Project Structure](#project-structure)
4. [Page Object Model (POM)](#page-object-model-pom)
5. [Writing Tests](#writing-tests)
6. [Locator Strategy](#locator-strategy)
7. [Test Data Management](#test-data-management)
8. [Component Object Pattern](#component-object-pattern)
9. [API Mocking & Network Interception](#api-mocking--network-interception)
10. [Visual Regression Testing](#visual-regression-testing)
11. [CI/CD Integration](#cicd-integration)
12. [MCP Playwright Integration](#mcp-playwright-integration)
13. [Common Patterns & Best Practices](#common-patterns--best-practices)
14. [Common Mistakes](#common-mistakes)

---

## 🎯 Overview

### ทำไมต้อง Playwright?

- **Cross-browser testing** - รองรับ Chromium, Firefox, WebKit
- **Auto-wait** - รอ element พร้อมก่อนทำ action โดยอัตโนมัติ
- **Web-first assertions** - assertions ที่ retry ให้อัตโนมัติจนกว่าจะ pass หรือ timeout
- **Trace viewer** - debug test ได้ง่ายด้วย trace recording
- **API testing** - รองรับการทดสอบ API ควบคู่กับ UI
- **Code generation** - สร้าง test code จากการ record user interaction

### ทำไมต้อง Page Object Model?

- **Reusability** - ใช้ locators และ actions ซ้ำได้หลาย test
- **Maintainability** - เมื่อ UI เปลี่ยน แก้ไขแค่ที่ Page Object ไม่ต้องแก้ทุก test
- **Readability** - test อ่านเข้าใจง่ายเหมือนอ่าน business requirement
- **Separation of concerns** - แยก test logic ออกจาก UI interaction

---

## 🛠️ Setup & Configuration

### Installation

```bash
# ใช้ Node.js 18+ และ TypeScript 5+
npm init playwright@latest

# หรือเพิ่มเข้าโปรเจ็กต์ที่มีอยู่
npm install -D @playwright/test
npx playwright install
```

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile viewports
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Environment Variables

```bash
# .env.test
BASE_URL=http://localhost:3000
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123!
```

> **สำคัญ**: ห้าม commit ไฟล์ `.env.test` ที่มี credentials จริง ใช้ `.env.test.example` เป็น template แทน

---

## 📁 Project Structure

```
e2e/
├── fixtures/                  # Custom fixtures และ test setup
│   ├── base.fixture.ts       # Base fixture ที่ทุก test ใช้ร่วมกัน
│   └── auth.fixture.ts       # Fixture สำหรับ authentication
├── pages/                     # Page Object Models
│   ├── base.page.ts          # Base page ที่ทุก page สืบทอด
│   ├── login.page.ts         # Login page
│   ├── dashboard.page.ts     # Dashboard page
│   └── exports/              # จัดกลุ่มตาม feature
│       ├── export-list.page.ts
│       └── export-detail.page.ts
├── components/                # Component Objects (shared UI components)
│   ├── navbar.component.ts
│   ├── sidebar.component.ts
│   ├── data-table.component.ts
│   └── modal.component.ts
├── tests/                     # Test files
│   ├── auth/
│   │   ├── login.spec.ts
│   │   └── logout.spec.ts
│   ├── dashboard/
│   │   └── dashboard.spec.ts
│   └── exports/
│       ├── export-list.spec.ts
│       └── export-create.spec.ts
├── helpers/                   # Utility functions
│   ├── api.helper.ts         # API helper สำหรับ setup/teardown
│   └── test-data.helper.ts   # Test data generators
└── global-setup.ts           # Global setup (เช่น login ครั้งเดียว)
```

### หลักการจัดโครงสร้าง

- **จัดกลุ่ม Page Objects ตาม feature** เหมือนโครงสร้างของแอปพลิเคชัน
- **แยก Component Objects** สำหรับ UI components ที่ใช้ร่วมกันหลายหน้า
- **จัดกลุ่ม Test files ตาม feature** เพื่อให้ค้นหาและดูแลรักษาง่าย
- **ใช้ fixtures** สำหรับ setup/teardown ที่ต้องใช้ร่วมกัน

---

## 🏗️ Page Object Model (POM)

### Base Page

สร้าง Base Page ที่มี methods พื้นฐานสำหรับทุกหน้า

```typescript
// e2e/pages/base.page.ts
import { type Page, type Locator, expect } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  // Navigation
  abstract readonly url: string;

  async goto(): Promise<void> {
    await this.page.goto(this.url);
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  // Common actions
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }
}
```

### Login Page (ตัวอย่าง Page Object)

```typescript
// e2e/pages/login.page.ts
import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  readonly url = '/login';

  // Locators - ประกาศเป็น property เพื่อให้ reuse ได้
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly submitButton: Locator;
  private readonly errorMessage: Locator;
  private readonly rememberMeCheckbox: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Sign in' });
    this.errorMessage = page.getByRole('alert');
    this.rememberMeCheckbox = page.getByLabel('Remember me');
  }

  // Actions - สะท้อน user behavior
  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async loginWithRememberMe(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.rememberMeCheckbox.check();
    await this.submitButton.click();
  }

  // Assertions - ฝังใน Page Object เพื่อ reuse
  async expectErrorMessage(message: string): Promise<void> {
    await expect(this.errorMessage).toContainText(message);
  }

  async expectToBeOnLoginPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login/);
    await expect(this.submitButton).toBeVisible();
  }
}
```

### Dashboard Page (ตัวอย่างหน้าที่ซับซ้อน)

```typescript
// e2e/pages/dashboard.page.ts
import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { NavbarComponent } from '../components/navbar.component';
import { SidebarComponent } from '../components/sidebar.component';

export class DashboardPage extends BasePage {
  readonly url = '/dashboard';

  // Compose ด้วย Component Objects
  readonly navbar: NavbarComponent;
  readonly sidebar: SidebarComponent;

  // Page-specific locators
  private readonly welcomeMessage: Locator;
  private readonly statsCards: Locator;
  private readonly recentActivityList: Locator;

  constructor(page: Page) {
    super(page);
    this.navbar = new NavbarComponent(page);
    this.sidebar = new SidebarComponent(page);
    this.welcomeMessage = page.getByTestId('welcome-message');
    this.statsCards = page.getByTestId('stats-card');
    this.recentActivityList = page.getByRole('list', { name: 'Recent activity' });
  }

  // Actions
  async getStatsCount(): Promise<number> {
    return this.statsCards.count();
  }

  async getWelcomeText(): Promise<string> {
    return this.welcomeMessage.innerText();
  }

  // Assertions
  async expectToBeOnDashboard(): Promise<void> {
    await expect(this.page).toHaveURL(/\/dashboard/);
    await expect(this.welcomeMessage).toBeVisible();
  }

  async expectStatsCardsVisible(count: number): Promise<void> {
    await expect(this.statsCards).toHaveCount(count);
  }
}
```

### หลักการออกแบบ Page Object

| หลักการ | คำอธิบาย |
|---------|---------|
| **Single Responsibility** | แต่ละ Page Object ดูแลหน้าเดียว |
| **Encapsulation** | Locators เป็น private, expose เฉพาะ actions และ assertions |
| **No assertions in actions** | แยก action methods กับ assertion methods ออกจากกัน |
| **Return type ชัดเจน** | Action ที่นำไปหน้าอื่นควร return Page Object ของหน้าปลายทาง |
| **Composable** | ใช้ Component Objects สำหรับ shared UI components |

### Navigation ระหว่างหน้า

```typescript
// ✅ ดี - return Page Object ของหน้าปลายทาง
export class LoginPage extends BasePage {
  async loginAndGoToDashboard(email: string, password: string): Promise<DashboardPage> {
    await this.login(email, password);
    const dashboard = new DashboardPage(this.page);
    await dashboard.expectToBeOnDashboard();
    return dashboard;
  }
}

// ❌ หลีกเลี่ยง - ไม่ return Page Object เมื่อ navigate ไปหน้าอื่น
export class LoginPage extends BasePage {
  async loginAndGoToDashboard(email: string, password: string): Promise<void> {
    await this.login(email, password);
    // ผู้เรียกต้องสร้าง DashboardPage เอง ทำให้ไม่รู้ว่า navigate ไปไหน
  }
}
```

---

## ✅ Writing Tests

### Test Structure

```typescript
// e2e/tests/auth/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { DashboardPage } from '../../pages/dashboard.page';

test.describe('Login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    const dashboard = await loginPage.loginAndGoToDashboard(
      'user@example.com',
      'ValidPassword123!',
    );

    await dashboard.expectToBeOnDashboard();
  });

  test('should show error with invalid credentials', async () => {
    await loginPage.login('user@example.com', 'WrongPassword');

    await loginPage.expectErrorMessage('Invalid email or password');
    await loginPage.expectToBeOnLoginPage();
  });

  test('should show validation error for empty email', async () => {
    await loginPage.login('', 'SomePassword123!');

    await loginPage.expectErrorMessage('Email is required');
  });
});
```

### การใช้ Custom Fixtures

```typescript
// e2e/fixtures/auth.fixture.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';

type AuthFixtures = {
  loginPage: LoginPage;
  authenticatedPage: DashboardPage;
};

export const test = base.extend<AuthFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await use(loginPage);
  },

  authenticatedPage: async ({ page }, use) => {
    // Login ผ่าน API เพื่อความเร็ว แล้วค่อยเปิดหน้า dashboard
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    const dashboard = await loginPage.loginAndGoToDashboard(
      process.env.TEST_USER_EMAIL!,
      process.env.TEST_USER_PASSWORD!,
    );
    await use(dashboard);
  },
});

export { expect } from '@playwright/test';
```

```typescript
// e2e/tests/dashboard/dashboard.spec.ts
import { test, expect } from '../../fixtures/auth.fixture';

test.describe('Dashboard', () => {
  test('should display welcome message', async ({ authenticatedPage }) => {
    const welcomeText = await authenticatedPage.getWelcomeText();
    expect(welcomeText).toContain('Welcome');
  });

  test('should display stats cards', async ({ authenticatedPage }) => {
    await authenticatedPage.expectStatsCardsVisible(4);
  });
});
```

### Authentication Strategy (storageState)

ใช้ `storageState` เพื่อ login ครั้งเดียวแล้วใช้ซ้ำทุก test เพื่อเพิ่มความเร็ว

```typescript
// e2e/global-setup.ts
import { chromium, type FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Login ผ่าน UI ครั้งเดียว
  await page.goto(`${config.projects[0].use.baseURL}/login`);
  await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/dashboard/);

  // บันทึก storage state เพื่อใช้ซ้ำ
  await page.context().storageState({ path: '.auth/user.json' });
  await browser.close();
}

export default globalSetup;
```

```typescript
// playwright.config.ts - เพิ่ม setup project
export default defineConfig({
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
```

---

## 🎯 Locator Strategy

### ลำดับความสำคัญของ Locators (จากแนะนำมากไปน้อย)

| ลำดับ | Locator | ตัวอย่าง | เหตุผล |
|-------|---------|---------|--------|
| 1 | `getByRole` | `page.getByRole('button', { name: 'Submit' })` | เข้าถึงได้ง่าย, ตรงกับ accessibility, ไม่เปลี่ยนบ่อย |
| 2 | `getByLabel` | `page.getByLabel('Email')` | สำหรับ form fields, ผูกกับ label text |
| 3 | `getByPlaceholder` | `page.getByPlaceholder('Search...')` | สำหรับ fields ที่ไม่มี label |
| 4 | `getByText` | `page.getByText('Welcome back')` | สำหรับ text content ที่ไม่เปลี่ยนบ่อย |
| 5 | `getByTestId` | `page.getByTestId('submit-btn')` | เมื่อไม่มี accessible role/label ที่เหมาะสม |
| 6 | CSS/XPath | `page.locator('.btn-primary')` | ใช้เป็นทางเลือกสุดท้ายเท่านั้น |

### ตัวอย่าง Locator ที่ดีและไม่ดี

```typescript
// ✅ ดี - ใช้ accessible roles
page.getByRole('button', { name: 'Save changes' });
page.getByRole('heading', { name: 'Dashboard' });
page.getByRole('link', { name: 'Settings' });
page.getByRole('textbox', { name: 'Search' });
page.getByRole('checkbox', { name: 'Remember me' });

// ✅ ดี - ใช้ label สำหรับ form fields
page.getByLabel('Email address');
page.getByLabel('Password');

// ✅ ดี - ใช้ test-id เมื่อจำเป็น
page.getByTestId('user-avatar');
page.getByTestId('export-progress-bar');

// ❌ หลีกเลี่ยง - CSS selectors ที่ผูกกับ implementation
page.locator('.MuiButton-root.MuiButton-contained');
page.locator('#root > div > div:nth-child(2) > button');
page.locator('[class*="styled-component"]');

// ❌ หลีกเลี่ยง - XPath ที่ซับซ้อน
page.locator('//div[@class="container"]//button[contains(text(),"Save")]');
```

### การตั้งค่า Test ID Attribute

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    testIdAttribute: 'data-testid', // ค่าเริ่มต้น
  },
});
```

```tsx
// ในโค้ด React component
<div data-testid="export-card">{/* ... */}</div>
```

### Filtering และ Chaining Locators

```typescript
// Filter ด้วย text
page.getByRole('listitem').filter({ hasText: 'Completed' });

// Filter ด้วย locator ข้างใน
page.getByRole('listitem').filter({
  has: page.getByRole('button', { name: 'Delete' }),
});

// Chaining - ค้นหาภายใน element
const card = page.getByTestId('export-card').first();
await card.getByRole('button', { name: 'Download' }).click();
```

---

## 📊 Test Data Management

### Test Data Helper

```typescript
// e2e/helpers/test-data.helper.ts
import { randomUUID } from 'crypto';

export class TestDataHelper {
  static uniqueEmail(): string {
    return `test-${randomUUID().slice(0, 8)}@example.com`;
  }

  static uniqueName(prefix: string): string {
    return `${prefix}-${Date.now()}`;
  }

  static createExportData(overrides?: Partial<ExportData>): ExportData {
    return {
      name: TestDataHelper.uniqueName('Export'),
      format: 'csv',
      dateRange: { start: '2025-01-01', end: '2025-12-31' },
      ...overrides,
    };
  }
}
```

### API Helper สำหรับ Setup/Teardown

```typescript
// e2e/helpers/api.helper.ts
import { type APIRequestContext } from '@playwright/test';

export class ApiHelper {
  constructor(private readonly request: APIRequestContext) {}

  async createUser(data: CreateUserData): Promise<User> {
    const response = await this.request.post('/api/users', { data });
    return response.json();
  }

  async deleteUser(id: string): Promise<void> {
    await this.request.delete(`/api/users/${id}`);
  }

  async seedExportData(count: number): Promise<Export[]> {
    const exports: Export[] = [];
    for (let i = 0; i < count; i++) {
      const response = await this.request.post('/api/exports', {
        data: TestDataHelper.createExportData(),
      });
      exports.push(await response.json());
    }
    return exports;
  }
}
```

```typescript
// ใช้ใน test
test('should display export list', async ({ page, request }) => {
  const api = new ApiHelper(request);
  const exports = await api.seedExportData(5);

  const exportListPage = new ExportListPage(page);
  await exportListPage.goto();
  await exportListPage.expectExportCount(5);

  // Cleanup
  for (const exp of exports) {
    await api.deleteExport(exp.id);
  }
});
```

---

## 🧩 Component Object Pattern

สำหรับ shared UI components ที่ใช้ในหลายหน้า

### DataTable Component

```typescript
// e2e/components/data-table.component.ts
import { type Page, type Locator, expect } from '@playwright/test';

export class DataTableComponent {
  private readonly root: Locator;
  private readonly rows: Locator;
  private readonly searchInput: Locator;
  private readonly paginationNext: Locator;
  private readonly paginationPrev: Locator;
  private readonly loadingSpinner: Locator;

  constructor(page: Page, testId: string = 'data-table') {
    this.root = page.getByTestId(testId);
    this.rows = this.root.getByRole('row');
    this.searchInput = this.root.getByRole('searchbox');
    this.paginationNext = this.root.getByRole('button', { name: 'Next page' });
    this.paginationPrev = this.root.getByRole('button', { name: 'Previous page' });
    this.loadingSpinner = this.root.getByTestId('loading-spinner');
  }

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.loadingSpinner.waitFor({ state: 'hidden' });
  }

  async clickRow(index: number): Promise<void> {
    // +1 เพื่อข้าม header row
    await this.rows.nth(index + 1).click();
  }

  async goToNextPage(): Promise<void> {
    await this.paginationNext.click();
    await this.loadingSpinner.waitFor({ state: 'hidden' });
  }

  async sortByColumn(columnName: string): Promise<void> {
    await this.root
      .getByRole('columnheader', { name: columnName })
      .click();
  }

  async getRowCount(): Promise<number> {
    // ลบ 1 เพราะ header row
    return (await this.rows.count()) - 1;
  }

  // Assertions
  async expectRowCount(count: number): Promise<void> {
    // +1 เพราะ header row
    await expect(this.rows).toHaveCount(count + 1);
  }

  async expectRowToContainText(index: number, text: string): Promise<void> {
    await expect(this.rows.nth(index + 1)).toContainText(text);
  }

  async expectEmptyState(): Promise<void> {
    await expect(this.root.getByText('No data available')).toBeVisible();
  }
}
```

### Modal Component

```typescript
// e2e/components/modal.component.ts
import { type Page, type Locator, expect } from '@playwright/test';

export class ModalComponent {
  private readonly root: Locator;
  private readonly title: Locator;
  private readonly closeButton: Locator;
  private readonly confirmButton: Locator;
  private readonly cancelButton: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('dialog');
    this.title = this.root.getByRole('heading');
    this.closeButton = this.root.getByRole('button', { name: 'Close' });
    this.confirmButton = this.root.getByRole('button', { name: /confirm|save|submit|delete/i });
    this.cancelButton = this.root.getByRole('button', { name: /cancel/i });
  }

  async confirm(): Promise<void> {
    await this.confirmButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async close(): Promise<void> {
    await this.closeButton.click();
  }

  async expectTitle(title: string): Promise<void> {
    await expect(this.title).toHaveText(title);
  }

  async expectToBeVisible(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  async expectToBeClosed(): Promise<void> {
    await expect(this.root).toBeHidden();
  }
}
```

### ใช้ Component Object ใน Page Object

```typescript
// e2e/pages/exports/export-list.page.ts
import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';
import { DataTableComponent } from '../../components/data-table.component';
import { ModalComponent } from '../../components/modal.component';

export class ExportListPage extends BasePage {
  readonly url = '/exports';

  readonly table: DataTableComponent;
  private readonly createButton: Locator;

  constructor(page: Page) {
    super(page);
    this.table = new DataTableComponent(page, 'exports-table');
    this.createButton = page.getByRole('button', { name: 'Create export' });
  }

  async clickCreateExport(): Promise<void> {
    await this.createButton.click();
  }

  async deleteExport(name: string): Promise<void> {
    await this.table.search(name);
    await this.page
      .getByRole('row', { name })
      .getByRole('button', { name: 'Delete' })
      .click();

    const modal = new ModalComponent(this.page);
    await modal.expectTitle('Confirm Delete');
    await modal.confirm();
  }

  async expectExportCount(count: number): Promise<void> {
    await this.table.expectRowCount(count);
  }
}
```

---

## 🌐 API Mocking & Network Interception

### Mock API Response

```typescript
test('should display error when API fails', async ({ page }) => {
  // Mock API ให้ return error
  await page.route('**/api/exports', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Internal Server Error' }),
    }),
  );

  const exportListPage = new ExportListPage(page);
  await exportListPage.goto();

  await expect(page.getByText('Failed to load exports')).toBeVisible();
});
```

### Mock Data สำหรับ Consistent Testing

```typescript
test('should display export list from mock data', async ({ page }) => {
  const mockExports = [
    { id: '1', name: 'Daily Report', status: 'completed', format: 'csv' },
    { id: '2', name: 'Monthly Summary', status: 'pending', format: 'xlsx' },
  ];

  await page.route('**/api/exports', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: mockExports, total: 2 }),
    }),
  );

  const exportListPage = new ExportListPage(page);
  await exportListPage.goto();

  await exportListPage.expectExportCount(2);
  await exportListPage.table.expectRowToContainText(0, 'Daily Report');
  await exportListPage.table.expectRowToContainText(1, 'Monthly Summary');
});
```

### Intercept และ Modify Response

```typescript
test('should handle slow network', async ({ page }) => {
  await page.route('**/api/exports', async (route) => {
    // จำลอง network ช้า
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await route.continue();
  });

  const exportListPage = new ExportListPage(page);
  await exportListPage.goto();

  // ตรวจสอบ loading state
  await expect(page.getByTestId('loading-spinner')).toBeVisible();
});
```

---

## 📸 Visual Regression Testing

### Screenshot Comparison

```typescript
test('dashboard should match visual snapshot', async ({ page }) => {
  const dashboard = new DashboardPage(page);
  await dashboard.goto();
  await dashboard.waitForPageLoad();

  await expect(page).toHaveScreenshot('dashboard.png', {
    maxDiffPixelRatio: 0.01, // อนุญาต diff ไม่เกิน 1%
  });
});

test('export form should match visual snapshot', async ({ page }) => {
  const exportPage = new ExportListPage(page);
  await exportPage.goto();
  await exportPage.clickCreateExport();

  // Screenshot เฉพาะ element
  const modal = page.getByRole('dialog');
  await expect(modal).toHaveScreenshot('export-create-modal.png');
});
```

### อัปเดต Snapshots

```bash
# อัปเดต snapshots ทั้งหมด
npx playwright test --update-snapshots

# อัปเดต snapshots เฉพาะ test file
npx playwright test tests/dashboard.spec.ts --update-snapshots
```

---

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    timeout-minutes: 30
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: npx playwright test
        env:
          BASE_URL: ${{ vars.TEST_BASE_URL }}
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}

      - name: Upload test report
        uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: test-results
          path: test-results/
          retention-days: 7
```

### GitLab CI

```yaml
# .gitlab-ci.yml
playwright-tests:
  image: mcr.microsoft.com/playwright:v1.49.0-noble
  stage: test
  script:
    - npm ci
    - npx playwright test
  artifacts:
    when: always
    paths:
      - playwright-report/
      - test-results/
    expire_in: 7 days
  variables:
    BASE_URL: $TEST_BASE_URL
    TEST_USER_EMAIL: $TEST_USER_EMAIL
    TEST_USER_PASSWORD: $TEST_USER_PASSWORD
```

---

## 🤖 MCP Playwright Integration

MCP (Model Context Protocol) ช่วยให้ AI tools เช่น Cursor และ Claude Code สามารถควบคุม browser ผ่าน Playwright ได้โดยตรง เหมาะสำหรับ:

- **สร้าง test อัตโนมัติ** - ให้ AI เปิดหน้าเว็บจริงแล้วสร้าง test code ให้
- **Debug test ที่ fail** - ให้ AI เปิด browser ดูหน้าจอจริงเพื่อวิเคราะห์ปัญหา
- **Scrape ข้อมูล** - ดึงข้อมูลจากหน้าเว็บเพื่อใช้ในการพัฒนา
- **ทดสอบ UI แบบ interactive** - สั่งให้ AI คลิก, พิมพ์, navigate แล้วตรวจสอบผลลัพธ์

### ติดตั้ง Playwright MCP Package

```bash
npm install -D @playwright/mcp@latest
```

### ตั้งค่าใน Cursor

เพิ่มไฟล์ `.cursor/mcp.json` ที่ root ของโปรเจ็กต์:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

หรือตั้งค่าผ่าน UI:
1. เปิด **Cursor Settings** → **MCP**
2. คลิก **Add new MCP Server**
3. ตั้งชื่อ `playwright`
4. เลือก Type เป็น `command`
5. ใส่ command: `npx @playwright/mcp@latest`

#### ตัวอย่าง Cursor Configuration พร้อม Options

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--browser", "chrome",
        "--viewport-size", "1280x720"
      ]
    }
  }
}
```

### ตั้งค่าใน Claude Code

```bash
# เพิ่ม Playwright MCP server (บันทึกถาวรสำหรับโปรเจ็กต์ปัจจุบัน)
claude mcp add playwright npx @playwright/mcp@latest
```

#### ตัวอย่างพร้อม Options

```bash
# ใช้ headless mode สำหรับ CI environment
claude mcp add playwright npx @playwright/mcp@latest --headless

# ระบุ browser
claude mcp add playwright npx @playwright/mcp@latest -- --browser chrome

# ตรวจสอบว่า MCP server ถูกเพิ่มแล้ว
claude mcp list
```

#### ตรวจสอบ Tools ที่พร้อมใช้งาน

หลังเพิ่ม MCP server แล้ว ให้ตรวจสอบ tools ด้วยคำสั่ง `/mcp` ใน Claude Code จากนั้นเลือก `playwright` เพื่อดู tools ที่พร้อมใช้งาน เช่น:

| Tool | คำอธิบาย |
|------|---------|
| `browser_navigate` | เปิด URL ใน browser |
| `browser_screenshot` | ถ่าย screenshot หน้าจอ |
| `browser_click` | คลิก element บนหน้าเว็บ |
| `browser_type` | พิมพ์ข้อความลงใน input field |
| `browser_snapshot` | ดึง accessibility snapshot ของหน้าเว็บ |
| `browser_tab_list` | แสดง tabs ที่เปิดอยู่ |
| `browser_console_messages` | ดู console logs |

### ตั้งค่าใน Claude Desktop

เปิด **Settings** → **Developer** → **Edit Config** แล้วแก้ไข `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

> **สำคัญ**: ต้อง restart Claude Desktop หลังแก้ไข config

### Command-Line Options

| Option | คำอธิบาย | ค่าเริ่มต้น |
|--------|---------|-------------|
| `--browser` | เลือก browser: `chrome`, `firefox`, `webkit`, `msedge` | `chrome` |
| `--headless` | รันแบบไม่แสดงหน้าต่าง browser | `false` (แสดงหน้าต่าง) |
| `--viewport-size` | ขนาดหน้าจอ เช่น `1280x720` | ค่าเริ่มต้นของ browser |
| `--user-data-dir` | โฟลเดอร์ profile ถาวร (เก็บ cookies, storage) | ไม่มี |
| `--storage-state` | โหลด cookies/storage จากไฟล์ | ไม่มี |
| `--port` | Port สำหรับ SSE transport | ไม่มี |

สามารถตั้งค่าผ่าน environment variables ได้เช่นกัน โดยใช้ prefix `PLAYWRIGHT_MCP_`:

```bash
export PLAYWRIGHT_MCP_HEADLESS=true
export PLAYWRIGHT_MCP_BROWSER=chrome
```

### Workflow แนะนำ

#### 1. สร้าง Test จากหน้าเว็บจริง

```
พิมพ์ใน Cursor / Claude Code:

"ใช้ playwright mcp เปิด http://localhost:3000/login
 แล้วสร้าง Playwright test สำหรับ login flow
 โดยใช้ Page Object Model ตามมาตรฐานของเรา"
```

> **Tips**: ระบุคำว่า "playwright mcp" อย่างชัดเจนในคำสั่งแรก เพื่อให้ AI ใช้ MCP server แทนการรัน Bash command

#### 2. Debug Test ที่ Fail

```
"ใช้ playwright mcp เปิดหน้า /exports
 แล้วตรวจสอบว่า element data-testid='exports-table' อยู่ตรงไหน
 test ของเราหา element นี้ไม่เจอ"
```

#### 3. Authentication แบบ Manual

เนื่องจาก MCP Playwright เปิด browser window ที่มองเห็นได้ สามารถให้ AI เปิดหน้า login แล้ว login ด้วยตัวเองได้:

```
"ใช้ playwright mcp เปิด http://localhost:3000/login
 แล้วรอให้ฉัน login ก่อน
 จากนั้นค่อย navigate ไปหน้า /dashboard แล้ว screenshot ให้"
```

Cookies จะยังคงอยู่ตลอด session ทำให้ทำงานต่อได้โดยไม่ต้อง login ซ้ำ

#### 4. ตรวจสอบ Accessibility

```
"ใช้ playwright mcp เปิด http://localhost:3000
 แล้วดึง accessibility snapshot ของหน้าหลัก
 ตรวจสอบว่า elements มี roles และ labels ที่ถูกต้อง"
```

### ข้อควรระวัง

- **อย่าใช้ MCP ใน CI/CD** - ใช้สำหรับ development และ debugging เท่านั้น ใน CI ให้ใช้ `npx playwright test` ตามปกติ
- **Credentials** - อย่า hardcode credentials ในคำสั่ง AI ให้ login ด้วยตัวเองผ่าน browser window
- **Token usage** - การใช้ MCP จะใช้ tokens มากกว่า CLI ปกติ (~4 เท่า) ใช้เท่าที่จำเป็น
- **Network** - MCP server ทำงานใน local machine ดังนั้นต้องเข้าถึงเว็บที่จะทดสอบได้

---

## 💡 Common Patterns & Best Practices

### 1. Test Independence

```typescript
// ✅ ดี - แต่ละ test เป็นอิสระ มี setup/teardown ของตัวเอง
test('should create export', async ({ page, request }) => {
  const api = new ApiHelper(request);
  const exportPage = new ExportListPage(page);
  await exportPage.goto();

  await exportPage.clickCreateExport();
  // ... create export ...
});

test('should delete export', async ({ page, request }) => {
  const api = new ApiHelper(request);
  // Setup: สร้างข้อมูลที่ต้องการ
  const exportData = await api.createExport(TestDataHelper.createExportData());

  const exportPage = new ExportListPage(page);
  await exportPage.goto();
  await exportPage.deleteExport(exportData.name);
});

// ❌ หลีกเลี่ยง - test พึ่งพา test อื่น
test('should create export', async ({ page }) => {
  // สร้าง export
});

test('should delete the export created above', async ({ page }) => {
  // พึ่งพา test ก่อนหน้า - จะ fail ถ้ารัน test เดียว
});
```

### 2. ใช้ Web-First Assertions

```typescript
// ✅ ดี - auto-retry จนกว่าจะ pass หรือ timeout
await expect(page.getByRole('alert')).toBeVisible();
await expect(page.getByRole('heading')).toHaveText('Dashboard');
await expect(page).toHaveURL(/\/dashboard/);

// ❌ หลีกเลี่ยง - ไม่ retry, อาจ fail เพราะ timing
const isVisible = await page.getByRole('alert').isVisible();
expect(isVisible).toBe(true);
```

### 3. หลีกเลี่ยง Hard Waits

```typescript
// ✅ ดี - รอ condition ที่เจาะจง
await page.getByRole('button', { name: 'Save' }).click();
await expect(page.getByText('Saved successfully')).toBeVisible();

// ✅ ดี - รอ network request เสร็จ
await Promise.all([
  page.waitForResponse('**/api/exports'),
  page.getByRole('button', { name: 'Load' }).click(),
]);

// ❌ หลีกเลี่ยง - hard wait ทำให้ test ช้าและไม่เสถียร
await page.getByRole('button', { name: 'Save' }).click();
await page.waitForTimeout(3000); // อย่าทำแบบนี้!
```

### 4. Test Naming Convention

```typescript
// ✅ ดี - อธิบาย behavior ที่คาดหวัง
test('should display error message when login with invalid credentials', ...);
test('should redirect to dashboard after successful login', ...);
test('should disable submit button when form is invalid', ...);

// ❌ หลีกเลี่ยง - ชื่อไม่ชัดเจน
test('login test', ...);
test('test1', ...);
test('it works', ...);
```

### 5. จัดกลุ่ม Test ด้วย describe

```typescript
test.describe('Export Management', () => {
  test.describe('Create Export', () => {
    test('should create export with valid data', ...);
    test('should show validation error for missing name', ...);
  });

  test.describe('Delete Export', () => {
    test('should delete export after confirmation', ...);
    test('should cancel delete when clicking cancel', ...);
  });
});
```

### 6. Tagging Tests

```typescript
// ใช้ tags เพื่อจัดกลุ่มและเลือก test ที่จะรัน
test('should create export @smoke', async ({ page }) => { ... });
test('should handle pagination @regression', async ({ page }) => { ... });
test('should display on mobile @mobile', async ({ page }) => { ... });
```

```bash
# รัน test ตาม tag
npx playwright test --grep @smoke
npx playwright test --grep @regression
npx playwright test --grep-invert @mobile  # ข้าม mobile tests
```

### 7. Retry Strategy

```typescript
// playwright.config.ts
export default defineConfig({
  retries: process.env.CI ? 2 : 0,  // retry เฉพาะใน CI
  expect: {
    timeout: 10_000,  // assertion timeout 10 วินาที
  },
  timeout: 30_000,    // test timeout 30 วินาที
});

// หรือ retry เฉพาะ test ที่ไม่เสถียร (ใช้ชั่วคราวเท่านั้น)
test('flaky network test', { retries: 3 }, async ({ page }) => {
  // ...
});
```

---

## ⚠️ Common Mistakes

### 1. Locators ที่เปราะบาง

```typescript
// ❌ ผิด - ผูกกับ implementation details
page.locator('.css-1a2b3c');
page.locator('#auto-generated-id-123');
page.locator('div > div > span:nth-child(2)');
page.locator('[class*="makeStyles"]');

// ✅ ถูก - ใช้ semantic locators
page.getByRole('button', { name: 'Submit' });
page.getByLabel('Email');
page.getByTestId('export-card');
```

### 2. ไม่แยก Concerns

```typescript
// ❌ ผิด - test มี locators และ logic ปนกัน
test('should login', async ({ page }) => {
  await page.goto('/login');
  await page.locator('#email').fill('user@test.com');
  await page.locator('#password').fill('pass123');
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('.welcome-msg')).toBeVisible();
  await page.locator('.nav-menu > li:nth-child(3)').click();
  await expect(page.locator('.export-table tbody tr')).toHaveCount(5);
});

// ✅ ถูก - ใช้ Page Objects
test('should login and view exports', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  const dashboard = await loginPage.loginAndGoToDashboard('user@test.com', 'pass123');

  await dashboard.sidebar.navigateTo('Exports');
  const exportPage = new ExportListPage(page);
  await exportPage.expectExportCount(5);
});
```

### 3. Test ที่พึ่งพาลำดับการรัน

```typescript
// ❌ ผิด - test.describe.serial ทำให้ test ไม่เป็นอิสระ
test.describe.serial('Export flow', () => {
  test('step 1: create export', ...);    // ถ้า fail test ถัดไปก็ fail
  test('step 2: verify export', ...);
  test('step 3: delete export', ...);
});

// ✅ ถูก - ถ้าจำเป็นต้องทดสอบ flow ทั้งหมด ให้รวมใน test เดียว
test('should complete full export flow', async ({ page, request }) => {
  const api = new ApiHelper(request);
  const exportPage = new ExportListPage(page);

  // Create
  await exportPage.goto();
  await exportPage.clickCreateExport();
  // ...

  // Verify
  await exportPage.table.expectRowToContainText(0, 'New Export');

  // Cleanup
  await exportPage.deleteExport('New Export');
});
```

### 4. ไม่ทำ Cleanup

```typescript
// ❌ ผิด - ไม่ cleanup ข้อมูลที่สร้าง
test('should create user', async ({ page }) => {
  // สร้าง user แต่ไม่ลบ ทำให้ test อื่นอาจ fail
});

// ✅ ถูก - ใช้ fixtures หรือ afterEach สำหรับ cleanup
test.afterEach(async ({ request }) => {
  const api = new ApiHelper(request);
  await api.cleanupTestData();
});
```

### 5. Screenshot ที่ไม่เสถียร

```typescript
// ❌ ผิด - screenshot ก่อนที่ข้อมูลจะโหลดเสร็จ
test('visual test', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveScreenshot();
});

// ✅ ถูก - รอข้อมูลโหลดเสร็จก่อน screenshot
test('visual test', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('stats-card')).toHaveCount(4);

  // ซ่อน dynamic content เช่น เวลา, animation
  await page.evaluate(() => {
    document.querySelectorAll('[data-testid="timestamp"]').forEach((el) => {
      el.textContent = '2025-01-01 00:00:00';
    });
  });

  await expect(page).toHaveScreenshot('dashboard.png', {
    maxDiffPixelRatio: 0.01,
    animations: 'disabled',
  });
});
```

---

## 📋 Checklist ก่อน Merge

- [ ] ทุก test ผ่านในทุก browser ที่กำหนด (Chromium, Firefox, WebKit)
- [ ] ไม่มี `test.only` หรือ `test.skip` ที่ไม่จำเป็นหลงเหลือ
- [ ] ไม่มี `page.waitForTimeout()` (hard waits) ในโค้ด
- [ ] ใช้ Page Object Model สำหรับทุก page interaction
- [ ] Locators ใช้ semantic selectors (getByRole, getByLabel, getByTestId)
- [ ] Test มีชื่อที่อธิบาย behavior ชัดเจน
- [ ] แต่ละ test เป็นอิสระและไม่พึ่งพาลำดับการรัน
- [ ] มีการ cleanup test data หลังทดสอบ
- [ ] Visual regression snapshots อัปเดตแล้ว (ถ้ามีการเปลี่ยน UI)
- [ ] CI pipeline ผ่าน
