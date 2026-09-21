<?php
// index.php
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="SmartDrive™ - Premium car and motorcycle rental service in the Philippines. Luxury, electric, and high-performance vehicles available for rent.">
  <meta name="keywords" content="car rental, motorcycle rental, vehicle rental, luxury vehicles, electric cars, Philippines">
  <meta name="theme-color" content="#a855f7">
  <meta property="og:title" content="SmartDrive™ - Premium Car & Motorcycle Rentals Philippines">
  <meta property="og:description" content="Rent premium cars and motorcycles in the Philippines. Fast, reliable, and affordable vehicle rental service.">
  <meta property="og:type" content="website">
  <title>SmartDrive™ - Premium Car & Motorcycle Rentals Philippines</title>
  <link rel="stylesheet" href="css/style.css">
  <link rel="preload" href="js/data.js" as="script">
  <style>
    /* Custom Scrollbar Styling */
    :root {
      scrollbar-color: #444 #1c1c1e; /* thumb and track color for Firefox */
      scrollbar-width: thin;
    }

    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    ::-webkit-scrollbar-track {
      background-color: rgba(28, 28, 30, 0.5);
    }

    ::-webkit-scrollbar-thumb {
      background-color: #444;
      border-radius: 10px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background-color: #a855f7; /* Primary green on hover */
    }
  </style>
</head>
<body>
<div class="aurora-orb aurora-orb--1"></div>
  <div class="aurora-orb aurora-orb--2"></div>
  <div class="aurora-orb aurora-orb--3"></div>

  <!-- Header/Navigation -->
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

      <div class="nav-actions" id="auth-buttons">
        <!-- Auth buttons are dynamically loaded here -->
      </div>

      <button class="mobile-menu-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
      </button>
    </div>

    <div class="mobile-menu">
      <div class="mobile-nav-links">
        <a href="index.php" class="mobile-nav-link">Home</a>
        <a href="rent-a-car.php" class="mobile-nav-link">Rent a Vehicle</a>
        <a href="dashboard.php" class="mobile-nav-link">Dashboard</a>
      </div>
      <div id="mobile-auth-links" class="flex flex-col gap-3 pt-2 border-t border-border mt-4"></div>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="hero">
    <div class="hero-bg">
      <!-- Carousel will be injected here by JavaScript -->
    </div>
    <div class="hero-content animate-fade-in">
      <h1 class="hero-title">Premium Vehicle Rentals for Your Philippine Journey</h1>
      <p class="hero-description">Experience the joy of the ride with our wide selection of premium cars and motorcycles. Easy booking, 24/7 support.</p>
      <div class="hero-actions">
        <a href="rent-a-car.php" class="btn-primary" aria-label="Find your vehicle">
          Find Your Vehicle
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </a>
        <a href="signup.php" class="btn-secondary">Sign Up Now</a>
      </div>
    </div>
  </section>

  <!-- Quick Search -->
  <section class="quick-search">
    <div class="search-card">
      <div class="search-inputs">
        <div class="input-group">
          <label class="input-label">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            Pick-up Location
          </label>
          <input type="text" placeholder="e.g., Makati, BGC, or NAIA Terminal 3" class="search-input">
        </div>
        <div class="input-group">
          <label class="input-label">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Pick-up Date
          </label>
          <input type="date" class="search-input">
        </div>
      </div>
      <a href="rent-a-car.php" class="btn-search">Search</a>
    </div>
  </section>

  <!-- Features -->
  <section class="section">
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">Why Choose SmartDrive?</h2>
        <p class="section-description">We provide a seamless experience from the moment you book until you return the keys.</p>
      </div>

      <div class="features-grid">
        <div class="feature-card animate-fade-in">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
          </div>
          <h3 class="feature-title">Fully Insured</h3>
          <p class="feature-description">All our vehicles come with comprehensive insurance coverage for your peace of mind.</p>
        </div>

        <div class="feature-card animate-fade-in">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <h3 class="feature-title">24/7 Support</h3>
          <p class="feature-description">Our customer service team is available around the clock to assist you with any queries.</p>
        </div>

        <div class="feature-card animate-fade-in">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <h3 class="feature-title">Premium Fleet</h3>
          <p class="feature-description">From sports cars to family SUVs, our vehicles are meticulously maintained and serviced.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Featured Cars -->
  <section class="section bg-card/30 py-24">
    <div class="container">
      <div class="flex justify-between items-end mb-12 flex-wrap gap-4">
        <div>
          <h2 class="section-title text-left mb-4">Featured Vehicles</h2>
          <p class="section-description text-left">The most popular choices from our customers this month.</p>
        </div>
        <a href="rent-a-car.php" class="text-primary font-semibold flex items-center gap-1" aria-label="View all vehicles">
          View All Vehicles
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </a>
      </div>

      <div class="cars-grid" id="featured-cars"></div>
    </div>
  </section>

  <!-- CTA -->
  <section class="section">
    <div class="container">
      <div class="cta-section animate-fade-in">
        <div class="cta-bg-blur"></div>
        <div class="cta-bg-blur"></div>
        <div class="cta-content">
          <h2 class="cta-title">Ready to hit the road?</h2>
          <p class="cta-description">Join thousands of happy customers who trust SmartDrive for their travel needs. Register today and get 15% off your first rental.</p>
          <div class="cta-actions">
            <a href="signup.php" class="btn-cta-primary">Create Account</a>
            <a href="rent-a-car.php" class="btn-cta-secondary">Explore Fleet</a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <footer class="footer">
    <div class="footer-content">
      <div class="footer-section">
        <h3 class="footer-title">SmartDrive™</h3>
        <p class="footer-text">The premium rental experience built for easier journeys, better vehicles, and more confident travel across the Philippines.</p>
      </div>

      <div class="footer-section">
        <h3 class="footer-title">Explore SmartDrive</h3>
        <div class="footer-links">
          <a href="index.php">Home</a><a href="rent-a-car.php">Rent a Vehicle</a>
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
  <script defer src="js/index.js"></script>
</body>
</html>
