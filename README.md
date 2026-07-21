# ShopX POS

A multi-tenant Point-of-Sale system built with Next.js and Oracle Database. Supports multiple shops with role-based access (super admin, shop admin, cashier).

## Features

- **POS Terminal** -- Product search/grid, cart management, barcode input, cash/card/mobile payments, receipt generation (HTML + PDF)
- **Dashboard** -- KPI cards (revenue, orders, products, customers), daily sales bar chart, payment method distribution pie chart
- **Product Management** -- CRUD for products (PLU), category assignment, stock tracking, barcode-based identification
- **Customer Management** -- CRUD for VIP customers with loyalty points tracking
- **Sales History** -- Searchable sales log with receipt download, detailed sale modal
- **Multi-Tenant Shops** -- Super admin creates/manages shops; each shop has its own products, customers, sales, and staff
- **Staff Management** -- Shop admins can create/manage cashiers under their shop
- **Authentication** -- Custom JWT-based auth with bcrypt password hashing, email verification, password reset (via SMTP)
- **Two-Factor Authentication** -- TOTP-based 2FA (Speakeasy/Google Authenticator)
- **Role-Based Access Control** -- Three roles: `super_admin` (system-wide), `shop_admin` (per-shop), `cashier` (limited POS access)
- **Receipt Printing** -- Generates printable receipts with store info, items, totals, and barcode

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Oracle 19c+ (via TypeORM) |
| ORM | TypeORM 1.x |
| Auth | JWT (jsonwebtoken), bcrypt, Speakeasy (2FA) |
| Charts | Recharts |
| PDF | jsPDF + html2canvas |
| Email | Nodemailer (SMTP) |
| Icons | Lucide React |

## Architecture

### Roles & Permissions

| Feature | super_admin | shop_admin | cashier |
|---------|:-----------:|:----------:|:-------:|
| POS Terminal | read all shops | own shop | own shop |
| Dashboard | read all | own shop | -- |
| Products | CRUD all | CRUD own | -- |
| Customers | CRUD all | CRUD own | -- |
| Sales | view all | view own | -- |
| Staff (CRUD) | all shops | own shop | -- |
| Shops (CRUD) | all | -- | -- |
| Categories | CRUD | CRUD | -- |

### Database Tables

| Table | Purpose |
|-------|---------|
| `shops` | Multi-tenant shop records |
| `users` | Staff accounts (bcrypt passwords, 2FA, email verification) |
| `plu` | Products (Price Look Up) -- legacy structure |
| `department` | Product categories |
| `vip` | Customers/loyalty members |
| `sales` | POS transaction records |
| `cashier`, `clerk`, `condiment`, `customkeyboard`, `departmentgroup`, `discount`, `foodpackage`, `foreigncurrency`, `i18nparameter`, `paymenttype`, `plustockin`, `receiptheaderfooter`, `servicefee`, `systempassword`, `sytemparameter`, `"TABLE"`, `tax` | Legacy import tables |

### Key Relationships

- `plu.shop_id`, `vip.shop_id`, `sales.shop_id`, `users.shop_id`, `department.shop_id` -> `shops.id`
- `plu.department` -> `department.INDEX`
- `sales.customer_id` -> `vip.vip_card`
- `sales.cashier_id` -> `users.id`

## Getting Started

### Prerequisites

- Node.js 20+
- Oracle Database 19c+ (XEPDB1 recommended)
- Oracle Instant Client (for oracledb native bindings)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local .env.local
# Edit .env.local with your Oracle credentials

# 3. Import database schema
sqlplus sys@localhost:1521/XEPDB1 as sysdba @scripts/schema.sql
sqlplus shopx/shopx123@localhost:1521/XEPDB1 @data/program_xls/oracle_import_xepdb1.sql
sqlplus shopx/shopx123@localhost:1521/XEPDB1 @scripts/migration.sql

# 4. Seed super admin user
node scripts/seed.mjs

# 5. Start development server
npm run dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `ORACLE_USER` | Oracle database user |
| `ORACLE_PASSWORD` | Oracle database password |
| `ORACLE_CONNECT_STRING` | Oracle connection string |
| `JWT_SECRET` | Secret for JWT token signing |
| `NEXT_PUBLIC_APP_URL` | Public app URL (for email links) |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |

