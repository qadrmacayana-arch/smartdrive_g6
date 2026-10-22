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
- **Google auth**: Supabase Google OAuth returns to the web app origin on browsers and uses an Android custom URL scheme with the system browser in Capacitor.
- **Legal**: `/legal/terms` and `/legal/privacy` provide the project’s Terms of Use and Privacy Notice; both are also linked from signup and account settings. The documents identify SmartDrive as a student project/prototype and should be reviewed and updated by the responsible operator before commercial launch.

## Running it

```bash
npm install
ionic serve          # or: ng serve
```

### Deploying to Vercel

The repository-root `vercel.json` installs and builds the app from `smartdrive-app`, publishes its Angular output, and sends browser routes to the app shell so refreshing a nested route works.

To deploy, import this GitHub repository into Vercel and keep the project root set to the repository root (do not set it to `smartdrive-app`). The build, install, and output settings are supplied by `vercel.json`. After the first deployment, add the Vercel domain to the Supabase Auth URL configuration if email confirmation, password recovery, or OAuth redirects need to return to the deployed app.

### Google sign-in setup

Enable Google in Supabase Authentication, configure the Google OAuth client with Supabase's callback URL (`https://<project-ref>.supabase.co/auth/v1/callback`), and add the deployed web origin and `com.smartdrive.tm://login-callback` to Supabase's allowed redirect URLs. Google sign-in opens the system browser on Android and returns to the app through that custom URL scheme.

### Mobile experience

- Pull down on Home or the vehicle fleet to refresh the latest available vehicles.
- Android haptic feedback is used for navigation, filters, refresh, and booking actions.
- `resources/icon.png` is the master app icon; keep the Android launcher variants and browser favicon in sync with it. Rebuild the Android project after changing native assets.
- Registered customers can use Trip Planner to search and select from 12 curated Philippine destinations and nearby landmarks, choose trip dates from an in-app calendar, see attributed Wikimedia Commons place photos, and clear their itinerary. The planner uses a refreshed, mobile-friendly travel layout with quick destination picks.
- Bookings has an at-a-glance trip summary and redesigned reservation cards; Offers & Promos has a refreshed campaign header and coordinated reward and promo-code styling.
- Notifications has additional spacing between the app toolbar and its page heading for clearer visual hierarchy.
- Android content reserves extra scroll space above the fixed customer navigation bar; Trip Planner uses standard header flow to avoid overlapping its hero with the native status-bar inset.
- The customer menu panel expands around its footer controls, and scrollable pages reserve enough space above the fixed customer navigation.
- Notifications uses a dedicated update banner and easier-to-scan update cards with consistent side gutters, hides the redundant floating bell while open, and reserves additional scroll room above the customer navigation.
- Admin fleet management can edit a vehicle's description, features, daily rate, seat capacity, transmission, fuel type, category, image, and featured status.
- The Home screen includes an auto-rotating illustrated promotions carousel with links to the fleet, offers, and Trip Planner. Carousel rotation pauses automatically when reduced motion is preferred and can be paused manually.
- Pickup location and date entered on Home are saved on the device and reused when browsing the fleet; past pickup dates are discarded.
- Full-screen Android pages reserve space below the status bar and above the home/gesture bar and app navigation, including vehicle-detail booking controls. Insets use Ionic's content padding variables so they are applied inside the actual scroll area.

### Profile photos

Before users can save a profile photo, run [`supabase/avatar-storage.sql`](./supabase/avatar-storage.sql) in the Supabase SQL Editor for this project. It creates the public `avatars` bucket and limits authenticated uploads and updates to each user's own folder. Profile images are publicly readable so they can appear in the navigation menu.

### Signup database trigger

If signup shows “Database error saving new user”, run [`supabase/fix-google-auth-profile-trigger.sql`](./supabase/fix-google-auth-profile-trigger.sql) in the Supabase SQL Editor. It synchronizes the Auth-to-profile trigger, permits optional profile fields to remain empty until registration is completed, derives a first name from Google metadata when available, and prevents stale profile conflicts from rolling back new Auth accounts.

### Booking row security

