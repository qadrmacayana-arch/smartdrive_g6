<?php
// rent-a-car.php
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="SmartDrive™ - Browse and rent premium cars and motorcycles in the Philippines. Fast booking and competitive prices.">
  <meta name="theme-color" content="#a855f7">
  <title>Rent a Vehicle - SmartDrive™</title>
  <link rel="stylesheet" href="css/style.css">
  <link rel="preload" href="js/data.js" as="script">
</head>
<body class="rent-page">
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
        <a href="rent-a-car.php" class="nav-link active">Rent a Vehicle</a>
        <a href="aboutpage.php" class="nav-link">About Us</a>
        <a href="dashboard.php" class="nav-link">Dashboard</a>
      </nav>

      <div class="nav-actions" id="auth-buttons">
        <a href="login.php" class="btn-login">Login</a>
        <a href="signup.php" class="btn-signup">Sign Up</a>
      </div>

      <button class="mobile-menu-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
      </button>
    </div>

    <div class="mobile-menu">
      <div class="mobile-nav-links">
        <a href="index.php" class="mobile-nav-link">Home</a>
        <a href="rent-a-car.php" class="mobile-nav-link active">Rent a Vehicle</a>
        <a href="dashboard.php" class="mobile-nav-link">Dashboard</a>
      </div>
      <div id="mobile-auth-links" class="flex flex-col gap-3 pt-2 border-t border-border mt-4"></div>
    </div>
  </header>

  <main class="rent-main">
    <div class="container py-10 rent-content">
      <header class="page-header">
        <h1 class="page-title">Our Premium Vehicle Fleet</h1>
        <p class="page-description">Carefully curated cars and motorcycles for your Philippine journey.</p>
      </header>

      <div class="search-filters rent-filters">
        <div class="search-bar-wrapper">
          <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" id="search-input" placeholder="Search by vehicle name or model..." class="search-bar">
        </div>
        
        <div class="category-filters">
          <div class="main-category-tabs">
            <button class="main-category-btn active" data-main-category="All">All Vehicles</button>
            <button class="main-category-btn" data-main-category="Cars">Cars</button>
            <button class="main-category-btn" data-main-category="Motorcycles">Motorcycles</button>
            <button class="main-category-btn" data-main-category="Recreational">Recreational Vehicles</button>
          </div>

          <div id="sub-category-container" class="sub-category-container">
            <!-- Sub-categories for Cars -->
            <div class="filter-buttons" data-parent-category="Cars" style="display:none;">
              <button class="filter-btn" data-filter="All">All Cars</button>
              <button class="filter-btn" data-filter="Electric">Electric</button>
              <button class="filter-btn" data-filter="Luxury Sedan">Luxury Sedan</button>
              <button class="filter-btn" data-filter="SUV">SUV</button>
            </div>

            <!-- Sub-categories for Motorcycles -->
            <div class="filter-buttons" data-parent-category="Motorcycles" style="display:none;">
              <button class="filter-btn" data-filter="All">All Motorcycles</button>
              <button class="filter-btn" data-filter="Traditional Commuter Scooters">Commuter Scooters</button>
              <button class="filter-btn" data-filter="Maxi-Scooters">Maxi-Scooters</button>
              <button class="filter-btn" data-filter="Underbones">Underbones</button>
            </div>

            <!-- Sub-categories for Recreational Vehicles -->
            <div class="filter-buttons" data-parent-category="Recreational" style="display:none;">
              <button class="filter-btn" data-filter="All">All RVs</button>
              <button class="filter-btn" data-filter="Motorhomes">Motorhomes</button>
              <button class="filter-btn" data-filter="Conversion Vans">Conversion Vans</button>
              <button class="filter-btn" data-filter="Travel Trailers">Travel Trailers</button>
            </div>
          </div>
        </div>
      </div>

      <section class="top-picks-section" aria-labelledby="top-picks-title">
        <div class="section-header-row top-picks-heading">
          <div>
            <h2 id="top-picks-title" class="section-title-small">Top 3 Picks</h2>
            <p class="section-subtitle">A quick shortlist for every kind of journey.</p>
          </div>
        </div>
        <div id="top-picks-grid" class="top-picks-grid"></div>
      </section>

      <!-- Favorites Section -->
      <div id="favorites-section" class="favorites-section" style="display: none;">
        <div class="section-header-row">
          <div>
            <h2 class="section-title-small">⭐ Your Favorite Vehicles</h2>
            <p class="section-subtitle">Your saved vehicles for quick access.</p>
          </div>
        </div>
        <div class="cars-grid" id="favorites-grid"></div>
      </div>

      <div class="section-header-row rent-results-heading">
        <h2 class="section-title-small">All Vehicles</h2>
        <p class="section-subtitle">Browse our entire collection</p>
      </div>

      <div class="cars-grid" id="cars-grid"></div>

      <div id="no-results" class="no-results" style="display: none; text-align: center; padding: 50px;">
        <h2>No vehicles found</h2>
        <p>Try adjusting your filters or search terms.</p>
        <button id="clear-filters" class="btn-clear-filters">Clear all filters</button>
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
          <a href="rent-a-car.php">Rent a Vehicle</a>
          <a href="aboutpage.php">About Us</a>
          <a href="dashboard.php">Dashboard</a>
        </div>
      </div>

      <div class="footer-section">
        <h3 class="footer-title">Plan Your Journey</h3>
        <div class="footer-links">
          <a href="aboutpage.php#contact-us" class="contact-link">Contact Us</a>
          <a href="#" class="legal-link" data-content="terms">Terms &amp; Conditions</a>
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

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script defer src="js/supabase.js"></script>
  <script defer src="js/data.js?v=20260904"></script>
  <script defer src="js/shared.js?v=20260906"></script>
  <script defer src="js/rent-a-car.js?v=20260906"></script>
</body>
</html>