## Project Structure

```
src/
  app/
    page.tsx                          # Login/Register
    (dashboard)/
      layout.tsx                      # Auth guard + sidebar
      dashboard/page.tsx              # KPI dashboard
      pos/page.tsx                    # POS terminal
      sales/page.tsx                  # Sales history
      customers/{page,new,[id]}.tsx   # Customer CRUD
      products/{page,new,[id]}.tsx    # Product CRUD
    super-admin/
      page.tsx                        # Super admin dashboard
      shops/{page,new,[id]}.tsx       # Shop management
    forgot-password/page.tsx
    reset-password/page.tsx
    verify-email/page.tsx
    api/
      auth/     login, me, 2fa, email verification, password reset
      products/   GET, POST, PATCH, DELETE
      customers/  GET, POST, PATCH, DELETE
      categories/ GET, POST
      sales/      GET, POST
      shops/      GET, POST, PATCH, DELETE
      staff/      GET, POST, PATCH, DELETE
      stats/      GET
  components/
    Sidebar.tsx         # Role-based navigation
    KpiCard.tsx         # Dashboard metric card
    Receipt.tsx         # Printable receipt template
    CustomerForm.tsx    # Customer add/edit form
    ProductForm.tsx     # Product add/edit form
  contexts/
    AuthContext.tsx     # Auth state management
  lib/
    auth.ts             # JWT, bcrypt, 2FA helpers
    datasource.ts       # TypeORM DataSource singleton
    email.ts            # Nodemailer email sending
    types.ts            # Frontend interfaces
    utils.ts            # formatCurrency, formatDate, generateReceiptNumber
    entities/           # TypeORM entity classes
      Shop.ts, User.ts, Plu.ts, Department.ts, Vip.ts, Sale.ts
scripts/
  schema.sql            # Sales table + sequence
  migration.sql         # Multi-tenant migration
  seed.mjs              # Super admin seed script
data/program_xls/       # Legacy data import files
```

## API Overview

All API routes require `Authorization: Bearer <token>` header. Authentication uses custom JWT tokens (not Firebase).

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Public | Login with email + password |
| POST | `/api/auth/verify-2fa` | Public | Verify 2FA code |
| GET | `/api/auth/me` | All | Current user profile |
| POST | `/api/auth/verify-email` | Public | Verify email token |
| POST | `/api/auth/reset-password` | Public | Send/reset password |
| POST | `/api/auth/setup-2fa` | All | Setup or enable 2FA |
| GET | `/api/products` | All | List products |
| POST | `/api/products` | All | Create product |
| GET | `/api/products/[id]` | All | Get product |
| PATCH | `/api/products/[id]` | All | Update product |
| DELETE | `/api/products/[id]` | shop_admin+ | Delete product |
| GET | `/api/customers` | All | List customers |
| POST | `/api/customers` | All | Create customer |
| GET | `/api/customers/[id]` | All | Get customer |
| PATCH | `/api/customers/[id]` | All | Update customer |
| DELETE | `/api/customers/[id]` | shop_admin+ | Delete customer |
| GET | `/api/categories` | shop_admin+ | List categories |
| POST | `/api/categories` | shop_admin+ | Create category |
| GET | `/api/sales` | shop_admin+ | List sales |
| POST | `/api/sales` | All | Create sale |
| GET | `/api/shops` | super_admin | List shops |
| POST | `/api/shops` | super_admin | Create shop |
| GET | `/api/shops/[id]` | super_admin | Get shop |
| PATCH | `/api/shops/[id]` | super_admin | Update shop |
| DELETE | `/api/shops/[id]` | super_admin | Delete shop |
| GET | `/api/staff` | shop_admin+ | List staff |
| POST | `/api/staff` | shop_admin+ | Create staff |
| PATCH | `/api/staff/[id]` | shop_admin+ | Update staff |
| DELETE | `/api/staff/[id]` | shop_admin+ | Deactivate staff |
| GET | `/api/stats` | shop_admin+ | Dashboard statistics |

## Default Account

After running `seed.mjs`, a super admin account is created:

- Email: `chathurapadmal3@gmail.com`
- Password: `chathura@1234`
