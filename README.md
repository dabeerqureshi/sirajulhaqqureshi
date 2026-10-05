# Siraj ul Haq Qureshi — Digital Archive & Portfolio
### سراج الحق قریشی — ڈیجیٹل کتب خانہ اور ادبی ورثہ

A modern bilingual (English & Urdu) digital archive, literary portfolio, and CMS built with **Next.js (App Router)**, **Tailwind CSS**, and **Supabase (PostgreSQL, Storage, RLS, Auth)**, deployed on **Vercel** with custom DNS via **Hostinger**.

---

## 🌟 Key Features

1. **Bilingual Experience (English / Urdu)**:
   - Dynamic Language Switcher (`EN | اردو`) with persistent state.
   - RTL (`dir="rtl"`) support for Urdu with authentic **Noto Nastaliq Urdu** typography.
   - Poetic couplet formatting for Ghazals and Nazms.

2. **Public vs. Restricted Content**:
   - Public materials (biography, selected poetry, books, historic photos) viewable and downloadable by anyone.
   - Restricted items (private family heritage, rare manuscripts) display locked badges and blur protection.
   - 1-click **"Request Access"** modal allowing researchers and family members to request access.

3. **Admin CMS & Access Approval Portal (`/admin`)**:
   - **Access Requests Review**: Instant **[Approve]** and **[Reject]** workflow for visitor requests.
   - **Publish Poetry**: Add English & Urdu verses, categorizations, and public/restricted visibility.
   - **Upload Books & Documents**: Add PDFs, authors, page counts, and publication metadata.

4. **Production Architecture**:
   - **Supabase PostgreSQL & Storage**: Strict Row Level Security (RLS) policies for user profiles, content, books, and media.
   - **Vercel Hosting**: Fast global edge delivery and serverless API endpoints.
   - **Hostinger Domain**: Simple DNS CNAME / A record routing.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Supabase Database
1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open `supabase/schema.sql` from this repository, copy all contents, and execute them in Supabase.
   - This sets up the `profiles`, `content`, `books`, `gallery`, and `access_requests` tables, functions, triggers, and Row Level Security (RLS) policies.
4. In Supabase **Storage**, create two buckets:
   - `public-assets` (Public: Enabled)
   - `private-assets` (Public: Disabled / Private)

### 3. Set Up Environment Variables
Copy `.env.example` to `.env.local` and add your project keys:
```bash
cp .env.example .env.local
```
Add your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the archive.

---

## 🌐 Deploying to Vercel & Connecting Hostinger

1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: initial bilingual digital archive setup"
   git push origin main
   ```
2. Import the repository in [Vercel](https://vercel.com):
   - Add your Supabase environment variables in Vercel Project Settings.
3. In Hostinger DNS Management:
   - Point your `@` A record to `76.76.21.21` (Vercel IP).
   - Point your `www` CNAME record to `cname.vercel-dns.com`.
