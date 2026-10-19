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

4. **Hamd Poetry PDF Library (Poetry ▸ Hamd)**:
   - Admin portal tab **"Hamd PDFs (حد)"**: publish a Hamd PDF with bilingual titles via drag & drop.
   - Files upload **browser → Supabase Storage** through a one-time signed URL (admin-only API), so large scans bypass Vercel's serverless request-body limit (up to 50MB).
   - The public Poetry page gains a **Poetry Verses | Hamd** switcher; each published Hamd PDF opens in an inline in-browser reader with download support.

5. **Production Architecture**:
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
3. Open `supabase/schema.sql` from this repository, copy **all** of its
   contents, paste them into the editor, and press **Run**.

   The script is fully **idempotent** — it is safe on a brand-new project and
   safe to re-run on an existing one. It creates everything the app needs in
   one shot:

   - Tables: `profiles`, `content`, `books`, `gallery`, `access_requests`, `videos`
   - Helper functions: `is_admin()`, `is_approved()`, `handle_new_user()`, `set_updated_at()`
   - Row Level Security (RLS) policies for every table, plus storage policies
   - The `hamd` content type and the `content.file_path` column
   - The `public-assets` (public) and `private-assets` (private) storage
     buckets — **no manual bucket setup required**

   > **Note:** every object is created *before* it is referenced, so the script
   > never fails with `relation "public.videos" does not exist`. If you hit
   > that error, you are running an older copy of the file — re-copy the
   > current `supabase/schema.sql` and run it again; it will repair the
   > database in place.

4. **Existing databases**: just re-run the whole file. Statements are guarded
   with `IF EXISTS` / `IF NOT EXISTS` / `DROP IF EXISTS`, so nothing is
   duplicated or lost.

### 3. Set Up Environment Variables
Copy `.env.example` to `.env.local` and add your project keys:
```bash
cp .env.example .env.local
```
Add your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Newer Supabase projects issue the publishable key, older ones the anon key —
# either name works with this codebase:
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-only secret key (legacy name shown; SUPABASE_SECRET_KEY also works):
SUPABASE_SERVICE_ROLE_KEY=your-secret-key
```

### 4. Create the Admin Account
The admin portal authenticates with **Supabase Auth** — no passwords are
stored in the codebase:
1. In Supabase go to **Authentication → Users → Add user** and create your
   admin email & password.
2. Promote the account in the SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
3. Sign in at [`http://localhost:3000/admin/login`](http://localhost:3000/admin/login)
   — you will be redirected to the `/admin` dashboard.

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the archive.

---

## 🌐 Deploying to Vercel & Connecting Hostinger

1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: production-ready archive with Hamd PDF section"
   git push origin main
   ```
2. Import the repository in [Vercel](https://vercel.com). The framework is
   auto-detected (**Next.js**) — no custom build settings are required — then add
   these **Environment Variables** under *Project → Settings → Environment Variables*:

   | Variable | Where to find it |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → **API Keys** → publishable key (`sb_publishable_...`; legacy projects use `NEXT_PUBLIC_SUPABASE_ANON_KEY`) |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → **API Keys** → secret key (`sb_secret_...` or legacy `service_role`) — **server only, keep secret** |
   | `NEXT_PUBLIC_ADMIN_EMAIL` | Optional: display-only admin contact |

3. Deploy — every push to `main` triggers a fresh production build (`next build`).
4. In Hostinger DNS Management:
   - Point your `@` A record to `76.76.21.21` (Vercel IP).
   - Point your `www` CNAME record to `cname.vercel-dns.com`.
5. **Post-deploy checklist**
   - `/admin/login` signs in with your Supabase admin user and opens `/admin`.
   - *Admin → Hamd PDFs (حد)* publishes a PDF, and *Poetry → Hamd* reads it inline.
   - The full `supabase/schema.sql` has been run once against the production
     database (step 2 of *Getting Started*). It is idempotent, so re-running it
     is always safe.

6. **Verify the production database** at any time:
   ```bash
   npm run check:db
   ```
   This reports, table by table and bucket by bucket, what is actually
   provisioned in your Supabase project.

---

## 🩺 Troubleshooting

### `relation "public.videos" does not exist`
You are running an **older copy** of `supabase/schema.sql`. The Supabase SQL
Editor aborts the entire script at the first failing statement, so everything
after the failure is silently never created. Copy the current
`supabase/schema.sql` from this repository and run it again — it creates every
object *before* referencing it, so it repairs the database in place.

### `Could not find the table 'public.content' in the schema cache`
The tables do not exist in your project yet. Run `supabase/schema.sql` in the
Supabase **SQL Editor** (step 2 of *Getting Started*), then confirm with
`npm run check:db`. PostgREST caches the schema, so give it a few seconds
after the first run.

### Hamd uploads fail with a bucket error
Run `supabase/schema.sql` — it creates the `public-assets` and
`private-assets` buckets for you, including their storage RLS policies. No
manual dashboard configuration is required.

### `Missing SUPABASE_SERVICE_ROLE_KEY`
The server-only key is not set. Add `SUPABASE_SERVICE_ROLE_KEY` (or
`SUPABASE_SECRET_KEY`) to `.env.local` for local work, and to the Vercel
project's environment variables for production. Never commit it.
