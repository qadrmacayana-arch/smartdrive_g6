<?php
// settings.php
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Settings - SmartDrive™</title>
  <link rel="stylesheet" href="css/style.css?v=20260906-settings">
</head>
<body>
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
      <div class="nav-actions" id="auth-buttons"></div>
    </div>
  </header>

  <main class="container py-10 settings-page" style="padding-top: 2rem; padding-bottom: 5rem;">
    <h1 class="page-title">Account Settings</h1>
    <p class="page-description">Manage your personal information and security.</p>

    <div class="settings-columns">
    <form id="settings-form" class="bg-card border rounded-2xl p-8 mt-6 settings-credentials-card">
      
      <div class="form-group">
        <label class="form-label" for="settings-name">Full Name</label>
        <input type="text" id="settings-name" class="form-input" required>
      </div>

      <div class="form-group">
        <label class="form-label" for="settings-birthday">Birthday</label>
        <input type="date" id="settings-birthday" class="form-input">
      </div>

      <div class="form-group">
        <label class="form-label" for="settings-address">Complete Address</label>
        <input type="text" id="settings-address" class="form-input" placeholder="Street, City, Province">
      </div>

      <div class="form-group">
        <label class="form-label" for="settings-gender">Gender</label>
        <div class="select-wrapper">
          <select id="settings-gender" class="form-input">
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="settings-email">Email Address</label>
        <input type="email" id="settings-email" class="form-input" required>
      </div>

      <div class="form-group">
        <label class="form-label" for="settings-phone">Phone Number</label>
        <input type="tel" id="settings-phone" class="form-input" required autocomplete="tel">
      </div>

      <hr class="border-t border-border my-8">

      <div class="form-group">
        <label class="form-label" for="settings-password">New Password (leave blank to keep current)</label>
        <input type="password" id="settings-password" class="form-input" placeholder="••••••••">
      </div>

      <div class="form-group">
        <label class="form-label" for="settings-confirm">Confirm New Password</label>
        <input type="password" id="settings-confirm" class="form-input" placeholder="••••••••">
      </div>

      <hr class="border-t border-border my-8">


      <div id="settings-message" style="display:none; margin-bottom:1rem; padding:1rem; border-radius:0.5rem; text-align: center; font-weight: 500;"></div>

      <button type="submit" class="btn-submit" style="width: 100%; margin-top: 1rem;">Save Changes</button>
    </form>

    <section class="settings-danger-card bg-card border rounded-2xl p-8 mt-6">
      <span class="settings-danger-label">Danger zone</span>
      <h2>Delete Account</h2>
      <p>This permanently removes your local account data, saved bookings, SR Points, and sign-in session from this browser.</p>
      <button type="button" id="delete-account-btn" class="settings-delete-btn">Delete My Account</button>
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
  <script src="js/data.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="js/supabase.js?v=20260906"></script>
  <script>
    // --- Legal Modal Logic ---
    const legalModal = document.getElementById('legal-modal');
    const closeLegalModalBtn = document.getElementById('close-legal-modal');
    const legalModalTitle = document.getElementById('legal-modal-title');
    const legalModalBody = document.getElementById('legal-modal-body');

    const legalContent = {
      terms: {
        title: 'Terms and Conditions',
        content: `
          <h4 style="color: var(--primary); margin-top: 1rem; margin-bottom: 0.5rem;">1. Rental Agreement</h4>
          <p>This agreement is between SmartDrive™ ('the Company') and the renter. By renting a vehicle, the renter agrees to all terms and conditions. The renter must be at least 21 years old and possess a valid driver's license recognized in the Philippines.</p>
          <h4 style="color: var(--primary); margin-top: 1rem; margin-bottom: 0.5rem;">2. Vehicle Use</h4>
          <p>The vehicle shall not be used for any illegal purpose, for racing, or outside the designated geographical limits without prior consent. The renter is responsible for all traffic violations and fines incurred during the rental period.</p>
          <h4 style="color: var(--primary); margin-top: 1rem; margin-bottom: 0.5rem;">3. Payment and Charges</h4>
          <p>All rental charges are to be paid in Philippine Peso (PHP). A security deposit is required upon vehicle pick-up. The final rental cost will include the daily rate, insurance, and any additional services availed. Late returns will be charged at 1.5x the daily rate.</p>
          <h4 style="color: var(--primary); margin-top: 1rem; margin-bottom: 0.5rem;">4. Insurance and Liability</h4>
          <p>All vehicles are covered by Comprehensive Insurance as mandated by Philippine law. In case of an accident, the renter is liable for a participation fee. The renter is responsible for any damage not covered by the insurance.</p>
          <h4 style="color: var(--primary); margin-top: 1rem; margin-bottom: 0.5rem;">5. Governing Law</h4>
          <p>This agreement shall be governed by the laws of the Republic of the Philippines. Any disputes shall be settled in the courts of Quezon City, Philippines.</p>
        `
      },
      privacy: {
        title: 'Privacy Policy',
        content: `
          <p>This Privacy Policy is in compliance with the Republic Act No. 10173, also known as the Data Privacy Act of 2012 of the Philippines.</p>
          <h4 style="color: var(--primary); margin-top: 1rem; margin-bottom: 0.5rem;">1. Information We Collect</h4>
          <p>We collect personal information such as your name, email address, contact number, birthday, address, and driver's license details upon registration and booking. We also collect non-personal data like browsing behavior to improve our services.</p>
          <h4 style="color: var(--primary); margin-top: 1rem; margin-bottom: 0.5rem;">2. Use of Information</h4>
          <p>Your data is used to process bookings, facilitate payments, communicate with you, and improve our platform. We may use your information for marketing purposes, from which you can opt-out at any time.</p>
          <h4 style="color: var(--primary); margin-top: 1rem; margin-bottom: 0.5rem;">3. Data Sharing and Security</h4>
          <p>We do not sell your personal data. We may share your information with trusted third-party partners (e.g., payment gateways) only for the purpose of providing our services. We implement robust security measures to protect your data from unauthorized access.</p>
          <h4 style="color: var(--primary); margin-top: 1rem; margin-bottom: 0.5rem;">4. Your Rights as a Data Subject</h4>
          <p>Under the Data Privacy Act of 2012, you have the right to access, correct, and erase your personal data. For any inquiries or to exercise your rights, please contact our Data Protection Officer at <a href="mailto:dpo@smartdrive.com" style="color: var(--primary);">dpo@smartdrive.com</a>.</p>
          <h4 style="color: var(--primary); margin-top: 1rem; margin-bottom: 0.5rem;">5. Contact Information</h4>
          <p>For any privacy-related concerns, you may contact us at our office located near the Technological Institute of the Philippines, Quezon City, or via email.</p>
        `
      }
    };

    function openLegalModal(type) {
      if (legalContent[type]) {
        legalModalTitle.textContent = legalContent[type].title;
        legalModalBody.innerHTML = legalContent[type].content;
        legalModal.style.display = 'flex';
      }
    }

    document.querySelectorAll('.legal-link').forEach(link => {
      link.addEventListener('click', function(e) { e.preventDefault(); openLegalModal(this.getAttribute('data-content')); });
    });

    closeLegalModalBtn.addEventListener('click', () => { legalModal.style.display = 'none'; });
    window.addEventListener('click', (event) => { if (event.target === legalModal) { legalModal.style.display = 'none'; } });

    function updateAuthButtons() {
      const user = JSON.parse(sessionStorage.getItem('user') || 'null');
      const authButtons = document.getElementById('auth-buttons');

      if (user) {
        authButtons.innerHTML = `
          <div class="flex items-center gap-4">
            <span class="text-sm text-muted-foreground">${user.email}</span>
            <button onclick="logout()" style="padding:0.625rem 1.25rem;border-radius:0.5rem;background:none;color:var(--primary);border:2px solid var(--primary);font-weight:600;cursor:pointer;">Logout</button>
          </div>
        `;
      } else {
        authButtons.innerHTML = `
          <a href="login.php" class="btn-login">Login</a>
          <a href="signup.php" class="btn-signup">Sign Up</a>
        `;
      }
    }

    function logout() {
      sessionStorage.removeItem('user');
      window.location.href = 'index.php';
    }

    function showMessage(text, success=true) {
      const msg = document.getElementById('settings-message');
      msg.style.display = 'block';
      msg.style.background = success ? 'rgba(168, 85, 247, 0.1)' : 'rgba(239, 68, 68, 0.1)';
      msg.style.border = success ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)';
      msg.style.color = success ? '#a855f7' : '#ef4444';
      msg.textContent = text;
      
      // Scroll to message so user sees it
      msg.scrollIntoView({ behavior: 'smooth', block: 'center' });

      setTimeout(() => { 
        msg.style.display='none'; 
      }, 4000);
    }

    // --- Initialization ---
    window.addEventListener('load', function() {
      updateAuthButtons();
      
      // Load current user from session
      const user = JSON.parse(sessionStorage.getItem('user') || 'null');
      
      if (!user) {
        window.location.href = 'login.php';
        return;
      }

      // Populate form with existing data
      document.getElementById('settings-name').value = user.fullName || '';
      document.getElementById('settings-email').value = user.email || '';
      document.getElementById('settings-phone').value = user.phone || '';
      document.getElementById('settings-birthday').value = user.birthday || '';
      document.getElementById('settings-address').value = user.address || '';
      document.getElementById('settings-gender').value = user.gender || '';

      // Handle form submission
      document.getElementById('settings-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('settings-name').value.trim();
        const email = document.getElementById('settings-email').value.trim();
        const phone = document.getElementById('settings-phone').value.trim();
        const birthday = document.getElementById('settings-birthday').value;
        const address = document.getElementById('settings-address').value.trim();
        const gender = document.getElementById('settings-gender').value;
        const pwd = document.getElementById('settings-password').value;
        const confirm = document.getElementById('settings-confirm').value;

        // Validation
        if (!name || !email || !phone) {
          showMessage('Name, email, and phone number cannot be blank', false);
          return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          showMessage('Please enter a valid email address', false);
          return;
        }
        
        if (pwd && pwd.length < 6) {
          showMessage('Password must be at least 6 characters', false);
          return;
        }
        
        if (pwd && pwd !== confirm) {
          showMessage('Passwords do not match', false);
          return;
        }

        const supabaseClient = window.smartdriveSupabase;
        if (supabaseClient) {
          const { data: authData, error: authLookupError } = await supabaseClient.auth.getUser();
          if (authLookupError || !authData.user) {
            showMessage('Your Supabase session has expired. Please log in again.', false);
            return;
          }

          const authChanges = { email };
          if (pwd) authChanges.password = pwd;
          const { error: authUpdateError } = await supabaseClient.auth.updateUser(authChanges);
          if (authUpdateError) {
            showMessage(`Supabase account update failed: ${authUpdateError.message}`, false);
            return;
          }

          const { error: profileUpdateError } = await supabaseClient
            .from('profiles')
            .update({
              email,
              full_name: name,
              birthday: birthday || null,
              address: address || null,
              gender: gender || 'prefer_not_to_say',
              phone
            })
            .eq('id', authData.user.id);
          if (profileUpdateError) {
            showMessage(`Profile update failed: ${profileUpdateError.message}`, false);
            return;
          }
        }

        // Update Permanent Storage (localStorage)
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        // Find user by their original email (stored in the session)
        const existingIndex = users.findIndex(u => u.email === user.email);
        
        if (existingIndex !== -1) {
          users[existingIndex].name = name;
          users[existingIndex].email = email;
          users[existingIndex].phone = phone;
          users[existingIndex].birthday = birthday;
          users[existingIndex].address = address;
          users[existingIndex].gender = gender;
          if (pwd) users[existingIndex].password = pwd;
          
          localStorage.setItem('users', JSON.stringify(users));
        }

        // Update Current Session (sessionStorage)
        const updatedUser = {
          ...user,
          fullName: name,
          email: email,
          phone: phone,
          birthday: birthday,
          address: address,
          gender: gender
        };
        sessionStorage.setItem('user', JSON.stringify(updatedUser));

        showMessage('Settings saved successfully!');
        
        // Optional: Refresh auth buttons to show new email if it changed
        updateAuthButtons();
      });

      document.getElementById('delete-account-btn').addEventListener('click', async function() {
        if (!confirm('Delete your account and all saved local data from this browser? This cannot be undone.')) return;

        if (window.smartdriveSupabase) {
          const { error } = await window.smartdriveSupabase.rpc('delete_my_account');
          if (error) {
            showMessage(`Supabase account deletion failed: ${error.message}`, false);
            return;
          }
        }

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        localStorage.setItem('users', JSON.stringify(users.filter(savedUser => savedUser.email !== user.email)));
        [
          `userBookings_${user.email}`,
          `wallet_history_${user.email}`,
          `srPoints_${user.email}`,
          `lastTopUp_${user.email}`
        ].forEach(key => localStorage.removeItem(key));
        sessionStorage.clear();
        localStorage.removeItem('smartdriveUser');
        showMessage('Account data deleted. Redirecting...', true);
        setTimeout(() => { window.location.href = 'index.php'; }, 900);
      });
    });
  </script>
</body>
</html>