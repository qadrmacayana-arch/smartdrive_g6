<?php
// srwallet.php
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="SmartDrive™ SR Wallet - Track SR Points earned and used for bookings.">
  <meta name="theme-color" content="#a855f7">
  <title>SR Wallet - SmartDrive™</title>
  <link rel="stylesheet" href="css/style.css?v=20260906-wallet3">
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
            <a href="offers.php" class="nav-item">Offers & Promos</a>
            <a href="srwallet.php" class="nav-item active">SR Wallet</a>
            <a href="settings.php" class="nav-item">Settings</a>
            <button class="nav-item danger" id="logout-btn" onclick="logout()">Sign Out</button>
          </nav>
        </div>
      </aside>

      <section class="dashboard-main wallet-page-container">
    <div class="wallet-page-header dashboard-header">
      <a href="dashboard.php" class="back-link">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Back to Dashboard
      </a>
      <h1 class="page-title">Your SR Wallet</h1>
      <p class="page-description">Track your SR Points and use them to reduce the cost of future bookings.</p>
    </div>

    <div class="wallet-grid-layout">
      <!-- Left Column: SR Points balance -->
      <div class="wallet-main-content">
        <div class="wallet-details-card">
          <div class="wallet-header">
            <h3>Available SR Points</h3>
          </div>
          <p class="wallet-balance" id="wallet-balance">0 pts</p>
          <p class="wallet-description">
            Earn points from completed bookings, then apply them at checkout. 1 SR Point = ₱1 discount.
          </p>
        </div>

        <div class="top-up-section glass-panel">
          <h2 class="section-title-small">How SR Points Work</h2>
          <p class="wallet-description">Complete bookings to earn SR Points based on the vehicle you choose. At payment, select <strong>Use SR Points</strong> to apply your points as a discount.</p>
          <div class="quick-amounts">
            <span class="btn-small">Earn on every booking</span>
            <span class="btn-small">1 point = ₱1 off</span>
            <span class="btn-small">No top-up required</span>
          </div>
        </div>
      </div>

      <!-- Right Column Container -->
      <div class="wallet-right-column">
        <!-- Most recent SR Points activity -->
        <div class="recent-top-up-card" id="recent-top-up-card" style="display: none;">
          <div class="section-header-row">
            <h2 class="section-title-small">Latest SR Points Activity</h2>
          </div>
          <div id="last-top-up-content">
            <div class="recent-top-up-details">
              <p><strong>Points:</strong> <span id="last-top-up-amount"></span></p>
              <p><strong>Date:</strong> <span id="last-top-up-date"></span></p>
              <p><strong>Activity:</strong> <span id="last-top-up-method"></span></p>
            </div>
          </div>
          <div id="no-top-up-message" style="display: none; color: var(--muted-foreground); text-align: center; padding: 1rem 0;">No SR Points activity yet.</div>
        </div>

        <!-- SR Points usage history -->
        <div class="transaction-history-card">
          <h2 class="section-title-small">SR Points History</h2>
          <div class="bookings-table-wrapper">
            <table class="bookings-table">
              <thead>
                <tr><th>Date</th><th>Activity</th><th>Points</th></tr>
              </thead>
              <tbody id="transaction-history-body"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
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

  <script defer src="js/data.js?v=20260903"></script>
  <script defer src="js/shared.js?v=20260906"></script>
  <script defer src="js/srwallet.js?v=20260906"></script>
</body>
</html>