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

### Deploying to Vercel

The repository-root `vercel.json` installs and builds the app from `smartdrive-app`, publishes its Angular output, and sends browser routes to the app shell so refreshing a nested route works.

To deploy, import this GitHub repository into Vercel and keep the project root set to the repository root (do not set it to `smartdrive-app`). The build, install, and output settings are supplied by `vercel.json`. After the first deployment, add the Vercel domain to the Supabase Auth URL configuration if email confirmation, password recovery, or OAuth redirects need to return to the deployed app.

### Mobile experience

- Pull down on Home or the vehicle fleet to refresh the latest available vehicles.
- Android haptic feedback is used for navigation, filters, refresh, and booking actions.
- Android uses the SmartDrive launcher icon and branded launch screen. Rebuild the Android project after changing native assets.
- Pickup location and date entered on Home are saved on the device and reused when browsing the fleet; past pickup dates are discarded.
- Full-screen Android pages reserve space below the status bar and above the home/gesture bar and app navigation, including vehicle-detail booking controls. Insets use Ionic's content padding variables so they are applied inside the actual scroll area.

### Profile photos

Before users can save a profile photo, run [`supabase/avatar-storage.sql`](./supabase/avatar-storage.sql) in the Supabase SQL Editor for this project. It creates the public `avatars` bucket and limits authenticated uploads and updates to each user's own folder. Profile images are publicly readable so they can appear in the navigation menu.

### Signup database trigger

If signup shows “Database error saving new user”, run [`supabase/fix-google-auth-profile-trigger.sql`](./supabase/fix-google-auth-profile-trigger.sql) in the Supabase SQL Editor. It synchronizes the Auth-to-profile trigger, permits optional profile fields to remain empty until registration is completed, derives a first name from Google metadata when available, and prevents stale profile conflicts from rolling back new Auth accounts.

### Booking row security

Before customers can submit bookings, run [`supabase/bookings-rls.sql`](./supabase/bookings-rls.sql) in the Supabase SQL Editor. It enables row-level security and allows authenticated customers to read, create, and update only rows whose `user_id` matches their Supabase Auth user ID. Local-only accounts cannot submit cloud bookings.

### Claimable rewards

Run the complete [`supabase/claimable-rewards.sql`](./supabase/claimable-rewards.sql) script in the Supabase SQL Editor for the same Supabase project configured by the app. It creates `public.claimed_reward_codes`, the reward-claim function, and the required row-level security policies, then asks PostgREST to reload its schema cache. If the Offers page reports that `claimed_reward_codes` is missing from the schema cache, run the script, wait for it to finish successfully, and reload the app. The Offers page awards codes for submitting a review, spending ₱5,000 on paid rentals, or completing three paid weekend rentals. Claimed codes are private to the signed-in account and can be applied during checkout. Referral and social-share rewards are not claimable until those activities can be verified by the app.

### Demo transaction tracking

Successful bookings and SmartDrive wallet transactions update a locally stored, synthetic Metro Manila tracking point for the signed-in cloud account. Admin Tracking also includes three fixed sample users in northern provinces: Clark Freeport Zone in Pampanga, Dagupan City in Pangasinan, and San Fernando City in La Union. Google Maps is embedded and centered on the selected user; distinct colors appear beside each user, and straight-line distance is calculated from the selected user. This demo does not request or read device GPS. Transaction demo entries are labeled and remain in that browser's local storage, so they are not shared across browsers or devices.

### Payment demo mode

Until a payment provider is configured, card, GCash, and Maya use demo-only test inputs. Use card number `4242 4242 4242 4242`, any future expiry, CVV `123`, or wallet test number `09170000000`. These methods create a reservation with payment status `pending`; no payment is processed, and test inputs are not sent to Supabase or saved. SR Points continue to use the SmartDrive wallet.

### Prediction prototype

The home page can recommend currently available vehicles using only the signed-in customer's own booking history. The booking calendar can show a conflict check and a historical weekday-demand signal for the selected vehicle and dates. For that date estimate, run [`supabase/vehicle-booking-signal.sql`](./supabase/vehicle-booking-signal.sql) in the Supabase SQL Editor; it returns only an overlap flag and a coarse aggregate, not other customers' booking details. The admin overview also shows a 30-day pickup-demand estimate and a relative vehicle-interest index from recorded bookings. These are transparent, in-app heuristics—not a trained AI model, individual booking probabilities, or guarantees. Estimates are withheld when historical data is too sparse. No external AI provider or customer-data sharing is used.

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
