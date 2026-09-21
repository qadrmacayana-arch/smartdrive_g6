<?php
// User-facing booking history page.
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Bookings - SmartDrive™</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body id="dashboard-page">
  <div class="aurora-orb aurora-orb--1"></div>
  <div class="aurora-orb aurora-orb--2"></div>

  <header class="header">
    <div class="container">
      <a href="index.php" class="logo">
        <div class="logo-icon" aria-hidden="true">SD</div>
        <span>SmartDrive<span style="font-size: 10px; margin-left: 2px; opacity: 0.7;">TM</span></span>
      </a>
      <nav class="nav-links">
        <a href="index.php" class="nav-link">Home</a>
        <a href="rent-a-car.php" class="nav-link">Rent a Vehicle</a>
        <a href="aboutpage.php" class="nav-link">About Us</a>
        <a href="dashboard.php" class="nav-link active">Dashboard</a>
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
            <a href="bookings.php" class="nav-item active">My Bookings</a>
            <a href="offers.php" class="nav-item">Offers & Promos</a>
            <a href="srwallet.php" class="nav-item">SR Wallet</a>
            <a href="settings.php" class="nav-item">Settings</a>
            <button class="nav-item danger" id="logout-btn" onclick="logout()">Sign Out</button>
          </nav>
        </div>
      </aside>

      <section class="dashboard-main">
        <div class="dashboard-header">
          <h1 class="dashboard-title">My Bookings</h1>
          <p class="dashboard-subtitle">View your past and upcoming SmartDrive reservations.</p>
        </div>
        <div class="dashboard-content bookings-section">
          <div class="bookings-table-wrapper">
            <table class="bookings-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Vehicle</th>
                  <th>Date Range</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="user-bookings-body">
                <tr><td colspan="5" class="text-center p-12 text-muted-foreground">Loading bookings...</td></tr>
              </tbody>
            </table>
          </div>
          <div style="margin-top: 1.5rem; text-align: center;">
            <a href="rent-a-car.php" class="btn-book-new">Book a New Vehicle</a>
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
          <a href="rent-a-car.php">Rent a Vehicle</a>
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
          <a href="faq.php">Help & FAQs</a>
          <a href="rent-a-car.php">Browse Fleet</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 SmartDrive™. All rights reserved. | Revolutionizing Premium Vehicle Rentals</p>
    </div>
  </footer>

  <div id="legal-modal" class="modal" style="display: none;">
    <div class="modal-content" style="max-width: 800px;">
      <div class="modal-header">
        <h2 id="legal-modal-title"></h2>
        <span class="close-btn" id="close-legal-modal">&times;</span>
      </div>
      <div class="modal-body" id="legal-modal-body" style="max-height: 70vh; overflow-y: auto;"></div>
    </div>
  </div>

  <script defer src="js/shared.js?v=20260906"></script>
  <script defer src="js/bookings-user.js?v=20260903"></script>
</body>
</html>
