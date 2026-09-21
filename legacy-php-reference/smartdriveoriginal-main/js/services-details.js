// --- Legal Modal Logic ---
        // Retrieves the vehicle ID from the URL's query parameters.
    // It checks for both 'id' and 'car' for backward compatibility.
    const urlParams = new URLSearchParams(window.location.search);
    const carId = urlParams.get('id') || urlParams.get('car');

    /**
     * Loads and displays the details of the selected car.
     * It finds the car in the global CARS array using the ID from the URL,
     * then populates the page's HTML elements with the car's data (name, image, specs, etc.).
     * If the car is not found, it displays an error message.
     */
    function loadCarDetails() {
      // Ensure carId is present and the global CARS data is loaded.
      if (!carId || !CARS || CARS.length === 0) {
        console.error('Invalid car ID or CARS data not loaded');
        const main = document.querySelector('main .container') || document.querySelector('main');
        if (main) {
          main.innerHTML = '<p style="color: #ef4444; padding: 2rem;">Car not found. <a href="rent-a-car.php">Back to Fleet</a></p>';
        }
        return;
      }

      const car = CARS.find(c => c.id === carId);
      if (!car) {
        console.error('Car not found');
        const main = document.querySelector('main .container') || document.querySelector('main');
        if (main) {
          main.innerHTML = '<p style="color: #ef4444; padding: 2rem;">Car not found. <a href="rent-a-car.php">Back to Fleet</a></p>';
        }
        return;
      }

      // Update page title
      document.title = `${car.name} - SmartDrive™`;

      // Populate car details
      document.getElementById('car-image').src = car.image || 'https://via.placeholder.com/800x400?text=' + car.name;
      document.getElementById('car-image').alt = car.name;
      document.getElementById('car-badge').textContent = car.type;
      document.getElementById('car-name').textContent = car.name;
      document.getElementById('car-seats').textContent = car.specs?.seats || '5';
      document.getElementById('car-transmission').textContent = car.specs?.transmission || 'Automatic';
      document.getElementById('car-fuel').textContent = car.specs?.fuel || 'Petrol';
      // use price field from CARS array (dailyRate was undefined)
      document.getElementById('car-price').textContent = formatNumber(car.price || 0);
      document.getElementById('car-description').textContent = car.description || 'Experience luxury and comfort with this premium vehicle. Perfect for any occasion.';

      // Populate features
      const featuresContainer = document.getElementById('car-features');
      const features = car.features || [
        'Air Conditioning',
        'Bluetooth Audio',
        'Power Steering',
        'ABS Brakes',
        'Navigation System',
        'Cruise Control'
      ];

      featuresContainer.innerHTML = features.map(feature => `
        <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background-color: rgba(168, 85, 247, 0.05); border-radius: 0.5rem; border-left: 3px solid var(--primary);">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span style="color: var(--muted-foreground);">${feature}</span>
        </div>
      `).join('');

      // Update "Book Now" button to include car ID
      const bookBtn = document.getElementById('book-now-btn');
      bookBtn.href = `calendar-selection.php?vehicle=${carId}`;
        bookBtn.addEventListener('click', (event) => {
          const currentUser = JSON.parse(sessionStorage.getItem('user') || 'null');
          if (!currentUser) {
            event.preventDefault();
            const existingModal = document.getElementById('account-required-modal');
            if (existingModal) existingModal.remove();

            const modal = document.createElement('div');
            modal.id = 'account-required-modal';
            modal.style.cssText = `position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; background: rgba(17, 24, 39, 0.52); backdrop-filter: blur(4px); padding: 1rem;`;
            modal.innerHTML = `
              <div style="width: min(440px, 92vw); background: #fff; border-radius: 24px; box-shadow: 0 30px 70px rgba(17, 24, 39, 0.25); overflow: hidden; border: 1px solid rgba(124,58,237,0.2);">
                <div style="padding: 1.5rem 1.5rem 0.75rem; text-align: center; background: linear-gradient(135deg, rgba(124,58,237,0.06), rgba(192,38,211,0.04));">
                  <div style="width: 68px; height: 68px; border-radius: 18px; margin: 0 auto 1rem; display: grid; place-items: center; background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; font-size: 2rem; font-weight: 800;">!</div>
                  <h2 style="margin: 0 0 0.5rem; color: #1c1430; font-size: 1.8rem; line-height: 1.2;">Create an account first</h2>
                  <p style="margin: 0; color: #6b6384; line-height: 1.6; font-size: 0.98rem;">You need an account before you can use the booking function. Please log in or sign up to continue.</p>
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
          }
        });
      }

    /**
     * Formats a number into a string with comma separators for thousands.
     * @param {number} num - The number to format.
     * @returns {string} The formatted number string (e.g., 1000 becomes "1,000").
     */
    function formatNumber(num) {
      return new Intl.NumberFormat('en-PH', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(num);
    }

    /**
     * Toggles the visibility of the mobile navigation menu.
     * This is typically triggered by a hamburger menu button on smaller screens.
     */
    function toggleMobileMenu() {
      const mobileLinks = document.querySelector('.mobile-nav-links');
      if (mobileLinks) {
        mobileLinks.style.display = mobileLinks.style.display === 'flex' ? 'none' : 'flex';
      }
    }
    /**
     * Updates the header and mobile menu authentication buttons based on the user's login status.
     * If a user is logged in (session data exists), it shows a welcome message and a "Logout" button.
     * Otherwise, it shows "Login" and "Sign Up" links.
     */
    function updateAuthButtons() {
      const navActions = document.querySelector('.nav-actions');
      const mobileLoginBtn = document.querySelector('.mobile-login');
      const mobileSignupBtn = document.querySelector('.mobile-signup');
      
      let user = null;
      try {
        const storedUser = sessionStorage.getItem('user') || localStorage.getItem('smartdriveUser');
        user = storedUser ? JSON.parse(storedUser) : null;
      } catch (error) {
        console.warn('Unable to read authentication state:', error);
      }
      
      if (!navActions) return;

      if (user) {
        navActions.innerHTML = `
          <div style="display: flex; align-items: center; gap: 1rem;">
            <span style="color: var(--muted-foreground); font-size: 0.875rem;">Welcome, ${user.email.split('@')[0]}</span>
            <a href="dashboard.php" style="padding: 0.625rem 1.25rem; border-radius: 0.5rem; background-color: var(--primary); color: white; font-weight: 600; text-decoration: none;">Dashboard</a>
          </div>
        `;
      } else {
        navActions.innerHTML = `
          <a href="login.php" class="btn-login">Login</a>
          <a href="signup.php" class="btn-signup">Sign Up</a>
        `;
      }

      // Update mobile menu buttons
      if (mobileLoginBtn && mobileSignupBtn) {
        if (user) {
          mobileLoginBtn.innerHTML = `<a href="dashboard.php" style="color: var(--primary); text-decoration: none; font-weight: 600;">Dashboard</a>`;
          mobileSignupBtn.innerHTML = '';
        } else {
          mobileLoginBtn.innerHTML = `<a href="login.php" style="color: var(--primary); text-decoration: none; font-weight: 600;">Login</a>`;
          mobileSignupBtn.innerHTML = `<a href="signup.php" style="color: white; text-decoration: none; font-weight: 600; background: var(--primary); padding: 0.5rem 1rem; border-radius: 0.5rem; display: block; text-align: center;">Sign Up</a>`;
        }
      }
    }

    /**
     * Logs the user out by removing their data from sessionStorage.
     * It then redirects to the homepage after a short delay.
     */
    function logout() {
      sessionStorage.removeItem('user');
      localStorage.removeItem('smartdriveUser');
      setTimeout(() => {
        window.location.href = 'index.php';
      }, 500);
    }
    /**
     * This function runs when the DOM is fully loaded.
     * It initializes the authentication buttons, loads car details, and sets up event listeners for the mobile menu.
     */
    document.addEventListener('DOMContentLoaded', function() {
      updateAuthButtons();
      loadCarDetails();

      // Add click handler for mobile menu button
      const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
      if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
      }

      // Close mobile menu when clicking a link
      const mobileLinks = document.querySelectorAll('.mobile-nav-links a, .mobile-nav-links button');
      mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
          const menu = document.querySelector('.mobile-nav-links');
          if (menu) {
            menu.style.display = 'none';
          }
        });
      });
    });

    /**
     * Dynamically injects CSS keyframe animations and responsive styles into the document's head.
     * This keeps animation logic within the script and handles mobile menu layout.
     */
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        .mobile-nav-links {
          display: none;
          position: absolute;
          top: 70px;
          left: 0;
          right: 0;
          background-color: rgba(10, 10, 10, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          flex-direction: column;
          padding: 1rem 0;
          z-index: 100;
        }

        .mobile-nav-links.active {
          display: flex;
        }

        .nav-links {
          display: none;
        }
      }
    `;
    document.head.appendChild(style);