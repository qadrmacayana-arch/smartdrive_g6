<?php
// dashboard.php
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="SmartDrive™ Dashboard - Manage your bookings, view rental history, and track your loyalty rewards.">
  <meta name="theme-color" content="#a855f7">
  <title>Dashboard - SmartDrive™</title>
  <link rel="stylesheet" href="css/style.css">
  <link rel="preload" href="js/data.js" as="script">
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js"></script>
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
        <a href="dashboard.php" class="nav-link active">Dashboard</a>
      </nav>
      <div class="nav-actions" id="auth-buttons"></div>
    </div>
  </header>

  <div class="dashboard-container">
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
            <a href="dashboard.php" class="nav-item active">Overview</a>
            <a href="bookings.php" class="nav-item">My Bookings</a>
            <a href="offers.php" class="nav-item">Offers & Promos</a>
            <a href="srwallet.php" class="nav-item">SR Wallet</a>
            <button class="nav-item" id="settings-link">Settings</button>
            <button class="nav-item danger" id="logout-btn">Sign Out</button>
          </nav>
        </div>
      </aside>

      <main class="dashboard-main">
        <div class="dashboard-header">
          <h1 class="dashboard-title" id="welcome-message">Welcome!</h1>
          <p class="dashboard-subtitle">Here's what's happening with your account today.</p>
        </div>

        <div class="dashboard-content">

            <!-- Ongoing Rental Card -->
            <div class="ongoing-rental-card" id="ongoing-rental-card" style="display: none;">
              <div class="ongoing-rental-image">
                  <img id="ongoing-car-image" src="" alt="Ongoing Rental Car">
              </div>
              <div class="ongoing-rental-info">
                  <p class="ongoing-rental-label">Your Current Ride</p>
                  <h3 id="ongoing-car-name">Car Name</h3>
                  <div class="rental-period">
                      <p><strong>From:</strong> <span id="ongoing-pickup-date"></span></p>
                      <p><strong>To:</strong> <span id="ongoing-return-date"></span></p>
                  </div>
                  <div class="rental-progress">
                      <div class="progress-bar-container">
                          <div class="progress-bar" id="rental-duration-progress"></div>
                      </div>
                      <p id="rental-days-left" class="progress-info"></p>
                  </div>
              </div>
            </div>

            <div class="welcome-banner" id="first-login-banner">
              <h2>🎉 Welcome Aboard! Your First Ride Awaits.</h2>
              <p class="welcome-banner-discount">As a new member, enjoy an exclusive <span>15% OFF</span> your first rental.</p>
              <p class="welcome-banner-note">This offer is automatically applied when you book your first car. Happy driving!</p>
            </div>

            <!-- Guest User Welcome Banner -->
            <div class="welcome-banner" id="guest-user-banner" style="display: none; background: linear-gradient(135deg, #007aff 0%, #1dddd3 100%);">
              <h2>🔒 Account required</h2>
              <p class="welcome-banner-discount">Create an account or log in to unlock booking access and exclusive offers.</p>
              <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1rem;">
                <a href="login.php" class="btn-cta-primary" style="margin-top: 0; display: inline-block; text-decoration: none;">Log In</a>
                <a href="signup.php" class="btn-cta-secondary" style="margin-top: 0; display: inline-block; text-decoration: none;">Sign Up</a>
              </div>
            </div>

            <div class="stats-grid">
              <div class="stat-card">
                <p class="stat-label">Active Bookings</p>
                <p class="stat-value" id="stat-bookings">0</p>
              </div>
              <div class="stat-card">
                <p class="stat-label">Total Spent</p>
                <p class="stat-value" id="stat-spent">₱0</p>
              </div>
              <div class="stat-card">
                <p class="stat-label">Hours Driven</p>
                <p class="stat-value" id="stat-hours">0</p>
              </div>
            </div>

            <!-- Loyalty Tier Card -->
            <div class="loyalty-tier-card" id="loyalty-card" style="display: none;">
              <div class="loyalty-header">
                <div class="loyalty-info">
                  <h3 class="loyalty-title" id="loyalty-message">Your Loyalty Tier</h3>
                  <p class="loyalty-message">Keep renting to unlock exclusive rewards.</p>
                </div>
                <div id="loyalty-badge" class="loyalty-badge"></div>
              </div>
              <div class="loyalty-progress">
                <div class="progress-header">
                  <span class="progress-text">Spending Progress</span>
                  <span id="spending-progress">₱0 / ₱5,000</span>
                </div>
                <div class="progress-bar-container">
                  <div class="progress-bar" id="progress-bar" style="width: 0%;"></div>
                </div>
                <p class="progress-info" id="tier-info">
                  You're just getting started! Spend ₱5,000 to reach the Premium tier.
                </p>
              </div>
            </div>

            <section class="bookings-section">
              <div class="section-header-row">
                <div>
                  <h2 class="section-title-small">Recent Activity</h2>
                  <p class="section-subtitle">Your latest bookings and transactions</p>
                </div>
                <a href="bookings.php" class="view-all-link">View All History →</a>
              </div>
              
              <div class="bookings-table-wrapper">
                <table class="bookings-table">
                  <thead>
                    <tr>
                      <th>Ref #</th>
                      <th>Vehicle</th>
                      <th>Date Range</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody id="recent-bookings-body">
                    <tr>
                      <td colspan="6" class="text-center p-8 text-muted-foreground">
                        Loading activity...
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <div class="satisfaction-meter-card">
              <div class="satisfaction-header">
                <h3>How Satisfied Are You?</h3>
                <p class="satisfaction-subtitle">Help us improve your experience</p>
              </div>
              <div class="satisfaction-scale">
                <button type="button" class="satisfaction-btn" data-value="1" title="Very Dissatisfied">
                  😡
                </button>
                <button type="button" class="satisfaction-btn" data-value="2" title="Dissatisfied">
                  😞
                </button>
                <button type="button" class="satisfaction-btn" data-value="3" title="Neutral">
                  😐
                </button>
                <button type="button" class="satisfaction-btn" data-value="4" title="Satisfied">
                  😊
                </button>
                <button type="button" class="satisfaction-btn" data-value="5" title="Very Satisfied">
                  😁
                </button>
              </div>
              <p class="satisfaction-feedback" id="satisfaction-feedback">Select a rating</p>
              <form id="review-form" class="review-form">
                <label for="review-comment">Tell us about your experience (optional)</label>
                <textarea id="review-comment" class="form-input" rows="3" maxlength="1000" placeholder="What did you enjoy, or what can we improve?"></textarea>
                <button type="submit" class="btn-book-new" id="review-submit-btn">Submit Review</button>
                <p class="review-form-message" id="review-form-message" role="status"></p>
              </form>
            </div>

            <div class="quick-action-card">
              <div class="quick-action-content">
                <div>
                  <h3>Need a ride for your next adventure?</h3>
                  <p>Choose from our premium fleet of electric and luxury vehicles.</p>
                </div>
              <a href="rent-a-car.php" class="btn-book-new">Book New Vehicle</a>
              </div>
            </div>

        </div>
      </main>
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
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script defer src="js/supabase.js?v=20260907"></script>
  <script defer src="js/dashboard.js?v=20260903"></script>

  <!-- Floating help button for users -->
  <a href="faq.php" id="help-fab" title="Help & FAQs" style="position:fixed;right:18px;bottom:18px;z-index:10000;width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0b5fff,#7c4dff);color:#fff;box-shadow:0 10px 30px rgba(12,32,63,0.25);text-decoration:none">
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
  </a>
</body>
</html>