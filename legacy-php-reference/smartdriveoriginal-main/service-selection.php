<?php
// service-selection.php
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Select Your Service - SmartDrive™</title>
  <link rel="stylesheet" href="css/style.css">
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
        <span>SmartDrive<span style="font-size: 10px; margin-left: 2px; opacity: 0.7;">TM</span></span>
      </a>

      <nav class="nav-links">
        <a href="index.php" class="nav-link">Home</a>
        <a href="rent-a-car.php" class="nav-link">Rent a Car</a>
        <a href="aboutpage.php" class="nav-link">About Us</a>
        <a href="dashboard.php" class="nav-link">Dashboard</a>
      </nav>

      <div class="nav-actions">
        <a href="login.php" class="btn-login">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
          Login
        </a>
        <a href="signup.php" class="btn-signup">Sign Up</a>
      </div>

      <button class="mobile-menu-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
      </button>
    </div>
  </header>

  <!-- Service Selection Content -->
  <main>
    <div class="container py-10">
      <header class="page-header">
        <h1 class="page-title">Choose Your Service</h1>
        <p class="page-description">Select the rental service that best fits your needs</p>
      </header>

      <!-- Service Types Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-bottom: 4rem;">
        <!-- Self-Drive Rental -->
        <div class="car-card animate-fade-in" style="animation-delay: 0s;">
          <div style="padding: 3rem 2rem; text-align: center;">
            <div style="width: 5rem; height: 5rem; background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); border-radius: 9999px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; box-shadow: 0 25px 50px -12px rgba(168, 85, 247, 0.3);">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
            </div>
            
            <h2 style="font-size: 1.5rem; font-weight: 900; color: var(--heading); margin-bottom: 0.5rem;">Self-Drive Rental</h2>
            <p style="color: var(--muted-foreground); margin-bottom: 1.5rem; line-height: 1.625;">Drive yourself with our premium fleet of vehicles</p>
            
            <div style="background-color: rgba(255, 255, 255, 0.02); border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 2rem; border: 1px solid rgba(255, 255, 255, 0.05);">
              <div style="display: flex; justify-content: center; align-items: baseline; gap: 0.25rem; margin-bottom: 0.5rem;">
                <span style="font-size: 1rem; font-weight: 900; color: var(--primary);">₱</span>
                <span style="font-size: 2rem; font-weight: 900; color: var(--primary); line-height: 1;">1,500</span>
              </div>
              <p style="font-size: 0.875rem; color: var(--muted-foreground);">Starting price per day</p>
            </div>
            
            <ul style="text-align: left; margin-bottom: 2rem; list-style: none; padding: 0;">
              <li style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; color: var(--muted-foreground);">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Wide selection of vehicles
              </li>
              <li style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; color: var(--muted-foreground);">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Unlimited mileage
              </li>
              <li style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; color: var(--muted-foreground);">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Full insurance coverage
              </li>
              <li style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; color: var(--muted-foreground);">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                24/7 roadside assistance
              </li>
              <li style="display: flex; align-items: center; gap: 0.75rem; color: var(--muted-foreground);">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Flexible rental periods
              </li>
            </ul>
            
            <a href="rent-a-car.php" class="btn-primary" style="text-decoration: none; display: flex; align-items: center; justify-content: center; width: 100%;">
              Browse Fleet
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </a>
          </div>
        </div>

        <!-- Chauffeur Service -->
        <div class="car-card animate-fade-in" style="animation-delay: 0.1s;">
          <div style="padding: 3rem 2rem; text-align: center;">
            <div style="width: 5rem; height: 5rem; background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); border-radius: 9999px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; box-shadow: 0 25px 50px -12px rgba(168, 85, 247, 0.3);">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            
            <h2 style="font-size: 1.5rem; font-weight: 900; color: var(--heading); margin-bottom: 0.5rem;">Chauffeur Service</h2>
            <p style="color: var(--muted-foreground); margin-bottom: 1.5rem; line-height: 1.625;">Relax while our professional drivers take you anywhere</p>
            
            <div style="background-color: rgba(255, 255, 255, 0.02); border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 2rem; border: 1px solid rgba(255, 255, 255, 0.05);">
              <div style="display: flex; justify-content: center; align-items: baseline; gap: 0.25rem; margin-bottom: 0.5rem;">
                <span style="font-size: 1rem; font-weight: 900; color: var(--primary);">₱</span>
                <span style="font-size: 2rem; font-weight: 900; color: var(--primary); line-height: 1;">2,500</span>
              </div>
              <p style="font-size: 0.875rem; color: var(--muted-foreground);">Starting price per day</p>
            </div>
            
            <ul style="text-align: left; margin-bottom: 2rem; list-style: none; padding: 0;">
              <li style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; color: var(--muted-foreground);">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Professional drivers
              </li>
              <li style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; color: var(--muted-foreground);">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Premium vehicles
              </li>
              <li style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; color: var(--muted-foreground);">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Airport transfers
              </li>
              <li style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; color: var(--muted-foreground);">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                City tours available
              </li>
              <li style="display: flex; align-items: center; gap: 0.75rem; color: var(--muted-foreground);">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Meet & greet service
              </li>
            </ul>
            
            <button onclick="showToast('Chauffeur service booking coming soon!', 'info')" class="btn-secondary" style="width: 100%; cursor: pointer;">
              Coming Soon
            </button>
          </div>
        </div>

        <!-- Hourly Rental -->
        <div class="car-card animate-fade-in" style="animation-delay: 0.2s;">
          <div style="padding: 3rem 2rem; text-align: center;">
            <div style="width: 5rem; height: 5rem; background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); border-radius: 9999px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; box-shadow: 0 25px 50px -12px rgba(168, 85, 247, 0.3);">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            
            <h2 style="font-size: 1.5rem; font-weight: 900; color: var(--heading); margin-bottom: 0.5rem;">Hourly Rental</h2>
            <p style="color: var(--muted-foreground); margin-bottom: 1.5rem; line-height: 1.625;">Short-term rental for quick trips around the city</p>
            
            <div style="background-color: rgba(255, 255, 255, 0.02); border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 2rem; border: 1px solid rgba(255, 255, 255, 0.05);">
              <div style="display: flex; justify-content: center; align-items: baseline; gap: 0.25rem; margin-bottom: 0.5rem;">
                <span style="font-size: 1rem; font-weight: 900; color: var(--primary);">₱</span>
                <span style="font-size: 2rem; font-weight: 900; color: var(--primary); line-height: 1;">250</span>
              </div>
              <p style="font-size: 0.875rem; color: var(--muted-foreground);">Starting price per hour</p>
            </div>
            
            <ul style="text-align: left; margin-bottom: 2rem; list-style: none; padding: 0;">
              <li style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; color: var(--muted-foreground);">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Minimum 3 hours
              </li>
              <li style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; color: var(--muted-foreground);">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Perfect for errands
              </li>
              <li style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; color: var(--muted-foreground);">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Quick booking process
              </li>
              <li style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; color: var(--muted-foreground);">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                No daily commitment
              </li>
              <li style="display: flex; align-items: center; gap: 0.75rem; color: var(--muted-foreground);">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Fuel included
              </li>
            </ul>
            
            <button onclick="showToast('Hourly rental booking coming soon!', 'info')" class="btn-secondary" style="width: 100%; cursor: pointer;">
              Coming Soon
            </button>
          </div>
        </div>
      </div>

      <!-- Why Choose Our Services -->
      <div style="background-color: var(--card); border-radius: 1.5rem; border: 1px solid rgba(255, 255, 255, 0.05); padding: 3rem 2rem; margin-bottom: 4rem;">
        <h2 style="font-size: 1.875rem; font-weight: 900; color: var(--heading); text-align: center; margin-bottom: 3rem;">Why Choose SmartDrive™</h2>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem;">
          <div style="text-align: center;">
            <div style="width: 3.5rem; height: 3.5rem; background-color: rgba(168, 85, 247, 0.1); border-radius: 9999px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
            </div>
            <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--heading); margin-bottom: 0.5rem;">Fully Insured</h3>
            <p style="color: var(--muted-foreground); font-size: 0.875rem;">Comprehensive insurance coverage on all vehicles</p>
          </div>
          
          <div style="text-align: center;">
            <div style="width: 3.5rem; height: 3.5rem; background-color: rgba(168, 85, 247, 0.1); border-radius: 9999px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--heading); margin-bottom: 0.5rem;">24/7 Support</h3>
            <p style="color: var(--muted-foreground); font-size: 0.875rem;">Round-the-clock customer service and assistance</p>
          </div>
          
          <div style="text-align: center;">
            <div style="width: 3.5rem; height: 3.5rem; background-color: rgba(168, 85, 247, 0.1); border-radius: 9999px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--heading); margin-bottom: 0.5rem;">Best Prices</h3>
            <p style="color: var(--muted-foreground); font-size: 0.875rem;">Competitive rates with no hidden fees</p>
          </div>
          
          <div style="text-align: center;">
            <div style="width: 3.5rem; height: 3.5rem; background-color: rgba(168, 85, 247, 0.1); border-radius: 9999px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--heading); margin-bottom: 0.5rem;">Quality Fleet</h3>
            <p style="color: var(--muted-foreground); font-size: 0.875rem;">Well-maintained, modern vehicles</p>
          </div>
        </div>
      </div>

      <!-- CTA Section -->
      <div style="background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); border-radius: 1.5rem; padding: 3rem 2rem; text-align: center;">
        <h2 style="font-size: 1.875rem; font-weight: 900; color: white; margin-bottom: 1rem;">Ready to Get Started?</h2>
        <p style="color: rgba(0, 0, 0, 0.7); margin-bottom: 2rem; font-size: 1.125rem;">Browse our fleet and book your perfect vehicle today</p>
        <a href="rent-a-car.php" class="btn-secondary" style="text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; background-color: black; color: white; border: 2px solid black;">
          View All Vehicles
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </a>
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
  <script src="js/data.js"></script>
  <script defer src="js/shared.js?v=20260906"></script>
</body>
</html>
