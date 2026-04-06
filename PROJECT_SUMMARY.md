# La Ripa — Project Summary

Piattaforma di prenotazione per la proprietà agrituristica **La Ripa di San Gimignano** (Toscana, Italia). SPA React con backend Supabase, integrazione con il PMS Smoobu, supporto multilingua IT/EN, pannello admin e blog CMS.

---

## Stack Tecnologico

| Layer | Tecnologia |
|-------|-----------|
| Frontend | React 18.3, TypeScript |
| Build Tool | Vite 5.4 |
| UI Framework | shadcn/ui + Radix UI + Tailwind CSS |
| Routing | React Router v6 |
| State / Data Fetching | React Context + TanStack React Query v5 |
| Form Validation | react-hook-form + Zod |
| Backend | Supabase (PostgreSQL + Edge Functions Deno) |
| Auth | Supabase Auth (Email/Password + Google OAuth) |
| Analytics | Google Analytics 4 (ID: `G-47KQTMQGEK`) + Custom Events |
| Hosting | Lovable platform / Netlify |
| Runtime | Bun (lock file) + Node (npm lock) |

---

## Struttura Directory

```
laripa/
├── src/
│   ├── App.tsx                  # Routing principale
│   ├── main.tsx                 # Entry point
│   ├── index.css                # Stili globali
│   ├── components/              # Componenti custom + ui/
│   ├── contexts/                # AuthContext, LanguageContext
│   ├── hooks/                   # Hook custom
│   ├── integrations/supabase/   # Client e tipi DB
│   ├── lib/                     # utils (cn())
│   ├── locales/                 # en.ts, it.ts
│   ├── pages/                   # Route pages (15)
│   └── utils/                   # SEO, sitemap
├── public/                      # Asset statici, robots.txt, sitemap.xml
├── supabase/
│   ├── config.toml
│   ├── functions/               # 11 Edge Functions
│   └── migrations/              # 25+ migrazioni SQL
└── [config files]               # vite, tailwind, tsconfig, eslint, ecc.
```

---

## Pagine / Route

| Route | Componente | Descrizione |
|-------|-----------|-------------|
| `/` | `Index.tsx` | Landing page con hero section |
| `/apartments` | `Apartments.tsx` | Lista appartamenti |
| `/apartments/:id` | `ApartmentDetail.tsx` | Dettaglio appartamento |
| `/booking` | `BookingPage.tsx` | Form di prenotazione |
| `/calendar` | `Calendar.tsx` | Calendario disponibilità |
| `/gallery` | `Gallery.tsx` | Galleria fotografica |
| `/amenities` | `Amenities.tsx` | Servizi e dotazioni |
| `/auth` | `Auth.tsx` | Login / Registrazione |
| `/my-bookings` | `MyBookings.tsx` | Prenotazioni utente (protetta) |
| `/admin/dashboard` | `AdminDashboard.tsx` | Pannello admin (protetta) |
| `/blog` | `Blog.tsx` | Lista articoli blog |
| `/blog/:slug` | `BlogPost.tsx` | Articolo singolo |
| `/blog/admin` | `BlogAdmin.tsx` | Gestione blog (admin) |
| `/blog/admin/new` | `BlogEditor.tsx` | Crea articolo |
| `/blog/admin/edit/:id` | `BlogEditor.tsx` | Modifica articolo |
| `*` | `NotFound.tsx` | 404 |

---

## Componenti Custom

