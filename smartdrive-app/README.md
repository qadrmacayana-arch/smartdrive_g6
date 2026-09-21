# SmartDrive™ Mobile (Ionic + Angular)

A native-ready mobile conversion of the SmartDrive™ vehicle rental web app (originally PHP + vanilla JS), rebuilt with **Ionic 8** and **Angular 22** (standalone components, signals) on top of the same **Supabase** backend the web app already uses.

Scope: this conversion covers the **customer-facing app** only — browsing the fleet, booking, payments, wallet, reviews, profile. The admin dashboard (`admin.php`, manage users/fleet/bookings, live user-location tracking) was intentionally left out, since that's an ops console rather than something end users install as a mobile app.

## Stack

- Ionic 8 (standalone components, no NgModules)
- Angular 22 with signals for local/component state
- `@supabase/supabase-js` — same Supabase project (`eykggdvyxbmtgyhwoguu`) and schema as the original web app, configured in `src/environments/environment.ts`
- Capacitor (already added by `ionic start --capacitor`) for native iOS/Android builds

## Structure

```
src/app/
  core/
    models/       # TS interfaces mirroring the Supabase schema (vehicles, bookings, wallet, reviews, profiles)
    services/     # SupabaseService, AuthService, VehicleService, BookingService, WalletService, ReviewService
    guards/       # authGuard / guestGuard
    icons.ts      # central ionicons registration
  pages/
    auth/         # login, signup, forgot-password
    tabs/         # bottom tab shell: home (fleet browse), bookings, wallet, account
    vehicle-detail/
    booking/      # dates -> details -> payment -> confirmation (multi-step flow, state held in BookingService)
    settings/, reviews/, faq/, about/
```

## Business rules ported from the original site

- **Discounts** (`BookingService.computePricing`): best of promo code %, PWD/Senior 20%, or new-member 15% — same "take the largest" rule as `payment.js`.
- **Insurance**: flat ₱500 per booking.
- **SR Points wallet**: paying with SR Points deducts the total; paying any other way earns the vehicle's `sr_points`. Mirrors `payment.js` / `srwallet.js`.
- **Auth**: Supabase email/password against the existing `profiles` table and trigger. Admin accounts (`admin@smartrentals.com` / `is_admin` metadata) aren't specially handled here since this build is customer-only.

## Running it

```bash
npm install
ionic serve          # or: ng serve
```

## Building for a device

```bash
npx cap add ios       # or android
npx cap sync
npx cap open ios      # or android
```

## Not carried over from the web app

- Admin panel and live user-location tracking (`admin.php`, `vehicletracking.php`, `manage*.php`) — ops tooling, not a mobile end-user feature.
- The FAQ page's scripted "AI assistant" chat widget — replaced with a plain accordion using the same Q&A content.
- Google OAuth buttons — Supabase supports `signInWithOAuth('google')` the same way, but wiring up native OAuth redirect handling for Capacitor needs an extra deep-link plugin, so it was left as a follow-up rather than half-done.
- Real payment gateway integration — the original app also only simulated card/GCash/Maya payments client-side; this build keeps that same "select a method and confirm" simulation.
