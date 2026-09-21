<?php
// confirmation.php
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="SmartDrive™ - Booking Confirmation. Your car rental is confirmed! Review your booking details and details.">
  <meta name="theme-color" content="#a855f7">
  <title>Booking Confirmation - SmartDrive™</title>
  <link rel="stylesheet" href="css/style.css">
  <link rel="preload" href="js/data.js" as="script">
</head>
<body>
<div class="aurora-orb aurora-orb--1"></div>
  <div class="aurora-orb aurora-orb--2"></div>
  <div class="aurora-orb aurora-orb--3"></div>

  <!-- Header/Navigation -->
  <header class="header">
    <div class="container">
      <a href="index.php" class="logo">
        <div class="logo-icon" style="background-color: #a855f7; padding: 0.5rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
        </div>
        <span style="color: white; font-weight: 700; font-size: 1.25rem;">SmartDrive<span style="font-size: 10px; margin-left: 2px; opacity: 0.7;">TM</span></span>
      </a>

      <nav class="nav-links">
        <a href="index.php" class="nav-link">Home</a>
        <a href="rent-a-car.php" class="nav-link">Rent a Car</a>
        <a href="aboutpage.php" class="nav-link">About Us</a>
        <a href="dashboard.php" class="nav-link">Dashboard</a>
      </nav>

      <div class="nav-actions">
        <a href="login.php" class="btn-login" id="nav-login">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
          Login
        </a>
        <a href="signup.php" class="btn-signup" id="nav-signup">Sign Up</a>
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
      </div>
      <hr style="border-color: rgba(255, 255, 255, 0.05);">
      <div style="display: flex; flex-direction: column; gap: 0.75rem; padding-top: 0.5rem;">
        <a href="login.php" class="mobile-nav-link" id="mobile-login" style="display: flex; align-items: center; gap: 0.5rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
          Login
        </a>
        <a href="signup.php" class="mobile-nav-link" id="mobile-signup">Sign Up</a>
      </div>
    </div>
  </header>

  <!-- Confirmation Container -->
  <div class="confirmation-container">
    <div class="confirmation-card animate-fade-in">
      <!-- Success Icon -->
      <div class="confirmation-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
          <circle cx="12" cy="12" r="10"></circle>
        </svg>
      </div>

      <!-- Confirmation Header -->
      <div class="confirmation-header">
        <h1 class="confirmation-title">Booking Confirmed!</h1>
        <p class="confirmation-subtitle">Your reservation has been successfully processed</p>
      </div>

      <!-- Confirmation Details -->
      <div class="confirmation-details">
        <div class="detail-section">
          <h3 class="detail-label">Booking Reference</h3>
          <p class="detail-value" id="ref-number">REF-2024-000000</p>
        </div>

        <div class="detail-grid">
          <div class="detail-item">
            <h4 class="detail-label">Vehicle</h4>
            <p class="detail-value" id="vehicle-info">Loading...</p>
          </div>
          <div class="detail-item">
            <h4 class="detail-label">Pick-up Date</h4>
            <p class="detail-value" id="pickup-date">Loading...</p>
          </div>
          <div class="detail-item">
            <h4 class="detail-label">Return Date</h4>
            <p class="detail-value" id="return-date">Loading...</p>
          </div>
          <div class="detail-item">
            <h4 class="detail-label">Location</h4>
            <p class="detail-value" id="location">Loading...</p>
          </div>
          <div class="detail-item">
            <h4 class="detail-label">Payment Method</h4>
            <p class="detail-value" id="payment-method-info">Loading...</p>
          </div>
        </div>

        <div class="detail-divider"></div>

        <div class="pricing-section">
          <div class="pricing-row">
            <span>Subtotal</span>
            <span id="subtotal-cost">₱0</span>
          </div>
          <div class="pricing-row">
            <span>Insurance</span>
            <span id="insurance-cost">₱0</span>
          </div>
          <div class="pricing-row" id="discount-row" style="display: none;">
            <span id="discount-label">Discount</span>
            <span id="discount-cost" style="color: #a855f7;">-₱0</span>
          </div>
          <div class="pricing-row pricing-total">
            <span>Total Amount</span>
            <span id="total-amount">₱0</span>
          </div>
        </div>

        <div class="detail-divider"></div>

        <!-- Customer Information -->
        <div class="customer-info">
          <h3 style="margin-bottom: 1rem; color: var(--heading);">Customer Information</h3>
          <div class="info-grid">
            <div>
              <p class="info-label">Full Name</p>
              <p class="info-value" id="customer-name">Loading...</p>
            </div>
            <div>
              <p class="info-label">Email</p>
              <p class="info-value" id="customer-email">Loading...</p>
            </div>
            <div>
              <p class="info-label">Phone</p>
              <p class="info-value" id="customer-phone">Loading...</p>
            </div>
            <div>
              <p class="info-label">License Type</p>
              <p class="info-value" id="license-type">Loading...</p>
            </div>
          </div>
        </div>

        <!-- Important Notes -->
        <div class="important-notes">
          <h4 style="color: #fbbf24; margin-bottom: 0.75rem;">Important Information:</h4>
          <ul style="list-style: none; padding: 0; color: var(--muted-foreground);">
            <li style="margin-bottom: 0.5rem;">✓ A confirmation email has been sent to your registered email address</li>
            <li style="margin-bottom: 0.5rem;">✓ Please arrive 15 minutes early for vehicle inspection</li>
            <li style="margin-bottom: 0.5rem;">✓ Bring a valid driver's license and identification</li>
            <li style="margin-bottom: 0.5rem;">✓ Vehicle must be returned with a full fuel tank</li>
            <li>✓ Late returns will be charged at 1.5x the daily rate</li>
          </ul>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="confirmation-actions">
        <a href="dashboard.php" class="btn btn-primary">View Booking in Dashboard</a>
        <a href="index.php" class="btn btn-secondary">Return to Home</a>
      </div>

      <!-- Download Receipt Link -->
      <div style="text-align: center; margin-top: 1.5rem;">
        <button id="download-receipt" class="receipt-link">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline; margin-right: 0.5rem;">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Download Receipt
        </button>
      </div>
    </div>
  </div>

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
          <a href="aboutpage.php#contact-us" class="contact-link">Contact Us</a>
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

  <script defer src="js/data.js"></script>
  <script defer src="js/shared.js?v=20260906"></script>
  <script defer src="js/confirmation.js?v=20260906"></script>
</body>
</html>
