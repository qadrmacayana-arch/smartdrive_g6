<?php
// calendar-selection.php
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Select Dates - SmartDrive™</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body id="calendar-selection-page">
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
      <div id="auth-buttons" class="nav-actions"></div>
    </div>
  </header>

  <main class="container py-10">
    <div class="stepper-container" style="max-width: 48rem; margin: 0 auto 3rem;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
        <div style="text-align: center; flex: 1;">
          <div style="width: 2.5rem; height: 2.5rem; background-color: var(--primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.5rem; font-weight: 900;">1</div>
          <p style="font-size: 0.75rem; font-weight: 700; color: var(--primary);">DATES</p>
        </div>
        <div style="text-align: center; flex: 1;">
          <div style="width: 2.5rem; height: 2.5rem; background-color: var(--muted); color: var(--muted-foreground); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.5rem; font-weight: 900;">2</div>
          <p style="font-size: 0.75rem; font-weight: 700; color: var(--muted-foreground);">DETAILS</p>
        </div>
        <div style="text-align: center; flex: 1;">
          <div style="width: 2.5rem; height: 2.5rem; background-color: var(--muted); color: var(--muted-foreground); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.5rem; font-weight: 900;">3</div>
          <p style="font-size: 0.75rem; font-weight: 700; color: var(--muted-foreground);">PAYMENT</p>
        </div>
        <div style="text-align: center; flex: 1;">
          <div style="width: 2.5rem; height: 2.5rem; background-color: var(--muted); color: var(--muted-foreground); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.5rem; font-weight: 900;">4</div>
          <p style="font-size: 0.75rem; font-weight: 700; color: var(--muted-foreground);">CONFIRM</p>
        </div>
      </div>
      <div style="height: 2px; background-color: var(--border); border-radius: 9999px; overflow: hidden;">
        <div style="height: 100%; width: 25%; background-color: var(--primary);"></div>
      </div>
    </div>

    <div class="selection-header" style="margin-bottom: 2rem; text-align: center;">
        <h1 class="page-title">SELECT DATES</h1>
        <p class="page-description">How long do you need the <span id="car-name" style="color: var(--primary); font-weight: 700;">Loading...</span> in Manila?</p>
    </div>

    <div class="calendar-selection-grid">
      <div class="calendar-container animate-fade-in">
        <div class="calendar-header">
          <h3 id="current-month-display">FEBRUARY 2026</h3> 
          <div class="nav-arrows">
            <button id="prev-month" class="nav-btn" aria-label="Previous Month">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button id="next-month" class="nav-btn" aria-label="Next Month">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
        <div class="calendar-grid" id="main-calendar"></div>
      </div>

      <div class="selection-preview">
        <div class="display-cards-container">
          
          <div class="info-card" id="card-pickup">
            <div class="icon-box">📅</div>
            <div>
              <p class="card-label">Pick-up Date</p>
              <h4 id="display-pickup">SELECT</h4>
              <span id="display-pickup-year" class="year-label">----</span>
            </div>
          </div>

          <div class="info-card" id="card-dropoff">
            <div class="icon-box">📅</div>
            <div>
              <p class="card-label">Drop-off Date</p>
              <h4 id="display-dropoff">SELECT</h4>
              <span id="display-dropoff-year" class="year-label">----</span>
            </div>
          </div>

          <div class="info-card full-width active">
            <div class="icon-box-green">🕒</div>
            <div class="calc-group">
              <p class="card-label">Total Duration</p>
              <h2 id="total-days">0 Days</h2>
            </div>
            <div style="text-align: right; margin-left: auto;">
              <p class="card-label">Estimated Rate</p>
              <h2 style="color: #a855f7;">₱ <span id="total-price">0</span></h2>
            </div>
          </div>

          <div class="action-buttons">
            <button type="button" class="btn-confirm" id="continue-btn" disabled style="opacity: 0.5; cursor: not-allowed;">
              CONFIRM & CONTINUE 
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-left:10px;"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
            
            <a href="rent-a-car.php" class="btn-back">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px;"><polyline points="15 18 9 12 15 6"/></svg>
              BACK TO FLEET
            </a>
          </div>
          
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

  <script src="js/data.js?v=20260904"></script>
  <script src="js/shared.js?v=20260906"></script>
  <script src="js/calendar-selection.js?v=20260906"></script>
</body>
</html>