Run [`supabase/bookings-rls.sql`](./supabase/bookings-rls.sql) in the Supabase SQL Editor for this project. It enables row-level security, lets authenticated customers read, create, and update only their own bookings, and lets authorized admins view and update booking progress. Customers alone can cancel confirmed bookings, and cancellation cannot be reversed by an admin. Admin status is accepted only for `admin@smartrentals.com` or a server-managed `app_metadata.is_admin` claim; user-editable `user_metadata` is not trusted. Local-only accounts cannot submit cloud bookings.

For admin transaction summaries, also run [`supabase/wallet_rls_policies.sql`](./supabase/wallet_rls_policies.sql). It preserves customers' own-wallet access and grants read-only access to wallet balances and transactions only to authorized admins.

### Contact form row security

Run or re-run [`supabase/contact-messages.sql`](./supabase/contact-messages.sql) in the Supabase SQL Editor to enable customer messages and the admin inbox. Contact form submissions require an online Supabase account; local-only sign-ins should use the displayed email link instead. If Supabase rejects a message under row-level security, apply this script and sign in again.

### Separate admin portal

The administrator portal is built as a separate application and is not included in the customer website or Android/iOS app. For an existing Supabase project, run [`supabase/admin-authorization.sql`](./supabase/admin-authorization.sql), [`supabase/bookings-rls.sql`](./supabase/bookings-rls.sql), and [`supabase/wallet_rls_policies.sql`](./supabase/wallet_rls_policies.sql) in the Supabase SQL Editor. If support conversations are enabled, also rerun [`supabase/support-conversations.sql`](./supabase/support-conversations.sql). These scripts preserve customer-own-booking access and grant admin capabilities only to the named admin account or an account with server-managed `app_metadata.is_admin = true`. Do not grant admin status through `user_metadata`.

Deploy the admin portal as a second Vercel project from this repository, with root directory `smartdrive-app/admin-portal` and **Include source files outside of the Root Directory in the Build Step** enabled. Its [`vercel.json`](./admin-portal/vercel.json) installs dependencies from the repository-root lockfile (including the `smartdrive-app` workspace), builds the admin target, and serves the separate `admin-portal/dist` output. Use a separate admin-only domain; hiding or keeping a URL secret is not an access-control mechanism. The portal verifies the signed-in Supabase account, and database row-level security is the authority for access to admin data. The existing `admin@smartrentals.com` account is authorized by email; other administrators must receive `app_metadata.is_admin = true` through a trusted Supabase Admin API or dashboard action.

### Claimable rewards

Run the complete [`supabase/claimable-rewards.sql`](./supabase/claimable-rewards.sql) script in the Supabase SQL Editor for the same Supabase project configured by the app. It creates `public.claimed_reward_codes`, the reward-claim function, and the required row-level security policies, then asks PostgREST to reload its schema cache. If the Offers page reports that `claimed_reward_codes` is missing from the schema cache, run the script, wait for it to finish successfully, and reload the app. The Offers page awards codes for submitting a review, spending ₱5,000 on paid rentals, or completing three paid weekend rentals. Claimed codes are private to the signed-in account and can be applied during checkout. Referral and social-share rewards are not claimable until those activities can be verified by the app.

### Demo transaction tracking

Successful bookings and SmartDrive wallet transactions update a locally stored, synthetic Metro Manila tracking point for the signed-in cloud account. Admin Tracking also includes three fixed sample users in northern provinces: Clark Freeport Zone in Pampanga, Dagupan City in Pangasinan, and San Fernando City in La Union. Google Maps is embedded and centered on the selected user; distinct colors appear beside each user, and straight-line distance is calculated from the selected user. This demo does not request or read device GPS. Transaction demo entries are labeled and remain in that browser's local storage, so they are not shared across browsers or devices.

### PayMongo checkout

Card, GCash, and Maya payments use PayMongo Hosted Checkout. The app sends the signed-in customer's draft details to the `create-checkout` Edge Function; it verifies availability and calculates the price server-side, then stores a private checkout attempt and returns the hosted checkout URL. On return, the confirmation page asks the authenticated `confirm-checkout` Edge Function to verify the session directly with PayMongo and creates a booking only when a paid payment matches the stored attempt. The signed `paymongo-webhook` remains the server-to-server confirmation path if the customer does not return to the app. A browser redirect by itself is never proof of payment.

