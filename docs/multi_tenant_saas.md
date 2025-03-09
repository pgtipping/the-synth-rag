# Architecture Strategy: Multi-Tenant SaaS Model

Avoid code duplication – build a single app that serves both demo users and paid clients with isolated data and features.

## 1. Architecture Strategy

### Layer Implementation Details

| Layer         | Implementation Details |
|--------------|----------------------|
| **Database** | Use row-level security (e.g., Supabase RLS) or schema-per-tenant (Postgres) to isolate client data. |
| **Auth** | Assign users to a `tenant_id` (e.g., `tenant_abc123`) with role-based access (Free/Pro/Enterprise). |
| **Feature Flags** | Use LaunchDarkly or `config.json` to toggle paid features (e.g., longer retention, custom domains). |

---

## 2. Customization Workflow

### A. Client-Specific Configuration

Store settings in a `tenants` table:

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name TEXT,
  plan TEXT, -- 'free', 'pro', 'enterprise'
  custom_domain TEXT,
  file_retention_days INT,
  storage_limit_gb INT,
  branding JSONB -- { "logo": "url", "colors": { "primary": "#000" } }
);
```

### B. Dynamic UI Branding

Inject tenant-specific styles/logo using CSS variables:

```tsx
// Apply dynamically
<div style={{ backgroundColor: tenant.branding.colors.primary }}>
  <img src={tenant.branding.logo} alt="Client Logo" />
</div>
```

---

## 3. Deployment & Hosting

### A. Custom Domains

- **Vercel:** Assign domains via Vercel Projects (supports wildcard domains `*.yourplatform.com`).
- **Reverse Proxy:** Use NGINX or Cloudflare to route `client1.com → your app` with `tenant_id` header.

### B. Client Onboarding Flow

- **Admin Dashboard:** Let clients pick a plan, upload branding, and configure settings.
- **Automated Provisioning:**
  - Create `tenant_id` in DB.
  - Set up DNS for custom domains (via Vercel/Cloudflare API).
  - Send welcome email with credentials.

---

## 4. Paid Feature Examples

| Feature          | Free Tier       | Paid Tier          |
|-----------------|----------------|--------------------|
| **Data Retention** | 30 days        | 1 year+           |
| **File Size Limit** | 500 MB        | 10 GB+            |
| **Custom Branding** | Demo branding | White-label UI    |
| **Support** | Community | 24/7 Priority |
| **Integrations** | None | API Access, Slack/Zapier |

---

## 5. Monetization & Billing

### A. Payment Integration

Use Stripe for subscriptions:

```tsx
// Create a Stripe Checkout session
const session = await stripe.checkout.sessions.create({
  success_url: `${domain}/success?session_id={CHECKOUT_SESSION_ID}`,
  line_items: [{ price: "price_abc123", quantity: 1 }],
});
```

Track subscriptions in a `subscriptions` table linked to `tenant_id`.

### B. Pricing Models

- **Monthly/Yearly Plans:** Tiered pricing (Pro: `$99/mo`, Enterprise: custom).
- **Usage-Based:** Charge per file processed or vector query.

---

## 6. Maintenance & Scaling

- **Single Codebase:** Push updates to all clients simultaneously.
- **CI/CD Pipeline:**

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: vercel/action@v3
        with:
          project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

- **Monitoring:** Track per-tenant usage with PostHog or Datadog.

---

## 7. Migration Path for Existing Demo Users

- **Offer Upgrade:** Let demo users convert their account to paid (retain data via `tenant_id`).
- **Data Porting:** Copy their existing files/embeddings to the paid tenant’s isolated storage.
- **Grandfather Features:** Reward early adopters with discounted rates.

---

## 8. Tools & Costs

| Tool            | Cost           | Purpose |
|---------------|--------------|---------|
| **Vercel Pro** | $20/mo       | Hosting + custom domains. |
| **Supabase Pro** | $25/mo       | Multi-tenant DB + auth. |
| **Stripe** | 2.9% + $0.30 | Payment processing. |
| **LaunchDarkly** | $25/mo | Feature flags for tiered access. |
