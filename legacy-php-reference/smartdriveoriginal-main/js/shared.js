/**
 * @file shared.js
 * This file contains centralized logic used across multiple pages of the SmartDrive™ application.
 * It includes functions for handling the legal modal, mobile navigation, authentication state,
 * wallet transactions, and toast notifications to ensure consistency and reduce code duplication.
 */

// --- 1. Legal Content & Modal Logic ---

/**
 * An object containing the static HTML content for the legal modals (Terms & Conditions, Privacy Policy).
 * @const {object}
 */
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

/**
 * This event listener initializes the legal modal functionality once the DOM is fully loaded.
 * It finds all necessary modal elements and attaches event listeners for opening and closing the modal.
 */
document.addEventListener('DOMContentLoaded', () => {
    const legalModal = document.getElementById('legal-modal');
    const closeLegalModalBtn = document.getElementById('close-legal-modal');
    const legalModalTitle = document.getElementById('legal-modal-title');
    const legalModalBody = document.getElementById('legal-modal-body');

    /**
     * Opens the legal modal and populates it with the specified content.
     * @param {('terms'|'privacy')} type - The type of legal content to display.
     */
    function openLegalModal(type) {
        if (legalModal && legalContent[type]) {
            if(legalModalTitle) legalModalTitle.textContent = legalContent[type].title;
            if(legalModalBody) legalModalBody.innerHTML = legalContent[type].content;
            legalModal.style.display = 'flex';
        }
    }

    // Attaches click listeners to all elements with the 'legal-link' class to open the modal.
    document.querySelectorAll('.legal-link').forEach(link => {
        link.addEventListener('click', function(e) { e.preventDefault(); openLegalModal(this.getAttribute('data-content')); });
    });

    // Attaches a click listener to the modal's close button.
    if(closeLegalModalBtn) closeLegalModalBtn.addEventListener('click', () => { legalModal.style.display = 'none'; });
    // Attaches a click listener to the window to close the modal if the user clicks on the background overlay.
    window.addEventListener('click', (event) => { if (event.target === legalModal) { legalModal.style.display = 'none'; } });
});

/**
 * This event listener centralizes the mobile menu toggle functionality.
 * It attaches a click listener to the hamburger button to show/hide the menu
 * and ensures the menu closes when a navigation link is clicked.
 */
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
        });

        // Close menu when a link is clicked
        mobileMenu.querySelectorAll('a, button').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
            });
        });
    }
});

// --- 3. Authentication Logic (Centralized) ---

/**
 * Updates the authentication buttons in both the desktop header and mobile menu.
 * It checks sessionStorage for a logged-in user and displays the appropriate navigation links.
 */
function getCurrentUser() {
  try {
    const storedUser = sessionStorage.getItem('user') || localStorage.getItem('smartdriveUser');
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    return parsedUser && parsedUser.email ? parsedUser : null;
  } catch (error) {
    return null;
  }
}