Before enabling payments:

1. Run [`supabase/paymongo.sql`](./supabase/paymongo.sql) in the Supabase SQL Editor. This creates the private checkout-attempt table, blocks direct client creation of online-payment bookings, and prevents client-side payment-status changes.
2. From `smartdrive-app`, install and link the Supabase CLI to this project, then set `PAYMONGO_SECRET_KEY`, `PAYMONGO_WEBHOOK_SECRET`, and `APP_BASE_URL` as Edge Function secrets. Use a PayMongo test secret key while testing; `APP_BASE_URL` must be the HTTPS origin of the deployed app.
3. From `smartdrive-app`, deploy with `supabase functions deploy create-checkout`, `supabase functions deploy confirm-checkout`, and `supabase functions deploy paymongo-webhook`.
4. In the PayMongo dashboard, register `https://<project-ref>.supabase.co/functions/v1/paymongo-webhook` as a webhook URL and subscribe to `checkout_session.payment.paid`. Save its webhook signing secret as `PAYMONGO_WEBHOOK_SECRET`.

For test-only checkout flows that need immediate confirmation without a completed PayMongo payment, set `PAYMONGO_TEST_AUTO_CONFIRM=true` as an Edge Function secret while using an `sk_test_` key. The confirmation page clearly labels these bookings as test confirmations. Remove or set the secret to `false` before using live keys; this setting is ignored unless the key starts with `sk_test_`.

After PayMongo checkout, web customers return to the same trusted origin that started checkout, preserving that origin's sign-in session. The `create-checkout` function validates the request origin against `APP_BASE_URL`, SmartDrive's `smartdrive-app*.vercel.app` domains, and the `smartdrive-*-smartdriveteam.vercel.app` preview domain; localhost origins are allowed only with a PayMongo test key. Android app customers return to the installed SmartDrive app using a one-time payment-attempt deep link, so the app verifies payment in its own signed-in WebView. Browser checkout returns are never switched to the app because browser and app sign-in sessions are stored separately.

Keep the PayMongo secret and webhook signing secret in Supabase Edge Function secrets only; never put them in Angular environment files. Configure test/live keys and webhook endpoints consistently. SR Points continue to use the SmartDrive wallet.

### Prediction prototype

The home page can recommend currently available vehicles using only the signed-in customer's own booking history. The booking calendar can show a conflict check and a historical weekday-demand signal for the selected vehicle and dates. For that date estimate, run [`supabase/vehicle-booking-signal.sql`](./supabase/vehicle-booking-signal.sql) in the Supabase SQL Editor; it returns only an overlap flag and a coarse aggregate, not other customers' booking details. The admin overview also shows a 30-day pickup-demand estimate and a relative vehicle-interest index from recorded bookings. These are transparent, in-app heuristics—not a trained AI model, individual booking probabilities, or guarantees. Estimates are withheld when historical data is too sparse. No external AI provider or customer-data sharing is used.

## Building for a device

Android builds with Capacitor 8 require JDK 21. Use a JDK 21 installation for this Gradle wrapper and set `JAVA_HOME` to its path before building.

The GitHub Actions workflow builds a signed APK and publishes it as `SmartDriveTM.apk` on each push to `main`. Configure these repository Actions secrets before pushing:

- `ANDROID_KEYSTORE_BASE64`: base64-encoded Android keystore file
- `ANDROID_KEYSTORE_PASSWORD`: keystore password
- `ANDROID_KEY_ALIAS`: signing key alias
- `ANDROID_KEY_PASSWORD`: signing key password

Use the same signing key as the existing installed app so users can install updates without uninstalling first. Pull requests build an unsigned debug APK artifact and do not publish a release.

```bash
npx cap add ios       # or android
npx cap sync
npx cap open ios      # or android
```

## Not carried over from the web app

- Admin panel and live user-location tracking (`admin.php`, `vehicletracking.php`, `manage*.php`) — ops tooling, not a mobile end-user feature.
- The FAQ page's scripted "AI assistant" chat widget — replaced with a plain accordion using the same Q&A content.
