<?php
// login.php
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="SmartDrive™ Login - Securely access your car rental account and manage bookings.">
  <meta name="theme-color" content="#a855f7">
  <title>Login - SmartDrive™</title>
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

      <button class="mobile-menu-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
      </button>
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
          <div class="auth-panel-tagline">PREMIUM MOBILITY, SIMPLIFIED</div>
          <h2 class="auth-panel-title">Drive More.<br>Worry Less.</h2>
          <p class="auth-panel-description">
            Access a curated fleet of premium cars and motorcycles — from electric city cruisers to luxury SUVs — all in one place.
          </p>
          <div class="auth-panel-features">
            <div class="auth-panel-feature">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>Verified premium fleet</span>
            </div>
            <div class="auth-panel-feature">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>24/7 support & roadside assistance</span>
            </div>
            <div class="auth-panel-feature">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
              <span>Smart wallet & rewards points</span>
            </div>
            <div class="auth-panel-feature">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
              <span>Secure & flexible booking</span>
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
            <h1 class="auth-title">SmartDrive<span class="tm">™</span></h1>
            <p class="auth-subtitle">Premium Member Access</p>
          </div>
        </div>

        <form id="login-form">
          <div class="form-group">
            <label class="form-label" for="email">Email Address</label>
            <div class="input-wrapper">
              <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              <input type="email" id="email" name="email" required placeholder="name@example.com" class="form-input" autocomplete="email" inputmode="email" spellcheck="false">
            </div>
          </div>

          <div class="form-group">
            <div class="flex justify-between items-center mb-3 ml-1">
              <label class="form-label m-0" for="password">Password</label>
              <button type="button" id="forgot-password-btn" class="text-link-small text-primary bg-none border-none cursor-pointer" style="font-size: 0.75rem; font-weight: 600;">Forgot?</button>
            </div>
            <div class="input-wrapper" style="position: relative;">
              <input type="password" id="password" name="password" required placeholder="••••••••" class="form-input" autocomplete="current-password">
              <button type="button" id="toggle-password-btn" class="password-toggle-btn" style="position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--muted-foreground); padding: 0.25rem;" title="Toggle password visibility">
                <svg id="eye-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>

          <div class="form-group" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <input type="checkbox" id="remember-me" name="remember-me" style="width: 1rem; height: 1rem; cursor: pointer;">
              <label for="remember-me" style="font-size: 0.875rem; color: var(--muted-foreground); font-weight: 500; cursor: pointer;">
                Remember Me
              </label>
            </div>
          </div>

          <button type="submit" class="btn-submit">
            Log In to Dashboard
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </form>

        <div class="divider">
          <div class="divider-line"></div>
          <span class="divider-text">Connect with</span>
          <div class="divider-line"></div>
        </div>

        <button type="button" id="google-sign-in-btn" class="btn-submit" style="width: 100%; background: #fff; color: #1f2937; border: 1px solid #d1d5db; box-shadow: none;">
          <span aria-hidden="true" style="font-weight: 800; font-size: 1.1rem;">G</span>
          Continue with Google
        </button>
        </div>

        <div class="auth-footer">
          <p class="auth-footer-text">
            New to SmartDrive?
            <a href="signup.php" class="auth-footer-link">Create Account</a>
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Forgot Password Modal -->
  <div id="forgot-password-modal" class="modal" style="display: none;">
    <div class="auth-card animate-fade-in" style="max-width: 28rem; padding: 0;">
      <div class="auth-content">
        <div class="auth-header" style="margin-bottom: 2rem;">
          <div class="auth-logo" style="padding: 1rem; border-radius: 1.25rem; margin-bottom: 1rem;">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>
          </div>
          <div>
            <h1 class="auth-title" style="font-size: 1.75rem;">Forgot Password</h1>
            <p class="auth-subtitle" style="font-size: 0.625rem;">RECOVER YOUR ACCOUNT</p>
          </div>
        </div>

        <form id="forgot-password-form">
          <p style="color: var(--muted-foreground); font-size: 0.875rem; margin-bottom: 1.5rem; text-align: center;">Enter your email and we'll send you your password.</p>
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <div class="input-wrapper">
              <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              <input type="email" id="forgot-email" class="form-input" required placeholder="name@example.com">
            </div>
          </div>
          <button type="submit" class="btn-submit" style="width: 100%; margin-top: 1.5rem;">Send Recovery Info</button>
        </form>
        <div id="forgot-message" style="display: none; margin-top: 1.5rem; padding: 1rem; border-radius: 1rem; text-align: center; font-weight: 600; font-size: 0.875rem;"></div>
      </div>
      <button id="close-forgot-modal" class="auth-footer-link" style="background: none; border: none; cursor: pointer; width: 100%; padding: 1rem; font-size: 0.8rem;">Cancel</button>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script defer src="js/data.js"></script>
  <script defer src="js/shared.js?v=20260906"></script>
  <script defer src="js/supabase.js?v=20260906"></script>
  <script defer src="js/login.js?v=20260906"></script>
</body>
</html>