function showBookingAccountRequired(feature = 'booking') {
  const existingModal = document.getElementById('account-required-modal');
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement('div');
  modal.id = 'account-required-modal';
  modal.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    display: flex; align-items: center; justify-content: center;
    background: rgba(17, 24, 39, 0.52); backdrop-filter: blur(4px);
    padding: 1rem;
  `;

  modal.innerHTML = `
    <div style="width: min(440px, 92vw); background: #fff; border-radius: 24px; box-shadow: 0 30px 70px rgba(17, 24, 39, 0.25); overflow: hidden; border: 1px solid rgba(124,58,237,0.2);">
      <div style="padding: 1.5rem 1.5rem 0.75rem; text-align: center; background: linear-gradient(135deg, rgba(124,58,237,0.06), rgba(192,38,211,0.04));">
        <div style="width: 68px; height: 68px; border-radius: 18px; margin: 0 auto 1rem; display: grid; place-items: center; background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; font-size: 2rem; font-weight: 800;">!</div>
        <h2 style="margin: 0 0 0.5rem; color: #1c1430; font-size: 1.8rem; line-height: 1.2;">Create an account first</h2>
        <p style="margin: 0; color: #6b6384; line-height: 1.6; font-size: 0.98rem;">You need an account before you can use the ${feature} function. Please log in or sign up to continue.</p>
      </div>
      <div style="display: flex; gap: 0.8rem; padding: 1.25rem 1.5rem 1.5rem; justify-content: center; flex-wrap: wrap;">
        <a href="login.php" style="padding: 0.8rem 1.2rem; border-radius: 999px; background: linear-gradient(135deg, #7c3aed, #a855f7); color: #fff; font-weight: 700; text-decoration: none;">Log In</a>
        <a href="signup.php" style="padding: 0.8rem 1.2rem; border-radius: 999px; background: #fff; color: #4c1d95; border: 1.5px solid rgba(124,58,237,0.35); font-weight: 700; text-decoration: none;">Sign Up</a>
      </div>
    </div>
  `;

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.remove();
    }
  });

  document.body.appendChild(modal);
  return modal;
}

function requireAccountForBooking(event) {
  if (getCurrentUser()) {
    return true;
  }

  if (event) {
    event.preventDefault();
  }

  showBookingAccountRequired();
  return false;
}

function getActiveBooking(user = getCurrentUser()) {
  if (!user?.email) return null;

  try {
    const bookings = JSON.parse(localStorage.getItem(`userBookings_${user.email}`) || '[]');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return bookings.find((booking) => {
      const status = String(booking.status || booking.booking_status || '').toLowerCase();
      if (['cancelled', 'canceled', 'completed', 'returned', 'closed'].includes(status)) return false;

      const returnDate = new Date(booking.returnDate || booking.return_date);
      if (Number.isNaN(returnDate.getTime())) return false;
      returnDate.setHours(0, 0, 0, 0);
      return returnDate > today;
    }) || null;
  } catch (error) {
    console.error('Could not check active booking:', error);
    return null;
  }
}

function showActiveBookingRequired(booking) {
  const existingModal = document.getElementById('active-booking-modal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.id = 'active-booking-modal';
  modal.style.cssText = `
    position: fixed; inset: 0; z-index: 9999; display: flex;
    align-items: center; justify-content: center; background: rgba(17, 24, 39, 0.52);
    backdrop-filter: blur(4px); padding: 1rem;
  `;
  const vehicle = booking.vehicleName || booking.vehicle_name || 'your current vehicle';
  const returnDate = booking.returnDate || booking.return_date;
  modal.innerHTML = `
    <div style="width: min(440px, 92vw); background: #fff; border-radius: 24px; padding: 1.5rem; text-align: center; box-shadow: 0 30px 70px rgba(17, 24, 39, 0.25);">
      <h2 style="margin: 0 0 0.75rem; color: #1c1430;">Booking already in progress</h2>
      <p style="margin: 0 0 1rem; color: #6b6384; line-height: 1.6;">
        You are currently using <strong>${vehicle}</strong>. You can book another vehicle after your current booking ends on <strong>${returnDate}</strong>.
      </p>
      <button type="button" id="close-active-booking-modal" style="padding: 0.8rem 1.4rem; border: 0; border-radius: 999px; background: linear-gradient(135deg, #7c3aed, #a855f7); color: #fff; font-weight: 700; cursor: pointer;">Got it</button>
    </div>
  `;
  modal.addEventListener('click', (event) => {
    if (event.target === modal || event.target.closest('#close-active-booking-modal')) modal.remove();
  });
  document.body.appendChild(modal);
}

function requireBookingAvailability(event) {
  if (!requireAccountForBooking(event)) return false;
  const activeBooking = getActiveBooking();
  if (!activeBooking) return true;

  if (event) event.preventDefault();
  showActiveBookingRequired(activeBooking);
  return false;
}

function requireAccountForDashboard(event) {
  if (getCurrentUser()) {
    return true;
  }

  if (event) {
    event.preventDefault();
  }

  showBookingAccountRequired('dashboard');
  return false;
}

document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target.closest('a[href*="dashboard.php"]') : null;
  if (target) {
    requireAccountForDashboard(event);
  }
}, true);

document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target.closest('a[href*="rent-a-car.php"]') : null;
  if (target) requireBookingAvailability(event);
}, true);

function clearAuthState() {
  const storageKeys = [
    'user',
    'isNewUser',
    'smartdriveUser',
    'smartdriveUsers',
    'users',
    'rememberedEmail'
  ];

  storageKeys.forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
}

function updateAuthButtons() {
  const user = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('smartdriveUser') || 'null');
  const isAdmin = Boolean(user && (user.isAdmin || user.email === 'admin@smartrentals.com'));
    const navActions = document.getElementById('auth-buttons');
    const mobileAuthLinks = document.getElementById('mobile-auth-links');
  const userName = document.getElementById('user-name');
  const userBadge = document.getElementById('user-badge');
    const userAvatar = document.getElementById('user-avatar-container');
    const logoutButton = document.getElementById('logout-btn');

  if (userName) {
    const displayName = user?.name || user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ');
    userName.textContent = displayName || 'Account required';
  }
  if (userBadge) {
    userBadge.textContent = user ? (isAdmin ? 'Admin' : 'Member') : 'Sign in required';
    userBadge.classList.toggle('member', Boolean(user));
  }
  if (userAvatar) {
    userAvatar.classList.toggle('member', Boolean(user));
    userAvatar.classList.toggle('guest', !user);
  }
  if (logoutButton) {
    logoutButton.style.display = user ? '' : 'none';
  }

    if (navActions) {
        if (user) {
            navActions.innerHTML = '';
        } else {
            navActions.innerHTML = `<a href="login.php" class="btn-login">Login</a><a href="signup.php" class="btn-signup">Sign Up</a>`;
        }
    }

    if (mobileAuthLinks) {
        // This part can be customized further if mobile layout differs significantly
        mobileAuthLinks.innerHTML = navActions.innerHTML;
    }

}

/**
 * Logs the user out by removing their data from sessionStorage and redirecting to the homepage.
 */
function logout() {
    clearAuthState();
    window.location.href = 'index.php';
}

// Initialize auth buttons on all pages as soon as the DOM is ready.
document.addEventListener('DOMContentLoaded', () => {
  updateAuthButtons();
  if (window.location.pathname.toLowerCase().endsWith('/dashboard.php')) {
    const user = getCurrentUser();
    if (!user) {
      window.location.replace('login.php?reason=account_required');
      return;
    }

    const isAdmin = Boolean(user.isAdmin || user.email === 'admin@smartrentals.com');
    if (isAdmin) {
      window.location.replace('admin.php');
      return;
    }
  }
  document.getElementById('logout-btn')?.addEventListener('click', logout);

  document.addEventListener('click', (event) => {
    const targetLink = event.target.closest('a[href*="calendar-selection.php"]');
    if (!targetLink) return;
    requireAccountForBooking(event);
  });
});

// --- 4. Shared Wallet Transaction Logic ---

/**
 * Retrieves the transaction history for a specific user from localStorage.
 * @param {string} userEmail - The email of the user whose history is being fetched.
 * @returns {Array<object>} An array of transaction objects, or an empty array if none exist.
 */
function getTransactionHistory(userEmail) {
  return JSON.parse(localStorage.getItem(`wallet_history_${userEmail}`) || '[]');
}

/**
 * Adds a new transaction to a user's wallet history in localStorage.
 * @param {string} userEmail - The email of the user.
 * @param {string} description - The SR Points activity description.
 * @param {number} amount - The points change. Positive for earned points, negative for spent points.
 */
function addTransaction(userEmail, description, amount) {
  const history = getTransactionHistory(userEmail);
  const newTransaction = {
    date: new Date().toISOString(),
    description,
    amount
  };
  history.unshift(newTransaction); // Add the new transaction to the beginning of the array.
  localStorage.setItem(`wallet_history_${userEmail}`, JSON.stringify(history));
}

/**
 * Displays a temporary notification message (a "toast") on the screen.
 * @param {string} message - The message to display.
 * @param {'success' | 'error' | 'info'} [type='success'] - The type of notification, which determines its color.
 */
function showToast(message, type = 'success') {
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let backgroundColor;
  switch(type) {
    case 'success':
      backgroundColor = 'var(--primary)';
      break;
    case 'error':
      backgroundColor = 'var(--destructive)';
      break;
    case 'info':
    default:
      backgroundColor = '#3b82f6'; // A neutral blue
      break;
  }

  toast.style.cssText = `
    position: fixed; bottom: 2rem; right: 2rem;
    background-color: ${backgroundColor};
    color: white;
    padding: 1rem 1.5rem; border-radius: 0.75rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    z-index: 1000; animation: slideIn 0.3s ease-out;
    max-width: 400px; word-wrap: break-word;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 4000);
}