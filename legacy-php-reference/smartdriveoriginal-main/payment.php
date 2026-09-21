<?php
// payment.php
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="SmartDrive™ - Secure payment processing for your car rental booking.">
  <meta name="theme-color" content="#a855f7">
  <title>Payment - SmartDrive™</title>
  <link rel="stylesheet" href="css/style.css">
  <link rel="preload" href="js/data.js" as="script">
</head>
<body id="payment-page">
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
        <a href="rent-a-car.php" class="nav-link">Rent a Car</a>
        <a href="aboutpage.php" class="nav-link">About Us</a>
        <a href="dashboard.php" class="nav-link">Dashboard</a>
      </nav>
      <div id="auth-buttons" class="nav-actions"></div>
    </div>
  </header>

  <main class="container py-10">
    <!-- Stepper -->
    <div class="stepper-container" style="max-width: 48rem; margin: 0 auto 3rem;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
        <div style="text-align: center; flex: 1;"><div style="width: 2.5rem; height: 2.5rem; background-color: #a855f7; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.5rem; font-weight: 900;">✓</div><p style="font-size: 0.75rem; font-weight: 700; color: #a855f7;">DATES</p></div>
        <div style="text-align: center; flex: 1;"><div style="width: 2.5rem; height: 2.5rem; background-color: #a855f7; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.5rem; font-weight: 900;">✓</div><p style="font-size: 0.75rem; font-weight: 700; color: #a855f7;">DETAILS</p></div>
        <div style="text-align: center; flex: 1;"><div style="width: 2.5rem; height: 2.5rem; background-color: var(--primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.5rem; font-weight: 900;">3</div><p style="font-size: 0.75rem; font-weight: 700; color: var(--primary);">PAYMENT</p></div>
        <div style="text-align: center; flex: 1;"><div style="width: 2.5rem; height: 2.5rem; background-color: rgba(255, 255, 255, 0.1); color: var(--muted-foreground); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.5rem; font-weight: 900;">4</div><p style="font-size: 0.75rem; font-weight: 700; color: var(--muted-foreground);">CONFIRM</p></div>
      </div>
      <div style="height: 2px; background-color: rgba(255, 255, 255, 0.1); border-radius: 9999px; overflow: hidden;">
        <div style="height: 100%; width: 75%; background-color: var(--primary);"></div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 2rem; align-items: start;">
      <!-- Payment Form -->
      <section class="glass-panel" style="padding: 2.5rem;">
        <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--heading); margin-bottom: 2rem; letter-spacing: -0.025em;">PAYMENT INFORMATION</h2>

        <form id="payment-form" style="display: grid; gap: 1.5rem;">
          <!-- Payment Method Selection -->
          <div>
            <label style="font-size: 0.75rem; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase; display: block; margin-bottom: 1rem;">Payment Method</label>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem;">
              <div class="payment-method-option" data-method="credit-card">
                <input type="radio" name="payment_method" value="credit-card" id="card-option" checked style="display: none;" />
                <label for="card-option" class="payment-method-label active">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                  </svg>
                  <span>Credit Card</span>
                </label>
              </div>
              <div class="payment-method-option" data-method="gcash">
                <input type="radio" name="payment_method" value="gcash" id="gcash-option" style="display: none;" />
                <label for="gcash-option" class="payment-method-label">
                  <img src="https://wp.logos-download.com/wp-content/uploads/2020/06/GCash_Logo.png?dl" alt="GCash" style="height: 24px;">
                  <span>GCash</span>
                </label>
              </div>
              <div class="payment-method-option" data-method="maya">
                <input type="radio" name="payment_method" value="maya" id="maya-option" style="display: none;" />
                <label for="maya-option" class="payment-method-label">
                  <img src="https://play-lh.googleusercontent.com/fdQjxsIO8BTLaw796rQPZtLEnGEV8OJZJBJvl8dFfZLZcGf613W93z7y9dFAdDhvfqw" alt="Maya" style="height: 24px; border-radius: 4px;">
                  <span>Maya</span>
                </label>
              </div>
              <div class="payment-method-option" data-method="srpoints">
                <input type="radio" name="payment_method" value="srpoints" id="srpoints-option" style="display: none;" />
                <label for="srpoints-option" class="payment-method-label">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
                  </svg>
                  <span>Use SR Points</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Credit Card Section -->
          <div id="credit-card-section">
            <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem;">
              <label style="font-size: 0.75rem; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase;">Card Holder Name</label>
              <input type="text" id="card-holder" placeholder="John Doe" autocomplete="cc-name" style="background: var(--background); border: 1px solid var(--border); border-radius: 0.5rem; padding: 0.8rem; color: var(--foreground);">
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem;">
              <label style="font-size: 0.75rem; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase;">Card Number</label>
              <input type="text" id="card-number" placeholder="1234 5678 9012 3456" inputmode="numeric" autocomplete="cc-number" maxlength="19" style="background: var(--background); border: 1px solid var(--border); border-radius: 0.5rem; padding: 0.8rem; color: var(--foreground); font-family: monospace; letter-spacing: 0.15em;">
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1rem;">
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <label style="font-size: 0.75rem; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase;">Expiry Date</label>
                <input type="text" id="expiry-date" placeholder="MM/YY" inputmode="numeric" autocomplete="cc-exp" maxlength="5" style="background: var(--background); border: 1px solid var(--border); border-radius: 0.5rem; padding: 0.8rem; color: var(--foreground);">
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <label style="font-size: 0.75rem; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase;">CVV</label>
                <input type="password" id="cvv" placeholder="***" inputmode="numeric" autocomplete="cc-csc" maxlength="4" style="background: var(--background); border: 1px solid var(--border); border-radius: 0.5rem; padding: 0.8rem; color: var(--foreground);">
              </div>
            </div>
          </div>

          <!-- Maya Section -->
          <div id="maya-section" style="display: none;">
            <div class="e-wallet-instructions">
              <div class="qr-placeholder">
                <p>QR Under Development</p>
              </div>
              <div class="e-wallet-text">
                <p class="e-wallet-title">Maya Payment Instructions</p>
                <p class="e-wallet-desc">
                  Send the exact amount to the Maya number below and enter the transaction ID to confirm.
                </p>
                <div class="e-wallet-number">0917 987 6543</div>
              </div>
            </div>
            <!-- New Customer Fields for Maya -->
             <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1.5rem;">
              <label style="font-size: 0.75rem; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase;">Maya Transaction ID</label>
              <input type="text" id="maya-ref" placeholder="Enter Maya transaction ID" style="background: var(--background); border: 1px solid var(--border); border-radius: 0.5rem; padding: 0.8rem; color: var(--foreground);">
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem;">
              <label style="font-size: 0.75rem; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase;">Full Name</label>
              <input type="text" id="maya-name" placeholder="Full Name" class="form-input">
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem;">
              <label style="font-size: 0.75rem; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase;">Address</label>
              <input type="text" id="maya-address" placeholder="Address" class="form-input">
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem;">
              <label style="font-size: 0.75rem; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase;">Phone Number</label>
              <input type="tel" id="maya-phone" placeholder="Phone Number" class="form-input">
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem;">
              <label style="font-size: 0.75rem; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase;">License Type</label>
              <input type="text" id="maya-license" placeholder="e.g., Non-Professional" class="form-input">
            </div>
          </div>

          <!-- GCash Section -->
          <div id="gcash-section" style="display: none;">
            <div class="e-wallet-instructions">
              <div class="qr-placeholder">
                <img src="https://images.seeklogo.com/logo-png/52/2/gcash-logo-png_seeklogo-522261.png" alt="GCash logo">
              </div>
              <div class="e-wallet-text"><p class="e-wallet-title">GCash Payment Instructions</p><p class="e-wallet-desc">Send the exact amount to the GCash number below and enter the transaction reference number to confirm.</p><div class="e-wallet-number">0917 123 4567</div></div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1.5rem;"><label style="font-size: 0.75rem; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase;">Reference Number</label><input type="text" id="gcash-ref" placeholder="GCash reference number" style="background: var(--background); border: 1px solid var(--border); border-radius: 0.5rem; padding: 0.8rem; color: var(--foreground);"></div>
            <!-- New Customer Fields for GCash --><div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem;"><label style="font-size: 0.75rem; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase;">Full Name</label><input type="text" id="gcash-name" placeholder="Full Name" class="form-input"></div><div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem;"><label style="font-size: 0.75rem; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase;">Address</label><input type="text" id="gcash-address" placeholder="Address" class="form-input"></div><div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem;"><label style="font-size: 0.75rem; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase;">Phone Number</label><input type="tel" id="gcash-phone" placeholder="Phone Number" class="form-input"></div><div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem;"><label style="font-size: 0.75rem; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase;">License Type</label><input type="text" id="gcash-license" placeholder="e.g., Non-Professional" class="form-input"></div>
          </div>

          <!-- SR Points Section -->
          <div id="srpay-section" style="display: none; background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.2); border-radius: 1rem; padding: 1.5rem;">
            <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--heading); margin-top: 0; margin-bottom: 1.5rem;">Use SR Points</h3>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              <p style="color: var(--muted-foreground); font-size: 0.9rem; text-align: center; line-height: 1.6;">
                Your SR Points will be deducted from your account and applied as a discount. 1 point equals ₱1 off.
              </p>
              <div id="wallet-balance-info" style="text-align: center; margin-top: 0.5rem;">
                <p style="font-size: 0.8rem; color: var(--muted-foreground); margin: 0;">Available SR Points</p>
                <p id="wallet-balance" class="wallet-balance-display" style="font-size: 1.75rem; font-weight: 800; color: var(--primary); margin: 0.25rem 0 0 0;">₱0</p>
              </div>
              <div id="wallet-status-message" style="text-align: center; font-weight: 600; font-size: 0.9rem;"></div>
            </div>
          </div>

          <!-- Billing Address -->
          <div id="billing-address-section" style="border-top: 1px solid var(--border); padding-top: 1.5rem;">
            <h3 style="font-size: 0.875rem; font-weight: 700; color: var(--heading); margin-bottom: 1rem;">Billing Address</h3>
            
            <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem;">
              <label style="font-size: 0.75rem; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase;">Full Address</label>
              <input type="text" id="billing-address" placeholder="123 Main Street" style="background: var(--background); border: 1px solid var(--border); border-radius: 0.5rem; padding: 0.8rem; color: var(--foreground);">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <label style="font-size: 0.75rem; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase;">City</label>
                <input type="text" id="billing-city" placeholder="Manila" style="background: var(--background); border: 1px solid var(--border); border-radius: 0.5rem; padding: 0.8rem; color: var(--foreground);">
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <label style="font-size: 0.75rem; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase;">Postal Code</label>
                <input type="text" id="billing-postal" placeholder="1000" style="background: var(--background); border: 1px solid var(--border); border-radius: 0.5rem; padding: 0.8rem; color: var(--foreground);">
              </div>
            </div>
          </div>

          <!-- Terms & Conditions -->
          <div style="display: flex; align-items: flex-start; gap: 0.75rem; padding-top: 1rem;">
            <input type="checkbox" id="terms-agree" style="margin-top: 0.25rem; cursor: pointer;">
            <label for="terms-agree" style="font-size: 0.875rem; color: var(--muted-foreground); cursor: pointer;">
              I agree to the <a href="#" class="legal-link" data-content="terms" style="color: var(--primary); text-decoration: underline;">Terms and Conditions</a> and <a href="#" class="legal-link" data-content="privacy" style="color: var(--primary); text-decoration: underline;">Privacy Policy</a>
            </label>
          </div>

          <!-- Submit Button -->
          <button type="submit" class="btn-confirm" style="margin-top: 1.5rem; width: 100%;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 10px;">
              <path d="M12 2v20m10-10H2"></path>
            </svg>
            COMPLETE PAYMENT
          </button>

          <!-- Loading State -->
          <div id="payment-loading" style="display: none; text-align: center; padding: 2rem;">
            <div style="width: 2.5rem; height: 2.5rem; border: 3px solid rgba(255,255,255,0.2); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;" style="--spin: spin 1s linear infinite;"></div>
            <p style="color: var(--muted-foreground);">Processing your payment...</p>
          </div>

          <!-- Error Message -->
          <div id="payment-error" style="display: none; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 0.5rem; padding: 1rem; color: #dc2626;"></div>

          <!-- Success Message -->
          <div id="payment-success" style="display: none; background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 0.5rem; padding: 1rem; color: #a855f7;">
            Payment successful! Redirecting to confirmation...
          </div>
        </form>
      </section>

      <!-- Payment Summary Sidebar -->
      <aside class="glass-panel" style="padding: 2rem; position: sticky; top: 100px;">
        <h2 style="font-size: 1.1rem; font-weight: 800; color: var(--heading); margin-bottom: 1.5rem;">PAYMENT SUMMARY</h2>

        <!-- Vehicle Details -->
        <div style="margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border);">
          <div id="vehicle-preview" style="text-align: center;">
            <img id="vehicle-image" src="" alt="Vehicle" style="width: 100%; height: 150px; object-fit: cover; border-radius: 0.5rem; margin-bottom: 1rem; display: none;">
            <h3 id="vehicle-name" style="color: var(--heading); font-weight: 700; margin-bottom: 0.25rem;">Loading...</h3>
            <p id="vehicle-type" style="color: var(--muted-foreground); font-size: 0.875rem;">-</p>
          </div>
        </div>

        <!-- Booking Details -->
        <div style="margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border);">
          <h4 style="font-size: 0.875rem; font-weight: 700; color: var(--heading); margin-bottom: 0.75rem;">Booking Details</h4>
          <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.875rem;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--muted-foreground);">Pick-up Date:</span>
              <span id="summary-pickup" style="color: var(--heading); font-weight: 600;">-</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--muted-foreground);">Return Date:</span>
              <span id="summary-return" style="color: var(--heading); font-weight: 600;">-</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--muted-foreground);">Duration:</span>
              <span id="summary-duration" style="color: var(--heading); font-weight: 600;">-</span>
            </div>
          </div>
        </div>

        <!-- Pricing Breakdown -->
        <div style="margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.75rem;">
            <span style="color: var(--muted-foreground);">Daily Rate</span>
            <span id="summary-daily-rate" style="color: var(--heading); font-weight: 600;">₱0</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.75rem;">
            <span style="color: var(--muted-foreground);">Rental Days</span>
            <span id="summary-days" style="color: var(--heading); font-weight: 600;">0</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.75rem;">
            <span style="color: var(--muted-foreground);">Subtotal</span>
            <span id="subtotal" style="color: var(--heading); font-weight: 600;">₱0</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.75rem;">
            <span style="color: var(--muted-foreground);">Insurance</span>
            <span style="color: var(--heading); font-weight: 600;">₱500</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 1rem;">
            <span style="color: var(--muted-foreground);">Discount</span>
            <span id="discount-amount" style="color: #a855f7; font-weight: 600;">-₱0</span>
          </div>

          <div style="border-top: 1px solid var(--border); padding-top: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: var(--heading); font-weight: 700;">Total Amount</span>
              <span id="total-price-display" style="color: var(--primary); font-size: 1.5rem; font-weight: 900;">₱0</span>
            </div>
          </div>
        </div>

        <!-- Security Badge -->
        <div style="background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 0.5rem; padding: 1rem; text-align: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 0.5rem;">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <p style="font-size: 0.75rem; color: #a855f7; font-weight: 600;">Secure Payment</p>
          <p style="font-size: 0.7rem; color: rgba(168, 85, 247, 0.7);">SSL Encrypted</p>
        </div>
      </aside>
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
          <a href="#">Help Center</a>
          <a href="#">Contact Us</a>
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
        <div class="modal-body" id="legal-modal-body" style="max-height: 70vh; overflow-y: auto;"></div>
        <div class="modal-footer">
          <p style="font-size: 0.8rem; color: var(--muted-foreground);">Last Updated: March 15, 2026</p>
        </div>
      </div>
    </div>

  <script defer src="js/data.js"></script>
  <script defer src="js/shared.js?v=20260906"></script>
  <script defer src="js/payment.js?v=20260906"></script>
</body>
</html>