| Componente | Funzione |
|-----------|---------|
| `Analytics.tsx` | Google Analytics 4 + event tracking DB |
| `ApartmentCard.tsx` | Card appartamento |
| `AllReviews.tsx` | Visualizzazione recensioni aggregate |
| `BookingForm.tsx` | Form prenotazione con validazione |
| `CustomCalendar.tsx` | Calendario disponibilità (sync Smoobu) |
| `Footer.tsx` | Footer sito |
| `GoogleReviews.tsx` | Integrazione Google Places reviews |
| `HeroSection.tsx` | Hero sezione landing |
| `LanguageSelector.tsx` | Switcher lingua EN/IT |
| `LazyImage.tsx` | Immagini lazy-loaded ottimizzate |
| `Navbar.tsx` | Barra di navigazione |
| `OptimizedImage.tsx` | Wrapper ottimizzazione immagini |
| `ReviewsManagement.tsx` | Gestione recensioni (admin) |
| `ReviewsManager.tsx` | CRUD recensioni |
| `SEO/SEOHead.tsx` | Meta tag e SEO |
| `SEO/StructuredData.tsx` | Schema.org structured data |
| `TestimonialsSection.tsx` | Sezione testimonianze ospiti |
| `ThemeToggle.tsx` | Toggle dark/light mode |

**UI Components (shadcn/ui):** 60+ componenti accessibili (Accordion, Alert, Avatar, Badge, Button, Calendar, Card, Carousel, Checkbox, Dialog, Drawer, DropdownMenu, Form, Input, Label, Pagination, Popover, Select, Sheet, Skeleton, Slider, Switch, Table, Tabs, Textarea, Toast, Tooltip, ecc.)

---

## Supabase Edge Functions

| Funzione | Scopo |
|---------|-------|
| `fetch-smoobu-prices` | Prezzi da Smoobu PMS |
| `smoobu-booking` | Crea prenotazione in Smoobu + DB |
| `fetch-calendar` | Sync iCal da Smoobu (disponibilità) |
| `fetch-google-reviews` | Recensioni da Google Places API |
| `find-place-id` | Trova Google Places ID |
| `fetch-facebook-reviews` | Recensioni da Facebook Graph API |
| `convert-facebook-token` | Converti token FB short → long lived |
| `test-facebook-token` | Valida token Facebook |
| `publish-to-facebook` | Pubblica contenuto su pagina FB |
| `setup-google-oauth` | Configura Google OAuth |
| `optimize-seo` | Utility ottimizzazione SEO |

Tutte le funzioni: Deno runtime, `verify_jwt = false`, CORS abilitato.

---

## Integrazioni Esterne

### Smoobu (PMS)
- API base: `https://login.smoobu.com/api/`
- Mapping appartamenti:
  - `1` → `192379` (Padronale)
  - `2` → `195814` (Ghiri)
  - `3` → `195816` (Fienile)
  - `4` → `195815` (Nidi)

### Google Places API
- Fetch recensioni e rating
- Ricerca place by name

### Facebook Graph API
- Fetch recensioni pagina
- Pubblicazione contenuti

### Google Analytics 4
- ID: `G-47KQTMQGEK`
- Tracciamento: page_view, purchase, view_item, eventi custom DB

---

## Database (PostgreSQL — Supabase)

### Tabelle

**`apartments`** — Proprietà
- `id` TEXT PK, `name`, `description`, `max_guests`, `price_per_night`, `currency`, `amenities[]`, `images[]`, timestamps
- RLS: lettura pubblica

**`bookings`** — Prenotazioni ospiti
- `id` UUID, `user_id` FK, `smoobu_booking_id`, `apartment_id`, `guest_name/email/phone`, `check_in/check_out`, `adults`, `children`, `total_price`, `currency`, `status` (pending|confirmed|cancelled), `notes`, timestamps
- RLS: utente vede/modifica solo le proprie

**`blog_posts`** — Articoli blog
- `id`, `author_id` FK, `title`, `slug`, `content`, `excerpt`, `featured_image`, `meta_description`, `published_at`, timestamps
- RLS: lettura pubblica post pubblicati, admin per tutto

**`user_roles`** — Autorizzazione utenti
- `id` UUID, `user_id` FK, `role` ENUM (admin|user), `created_at`
- Funzione DB: `has_role()` per verifica permessi

