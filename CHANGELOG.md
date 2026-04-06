# Changelog

Tutte le modifiche rilevanti al progetto sono documentate qui.
Formato: `[versione] - YYYY-MM-DD` con sezioni `Added`, `Changed`, `Fixed`, `Removed`.

---

## [Unreleased]

### Added
- **Flusso prenotazione interno Stripe** — sostituisce il widget iframe Smoobu con un wizard a 4 step (date+appartamento → dati ospite → pagamento Stripe → conferma)
- `create-payment-intent` Edge Function: calcola prezzo da Smoobu rates API, applica codice sconto (`MIMANDADUCCIO` = 10%), crea Stripe PaymentIntent e restituisce `clientSecret`
- `BookingCalendar` component: calendario con selezione range (check-in/check-out) e date non disponibili da iCal Smoobu
- Packages `@stripe/stripe-js` e `@stripe/react-stripe-js` installati
- Variabile d'ambiente `VITE_STRIPE_PUBLISHABLE_KEY` aggiunta a `.env`
- `smoobu-booking`: accetta `paymentIntentId` e lo persiste nel campo `notes` della prenotazione

### Fixed
- `smoobu-booking` Edge Function: aggiunto handler POST per creare prenotazioni reali su Smoobu API (`POST /api/reservations`) con mapping appartamenti (1→192379, 2→195814, 3→195816, 4→195815); la prenotazione viene poi salvata su Supabase con lo `smoobu_booking_id` restituito
- `smoobu-booking` Edge Function: l'handler sync iCal ora è correttamente isolato su `action === 'sync'`; in caso di errore DB post-Smoobu viene restituito status 207 invece di 500
- `AdminDashboard`: bottone "Sync with Smoobu" ora passa `{ action: 'sync' }` nel body invece di `{ method: 'GET' }` (che veniva ignorato); il toast mostra il numero di prenotazioni importate
- `BookingForm`: aggiunto `userId: user.id` nel payload per collegare la prenotazione all'utente autenticato anziché a UUID zero

## [1.0.0] - 2026-04-06

### Added
- Piattaforma di prenotazione SPA React + Supabase per La Ripa di San Gimignano
- 15 pagine: landing, lista appartamenti, dettaglio, prenotazione, calendario, galleria, amenities, auth, my-bookings, admin dashboard, blog (lista, post, admin, editor), 404
- 4 appartamenti gestiti: Padronale, Ghiri, Fienile, Nidi
- Integrazione Smoobu PMS: prezzi, prenotazioni, sync calendario iCal
- Integrazione Google Places API per recensioni
- Integrazione Facebook Graph API per recensioni e pubblicazione
- Google Analytics 4 (`G-47KQTMQGEK`) con tracking eventi custom su Supabase
- Autenticazione Supabase: Email/Password + Google OAuth
- Sistema di ruoli: admin / user con RLS PostgreSQL
- Blog CMS con editor, slug, SEO meta, pubblicazione
- Supporto multilingua EN/IT (`LanguageContext` + `locales/`)
- Dark/light mode toggle (`next-themes`)
- 11 Supabase Edge Functions (Deno)
- Database PostgreSQL: tabelle `apartments`, `bookings`, `blog_posts`, `user_roles`, `reviews`, `analytics_events`
- SEO: meta tag, Open Graph, Schema.org structured data, sitemap.xml, robots.txt
- UI con shadcn/ui (60+ componenti), Radix UI, Tailwind CSS tema Tuscany/Olive
- `PROJECT_SUMMARY.md` e `CHANGELOG.md` aggiunti alla root
