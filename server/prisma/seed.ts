import {
  PrismaClient, UserRole, ProjectMemberRole, Priority, CaseStatus,
  RunStatus, ResultStatus, DefectStatus, Severity, TestType,
  TestEnvironment, AutomationStatus, ReviewStatus, PlatformPortal,
  UrgencyFlag, AdhocStatus, UatSessionStatus, UatResultStatus,
  ChecklistEntryStatus, PlanStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
// Use UTC noon to avoid local-timezone boundary collisions for @db.Date fields
const utcDateOnly = (daysBack: number) => {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysBack);
  return d;
};

async function main() {
  console.log('🌱  Seeding ShopEase demo data...');

  // ── Users ──────────────────────────────────────────────────────────────────
  const [adminPw, mgrPw, testerPw, devPw, t2Pw] = await Promise.all([
    bcrypt.hash('Admin@123456!', 10),
    bcrypt.hash('Manager@123456!', 10),
    bcrypt.hash('Tester@123456!', 10),
    bcrypt.hash('Developer@123456!', 10),
    bcrypt.hash('Tester@123456!', 10),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' }, update: {},
    create: { email: 'admin@example.com', name: 'Alex Admin', password: adminPw, role: UserRole.ADMIN, isActive: true },
  });
  const manager = await prisma.user.upsert({
    where: { email: 'manager@example.com' }, update: {},
    create: { email: 'manager@example.com', name: 'Morgan Chen', password: mgrPw, role: UserRole.MANAGER, isActive: true },
  });
  const tester = await prisma.user.upsert({
    where: { email: 'tester@example.com' }, update: {},
    create: { email: 'tester@example.com', name: 'Taylor QA', password: testerPw, role: UserRole.QA, isActive: true },
  });
  const developer = await prisma.user.upsert({
    where: { email: 'developer@example.com' }, update: {},
    create: { email: 'developer@example.com', name: 'Jordan Dev', password: devPw, role: UserRole.DEVELOPER, isActive: true },
  });
  const tester2 = await prisma.user.upsert({
    where: { email: 'tester2@example.com' }, update: {},
    create: { email: 'tester2@example.com', name: 'Sam Tester', password: t2Pw, role: UserRole.QA, isActive: true },
  });
  console.log('✅  Users ready');

  // ── Project (delete + recreate for idempotency) ────────────────────────────
  // Must delete in FK-safe order (some relations use RESTRICT, not CASCADE)
  const existing = await prisma.project.findUnique({ where: { key: 'DEMO' } });
  if (existing) {
    const pid = existing.id;
    const runIds    = (await prisma.testRun.findMany({ where: { projectId: pid }, select: { id: true } })).map(r => r.id);
    const planIds   = (await prisma.testPlan.findMany({ where: { projectId: pid }, select: { id: true } })).map(r => r.id);
    const sessIds   = (await prisma.checklistSession.findMany({ where: { projectId: pid }, select: { id: true } })).map(r => r.id);
    const uatIds    = (await prisma.uatSession.findMany({ where: { projectId: pid }, select: { id: true } })).map(r => r.id);
    const defectIds = (await prisma.defect.findMany({ where: { projectId: pid }, select: { id: true } })).map(r => r.id);
    const reqIds    = (await prisma.requirement.findMany({ where: { projectId: pid }, select: { id: true } })).map(r => r.id);
    const tcIds     = (await prisma.testCase.findMany({ where: { projectId: pid }, select: { id: true } })).map(r => r.id);

    await prisma.uatResult.deleteMany({ where: { sessionId: { in: uatIds } } });
    await prisma.uatSession.deleteMany({ where: { id: { in: uatIds } } });
    await prisma.checklistEntry.deleteMany({ where: { sessionId: { in: sessIds } } });
    await prisma.checklistSession.deleteMany({ where: { id: { in: sessIds } } });
    await prisma.adhocCase.deleteMany({ where: { projectId: pid } });
    await prisma.defectComment.deleteMany({ where: { defectId: { in: defectIds } } });
    await prisma.defect.deleteMany({ where: { id: { in: defectIds } } });
    await prisma.testResult.deleteMany({ where: { runId: { in: runIds } } });
    await prisma.testRun.deleteMany({ where: { id: { in: runIds } } });
    await prisma.testPlanAssignee.deleteMany({ where: { planId: { in: planIds } } });
    await prisma.testPlan.deleteMany({ where: { id: { in: planIds } } });
    await prisma.requirementTestCase.deleteMany({ where: { requirementId: { in: reqIds } } });
    await prisma.requirementDocument.deleteMany({ where: { requirementId: { in: reqIds } } });
    await prisma.requirement.deleteMany({ where: { id: { in: reqIds } } });
    await prisma.testCaseComment.deleteMany({ where: { testCaseId: { in: tcIds } } });
    await prisma.testStep.deleteMany({ where: { testCaseId: { in: tcIds } } });
    await prisma.testCase.deleteMany({ where: { id: { in: tcIds } } });
    await prisma.testSuite.deleteMany({ where: { projectId: pid } });
    await prisma.checklistItem.deleteMany({ where: { projectId: pid } });
    await prisma.activityLog.deleteMany({ where: { projectId: pid } });
    await prisma.projectMember.deleteMany({ where: { projectId: pid } });
    await prisma.project.delete({ where: { id: pid } });
  }

  const project = await prisma.project.create({
    data: {
      name: 'ShopEase — E-Commerce Platform',
      description: 'End-to-end QA for an online shopping platform: auth, catalog, cart, checkout, orders & admin.',
      key: 'DEMO',
      createdById: admin.id,
      isActive: true,
    },
  });

  await prisma.projectMember.createMany({
    data: [
      { projectId: project.id, userId: admin.id,     role: ProjectMemberRole.ADMIN },
      { projectId: project.id, userId: manager.id,   role: ProjectMemberRole.MANAGER },
      { projectId: project.id, userId: tester.id,    role: ProjectMemberRole.QA },
      { projectId: project.id, userId: tester2.id,   role: ProjectMemberRole.QA },
      { projectId: project.id, userId: developer.id, role: ProjectMemberRole.VIEWER },
    ],
  });
  console.log('✅  Project & members ready');

  // ── Test Suites ────────────────────────────────────────────────────────────
  const sAuth      = await prisma.testSuite.create({ data: { projectId: project.id, name: 'Authentication', description: 'Login, registration, and session management', order: 1 } });
  const sLoginReg  = await prisma.testSuite.create({ data: { projectId: project.id, parentId: sAuth.id, name: 'Login & Registration', order: 1 } });
  const sPassword  = await prisma.testSuite.create({ data: { projectId: project.id, parentId: sAuth.id, name: 'Password Management', order: 2 } });
  const sCatalog   = await prisma.testSuite.create({ data: { projectId: project.id, name: 'Product Catalog', description: 'Search, filtering, and product pages', order: 2 } });
  const sSearch    = await prisma.testSuite.create({ data: { projectId: project.id, parentId: sCatalog.id, name: 'Search & Filtering', order: 1 } });
  const sPDP       = await prisma.testSuite.create({ data: { projectId: project.id, parentId: sCatalog.id, name: 'Product Detail Page', order: 2 } });
  const sCart      = await prisma.testSuite.create({ data: { projectId: project.id, name: 'Shopping Cart', description: 'Cart and wishlist operations', order: 3 } });
  const sCheckout  = await prisma.testSuite.create({ data: { projectId: project.id, name: 'Checkout & Payment', description: 'End-to-end checkout and payment processing', order: 4 } });
  const sOrders    = await prisma.testSuite.create({ data: { projectId: project.id, name: 'Order Management', description: 'Order tracking, cancellation, and returns', order: 5 } });
  const sAdmin     = await prisma.testSuite.create({ data: { projectId: project.id, name: 'Admin Panel', description: 'Back-office product, user, and report management', order: 6 } });
  console.log('✅  Test suites ready');

  // ── Test Cases ─────────────────────────────────────────────────────────────
  const mkSteps = (steps: { action: string; expectedResult: string }[]) =>
    steps.map((s, i) => ({ order: i + 1, ...s }));

  // Login & Registration (5 cases)
  const tc001 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sLoginReg.id, caseId: 'TC-001', title: 'Successful login with valid credentials', scenario: 'User Authentication', description: 'Verify a registered user can log in with correct email and password', preconditions: 'Active account with verified email', priority: Priority.HIGH, severity: Severity.HIGH, testType: TestType.SMOKE, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.AUTOMATED, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.WEB_PORTAL, tags: ['smoke', 'auth', 'login'], createdById: admin.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Navigate to /login', expectedResult: 'Login page loads with email and password fields' }, { action: 'Enter valid email "buyer@shopease.io"', expectedResult: 'Email populated' }, { action: 'Enter correct password', expectedResult: 'Password masked' }, { action: 'Click "Sign In"', expectedResult: 'Redirected to /dashboard, nav shows user avatar' }]) } } });
  const tc002 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sLoginReg.id, caseId: 'TC-002', title: 'Login rejected with incorrect password', scenario: 'User Authentication', description: 'Verify login is blocked when wrong password is submitted', preconditions: 'Valid user account exists', priority: Priority.HIGH, severity: Severity.HIGH, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.AUTOMATED, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.WEB_PORTAL, tags: ['auth', 'negative', 'security'], createdById: admin.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Navigate to /login', expectedResult: 'Login page displayed' }, { action: 'Enter valid email with wrong password', expectedResult: 'Fields populated' }, { action: 'Click "Sign In"', expectedResult: '"Invalid email or password" toast shown; user stays on login page' }]) } } });
  const tc003 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sLoginReg.id, caseId: 'TC-003', title: 'Login blocked for unverified email', scenario: 'User Authentication', description: 'Users with unverified emails must be prompted to verify before accessing', preconditions: 'Account created but email not verified', priority: Priority.MEDIUM, severity: Severity.MEDIUM, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.MANUAL, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.WEB_PORTAL, tags: ['auth', 'email-verification'], createdById: tester.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Attempt login with unverified account', expectedResult: 'Warning: "Please verify your email address"' }, { action: 'Check inbox for verification link', expectedResult: 'Verification email received within 2 minutes' }]) } } });
  const tc004 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sLoginReg.id, caseId: 'TC-004', title: 'New user registration with valid data', scenario: 'User Authentication', description: 'Verify complete registration flow for a new user', preconditions: 'Email address not previously registered', priority: Priority.HIGH, severity: Severity.HIGH, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.AUTOMATED, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.WEB_PORTAL, tags: ['auth', 'registration', 'smoke'], createdById: admin.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Navigate to /register', expectedResult: 'Registration form displayed' }, { action: 'Fill in name, email, password, confirm password', expectedResult: 'All fields validated in real-time' }, { action: 'Submit form', expectedResult: 'Success message; verification email sent' }, { action: 'Click verification link in email', expectedResult: 'Account activated; redirected to login' }]) } } });
  const tc005 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sLoginReg.id, caseId: 'TC-005', title: 'Registration blocked for duplicate email', scenario: 'User Authentication', description: 'System prevents registration with an already-registered email', preconditions: 'Account with target email already exists', priority: Priority.MEDIUM, severity: Severity.MEDIUM, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.MANUAL, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.WEB_PORTAL, tags: ['auth', 'registration', 'negative'], createdById: tester.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Submit registration with existing email', expectedResult: '"Email already in use" inline error displayed' }]) } } });

  // Password Management (3 cases)
  const tc006 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sPassword.id, caseId: 'TC-006', title: 'Forgot password — reset email delivered', scenario: 'Password Management', description: 'Verify password reset email is sent when user requests a reset', preconditions: 'Registered account with verified email', priority: Priority.HIGH, severity: Severity.HIGH, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.MANUAL, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.WEB_PORTAL, tags: ['auth', 'password-reset'], createdById: tester.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Click "Forgot Password?" on login page', expectedResult: 'Forgot password form opens' }, { action: 'Enter registered email and submit', expectedResult: 'Confirmation message shown; reset email sent within 1 min' }, { action: 'Open reset link in email', expectedResult: 'New password form displayed with valid token' }, { action: 'Enter new password and confirm, submit', expectedResult: 'Password updated; redirected to login' }]) } } });
  const tc007 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sPassword.id, caseId: 'TC-007', title: 'Expired password reset link rejected', scenario: 'Password Management', description: 'Reset links older than 1 hour must be invalidated', preconditions: 'Password reset email requested >1 hour ago', priority: Priority.MEDIUM, severity: Severity.MEDIUM, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.MANUAL, reviewStatus: ReviewStatus.READY, platformPortal: PlatformPortal.WEB_PORTAL, tags: ['auth', 'security', 'negative'], createdById: tester.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Click an expired reset link', expectedResult: '"Link has expired" error page shown with option to request a new link' }]) } } });
  const tc008 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sPassword.id, caseId: 'TC-008', title: 'Change password from My Account', scenario: 'Password Management', description: 'Logged-in user can change password from profile settings', preconditions: 'User is authenticated', priority: Priority.MEDIUM, severity: Severity.MEDIUM, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.MANUAL, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.WEB_PORTAL, tags: ['auth', 'profile'], createdById: tester.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Go to My Account → Security', expectedResult: 'Change password form displayed' }, { action: 'Enter current password and new password', expectedResult: 'Fields validated' }, { action: 'Submit', expectedResult: 'Password updated; session invalidated on other devices' }]) } } });

  // Search & Filtering (4 cases)
  const tc009 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sSearch.id, caseId: 'TC-009', title: 'Keyword search returns relevant products', scenario: 'Product Discovery', description: 'Search bar returns products matching keyword in title or description', preconditions: 'Product catalog has at least 20 items', priority: Priority.HIGH, severity: Severity.HIGH, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.AUTOMATED, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.WEB_PORTAL, tags: ['search', 'catalog', 'smoke'], createdById: tester.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Type "wireless headphones" in the global search bar', expectedResult: 'Dropdown suggestions appear within 300 ms' }, { action: 'Press Enter', expectedResult: 'Results page shows ≥5 products with "wireless headphones" in name/description' }, { action: 'Verify sort default is "Relevance"', expectedResult: 'Most relevant products shown first' }]) } } });
  const tc010 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sSearch.id, caseId: 'TC-010', title: 'Filter products by category', scenario: 'Product Discovery', description: 'Category filter narrows results to selected category only', preconditions: 'Multiple product categories exist', priority: Priority.MEDIUM, severity: Severity.MEDIUM, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.MANUAL, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.WEB_PORTAL, tags: ['search', 'filter', 'catalog'], createdById: tester.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Open category sidebar, click "Electronics"', expectedResult: 'Filter applied; URL updates with category param' }, { action: 'Check all results', expectedResult: 'Every displayed product belongs to Electronics category' }]) } } });
  const tc011 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sSearch.id, caseId: 'TC-011', title: 'Filter products by price range', scenario: 'Product Discovery', description: 'Price range slider filters products within the specified min-max range', preconditions: 'Products with varying prices exist', priority: Priority.MEDIUM, severity: Severity.LOW, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.MANUAL, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.WEB_PORTAL, tags: ['search', 'filter', 'price'], createdById: tester2.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Drag price slider to $50–$200', expectedResult: 'Results update; all products priced between $50–$200' }]) } } });
  const tc012 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sSearch.id, caseId: 'TC-012', title: 'Search with no matching results shows empty state', scenario: 'Product Discovery', description: 'When search yields no results, a helpful empty state is shown', preconditions: 'None', priority: Priority.LOW, severity: Severity.LOW, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.MANUAL, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.WEB_PORTAL, tags: ['search', 'edge-case'], createdById: tester2.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Search for "xyznonexistentproduct9999"', expectedResult: '"No products found" message with suggested search terms' }]) } } });

  // Product Detail Page (3 cases)
  const tc013 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sPDP.id, caseId: 'TC-013', title: 'Product detail page displays all content', scenario: 'Product Discovery', description: 'PDP shows title, description, price, images, stock status and reviews', preconditions: 'Active product exists in catalog', priority: Priority.HIGH, severity: Severity.HIGH, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.AUTOMATED, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.WEB_PORTAL, tags: ['pdp', 'catalog', 'smoke'], createdById: admin.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Navigate to a product URL', expectedResult: 'Page loads within 2 seconds' }, { action: 'Inspect page sections', expectedResult: 'Title, price, images, description, stock badge, and review score all visible' }]) } } });
  const tc014 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sPDP.id, caseId: 'TC-014', title: 'Product image gallery — thumbnail navigation', scenario: 'Product Discovery', description: 'Clicking thumbnails updates main product image', preconditions: 'Product has at least 3 images', priority: Priority.MEDIUM, severity: Severity.LOW, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.MANUAL, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.WEB_PORTAL, tags: ['pdp', 'images'], createdById: tester2.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Click second thumbnail image', expectedResult: 'Main image changes to selected thumbnail without page reload' }]) } } });
  const tc015 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sPDP.id, caseId: 'TC-015', title: 'Customer reviews displayed and paginated', scenario: 'Product Discovery', description: 'Reviews section shows ratings and comments, paginated at 10 per page', preconditions: 'Product has ≥15 reviews', priority: Priority.LOW, severity: Severity.LOW, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.MANUAL, reviewStatus: ReviewStatus.READY, platformPortal: PlatformPortal.WEB_PORTAL, tags: ['pdp', 'reviews'], createdById: tester2.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Scroll to Reviews section', expectedResult: '10 reviews displayed with stars and text' }, { action: 'Click "Next page"', expectedResult: 'Next 10 reviews loaded; URL reflects page param' }]) } } });

  // Shopping Cart (5 cases)
  const tc016 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sCart.id, caseId: 'TC-016', title: 'Add in-stock product to cart', scenario: 'Cart Management', description: 'Verify product is added to cart and cart count increments', preconditions: 'User is logged in; product is in stock', priority: Priority.CRITICAL, severity: Severity.CRITICAL, testType: TestType.SMOKE, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.AUTOMATED, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.WEB_PORTAL, tags: ['cart', 'smoke', 'critical-path'], createdById: admin.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Click "Add to Cart" on PDP', expectedResult: 'Cart icon in header increments by 1; "Added to Cart" toast shown' }, { action: 'Open cart sidebar/page', expectedResult: 'Product listed with correct name, price, and quantity 1' }]) } } });
  const tc017 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sCart.id, caseId: 'TC-017', title: 'Remove item from cart', scenario: 'Cart Management', description: 'Item can be removed from cart; totals update correctly', preconditions: 'Cart has at least 1 item', priority: Priority.HIGH, severity: Severity.HIGH, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.AUTOMATED, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.WEB_PORTAL, tags: ['cart'], createdById: tester.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Click trash icon next to item in cart', expectedResult: 'Item removed; cart total updated; empty-cart message if last item' }]) } } });
  const tc018 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sCart.id, caseId: 'TC-018', title: 'Update item quantity in cart', scenario: 'Cart Management', description: 'Changing quantity spinner updates line-item subtotal and cart total', preconditions: 'Cart has at least 1 item', priority: Priority.HIGH, severity: Severity.MEDIUM, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.MANUAL, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.WEB_PORTAL, tags: ['cart', 'quantity'], createdById: tester.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Change quantity of item from 1 to 3', expectedResult: 'Line subtotal = price × 3; cart total updates accordingly' }]) } } });
  const tc019 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sCart.id, caseId: 'TC-019', title: 'Add product to wishlist', scenario: 'Cart Management', description: 'Heart icon saves product to user wishlist', preconditions: 'User is logged in', priority: Priority.LOW, severity: Severity.LOW, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.MANUAL, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.WEB_PORTAL, tags: ['wishlist'], createdById: tester2.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Click heart icon on product card', expectedResult: 'Icon turns solid red; product saved to /my-wishlist' }]) } } });
  const tc020 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sCart.id, caseId: 'TC-020', title: 'Cart persists after user logs out and back in', scenario: 'Cart Management', description: 'Cart contents are preserved server-side and restored on re-login', preconditions: 'User has items in cart', priority: Priority.MEDIUM, severity: Severity.MEDIUM, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.MANUAL, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.WEB_PORTAL, tags: ['cart', 'session'], createdById: tester.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Add 2 items to cart, log out', expectedResult: 'Logged out; cart cleared from UI' }, { action: 'Log back in', expectedResult: 'Cart restored with same 2 items' }]) } } });

  // Checkout & Payment (5 cases)
  const tc021 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sCheckout.id, caseId: 'TC-021', title: 'Complete checkout with credit card', scenario: 'Payment & Checkout', description: 'End-to-end checkout: address → shipping → payment → confirmation', preconditions: 'Cart has items; user has saved address', priority: Priority.CRITICAL, severity: Severity.CRITICAL, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.UAT, automationStatus: AutomationStatus.MANUAL, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.WEB_PORTAL, tags: ['checkout', 'payment', 'critical-path', 'smoke'], createdById: admin.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Click "Proceed to Checkout"', expectedResult: 'Checkout stepper opens at Address step' }, { action: 'Confirm shipping address, click Next', expectedResult: 'Shipping options displayed' }, { action: 'Select standard shipping, click Next', expectedResult: 'Payment form displayed' }, { action: 'Enter Visa 4111111111111111 expiry 12/26 CVV 123', expectedResult: 'Payment details validated' }, { action: 'Click "Place Order"', expectedResult: 'Order confirmation page shown with order ID; confirmation email sent' }]) } } });
  const tc022 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sCheckout.id, caseId: 'TC-022', title: 'Apply valid promo code at checkout', scenario: 'Payment & Checkout', description: 'Valid promo code reduces order total by the correct discount amount', preconditions: 'Active promo code "SAVE20" for 20% off exists', priority: Priority.HIGH, severity: Severity.HIGH, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.MANUAL, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.WEB_PORTAL, tags: ['checkout', 'promo'], createdById: tester.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Enter "SAVE20" in promo code field and click Apply', expectedResult: '"20% discount applied" message; order total reduced by 20%' }, { action: 'Complete payment', expectedResult: 'Invoice reflects discounted amount' }]) } } });
  const tc023 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sCheckout.id, caseId: 'TC-023', title: 'Guest checkout without account', scenario: 'Payment & Checkout', description: 'Non-registered users can complete purchase as guest', preconditions: 'User is not logged in', priority: Priority.MEDIUM, severity: Severity.MEDIUM, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.MANUAL, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.WEB_PORTAL, tags: ['checkout', 'guest'], createdById: tester2.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Proceed to checkout as guest, enter email', expectedResult: 'Guest checkout form displayed' }, { action: 'Complete address and payment', expectedResult: 'Order confirmed; confirmation email sent to guest email' }]) } } });
  const tc024 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sCheckout.id, caseId: 'TC-024', title: 'Payment declined for invalid card', scenario: 'Payment & Checkout', description: 'System handles declined payment gracefully without losing cart', preconditions: 'Cart has items', priority: Priority.HIGH, severity: Severity.HIGH, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.MANUAL, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.WEB_PORTAL, tags: ['checkout', 'payment', 'negative'], createdById: tester.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Enter declined card 4000000000000002', expectedResult: '"Payment declined — please use a different card" error; cart intact' }]) } } });
  const tc025 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sCheckout.id, caseId: 'TC-025', title: 'Address validation rejects incomplete address', scenario: 'Payment & Checkout', description: 'Missing required address fields prevent checkout progression', preconditions: 'User is on address step', priority: Priority.MEDIUM, severity: Severity.MEDIUM, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.MANUAL, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.WEB_PORTAL, tags: ['checkout', 'validation'], createdById: tester2.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Leave postal code blank and click Next', expectedResult: '"Postal code is required" inline error; user stays on address step' }]) } } });

  // Order Management (5 cases)
  const tc026 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sOrders.id, caseId: 'TC-026', title: 'Order history lists all past orders', scenario: 'Order Tracking', description: 'My Orders page shows all orders with status, date, and total', preconditions: 'User has at least 3 past orders', priority: Priority.HIGH, severity: Severity.MEDIUM, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.AUTOMATED, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.WEB_PORTAL, tags: ['orders', 'smoke'], createdById: tester.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Navigate to My Account → Orders', expectedResult: 'List of orders with order ID, date, total, and status badge' }]) } } });
  const tc027 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sOrders.id, caseId: 'TC-027', title: 'Order detail shows tracking information', scenario: 'Order Tracking', description: 'Order detail page shows shipping carrier, tracking number, and progress steps', preconditions: 'Order is in "Shipped" status', priority: Priority.HIGH, severity: Severity.MEDIUM, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.MANUAL, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.WEB_PORTAL, tags: ['orders', 'tracking'], createdById: tester.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Click on a shipped order', expectedResult: 'Tracking number and carrier shown; progress bar indicates "In Transit"' }]) } } });
  const tc028 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sOrders.id, caseId: 'TC-028', title: 'Cancel order within cancellation window', scenario: 'Order Tracking', description: 'Orders can be cancelled within 1 hour of placement', preconditions: 'Order placed less than 1 hour ago; status is "Processing"', priority: Priority.MEDIUM, severity: Severity.MEDIUM, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.MANUAL, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.WEB_PORTAL, tags: ['orders', 'cancellation'], createdById: tester2.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Click "Cancel Order" on order detail', expectedResult: 'Cancellation confirmation dialog shown' }, { action: 'Confirm cancellation', expectedResult: 'Order status changes to "Cancelled"; refund initiated within 24 h' }]) } } });
  const tc029 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sOrders.id, caseId: 'TC-029', title: 'Order confirmation email received', scenario: 'Order Tracking', description: 'Email with order summary is sent to customer email within 5 minutes', preconditions: 'Order placed successfully', priority: Priority.HIGH, severity: Severity.HIGH, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.UAT, automationStatus: AutomationStatus.MANUAL, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.WEB_PORTAL, tags: ['orders', 'email'], createdById: tester.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Complete a purchase', expectedResult: 'Confirmation page shown with order ID' }, { action: 'Check email inbox within 5 minutes', expectedResult: 'Email contains order ID, itemized list, total, and estimated delivery date' }]) } } });
  const tc030 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sOrders.id, caseId: 'TC-030', title: 'Submit return/refund request', scenario: 'Order Tracking', description: 'Customer can request a return for delivered orders within 30 days', preconditions: 'Order status is "Delivered"; within return window', priority: Priority.MEDIUM, severity: Severity.MEDIUM, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.MANUAL, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.WEB_PORTAL, tags: ['orders', 'returns'], createdById: tester2.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Click "Return Item" on order detail', expectedResult: 'Return reason form displayed' }, { action: 'Select reason and submit', expectedResult: 'Return request submitted; return shipping label emailed' }]) } } });

  // Admin Panel (5 cases)
  const tc031 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sAdmin.id, caseId: 'TC-031', title: 'Admin adds a new product', scenario: 'Platform Administration', description: 'Admin can create a new product with all attributes from back-office', preconditions: 'Admin is logged in to admin portal', priority: Priority.HIGH, severity: Severity.HIGH, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.MANUAL, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.ADMIN_PORTAL, tags: ['admin', 'product-management'], createdById: manager.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Navigate to Admin → Products → New Product', expectedResult: 'Product creation form displayed' }, { action: 'Fill in name, price, stock, category, images and save', expectedResult: 'Product published; visible on storefront search' }]) } } });
  const tc032 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sAdmin.id, caseId: 'TC-032', title: 'Admin edits product price', scenario: 'Platform Administration', description: 'Price change reflects immediately on storefront', preconditions: 'Product exists in catalog', priority: Priority.HIGH, severity: Severity.HIGH, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.MANUAL, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.ADMIN_PORTAL, tags: ['admin', 'product-management'], createdById: manager.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Edit product and change price from $99 to $79', expectedResult: 'Save succeeds; storefront shows $79 within cache TTL (≤30 s)' }]) } } });
  const tc033 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sAdmin.id, caseId: 'TC-033', title: 'Admin deletes product not in active orders', scenario: 'Platform Administration', description: 'Products with no active orders can be permanently deleted', preconditions: 'Product exists with no active orders', priority: Priority.MEDIUM, severity: Severity.MEDIUM, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.MANUAL, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.ADMIN_PORTAL, tags: ['admin', 'product-management'], createdById: manager.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Click delete on a product with 0 active orders', expectedResult: 'Confirmation dialog shown' }, { action: 'Confirm deletion', expectedResult: 'Product removed from catalog and admin list' }]) } } });
  const tc034 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sAdmin.id, caseId: 'TC-034', title: 'Admin deactivates a user account', scenario: 'Platform Administration', description: 'Deactivated users cannot log in; ongoing sessions are terminated', preconditions: 'Target user account is active', priority: Priority.HIGH, severity: Severity.HIGH, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.MANUAL, reviewStatus: ReviewStatus.APPROVED, platformPortal: PlatformPortal.ADMIN_PORTAL, tags: ['admin', 'user-management', 'security'], createdById: manager.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Admin toggles user to Inactive in Users list', expectedResult: 'User status updated to Inactive' }, { action: 'Attempt login as that user', expectedResult: '"Account deactivated" message; login rejected' }]) } } });
  const tc035 = await prisma.testCase.create({ data: { projectId: project.id, suiteId: sAdmin.id, caseId: 'TC-035', title: 'Admin exports sales report as CSV', scenario: 'Platform Administration', description: 'Sales report CSV includes all orders in selected date range', preconditions: 'Orders exist in the selected period', priority: Priority.MEDIUM, severity: Severity.LOW, testType: TestType.FUNCTIONAL, testEnvironment: TestEnvironment.STAGING, automationStatus: AutomationStatus.MANUAL, reviewStatus: ReviewStatus.READY, platformPortal: PlatformPortal.ADMIN_PORTAL, tags: ['admin', 'reports', 'export'], createdById: manager.id, status: CaseStatus.ACTIVE, steps: { create: mkSteps([{ action: 'Set date range "last 30 days", click Export CSV', expectedResult: 'CSV downloads with columns: Order ID, Date, Customer, Items, Total, Status' }]) } } });

  console.log('✅  Test cases ready (TC-001 → TC-035)');

  // ── Requirements ───────────────────────────────────────────────────────────
  const req1  = await prisma.requirement.create({ data: { projectId: project.id, reqId: 'REQ-001', title: 'User Authentication System', description: 'The platform must provide secure login, registration, and session management for all user roles', externalId: 'JIRA-101', priority: Priority.CRITICAL } });
  const req2  = await prisma.requirement.create({ data: { projectId: project.id, reqId: 'REQ-002', title: 'Password Management', description: 'Users must be able to reset forgotten passwords and change passwords while logged in', externalId: 'JIRA-102', priority: Priority.HIGH } });
  const req3  = await prisma.requirement.create({ data: { projectId: project.id, reqId: 'REQ-003', title: 'Product Search & Discovery', description: 'Customers can search by keyword and filter by category, price, rating, and availability', externalId: 'JIRA-103', priority: Priority.HIGH } });
  const req4  = await prisma.requirement.create({ data: { projectId: project.id, reqId: 'REQ-004', title: 'Product Catalog Display', description: 'Product detail pages must show all attributes including images, price, stock, and reviews', externalId: 'JIRA-104', priority: Priority.HIGH } });
  const req5  = await prisma.requirement.create({ data: { projectId: project.id, reqId: 'REQ-005', title: 'Shopping Cart Functionality', description: 'Cart must support add, remove, quantity update, and server-side persistence across sessions', externalId: 'JIRA-105', priority: Priority.CRITICAL } });
  const req6  = await prisma.requirement.create({ data: { projectId: project.id, reqId: 'REQ-006', title: 'Checkout & Payment Processing', description: 'Checkout flow must support credit cards, promo codes, guest checkout, and graceful payment error handling', externalId: 'JIRA-106', priority: Priority.CRITICAL } });
  const req7  = await prisma.requirement.create({ data: { projectId: project.id, reqId: 'REQ-007', title: 'Order Management', description: 'Customers must see order history, tracking info, and be able to cancel or return orders', externalId: 'JIRA-107', priority: Priority.HIGH } });
  const req8  = await prisma.requirement.create({ data: { projectId: project.id, reqId: 'REQ-008', title: 'Transactional Email Notifications', description: 'System must send confirmation emails on registration, order placement, shipping, and password reset', externalId: 'JIRA-108', priority: Priority.HIGH } });
  const req9  = await prisma.requirement.create({ data: { projectId: project.id, reqId: 'REQ-009', title: 'Admin Product Management', description: 'Admins must be able to create, edit, and remove products from the back-office portal', externalId: 'JIRA-109', priority: Priority.MEDIUM } });
  const req10 = await prisma.requirement.create({ data: { projectId: project.id, reqId: 'REQ-010', title: 'Admin Reporting & Analytics', description: 'Admin portal must provide sales reports exportable as CSV and Excel', externalId: 'JIRA-110', priority: Priority.LOW } });

  // Link requirements to test cases
  const links = [
    [req1.id, [tc001, tc002, tc003, tc004, tc005]],
    [req2.id, [tc006, tc007, tc008]],
    [req3.id, [tc009, tc010, tc011, tc012]],
    [req4.id, [tc013, tc014, tc015]],
    [req5.id, [tc016, tc017, tc018, tc019, tc020]],
    [req6.id, [tc021, tc022, tc023, tc024, tc025]],
    [req7.id, [tc026, tc027, tc028, tc029, tc030]],
    [req8.id, [tc004, tc029]],
    [req9.id, [tc031, tc032, tc033, tc034]],
    [req10.id, [tc035]],
  ] as [string, typeof tc001[]][];

  for (const [reqId, tcs] of links) {
    await prisma.requirementTestCase.createMany({
      data: tcs.map((t) => ({ requirementId: reqId, testCaseId: t.id })),
      skipDuplicates: true,
    });
  }
  console.log('✅  Requirements ready');

  // ── Test Plans ─────────────────────────────────────────────────────────────
  const plan1 = await prisma.testPlan.create({
    data: {
      projectId: project.id,
      name: 'Sprint 3 — Auth & Catalog',
      sprint: 'Sprint 3',
      version: 'v1.2.0',
      description: 'Covers all authentication and product catalog test cases for Sprint 3 release',
      targetDate: daysAgo(7),
      status: PlanStatus.COMPLETED,
      createdById: manager.id,
      assignees: { create: [{ userId: tester.id }, { userId: manager.id }] },
    },
  });
  const plan2 = await prisma.testPlan.create({
    data: {
      projectId: project.id,
      name: 'Sprint 4 — Cart, Checkout & Orders',
      sprint: 'Sprint 4',
      version: 'v1.3.0',
      description: 'Full regression for cart, checkout, payment and order management features',
      targetDate: daysAgo(-7),
      status: PlanStatus.ACTIVE,
      createdById: manager.id,
      assignees: { create: [{ userId: tester.id }, { userId: tester2.id }, { userId: manager.id }] },
    },
  });
  console.log('✅  Test plans ready');

  // ── Test Runs & Results ────────────────────────────────────────────────────
  // Helper: create a run with results
  const createRun = async (
    name: string,
    status: RunStatus,
    sprint: string,
    version: string,
    planId: string | null,
    startedAt: Date,
    completedAt: Date | null,
    caseResultPairs: { tc: typeof tc001; status: ResultStatus; assigneeId: string; notes?: string }[],
  ) => {
    const run = await prisma.testRun.create({
      data: {
        projectId: project.id,
        name,
        sprint,
        version,
        status,
        planId: planId ?? undefined,
        createdById: manager.id,
        startedAt,
        completedAt: completedAt ?? undefined,
        createdAt: startedAt,
      },
    });
    await prisma.testResult.createMany({
      data: caseResultPairs.map((p) => ({
        runId: run.id,
        testCaseId: p.tc.id,
        assigneeId: p.assigneeId,
        status: p.status,
        notes: p.notes ?? null,
        executedAt: completedAt ?? undefined,
        duration: p.status !== ResultStatus.PENDING ? Math.floor(Math.random() * 120) + 30 : null,
      })),
    });
    return run;
  };

  const run1 = await createRun(
    'Sprint 3 — Smoke Test', RunStatus.COMPLETED, 'Sprint 3', 'v1.2.0', plan1.id,
    daysAgo(21), daysAgo(20),
    [
      { tc: tc001, status: ResultStatus.PASS, assigneeId: tester.id },
      { tc: tc002, status: ResultStatus.PASS, assigneeId: tester.id },
      { tc: tc003, status: ResultStatus.BLOCKED, assigneeId: tester.id, notes: 'Email service down in staging env' },
      { tc: tc004, status: ResultStatus.PASS, assigneeId: tester2.id },
      { tc: tc005, status: ResultStatus.PASS, assigneeId: tester2.id },
      { tc: tc006, status: ResultStatus.FAIL, assigneeId: tester.id, notes: 'Reset email not delivered — SMTP config issue' },
      { tc: tc009, status: ResultStatus.PASS, assigneeId: tester2.id },
      { tc: tc010, status: ResultStatus.PASS, assigneeId: tester2.id },
      { tc: tc013, status: ResultStatus.PASS, assigneeId: tester.id },
      { tc: tc016, status: ResultStatus.PASS, assigneeId: tester.id },
    ],
  );

  const run2 = await createRun(
    'Sprint 3 — Full Regression', RunStatus.COMPLETED, 'Sprint 3', 'v1.2.0', plan1.id,
    daysAgo(14), daysAgo(12),
    [
      { tc: tc001, status: ResultStatus.PASS, assigneeId: tester.id },
      { tc: tc002, status: ResultStatus.PASS, assigneeId: tester.id },
      { tc: tc003, status: ResultStatus.PASS, assigneeId: tester.id },
      { tc: tc004, status: ResultStatus.PASS, assigneeId: tester2.id },
      { tc: tc005, status: ResultStatus.PASS, assigneeId: tester2.id },
      { tc: tc006, status: ResultStatus.PASS, assigneeId: tester.id, notes: 'Fixed in v1.2.0-rc2; reset email now delivered' },
      { tc: tc007, status: ResultStatus.PASS, assigneeId: tester.id },
      { tc: tc008, status: ResultStatus.FAIL, assigneeId: tester2.id, notes: 'Session not invalidated on other devices after password change' },
      { tc: tc009, status: ResultStatus.PASS, assigneeId: tester.id },
      { tc: tc010, status: ResultStatus.PASS, assigneeId: tester.id },
      { tc: tc011, status: ResultStatus.PASS, assigneeId: tester2.id },
      { tc: tc012, status: ResultStatus.PASS, assigneeId: tester2.id },
      { tc: tc013, status: ResultStatus.PASS, assigneeId: tester.id },
      { tc: tc014, status: ResultStatus.PASS, assigneeId: tester.id },
      { tc: tc015, status: ResultStatus.BLOCKED, assigneeId: tester2.id, notes: 'Review section not available on staging — feature flag disabled' },
      { tc: tc016, status: ResultStatus.PASS, assigneeId: tester.id },
      { tc: tc017, status: ResultStatus.PASS, assigneeId: tester.id },
      { tc: tc018, status: ResultStatus.FAIL, assigneeId: tester2.id, notes: 'Quantity spinner shows -1 when decremented below 1' },
      { tc: tc019, status: ResultStatus.PASS, assigneeId: tester2.id },
      { tc: tc020, status: ResultStatus.FAIL, assigneeId: tester.id, notes: 'Cart cleared on re-login — server-side cart not merged with guest cart' },
    ],
  );

  const run3 = await createRun(
    'Sprint 4 — Smoke Test', RunStatus.COMPLETED, 'Sprint 4', 'v1.3.0', plan2.id,
    daysAgo(7), daysAgo(7),
    [
      { tc: tc016, status: ResultStatus.PASS, assigneeId: tester.id },
      { tc: tc017, status: ResultStatus.PASS, assigneeId: tester.id },
      { tc: tc018, status: ResultStatus.PASS, assigneeId: tester.id },
      { tc: tc021, status: ResultStatus.FAIL, assigneeId: tester.id, notes: 'Payment gateway returns 504 timeout on staging — no error shown to user' },
      { tc: tc022, status: ResultStatus.BLOCKED, assigneeId: tester2.id, notes: 'Promo code endpoint returns 500 — back-end issue' },
      { tc: tc026, status: ResultStatus.PASS, assigneeId: tester2.id },
      { tc: tc029, status: ResultStatus.FAIL, assigneeId: tester.id, notes: 'Confirmation email not received within 5 min window' },
    ],
  );

  // Run 4 — In Progress (Sprint 4 full regression)
  const run4 = await prisma.testRun.create({
    data: {
      projectId: project.id,
      name: 'Sprint 4 — Full Regression',
      sprint: 'Sprint 4',
      version: 'v1.3.0',
      status: RunStatus.IN_PROGRESS,
      planId: plan2.id,
      createdById: manager.id,
      startedAt: daysAgo(2),
      createdAt: daysAgo(2),
    },
  });
  await prisma.testResult.createMany({
    data: [
      { runId: run4.id, testCaseId: tc016.id, assigneeId: tester.id,  status: ResultStatus.PASS, executedAt: daysAgo(1), duration: 45 },
      { runId: run4.id, testCaseId: tc017.id, assigneeId: tester.id,  status: ResultStatus.PASS, executedAt: daysAgo(1), duration: 38 },
      { runId: run4.id, testCaseId: tc018.id, assigneeId: tester.id,  status: ResultStatus.PASS, executedAt: daysAgo(1), duration: 52 },
      { runId: run4.id, testCaseId: tc019.id, assigneeId: tester2.id, status: ResultStatus.PASS, executedAt: daysAgo(1), duration: 30 },
      { runId: run4.id, testCaseId: tc020.id, assigneeId: tester2.id, status: ResultStatus.PASS, executedAt: daysAgo(1), duration: 90 },
      { runId: run4.id, testCaseId: tc021.id, assigneeId: tester.id,  status: ResultStatus.PASS, executedAt: daysAgo(1), duration: 180, notes: 'Payment gateway issue resolved in v1.3.0-rc3' },
      { runId: run4.id, testCaseId: tc022.id, assigneeId: tester2.id, status: ResultStatus.FAIL, executedAt: daysAgo(1), duration: 60, notes: 'Promo SAVE20 applies 10% instead of 20% — calculation bug' },
      { runId: run4.id, testCaseId: tc023.id, assigneeId: tester.id,  status: ResultStatus.PASS, executedAt: daysAgo(1), duration: 150 },
      { runId: run4.id, testCaseId: tc024.id, assigneeId: tester.id,  status: ResultStatus.PASS, executedAt: daysAgo(1), duration: 75 },
      { runId: run4.id, testCaseId: tc025.id, assigneeId: tester2.id, status: ResultStatus.PASS, executedAt: daysAgo(1), duration: 40 },
      { runId: run4.id, testCaseId: tc026.id, assigneeId: tester2.id, status: ResultStatus.PASS, executedAt: daysAgo(1), duration: 35 },
      { runId: run4.id, testCaseId: tc027.id, assigneeId: tester.id,  status: ResultStatus.PENDING },
      { runId: run4.id, testCaseId: tc028.id, assigneeId: tester.id,  status: ResultStatus.PENDING },
      { runId: run4.id, testCaseId: tc029.id, assigneeId: tester2.id, status: ResultStatus.FAIL, executedAt: daysAgo(1), duration: 300, notes: 'Email delivered after 12 min — exceeds 5 min SLA' },
      { runId: run4.id, testCaseId: tc030.id, assigneeId: tester2.id, status: ResultStatus.PENDING },
    ],
  });
  console.log('✅  Test runs & results ready');

  // Fetch some result IDs for defect linking
  const res3_tc021 = await prisma.testResult.findFirst({ where: { runId: run3.id, testCaseId: tc021.id } });
  const res4_tc022 = await prisma.testResult.findFirst({ where: { runId: run4.id, testCaseId: tc022.id } });
  const res4_tc029 = await prisma.testResult.findFirst({ where: { runId: run4.id, testCaseId: tc029.id } });

  // ── Defects ────────────────────────────────────────────────────────────────
  const def1 = await prisma.defect.create({ data: { projectId: project.id, defectId: 'BUG-001', title: 'Login fails when password contains special characters (#, $, &)', module: 'Authentication', description: 'Passwords with #, $ or & cause a 400 error on the login API due to unescaped query param', stepsToReproduce: '1. Register with password "P@ss#word$1"\n2. Attempt login\n3. Observe 400 error in console', expectedResult: 'Login succeeds with any valid special-character password', actualResult: 'API returns 400 Bad Request; "Unexpected token" in response', severity: Severity.HIGH, priority: Priority.HIGH, status: DefectStatus.FIXED, testCaseId: tc002.id, assignedToId: developer.id, verifiedById: tester.id, bugPattern: 'Input sanitization', createdById: tester.id, createdAt: daysAgo(25), fixedAt: daysAgo(18), verifiedAt: daysAgo(16) } });
  const def2 = await prisma.defect.create({ data: { projectId: project.id, defectId: 'BUG-002', title: 'Promo code SAVE20 applies 10% discount instead of 20%', module: 'Checkout', description: 'When applying promo code SAVE20, the discount computation divides by 10 instead of 5, resulting in half the expected discount', stepsToReproduce: '1. Add any item to cart\n2. Proceed to checkout\n3. Enter promo code SAVE20\n4. Observe order total', expectedResult: 'Order total reduced by exactly 20%', actualResult: 'Order total reduced by only 10% — discount calculation bug in PromoService.calculateDiscount()', severity: Severity.HIGH, priority: Priority.CRITICAL, status: DefectStatus.OPEN, testCaseId: tc022.id, testResultId: res4_tc022?.id, assignedToId: developer.id, bugPattern: 'Business logic error', createdById: tester2.id, createdAt: daysAgo(1) } });
  const def3 = await prisma.defect.create({ data: { projectId: project.id, defectId: 'BUG-003', title: 'Payment gateway timeout shows blank screen instead of error message', module: 'Checkout', description: 'When Stripe gateway responds with 504, the checkout page becomes blank instead of showing a retry prompt', stepsToReproduce: '1. Set network to 3G throttle\n2. Proceed through checkout\n3. Click Place Order\n4. Wait for gateway timeout', expectedResult: '"Payment processing timed out — please try again" with retry button', actualResult: 'Blank white screen; browser console shows unhandled promise rejection', severity: Severity.CRITICAL, priority: Priority.CRITICAL, status: DefectStatus.IN_PROGRESS, testCaseId: tc021.id, testResultId: res3_tc021?.id, assignedToId: developer.id, bugPattern: 'Error handling', createdById: tester.id, createdAt: daysAgo(7) } });
  const def4 = await prisma.defect.create({ data: { projectId: project.id, defectId: 'BUG-004', title: 'Search results not sorted by relevance — alphabetical by default', module: 'Product Catalog', description: 'Search results default to alphabetical sort rather than relevance ranking, causing less relevant products to appear first', stepsToReproduce: '1. Search "bluetooth speaker"\n2. Note the result order', expectedResult: 'Results ranked by relevance score (Elasticsearch scoring)', actualResult: 'Results sorted A-Z by product title', severity: Severity.MEDIUM, priority: Priority.MEDIUM, status: DefectStatus.VERIFIED, testCaseId: tc009.id, assignedToId: developer.id, verifiedById: tester.id, createdById: tester.id, createdAt: daysAgo(20), fixedAt: daysAgo(10), verifiedAt: daysAgo(8) } });
  const def5 = await prisma.defect.create({ data: { projectId: project.id, defectId: 'BUG-005', title: 'Checkout page crashes on mobile Safari 16 when selecting shipping', module: 'Checkout', description: 'Tapping shipping option on iOS Safari 16 triggers "TypeError: undefined is not a function" and the page freezes', stepsToReproduce: '1. Add item to cart on iPhone 14 Safari 16\n2. Proceed to checkout\n3. Tap on Standard Shipping radio button', expectedResult: 'Shipping method selected; proceed to payment', actualResult: 'Page freezes; JavaScript error in console: TypeError shippingOption.price.toFixed is not a function', severity: Severity.CRITICAL, priority: Priority.HIGH, status: DefectStatus.RETEST, testCaseId: tc021.id, assignedToId: developer.id, bugPattern: 'Browser compatibility', createdById: tester2.id, createdAt: daysAgo(8) } });
  const def6 = await prisma.defect.create({ data: { projectId: project.id, defectId: 'BUG-006', title: 'Admin cannot delete product that has completed (closed) orders', module: 'Admin Panel', description: 'Delete endpoint returns 409 Conflict even when all associated orders are in CLOSED/DELIVERED status — business rule too restrictive', stepsToReproduce: '1. Login as admin\n2. Find a product with only DELIVERED orders\n3. Attempt to delete', expectedResult: 'Product deleted successfully (all orders are closed)', actualResult: '409 Conflict: "Cannot delete product with associated orders"', severity: Severity.MEDIUM, priority: Priority.MEDIUM, status: DefectStatus.OPEN, testCaseId: tc033.id, assignedToId: developer.id, bugPattern: 'Business logic error', createdById: manager.id, createdAt: daysAgo(5) } });
  const def7 = await prisma.defect.create({ data: { projectId: project.id, defectId: 'BUG-007', title: 'Order confirmation email not sent within 5-minute SLA', module: 'Order Management', description: 'Confirmation emails are queued in the background job but processing delay causes delivery after 10-15 minutes instead of ≤5 min', stepsToReproduce: '1. Place an order\n2. Monitor email inbox for 5 min', expectedResult: 'Confirmation email received within 5 minutes', actualResult: 'Email arrives after 10-15 minutes — background worker queue congestion', severity: Severity.HIGH, priority: Priority.HIGH, status: DefectStatus.IN_PROGRESS, testCaseId: tc029.id, testResultId: res4_tc029?.id, assignedToId: developer.id, bugPattern: 'Performance / queue', createdById: tester.id, createdAt: daysAgo(3) } });
  const def8 = await prisma.defect.create({ data: { projectId: project.id, defectId: 'BUG-008', title: 'Duplicate order created when user clicks Place Order and hits browser back', module: 'Checkout', description: 'Clicking Place Order and then pressing the browser back button and resubmitting creates two identical orders', stepsToReproduce: '1. Place an order\n2. On confirmation page, press browser back\n3. Re-click Place Order', expectedResult: 'Idempotency check prevents duplicate order creation', actualResult: 'Second order created with same items — no idempotency key implemented', severity: Severity.CRITICAL, priority: Priority.CRITICAL, status: DefectStatus.CLOSED, testCaseId: tc021.id, assignedToId: developer.id, verifiedById: manager.id, bugPattern: 'Idempotency', createdById: tester.id, createdAt: daysAgo(30), fixedAt: daysAgo(22), verifiedAt: daysAgo(20) } });

  // Defect comments
  await prisma.defectComment.createMany({
    data: [
      { defectId: def2.id, authorId: developer.id, content: 'Traced to PromoService.calculateDiscount() — divisor should be 5 not 10. Fix in progress on feature/promo-fix branch.' },
      { defectId: def2.id, authorId: manager.id,   content: 'This is a CRITICAL bug affecting revenue. Prioritise for hotfix in v1.3.1 before next sprint demo.' },
      { defectId: def2.id, authorId: tester2.id,   content: 'Confirmed on staging. 100% reproducible. All promo codes using percentage discounts are affected, not just SAVE20.' },
      { defectId: def3.id, authorId: developer.id, content: 'Payment service wrapper does not catch timeout errors. Adding global error boundary and retry logic.' },
      { defectId: def3.id, authorId: tester.id,    content: 'Also happens with PayPal gateway on slow connections. Not just Stripe.' },
      { defectId: def5.id, authorId: developer.id, content: 'Root cause: shipping option price from API is a string, not a number. toFixed() fails on strings in Safari. Adding Number() cast.' },
      { defectId: def5.id, authorId: tester2.id,   content: 'Fix deployed to staging. Retesting on physical iPhone 14 Pro Max Safari 16.6.' },
      { defectId: def7.id, authorId: developer.id, content: 'Identified bottleneck: email worker pool size is 2 threads during peak. Scaling to 8 and adding Redis priority queue.' },
    ],
  });
  console.log('✅  Defects & comments ready');

  // ── UAT Sessions ───────────────────────────────────────────────────────────
  const uat1 = await prisma.uatSession.create({
    data: {
      projectId: project.id, sessionId: 'UAT-001',
      name: 'Sprint 3 UAT — Auth & Catalog Sign-Off',
      version: 'v1.2.0',
      environmentUrl: 'https://uat.shopease.io',
      uatStartDate: daysAgo(15),
      uatEndDate: daysAgo(13),
      supportContact: 'Morgan Chen — manager@example.com',
      status: UatSessionStatus.SIGNED_OFF,
      createdById: manager.id,
      signOffById: manager.id,
      signOffNote: 'All critical and high-priority scenarios passed. Minor cosmetic issues logged as low-severity defects. Approved for production release.',
      signedOffAt: daysAgo(13),
    },
  });

  await prisma.uatResult.createMany({
    data: [
      { sessionId: uat1.id, testCaseId: tc001.id, testerId: tester.id,  status: UatResultStatus.PASS, actualResult: 'Login works as expected', executedAt: daysAgo(15) },
      { sessionId: uat1.id, testCaseId: tc002.id, testerId: tester.id,  status: UatResultStatus.PASS, actualResult: 'Invalid credentials correctly rejected', executedAt: daysAgo(15) },
      { sessionId: uat1.id, testCaseId: tc004.id, testerId: tester2.id, status: UatResultStatus.PASS, actualResult: 'Registration completes; verification email received', executedAt: daysAgo(15) },
      { sessionId: uat1.id, testCaseId: tc006.id, testerId: tester.id,  status: UatResultStatus.PASS, actualResult: 'Password reset flow works end-to-end', executedAt: daysAgo(14) },
      { sessionId: uat1.id, testCaseId: tc009.id, testerId: tester2.id, status: UatResultStatus.PASS, actualResult: 'Search returns relevant results', executedAt: daysAgo(14) },
      { sessionId: uat1.id, testCaseId: tc010.id, testerId: tester2.id, status: UatResultStatus.PASS, actualResult: 'Category filter works correctly', executedAt: daysAgo(14) },
      { sessionId: uat1.id, testCaseId: tc013.id, testerId: tester.id,  status: UatResultStatus.PASS, actualResult: 'PDP loads all content within 2 seconds', executedAt: daysAgo(13) },
      { sessionId: uat1.id, testCaseId: tc016.id, testerId: tester.id,  status: UatResultStatus.PASS, actualResult: 'Add to cart works; counter increments', executedAt: daysAgo(13) },
      { sessionId: uat1.id, testCaseId: tc015.id, testerId: tester2.id, status: UatResultStatus.FAIL, actualResult: 'Reviews pagination not working — jumps to page 1 when clicking page 2', comments: 'Minor UX issue; does not block release', executedAt: daysAgo(13) },
    ],
  });

  const uat2 = await prisma.uatSession.create({
    data: {
      projectId: project.id, sessionId: 'UAT-002',
      name: 'Sprint 4 UAT — Cart & Checkout',
      version: 'v1.3.0',
      environmentUrl: 'https://uat.shopease.io',
      uatStartDate: daysAgo(2),
      uatEndDate: daysAgo(-3),
      supportContact: 'Morgan Chen — manager@example.com',
      status: UatSessionStatus.IN_PROGRESS,
      createdById: manager.id,
    },
  });

  await prisma.uatResult.createMany({
    data: [
      { sessionId: uat2.id, testCaseId: tc016.id, testerId: tester.id,  status: UatResultStatus.PASS, actualResult: 'Add to cart works perfectly', executedAt: daysAgo(2) },
      { sessionId: uat2.id, testCaseId: tc017.id, testerId: tester.id,  status: UatResultStatus.PASS, actualResult: 'Remove from cart works', executedAt: daysAgo(2) },
      { sessionId: uat2.id, testCaseId: tc018.id, testerId: tester2.id, status: UatResultStatus.PASS, actualResult: 'Quantity update and total recalculation correct', executedAt: daysAgo(2) },
      { sessionId: uat2.id, testCaseId: tc021.id, testerId: tester.id,  status: UatResultStatus.PASS, actualResult: 'Full checkout with Visa completed successfully', executedAt: daysAgo(1) },
      { sessionId: uat2.id, testCaseId: tc022.id, testerId: tester2.id, status: UatResultStatus.FAIL, actualResult: 'SAVE20 applied 10% not 20% — BUG-002 still not fixed', comments: 'BLOCKER — cannot proceed with payment testing until fixed', executedAt: daysAgo(1) },
      { sessionId: uat2.id, testCaseId: tc026.id, testerId: tester.id,  status: UatResultStatus.PASS, actualResult: 'Order history shows all orders correctly', executedAt: daysAgo(1) },
      { sessionId: uat2.id, testCaseId: tc029.id, testerId: tester2.id, status: UatResultStatus.PENDING },
      { sessionId: uat2.id, testCaseId: tc028.id, testerId: tester.id,  status: UatResultStatus.PENDING },
    ],
  });
  console.log('✅  UAT sessions ready');

  // ── Ad-hoc Cases ───────────────────────────────────────────────────────────
  await prisma.adhocCase.createMany({
    data: [
      { projectId: project.id, adhocId: 'ADHOC-001', requestDate: daysAgo(30), requestor: 'Product Owner', requestType: 'Compatibility', urgency: UrgencyFlag.HIGH, module: 'Authentication', issueDescription: 'Login page not rendering on Internet Explorer 11 — all input fields missing', impactAssessment: 'IE11 still used by ~3% of enterprise customers', testApproach: 'Cross-browser testing on IE11 with BrowserStack', testStepsPerformed: 'Opened login URL in IE11; observed blank form body', findings: 'Missing polyfill for CSS Grid; form inputs not rendered', status: AdhocStatus.RESOLVED, severity: Severity.MEDIUM, assignedQaId: tester.id, resolution: 'Added css-grid polyfill; IE11 now renders login form correctly', completionDate: daysAgo(25), createdById: tester.id },
      { projectId: project.id, adhocId: 'ADHOC-002', requestDate: daysAgo(10), requestor: 'DevOps Team', requestType: 'Infrastructure', urgency: UrgencyFlag.CRITICAL, module: 'Product Catalog', issueDescription: 'Product images broken across entire catalog after CDN migration to CloudFront', impactAssessment: 'All product pages show broken image icons — critical customer-facing impact', testApproach: 'Validate all image URLs return 200 after CDN migration', testStepsPerformed: 'Ran curl on 50 random image URLs; 100% returning 403 Forbidden', findings: 'CloudFront distribution missing bucket policy for public read', status: AdhocStatus.IN_PROGRESS, severity: Severity.CRITICAL, assignedQaId: tester2.id, assignedDeveloper: 'Jordan Dev', createdById: manager.id },
      { projectId: project.id, adhocId: 'ADHOC-003', requestDate: daysAgo(6), requestor: 'Security Team', requestType: 'Security', urgency: UrgencyFlag.HIGH, module: 'Checkout', issueDescription: 'Promo code input field accepts negative values (-100%) — potential for credit injection', impactAssessment: 'Attacker could apply negative promo to receive store credit', testApproach: 'Input boundary testing on promo code field', testStepsPerformed: 'Entered -100, -999 in promo field; submitted checkout', findings: 'No server-side validation on discount sign; negative values accepted', status: AdhocStatus.OPEN, severity: Severity.HIGH, assignedQaId: tester.id, relatedBugId: 'BUG-002', createdById: tester.id },
      { projectId: project.id, adhocId: 'ADHOC-004', requestDate: daysAgo(4), requestor: 'Customer Support', requestType: 'Localisation', urgency: UrgencyFlag.NORMAL, module: 'Shopping Cart', issueDescription: 'International users (Thailand, EU) report cart showing USD prices instead of local currency', impactAssessment: 'Confusing for ~15% of user base; potential drop in conversion', testApproach: 'Test with VPN set to various regions; inspect currency display', testStepsPerformed: 'Set browser locale to th-TH; added items to cart', findings: 'Cart page does not respect Accept-Language header; hardcoded USD', status: AdhocStatus.ESCALATED, severity: Severity.MEDIUM, assignedQaId: tester2.id, createdById: tester2.id },
      { projectId: project.id, adhocId: 'ADHOC-005', requestDate: daysAgo(2), requestor: 'Finance Team', requestType: 'Performance', urgency: UrgencyFlag.NORMAL, module: 'Admin Panel', issueDescription: 'Admin sales report export hangs indefinitely when date range includes >1000 orders', impactAssessment: 'Monthly reporting blocked; finance team cannot extract data', testApproach: 'Generate report with 1000+ orders in range; measure response time', testStepsPerformed: 'Set range Jan 1 – Jun 30; clicked Export CSV; waited 5 min', findings: 'Request times out at 30 s; no pagination/streaming implemented for CSV export', status: AdhocStatus.OPEN, severity: Severity.HIGH, assignedQaId: tester.id, relatedTcId: 'TC-035', createdById: manager.id },
    ],
  });
  console.log('✅  Ad-hoc cases ready');

  // ── Daily Checklist Items & Sessions ──────────────────────────────────────
  const items = await prisma.$transaction([
    prisma.checklistItem.create({ data: { projectId: project.id, title: 'Verify staging environment is up and accessible', order: 1 } }),
    prisma.checklistItem.create({ data: { projectId: project.id, title: 'Run smoke test suite (TC-001, TC-004, TC-009, TC-016, TC-021)', order: 2 } }),
    prisma.checklistItem.create({ data: { projectId: project.id, title: 'Check error logs in Datadog for new CRITICAL/ERROR entries', order: 3 } }),
    prisma.checklistItem.create({ data: { projectId: project.id, title: 'Validate payment gateway connectivity (Stripe ping)', order: 4 } }),
    prisma.checklistItem.create({ data: { projectId: project.id, title: 'Confirm CDN is serving latest assets (cache-busted URLs)', order: 5 } }),
    prisma.checklistItem.create({ data: { projectId: project.id, title: 'Review open defect list — confirm no new CRITICAL defects', order: 6 } }),
    prisma.checklistItem.create({ data: { projectId: project.id, title: 'Check email service delivery rate (>99% threshold)', order: 7 } }),
    prisma.checklistItem.create({ data: { projectId: project.id, title: 'Verify database backup ran successfully overnight', order: 8 } }),
    prisma.checklistItem.create({ data: { projectId: project.id, title: 'Test OTP / 2FA login path on mobile', order: 9 } }),
    prisma.checklistItem.create({ data: { projectId: project.id, title: 'Review pending UAT items and update status', order: 10 } }),
  ]);

  // Session 2 days ago — all done
  const sess1 = await prisma.checklistSession.create({ data: { projectId: project.id, date: utcDateOnly(2), createdById: tester.id } });
  await prisma.checklistEntry.createMany({
    data: items.map((item, i) => ({
      sessionId: sess1.id, itemId: item.id,
      status: i < 8 ? ChecklistEntryStatus.DONE : ChecklistEntryStatus.SKIPPED,
      completedById: tester.id,
      completedAt: daysAgo(2),
      notes: i === 2 ? '2 new ERROR entries found — both related to BUG-007 email queue' : i === 7 ? '2FA not testable today — TOTP service license expired on staging' : null,
    })),
  });

  // Session yesterday — mostly done with one blocked
  const sess2 = await prisma.checklistSession.create({ data: { projectId: project.id, date: utcDateOnly(1), createdById: tester2.id } });
  await prisma.checklistEntry.createMany({
    data: items.map((item, i) => ({
      sessionId: sess2.id, itemId: item.id,
      status: i === 3 ? ChecklistEntryStatus.BLOCKED : ChecklistEntryStatus.DONE,
      completedById: i === 3 ? null : tester2.id,
      completedAt: i === 3 ? null : daysAgo(1),
      notes: i === 3 ? 'Stripe staging dashboard showing degraded status — cannot confirm connectivity' : null,
    })),
  });

  // Session today — in progress (only first 5 done)
  const sess3 = await prisma.checklistSession.create({ data: { projectId: project.id, date: utcDateOnly(0), createdById: tester.id } });
  await prisma.checklistEntry.createMany({
    data: items.map((item, i) => ({
      sessionId: sess3.id, itemId: item.id,
      status: i < 5 ? ChecklistEntryStatus.DONE : ChecklistEntryStatus.PENDING,
      completedById: i < 5 ? tester.id : null,
      completedAt: i < 5 ? new Date() : null,
    })),
  });
  console.log('✅  Checklist items & sessions ready');

  console.log('\n🎉  Seed complete!');
  console.log('\n📋  Credentials:');
  console.log('  Admin:     admin@example.com    /  Admin@123456!');
  console.log('  Manager:   manager@example.com  /  Manager@123456!');
  console.log('  Tester:    tester@example.com   /  Tester@123456!');
  console.log('  Tester 2:  tester2@example.com  /  Tester@123456!');
  console.log('  Developer: developer@example.com /  Developer@123456!');
  console.log('\n📊  Data summary:');
  console.log('  10 test suites (6 parent + 4 child)');
  console.log('  35 test cases across all suites');
  console.log('  10 requirements linked to test cases');
  console.log('  2 test plans (1 completed, 1 active)');
  console.log('  4 test runs (3 completed, 1 in-progress)');
  console.log('  8 defects with comments');
  console.log('  2 UAT sessions (1 signed-off, 1 in-progress)');
  console.log('  5 ad-hoc cases');
  console.log('  10 checklist items + 3 daily sessions');
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