**`reviews`** — Recensioni aggregate
- `id`, `author_name`, `rating` (1-5), `review_text`, `platform` (airbnb|booking|google|other), `review_date`, `is_featured`, `is_published`, timestamps
- RLS: lettura pubblica se published, admin per gestione

**`analytics_events`** — Tracking eventi custom
- `id`, `event_type`, `page_path`, `apartment_id`, `user_agent`, `referrer`, `session_id`, `ip_address`, `created_at`
- RLS: solo admin in lettura

### Trigger & Funzioni DB
- `update_updated_at_column()` — Auto-update timestamps
- `handle_new_user()` — Assegna ruolo 'user' alla registrazione
- `handle_admin_user()` — Assegna ruolo 'admin' per email specifiche (d.incagli@gmail.com)

---

## Autenticazione

| Metodo | Dettagli |
|--------|---------|
| Email/Password | `signUp`, `signInWithPassword`, `signOut` |
| Google OAuth | `signInWithOAuth({ provider: 'google' })` |

- **AuthContext** (`src/contexts/AuthContext.tsx`): stato globale, auto token refresh, persistenza localStorage
- **Hook:** `useAuth()` — user, session, loading, metodi auth
- **Hook:** `useUserRole()` — role, isAdmin, isUser
- **Route protette:** `/my-bookings` (auth), `/admin/dashboard` (admin), `/blog/admin/*` (admin)

---

## Hook Custom

| Hook | Scopo |
|------|-------|
| `useAuth()` | Stato autenticazione globale |
| `useLanguage()` | i18n EN/IT con localStorage |
| `useUserRole()` | Ruolo utente da DB |
| `useSmoobuPricing()` | Prezzi da Smoobu API con fallback |
| `useToast()` | Notifiche toast (shadcn/ui) |
| `use-mobile()` | Breakpoint responsive detection |

---

## Variabili d'Ambiente

### Frontend (`.env` — prefisso `VITE_`)

| Variabile | Valore/Descrizione |
|----------|-------------------|
| `VITE_SUPABASE_URL` | URL progetto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chiave anon pubblica Supabase |
| `VITE_SUPABASE_PROJECT_ID` | ID progetto Supabase |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (pk_live_... o pk_test_...) |

### Edge Functions (Supabase Secrets — non in repo)

| Secret | Descrizione |
|--------|------------|
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_live_... o sk_test_...) |
| `SMOOBU_API_KEY` | Autenticazione Smoobu |
| `SMOOBU_ICAL_PADRONALE` | URL iCal appartamento 1 |
| `SMOOBU_ICAL_GHIRI` | URL iCal appartamento 2 |
| `SMOOBU_ICAL_FIENILE` | URL iCal appartamento 3 |
| `SMOOBU_ICAL_NIDI` | URL iCal appartamento 4 |
| `GOOGLE_PLACES_API_KEY` | Google Places API |
| `FACEBOOK_ACCESS_TOKEN` | Facebook Graph API |
| `SUPABASE_URL` | URL progetto (lato server) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role per funzioni backend |

---

## Script di Sviluppo

```bash
npm run dev       # Dev server su porta 8080
npm run build     # Build produzione
npm run build:dev # Build development
npm run lint      # ESLint
npm run preview   # Preview build
```

---

## Funzionalità Principali

1. Supporto multilingua (EN/IT) con `LanguageContext`
2. Dark/light theme toggle (`next-themes`)
3. Design responsive (mobile-first, Tailwind)
4. Pannello admin con gestione prenotazioni, recensioni, blog
5. Sincronizzazione calendario disponibilità con Smoobu via iCal
6. Aggregazione recensioni (Google, Facebook, manuali)
7. Blog CMS con editor e gestione slug/SEO
8. SEO ottimizzato: meta tag, Open Graph, Schema.org, sitemap.xml
9. Analytics: GA4 + eventi custom su Supabase
10. Prenotazione con invio dati a Smoobu PMS
