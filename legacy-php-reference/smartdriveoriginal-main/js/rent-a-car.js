/**
 * @file rent-a-car.js
 * This file contains the logic for the main vehicle listing page.
 * It handles rendering the vehicle grid, filtering by type, searching, and managing user favorites.
 */

/**
 * Formats a number with commas for thousands separation.
 * @param {number} num - The number to format.
 * @returns {string} The formatted number string.
 */
function formatNumber(num) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function showAccountRequiredModal() {
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
     return modal;
    }

    function requireAccountForBooking(event) {
     return requireBookingAvailability(event);
    }

    // Global state variables for the current filter and search query.
    let currentMainCategory = 'All';
    let currentFilter = 'All';
    let currentSearch = '';

    const mainCategoryTypes = {
      'Cars': ['Electric', 'Luxury Sedan', 'SUV'],
      'Motorcycles': ['Traditional Commuter Scooters', 'Maxi-Scooters', 'Underbones'],
      'Recreational': ['Motorhomes', 'Conversion Vans', 'Travel Trailers']
    };

    async function loadFleetFromDatabase() {
      try {
        let vehicles;
        if (window.smartdriveSupabase) {
          const { data, error } = await window.smartdriveSupabase
            .from('vehicles')
            .select('*')
            .neq('status', 'archived')
            .order('created_at', { ascending: false });
          if (error) throw new Error(error.message || 'Could not load vehicles from Supabase.');
          vehicles = data;
        } else {
          const response = await fetch('api/vehicles.php');
          const result = await response.json();
          if (!response.ok || !result.success || !Array.isArray(result.vehicles)) {
            throw new Error(result.message || 'Could not load vehicles.');
          }
          vehicles = result.vehicles;
        }

        if (!Array.isArray(vehicles) || vehicles.length === 0) {
          throw new Error('The vehicle database returned no vehicles.');
        }

        VEHICLES = vehicles.map(vehicle => ({
          ...vehicle,
          id: String(vehicle.id ?? vehicle.vehicle_id),
          vehicle_id: String(vehicle.vehicle_id ?? vehicle.id),
          specs: vehicle.specs || {
            transmission: vehicle.transmission || 'Automatic',
            fuel: vehicle.fuel || 'Gasoline',
            seats: vehicle.seats || 5
          }
        }));
        CARS = VEHICLES;
        localStorage.setItem('fleetData', JSON.stringify(VEHICLES));
      } catch (error) {
        console.warn('Could not load vehicles from database. Using saved fleet data.', error);
        VEHICLES = getFleet();
        CARS = VEHICLES;
      }
    }

    /**
     * Retrieves the list of favorite car IDs from localStorage.
     * @returns {Array<string>} An array of vehicle IDs.
     */
    function getFavorites() {
      return JSON.parse(localStorage.getItem('favoriteCars') || '[]');
    }

    function renderTopPicks() {
      const container = document.getElementById('top-picks-grid');
      if (!container || typeof VEHICLES === 'undefined') return;

      const pickGroups = [
        { label: 'Cars', types: mainCategoryTypes.Cars },
        { label: 'Motorcycles', types: mainCategoryTypes.Motorcycles },
        { label: 'Recreational Vehicles', types: mainCategoryTypes.Recreational }
      ];

      container.innerHTML = pickGroups.map(group => {
        const picks = VEHICLES.filter(vehicle => vehicle.status !== 'archived' && group.types.includes(vehicle.type)).slice(0, 3);
        if (!picks.length) return '';

        return `
          <article class="top-pick-group">
            <div class="top-pick-group-header">
              <h3>${group.label}</h3>
              <span>3 picks</span>
            </div>
            <div class="top-pick-list">
              ${picks.map((vehicle, index) => `
                <a class="top-pick-item" href="services-details.php?id=${vehicle.id}">
                  <span class="top-pick-rank">0${index + 1}</span>
                  <img src="${vehicle.image}" alt="${vehicle.name}" loading="lazy">
                  <span class="top-pick-info">
                    <strong>${vehicle.name}</strong>
                    <small>${vehicle.type} · ₱${formatNumber(vehicle.price)}/day</small>
                  </span>
                  <span class="top-pick-arrow" aria-hidden="true">↗</span>
                </a>
              `).join('')}
            </div>
          </article>
        `;
      }).join('');
    }

    /**
     * Renders the "Your Favorite Vehicles" section.
     * It filters the main vehicle list based on saved favorites and displays them in a separate grid.
     */
    function renderFavorites() {
      const favoritesSection = document.getElementById('favorites-section');
      const container = document.getElementById('favorites-grid');
      const allFavorites = getFavorites();

      if (typeof VEHICLES === 'undefined') return;

      const favoriteCars = VEHICLES.filter(car => allFavorites.includes(car.id));

      if (favoriteCars.length === 0) {
        favoritesSection.style.display = 'none';
        container.innerHTML = '';
      } else {
        favoritesSection.style.display = 'block';
        container.innerHTML = favoriteCars.map((car, index) => `
          <div class="vehicle-card animate-fade-in" style="animation-delay: ${index * 0.05}s;">
            <div class="car-image">
              <img src="${car.image}" alt="${car.name}" loading="lazy">
              <div class="car-badge-stack">
                <div class="car-badge">${car.type}</div>
                <div class="car-badge" style="background-color: #fbbf24; color: black;">✨ Earn ${car.srPoints || 100} Points</div>
              </div>
            </div>
            <div class="car-content">
              <div>
                <h3 class="car-name">${car.name}</h3>
                <p class="car-condition m-0 text-xs">High Quality Condition</p>
              </div>

              <div class="car-price" style="margin-top: -1.5rem; margin-bottom: 1rem; text-align: right;">
                <span class="price-currency">₱</span>
                <span class="price-amount">${formatNumber(car.price)}</span>
                <span class="price-period">/day</span>
              </div>
              
              <div class="car-specs">
                <div class="car-spec">
                  <div class="spec-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                  <span class="spec-label">${car.specs.seats} Seats</span>
                </div>
                <div class="car-spec">
                  <div class="spec-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
                  <span class="spec-label">${car.specs.transmission}</span>
                </div>
                <div class="car-spec">
                  <div class="spec-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/></svg></div>
                  <span class="spec-label">${car.specs.fuel}</span>
                </div>
              </div>
              
              <div class="flex gap-4">
                <a href="calendar-selection.php?vehicle=${car.id}" class="btn-view-details" style="flex-grow: 1; text-align: center; text-decoration: none; display: flex; align-items: center; justify-content: center;">
                  Book Now
                </a>
                <a href="services-details.php?id=${car.id}" class="btn-icon" title="View Details"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></a>
                <button class="btn-icon favorite-btn-action active" data-car-id="${car.id}" title="Remove from favorites">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                </button>
              </div>
            </div>
          </div>
        `).join('');
      }

      // Add listeners to the buttons inside the favorites section
      addFavoriteButtonListeners();
    }

    /**
     * Renders the main grid of vehicles based on the current search and filter criteria.
     * It filters out archived vehicles and matches against the `currentSearch` and `currentFilter` state.
     * It also handles showing a "no results" message if the filtered list is empty.
     */
    function renderCars() {
      const container = document.getElementById('cars-grid');
      const noResults = document.getElementById('no-results');
      
      const user = JSON.parse(sessionStorage.getItem('user') || 'null');

      if (typeof VEHICLES === 'undefined') {
        console.error('VEHICLES data not loaded');
        container.innerHTML = '<p style="color: var(--heading);">Error loading vehicle data. Please refresh the page.</p>';
        return;
      }
      const favorites = getFavorites();

      const filteredCars = VEHICLES.filter(car => {
        const isAvailable = car.status !== 'archived';
        const matchesSearch = car.name.toLowerCase().includes(currentSearch.toLowerCase()) || car.type.toLowerCase().includes(currentSearch.toLowerCase());
        
        const matchesMainCategory = currentMainCategory === 'All' || mainCategoryTypes[currentMainCategory]?.includes(car.type);
        
        const subCategoryContainer = document.querySelector(`.filter-buttons[data-parent-category="${currentMainCategory}"]`);
        const activeSubFilter = subCategoryContainer ? subCategoryContainer.querySelector('.filter-btn.active')?.dataset.filter : 'All';
        const matchesSubFilter = activeSubFilter === 'All' || car.type === activeSubFilter;

        return isAvailable && matchesSearch && matchesMainCategory && matchesSubFilter;
      });

      if (filteredCars.length === 0) {
        container.style.display = 'none';
        noResults.style.display = 'block';
      } else {
        container.style.display = 'grid';
        noResults.style.display = 'none';
        
        container.innerHTML = filteredCars.map((car, index) => {
          const srPointsHTML = user ? `
            <div class="car-badge" style="background-color: #fbbf24; color: black;">✨ Earn ${car.srPoints || 100} Points</div>
          ` : '';

          return `
          <div class="vehicle-card animate-fade-in" style="animation-delay: ${index * 0.05}s;">
            <div class="car-image">
              <img src="${car.image}" alt="${car.name}" loading="lazy">
              <div class="car-badge-stack">
                <div class="car-badge">${car.type}</div>
                ${srPointsHTML}
              </div>
            </div>
            <div class="car-content">
              <div>
                <h3 class="car-name">${car.name}</h3>
                <p class="car-condition m-0 text-xs">High Quality Condition</p>
              </div>

              <div class="car-price" style="margin-top: -1.5rem; margin-bottom: 1rem; text-align: right;">
                <span class="price-currency">₱</span>
                <span class="price-amount">${formatNumber(car.price)}</span>
                <span class="price-period">/day</span>
              </div>
              
              <div class="car-specs">
                <div class="car-spec">
                  <div class="spec-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                  <span class="spec-label">${car.specs.seats} Seats</span>
                </div>
                <div class="car-spec">
                  <div class="spec-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
                  <span class="spec-label">${car.specs.transmission}</span>
                </div>
                <div class="car-spec">
                  <div class="spec-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/></svg></div>
                  <span class="spec-label">${car.specs.fuel}</span>
                </div>
              </div>
              
              <div class="flex gap-4">
                <a href="calendar-selection.php?vehicle=${car.id}" class="btn-view-details" style="flex-grow: 1; text-align: center; text-decoration: none; display: flex; align-items: center; justify-content: center;">
                  Book Now
                </a>
                <a href="services-details.php?id=${car.id}" class="btn-icon" title="View Details"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></a>
                <button class="btn-icon favorite-btn-action ${favorites.includes(car.id) ? 'active' : ''}" data-car-id="${car.id}" title="Add to favorites"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></button>
              </div>
            </div>
          </div>`;
        }).join('');
      }

      // Add event listeners to the new favorite buttons
      addFavoriteButtonListeners();
    }

    /**
     * Attaches click event listeners to all favorite buttons (star icons) on the page.
     * Handles adding or removing a vehicle ID from the `favoriteCars` array in localStorage
     * and then re-renders the UI to reflect the change.
     */
    function addFavoriteButtonListeners() {
      document.querySelectorAll('.favorite-btn-action').forEach(btn => {
        btn.addEventListener('click', function() {
          const carId = this.dataset.carId;
          let favorites = getFavorites();
          if (favorites.includes(carId)) {
            favorites = favorites.filter(id => id !== carId);
            this.classList.remove('active');
          } else {
            favorites.push(carId);
            this.classList.add('active');
          }
          localStorage.setItem('favoriteCars', JSON.stringify(favorites));
          renderFavorites(); // Re-render favorites section
          renderCars(); // Re-render main grid to update star states
        });
      });
    }

    /**
     * Updates the authentication buttons in the header and mobile menu
     * based on the user's login status from sessionStorage.
     */
    function updateAuthButtons() {
      const user = JSON.parse(sessionStorage.getItem('user') || 'null');
      const authButtons = document.getElementById('auth-buttons');
      const mobileAuthLinks = document.getElementById('mobile-auth-links');

      if (user) {
        authButtons.innerHTML = '';
        mobileAuthLinks.innerHTML = '';
      } else {
        authButtons.innerHTML = `
          <a href="login.php" class="btn-login">Login</a>
          <a href="signup.php" class="btn-signup">Sign Up</a>
        `;
        mobileAuthLinks.innerHTML = `
          <a href="login.php" class="mobile-nav-link">Login</a>
          <a href="signup.php" class="btn-signup" style="text-align: center;">Sign Up</a>
        `;
      }
    }

    /**
     * Logs the user out by clearing sessionStorage and redirecting to the homepage.
     */
    function logout() {
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('isNewUser');
      localStorage.removeItem('smartdriveUser');
      localStorage.removeItem('smartdriveUsers');
      window.location.href = 'index.php';
    }

    /**
     * Main entry point for the page, executed when the DOM is fully loaded.
     * It initializes the UI by rendering cars and favorites, updating auth buttons,
     * and setting up all event listeners for search and filtering.
     */
    document.addEventListener('DOMContentLoaded', async function() {
      document.addEventListener('click', (event) => {
        const targetLink = event.target.closest('a[href*="calendar-selection.php"]');
        if (!targetLink) return;
        requireAccountForBooking(event);
      });

      await loadFleetFromDatabase();
      renderTopPicks();
      renderCars();
      renderFavorites();
      updateAuthButtons();

      document.getElementById('search-input').addEventListener('input', function(e) {
        currentSearch = e.target.value;
        renderCars();
      });

      // Main category switching
      document.querySelectorAll('.main-category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          // Update main category button styles
          document.querySelectorAll('.main-category-btn').forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          currentMainCategory = this.dataset.mainCategory;

          // Show/hide sub-category containers
          document.querySelectorAll('#sub-category-container .filter-buttons').forEach(container => {
            container.style.display = 'none';
          });

          if (currentMainCategory !== 'All') {
            const subCategoryContainer = document.querySelector(`.filter-buttons[data-parent-category="${currentMainCategory}"]`);
            if (subCategoryContainer) {
              subCategoryContainer.style.display = 'flex';
              // Reset sub-filter to 'All' for that category
              subCategoryContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
              subCategoryContainer.querySelector('[data-filter="All"]').classList.add('active');
            }
          }
          
          currentFilter = 'All'; // Reset sub-filter when changing main category
          renderCars();
        });
      });

      // Sub-category filtering
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          // Deactivate other buttons within the same parent container
          this.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          currentFilter = this.dataset.filter;
          renderCars();
        });
      });

      document.getElementById('clear-filters').addEventListener('click', function() {
        currentSearch = '';
        currentMainCategory = 'All';
        document.getElementById('search-input').value = '';
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-filter="All"]').classList.add('active');
        renderCars();
      });
    });