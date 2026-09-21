<?php
// offers.php
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="SmartDrive™ - Exclusive offers and discounts on premium car rentals.">
  <meta name="theme-color" content="#a855f7">
  <title>Offers - SmartDrive™</title>
  <link rel="stylesheet" href="css/style.css">
  <link rel="preload" href="js/data.js" as="script">
</head>
<body id="dashboard-page">
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
        <a href="rent-a-car.php" class="nav-link">Rent a Vehicle</a>
        <a href="aboutpage.php" class="nav-link">About Us</a>
        <a href="dashboard.php" class="nav-link">Dashboard</a>
      </nav>
      <div class="nav-actions" id="auth-buttons"></div>
    </div>
  </header>

  <main class="dashboard-container">
    <div class="dashboard-layout">
      <aside class="dashboard-sidebar">
        <div class="profile-card">
          <div class="profile-header">
            <div class="profile-avatar" id="user-avatar-container">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div class="profile-info">
              <h3 id="user-name">Account required</h3>
              <p class="profile-badge" id="user-badge">Sign in required</p>
            </div>
          </div>
          <nav class="sidebar-nav">
            <a href="dashboard.php" class="nav-item">Overview</a>
            <a href="bookings.php" class="nav-item">My Bookings</a>
            <a href="offers.php" class="nav-item active">Offers & Promos</a>
            <a href="srwallet.php" class="nav-item">SR Wallet</a>
            <a href="settings.php" class="nav-item">Settings</a>
            <button class="nav-item danger" id="logout-btn" onclick="logout()">Sign Out</button>
          </nav>
        </div>
      </aside>

      <section class="dashboard-main">
        <div class="offers-header" style="margin-bottom: 3rem;">
      <h1 class="offers-title">Exclusive Offers & Promos</h1>
      <p class="offers-subtitle">Take advantage of our special promotions to get the best value on your next rental.</p>
        </div>

        <div class="offers-grid" id="offers-grid">
      <!-- Offers will be dynamically loaded and rotated here -->
      </div>

    <!-- Claimable Rewards & Offers -->
      <div class="claimable-rewards-section" style="margin-top: 3rem;">
      <div class="section-header">
        <h2 class="section-title-small">🎁 Claimable Rewards</h2>
        <p class="section-subtitle">Complete tasks and meet requirements to unlock exclusive discount codes</p>
      </div>
      <div class="claimable-offers-grid" id="claimable-offers-grid">
        <!-- Claimable offers will be dynamically loaded here -->
      </div>
      </div>

    <!-- Discount Code Section -->
      <div class="discount-info-section" style="margin-top: 3rem;">
      <h2 class="section-title-small">Your Loyalty Discount Codes</h2>
      <p class="section-subtitle">Unlock codes based on your spending and membership level</p>
      
      <!-- Promo Code Input Section -->
      <div class="promo-code-input-section">
        <h3>Enter Promo Code</h3>
        <div class="promo-code-input-group">
          <input 
            type="text" 
            id="promo-code-input" 
            class="promo-code-input" 
            placeholder="Enter your promo code"
            maxlength="20"
            aria-label="Promo code input"
          >
          <button id="validate-promo-btn" class="btn-validate-promo" aria-label="Validate promo code">Validate Code</button>
        </div>
        <div id="promo-validation-message" class="promo-validation-message" style="display: none;" role="alert"></div>
      </div>

      <!-- Available Codes Based on User Requirements -->
      <div id="available-codes-section">
        <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Your Available Codes</h3>
        <div class="discount-codes-list" id="discount-codes-list">
          <!-- Codes will be dynamically loaded based on user eligibility -->
        </div>
      </div>

        </div>
    <!-- /.discount-info-section -->
      </section>
    </div>
  </main>

  <footer class="footer">
    <div class="footer-content">
      <div class="footer-section">
        <h3 class="footer-title">SmartDrive™</h3>
        <p class="footer-text">The premium rental experience built for easier journeys, better vehicles, and more confident travel across the Philippines.</p>
      </div>
      <div class="footer-section">
        <h3 class="footer-title">Explore SmartDrive</h3>
        <div class="footer-links">
          <a href="index.php">Home</a>
          <a href="rent-a-car.php">Rent a Car</a>
          <a href="offers.php">Offers</a>
          <a href="aboutpage.php">About Us</a>
          <a href="dashboard.php">Dashboard</a>
        </div>
      </div>
      <div class="footer-section">
        <h3 class="footer-title">Plan Your Journey</h3>
        <div class="footer-links">
          <a href="aboutpage.php#contact-us">Contact Us</a>
          <a href="#" class="legal-link" data-content="terms">Terms & Conditions</a>
          <a href="#" class="legal-link" data-content="privacy">Privacy Policy</a>
        </div>
      </div>
      <div class="footer-section">
        <h3 class="footer-title">24/7 Support</h3>
        <div class="footer-links">
          <a href="#">Careers</a>
          <a href="#">Blog</a>
          <a href="#">Partners</a>
          <a href="#">Fleet</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 SmartDrive™. All rights reserved. | Revolutionizing Premium Vehicle Rentals</p>
    </div>
  </footer>
  <!-- Legal Modal is now in shared.js -->
  <script defer src="js/shared.js?v=20260906"></script>
  <script src="js/offers.js?v=20260903"></script>
</body>
</html>