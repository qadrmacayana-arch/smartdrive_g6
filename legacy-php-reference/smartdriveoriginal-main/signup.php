<?php
// signup.php
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="SmartDrive™ Sign Up - Create your account and start renting premium vehicles today.">
  <meta name="theme-color" content="#a855f7">
  <title>Sign Up - SmartDrive™</title>
  <link rel="stylesheet" href="css/style.css">
  <link rel="preload" href="js/data.js" as="script">
</head>
<body>
<div class="aurora-orb aurora-orb--1"></div>
  <div class="aurora-orb aurora-orb--2"></div>
  <div class="aurora-orb aurora-orb--3"></div>

  <header class="header">
    <div class="container">
      <a href="index.php" class="logo">
        <div class="logo-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
        </div>
        <span>SmartDrive<span style="font-size: 10px; margin-left: 2px; opacity: 0.7;">TM</span></span>
      </a>

      <nav class="nav-links">
        <a href="index.php" class="nav-link">Home</a>
        <a href="rent-a-car.php" class="nav-link">Rent a Car</a>
        <a href="aboutpage.php" class="nav-link">About Us</a>
        <a href="dashboard.php" class="nav-link">Dashboard</a>
      </nav>

      <div class="nav-actions" id="auth-buttons">
        <!-- Auth buttons are dynamically loaded here -->
      </div>

      <button class="mobile-menu-btn" onclick="toggleMobileMenu()">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
      </button>
    </div>

    <div class="mobile-menu">
      <div class="mobile-nav-links">
        <a href="index.php" class="mobile-nav-link">Home</a>
        <a href="rent-a-car.php" class="mobile-nav-link">Rent a Car</a>
        <a href="dashboard.php" class="mobile-nav-link">Dashboard</a>
        <div class="mobile-login p-4 border-t border-border">
          <a href="login.php" class="text-primary no-underline font-semibold">Login</a>
        </div>
        <div class="mobile-signup">
          <a href="signup.php" class="text-primary-foreground no-underline font-semibold bg-primary p-2 px-4 rounded-lg block text-center">Sign Up</a>
        </div>
      </div>
    </div>
  </header>

  <div class="auth-container">
    <div class="auth-card animate-fade-in">
      <!-- Landscape Showcase Panel -->
      <div class="auth-panel auth-panel-showcase">
        <div class="auth-panel-overlay"></div>
        <div class="auth-panel-content">
          <div class="auth-panel-logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
          </div>
          <div class="auth-panel-tagline">JOIN SMARTDRIVE TODAY</div>
          <h2 class="auth-panel-title">Your Journey.<br>Our Fleet.</h2>
          <p class="auth-panel-description">
            Unlock instant access to a premium fleet — electric cars, luxury sedans, SUVs, and more — with flexible booking and rewards on every ride.
          </p>
          <div class="auth-panel-features">
            <div class="auth-panel-feature">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>Create your account in minutes</span>
            </div>
            <div class="auth-panel-feature">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>Earn rewards on every rental</span>
            </div>
            <div class="auth-panel-feature">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
              <span>Smart wallet for instant payments</span>
            </div>
            <div class="auth-panel-feature">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
              <span>Trusted by thousands of drivers</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right side: Form -->
      <div class="auth-side">
        <div class="auth-content">
        <div class="auth-header">
          <div class="auth-logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
          </div>
          <div>
            <h1 class="auth-title">Create Account</h1>
            <p class="auth-subtitle">Start Your SmartDrive Journey</p>
          </div>
        </div>

        <form id="signup-form">
          <div class="auth-form-grid">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input type="text" id="name" required placeholder="John Doe" class="form-input pl-6">
            </div>

            <div class="form-group">
              <label class="form-label">Birthday</label>
              <input type="date" id="birthday" required class="form-input pl-6">
            </div>

            <div class="form-group">
              <label class="form-label">Complete Address</label>
              <input type="text" id="address" required placeholder="Street, City, Province" class="form-input pl-6">
            </div>

            <div class="form-group">
              <label class="form-label">Gender</label>
              <div class="select-wrapper">
                <select id="gender" class="form-input pl-6">
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div class="form-group auth-form-span-2">
              <label class="form-label">Email Address</label>
              <input type="email" id="email" required placeholder="name@example.com" class="form-input pl-6">
            </div>

            <div class="form-group auth-form-span-2">
              <label class="form-label">Phone Number</label>
              <input type="tel" id="phone" required placeholder="+63 912 345 6789" class="form-input pl-6" autocomplete="tel">
            </div>

            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" id="password" required placeholder="••••••••" class="form-input pl-6">
              <small id="password-error" class="text-destructive text-xs hidden">Password must be at least 6 characters</small>
            </div>

            <div class="form-group">
              <label class="form-label">Confirm Password</label>
              <input type="password" id="confirmPassword" required placeholder="••••••••" class="form-input pl-6">
              <small id="confirm-error" class="text-destructive text-xs hidden">Passwords do not match</small>
            </div>
          </div>

          <div class="divider">
            <div class="divider-line"></div>
            <span class="divider-text">OR</span>
            <div class="divider-line"></div>
          </div>

          <button type="button" id="google-sign-up-btn" class="btn-submit" style="width: 100%; background: #fff; color: #1f2937; border: 1px solid #d1d5db; box-shadow: none; margin-bottom: 0.75rem;">
            <span aria-hidden="true" style="font-weight: 800; font-size: 1.1rem;">G</span>
            Continue with Google
          </button>

          <div id="loading" class="hidden text-center mb-4">
            <div class="border-4 border-primary/30 border-t-primary rounded-full w-10 h-10 animate-spin mx-auto"></div>
          </div>

          <div id="success-message" class="hidden bg-primary/10 border border-primary text-primary text-center p-4 rounded-lg mb-4">
            Account created successfully! Redirecting...
          </div>

          <div id="error-message" class="hidden bg-destructive/10 border border-destructive text-destructive text-center p-4 rounded-lg mb-4"></div>

          <div class="pt-4">
            <button type="submit" class="btn-submit" id="submit-btn">
              Sign Up Now
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </div>
        </form>

        <p class="text-xs text-center leading-relaxed font-black uppercase tracking-widest mt-6" style="color: var(--muted-foreground); opacity: 0.8;">
          By signing up, you agree to our <a href="#" class="legal-link text-primary underline" data-content="terms">Terms</a> and 
          <a href="#" class="legal-link text-primary underline" data-content="privacy">Privacy Policy</a>.
        </p>
      </div>

      <div class="auth-footer">
        <p class="auth-footer-text">
          Already a member?
          <a href="login.php" class="auth-footer-link">Log in</a>
        </p>
      </div>
    </div>
  </div>

  <!-- Legal Modal -->
  <div id="legal-modal" class="modal" style="display: none;">
    <div class="modal-content" style="max-width: 800px;">
      <div class="modal-header">
        <h2 id="legal-modal-title"></h2>
        <span class="close-btn" id="close-legal-modal">&times;</span>
      </div>
      <div class="modal-body" id="legal-modal-body" style="max-height: 70vh; overflow-y: auto;">
        <!-- Content will be injected by JavaScript -->
      </div>
      <div class="modal-footer">
        <p style="font-size: 0.8rem; color: var(--muted-foreground);">Last Updated: March 15, 2026</p>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script defer src="js/data.js"></script>
  <script defer src="js/supabase.js?v=20260907"></script>
  <script defer src="js/signup.js?v=20260907"></script>
</body>
</html>