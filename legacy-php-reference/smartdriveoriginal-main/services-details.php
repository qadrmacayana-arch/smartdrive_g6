<?php
// services-details.php
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vehicle Details - SmartDrive™</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
<div class="aurora-orb aurora-orb--1"></div>
  <div class="aurora-orb aurora-orb--2"></div>
  <div class="aurora-orb aurora-orb--3"></div>

  <header class="header">
    <div class="container">
      <a href="index.php" class="logo">
        <div class="logo-icon" style="background-color: #a855f7; padding: 0.5rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
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
        <a href="login.php" class="btn-login">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
          Login
        </a>
        <a href="signup.php" class="btn-signup">Sign Up</a>
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
        <div class="mobile-login" style="padding: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.05);">
          <a href="login.php" class="btn-login">Login</a>
        </div>
        <div class="mobile-signup">
          <a href="signup.php" class="btn-signup">Sign Up</a>
        </div>
      </div>
    </div>
  </header>

  <main>
    <div class="container py-10">
      <nav style="margin-bottom: 2rem;">
        <a href="rent-a-car.php" style="color: var(--muted-foreground); font-size: 0.875rem; text-decoration: none;">← Back to Fleet</a>
      </nav>

      <div style="display: grid; grid-template-columns: 1fr; gap: 3rem;">
        <div style="position: relative; border-radius: 1.5rem; overflow: hidden; height: 400px; background-color: var(--muted);">
          <img id="car-image" src="" alt="Car Loading..." style="width: 100%; height: 100%; object-fit: cover;">
          <div style="position: absolute; top: 1.5rem; left: 1.5rem;">
            <span id="car-badge" class="car-badge" style="font-size: 0.875rem; padding: 0.5rem 1rem;"></span>
          </div>
        </div>

        <div class="grid" style="grid-template-columns: 2fr 1fr; gap: 3rem;">
          <div>
            <div style="margin-bottom: 2rem;">
              <h1 id="car-name" style="font-size: 2.25rem; font-weight: 900; color: var(--heading); margin-bottom: 0.5rem;"></h1>
              <p style="color: var(--muted-foreground); font-size: 0.875rem;">High Quality Condition • Fully Sanitized</p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; padding: 2rem; background-color: var(--card); border-radius: 1rem; border: 1px solid rgba(255, 255, 255, 0.05); margin-bottom: 2rem;">
              <div>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <span style="font-size: 0.75rem; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase;">Seats</span>
                </div>
                <p id="car-seats" style="font-size: 1.25rem; font-weight: 900; color: var(--heading);"></p>
              </div>
              <div>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  <span style="font-size: 0.75rem; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase;">Transmission</span>
                </div>
                <p id="car-transmission" style="font-size: 1.25rem; font-weight: 900; color: var(--heading);"></p>
              </div>
              <div>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" x2="15" y1="22" y2="22"/><line x1="4" x2="14" y1="9" y2="9"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/></svg>
                  <span style="font-size: 0.75rem; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase;">Fuel Type</span>
                </div>
                <p id="car-fuel" style="font-size: 1.25rem; font-weight: 900; color: var(--heading);"></p>
              </div>
            </div>

            <div style="margin-bottom: 2rem;">
              <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--heading); margin-bottom: 1rem;">About This Vehicle</h2>
              <p id="car-description" style="color: var(--muted-foreground); line-height: 1.625;"></p>
            </div>

            <div>
              <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--heading); margin-bottom: 1rem;">Features & Amenities</h2>
              <div id="car-features" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;"></div>
            </div>
          </div>

          <aside>
            <div style="position: sticky; top: 5rem; background-color: var(--card); border-radius: 1.5rem; border: 1px solid rgba(255, 255, 255, 0.05); padding: 2rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
              <div style="text-align: center; margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                <p style="font-size: 0.75rem; color: var(--muted-foreground); margin-bottom: 0.5rem; font-weight: 700; text-transform: uppercase;">Starting from</p>
                <div style="display: flex; align-items: baseline; justify-content: center; gap: 0.25rem;">
                  <span style="font-size: 1.5rem; font-weight: 900; color: var(--primary);">₱</span>
                  <span id="car-price" style="font-size: 3rem; font-weight: 900; color: var(--primary); line-height: 1;"></span>
                </div>
                <p style="font-size: 0.875rem; color: var(--muted-foreground); font-weight: 700;">/day</p>
              </div>

              <div style="display: flex; flex-direction: column; gap: 1rem;">
                <p style="font-size: 0.875rem; color: var(--muted-foreground); margin-bottom: 1rem;">Select your rental dates to get started</p>
                <a href="calendar-selection.php" id="book-now-btn" class="btn-submit" style="text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                  Book This Car
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </a>
                
                <div style="display: grid; gap: 0.75rem; font-size: 0.875rem; color: var(--muted-foreground); margin-top: 1rem;">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Free cancellation up to 24h
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Comprehensive insurance
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
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
  <script src="js/data.js?v=20260904"></script>
  <script src="js/services-details.js?v=20260904"></script>
</body>
</html>