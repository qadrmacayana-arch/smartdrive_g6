// All available promo codes with requirements
    const promoCodes = {
      'WELCOME15': { // This is for new users, handled separately in payment.php
        name: 'New Member Welcome',
        discount: 15,
        description: '15% Off Your First Booking',
        minSpending: 0,
        minBookings: 1,
        locked: false
      },
      'LOYAL10': { // This is a base code, always available for members
        name: 'Standard Member',
        discount: 10,
        description: '10% Off Your Bookings',
        minSpending: 0,
        minBookings: 1,
        locked: false
      },
      'LOYAL15': { // Premium member code
        name: 'Premium Member',
        discount: 15,
        description: '15% Off Your Bookings',
        minSpending: 5000,
        minBookings: 2,
        locked: false
      },
      'LOYAL20': { // Gold member code
        name: 'Gold Member',
        discount: 20,
        description: '20% Off Your Bookings',
        minSpending: 10000,
        minBookings: 3,
        locked: false
      }
    };

    // All available offers and promos (static content for display)
    const allOffers = [
      {
        tag: 'New Members',
        title: '15% OFF Your First Ride',
        description: 'Welcome to SmartDrive! As a new member, enjoy a special discount on your first booking. The discount is applied automatically at checkout.',
        info: 'Code: WELCOME15',
        link: 'rent-a-car.php',
        premium: false
      },
      {
        tag: 'Weekend Deal',
        title: 'Weekend SUV Special',
        description: 'Planning a weekend getaway? Rent any SUV for 3 days and get the 3rd day at 50% off. Perfect for family trips or adventures.',
        info: 'Valid: Fri-Sun',
        link: 'rent-a-car.php?filter=SUV',
        premium: false
      },
      {
        tag: 'Long-Term',
        title: 'Weekly Rental Discount',
        description: 'Rent any vehicle for 7 days or more and receive a 20% discount on the total rental fee. Ideal for longer business trips or vacations.',
        info: 'Min. 7 Days',
        link: 'rent-a-car.php',
        premium: false
      },
      {
        tag: 'Premium Members',
        title: 'Free Upgrade',
        description: 'As a thank you to our loyal premium members, enjoy a complimentary one-class upgrade on your next booking, subject to availability.',
        info: 'Status: 👑',
        link: 'dashboard.php',
        premium: true
      },
      {
        tag: 'Holiday Promo',
        title: 'Extended Weekend Getaway',
        description: 'Book for a 4-day extended weekend and save 25% on your total rental. Perfect for holiday trips and special occasions.',
        info: 'Limited Time Offer',
        link: 'rent-a-car.php',
        premium: false
      },
      {
        tag: 'Corporate',
        title: 'Business Travel Package',
        description: 'Get 15% off when you book 3 or more vehicles for business travel. Includes flexible cancellation and priority support.',
        info: 'For Business Accounts',
        link: 'rent-a-car.php',
        premium: false
      },
      {
        tag: 'Flash Sale',
        title: 'Luxury Car Flash Deal',
        description: 'Rent a luxury vehicle mid-week and get up to 30% off. Available only on Tuesday to Thursday bookings.',
        info: 'Tue-Thu Only',
        link: 'rent-a-car.php',
        premium: false
      }
    ];

    // Claimable Rewards with Tasks (initial state, user-specific state stored in localStorage)
    const claimableRewards = [
      {
        id: 'referral-reward',
        title: '🎯 Refer a Friend',
        description: 'Share your unique code with friends and earn ₱500 discount per successful referral',
        reward: { discount: 15, code: 'REFERRAL15' },
        requirements: [
          { text: 'Invite at least 1 friend', completed: false },
          { text: 'Friend makes their first booking', completed: false }
        ],
        totalRequirements: 2,
        completedRequirements: 0, // This will be calculated dynamically
        claimed: false
      },
      {
        id: 'review-reward',
        title: '⭐ Leave a Review',
        description: 'Share your experience and get a 10% discount on your next booking',
        reward: { discount: 10, code: 'REVIEW10' },
        requirements: [
          { text: 'Complete a booking', completed: false },
          { text: 'Leave a 5-star review', completed: false }
        ],
        totalRequirements: 2,
        completedRequirements: 0, // This will be calculated dynamically
        claimed: false
      },
      {
        id: 'loyalty-milestone',
        title: '🏆 Loyalty Milestone',
        description: 'Reach ₱5,000 lifetime spending and unlock an exclusive 12% discount code',
        reward: { discount: 12, code: 'MILESTONE12' },
        requirements: [
          { text: 'Spend ₱5,000', completed: false }
        ],
        totalRequirements: 1,
        completedRequirements: 0, // This will be calculated dynamically
        claimed: false
      },
      {
        id: 'social-share',
        title: '📱 Share on Social Media',
        description: 'Share SmartDrive on social and get an extra 8% off your next rental',
        reward: { discount: 8, code: 'SOCIAL8' },
        requirements: [
          { text: 'Follow our social media account', completed: false },
          { text: 'Share a booking screenshot', completed: false }
        ],
        totalRequirements: 2,
        completedRequirements: 0, // This will be calculated dynamically
        claimed: false
      },
      {
        id: 'weekend-warrior',
        title: '🚗 Weekend Warrior',
        description: 'Book 3 weekend rentals and earn a 15% weekend-only discount code',
        reward: { discount: 15, code: 'WEEKEND15' },
        requirements: [
          { text: 'Complete 3 weekend bookings', completed: false }
        ],
        totalRequirements: 1,
        completedRequirements: 0, // This will be calculated dynamically
        claimed: false
      },
      {
        id: 'premium-upgrade',
        title: '👑 Go Premium',
        description: 'Spend ₱10,000 and unlock premium status with exclusive 20% discounts',
        reward: { discount: 20, code: 'PREMIUM20' },
        requirements: [
          { text: 'Spend ₱10,000', completed: false },
          { text: 'Complete 5 bookings', completed: false }
        ],
        totalRequirements: 2,
        completedRequirements: 0, // This will be calculated dynamically
        claimed: false
      }
    ];

    /**
     * Calculates and returns the current user's loyalty statistics.
     * It aggregates total spending and booking count from localStorage
     * and determines the user's loyalty tier (guest, standard, premium, gold).
     * @returns {{totalSpent: number, bookingCount: number, loyaltyTier: string}} An object with user stats.
     */
    function getUserLoyaltyStats() {
      const user = JSON.parse(sessionStorage.getItem('user') || 'null');
      if (!user) return { totalSpent: 0, bookingCount: 0, loyaltyTier: 'guest' };

      const storageKey = `userBookings_${user.email}`;
      const bookings = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      let totalSpent = 0;
      bookings.forEach(booking => {
        totalSpent += (booking.totalPrice || 0);
      });

      let loyaltyTier = 'guest';
      if (bookings.length > 0 && totalSpent >= 10000) {
        loyaltyTier = 'gold';
      } else if (bookings.length >= 2 && totalSpent >= 5000) {
        loyaltyTier = 'premium';
      } else if (bookings.length > 0) {
        loyaltyTier = 'standard';
      }

      return {
        totalSpent: totalSpent,
        bookingCount: bookings.length,
        loyaltyTier: loyaltyTier
      };
    }

    // Global variable to hold dynamic promo codes (including claimed ones)
    let dynamicPromoCodes = JSON.parse(localStorage.getItem('dynamicPromoCodes') || JSON.stringify(promoCodes));

    /**
     * Updates the global `dynamicPromoCodes` object and saves it to localStorage.
     * This allows for adding new codes (e.g., from claimed rewards) to the user's available set.
     * @param {string} newCode - The new promo code to add (e.g., 'REVIEW10').
     * @param {object} codeDetails - The details of the new promo code.
     */
    function updateDynamicPromoCodes(newCode, codeDetails) {
      dynamicPromoCodes[newCode] = codeDetails;
      localStorage.setItem('dynamicPromoCodes', JSON.stringify(dynamicPromoCodes));
    }

    /**
     * Retrieves the details for a specific promo code from the dynamic list.
     * @param {string} code - The promo code to look up.
     * @returns {object | undefined} The code's details object, or undefined if not found.
     */
    function getPromoCodeDetails(code) {
      return dynamicPromoCodes[code];
    }

    /**
     * Checks if the user meets the minimum spending and booking requirements for a given promo code.
     * @param {string} code - The promo code to check against.
     * @param {object} stats - The user's loyalty stats from `getUserLoyaltyStats`.
     * @returns {boolean} True if the user qualifies, otherwise false.
     */
    function userQualifiesForCode(code, stats) {
      const codeInfo = getPromoCodeDetails(code);
      if (!codeInfo) return false;

      return stats.bookingCount >= codeInfo.minBookings && 
             stats.totalSpent >= codeInfo.minSpending;
    }

    /**
     * Renders the promo code sections on the page.
     * It iterates through all available codes, checks if the user qualifies for them,
     * and sorts them into "Available" and "Locked" lists with corresponding UI.
     */
    function renderPromoCodeSections() {
      const stats = getUserLoyaltyStats();
      const availableCodesList = document.getElementById('discount-codes-list');
      const lockedCodesList = document.getElementById('locked-codes-list');
      const user = JSON.parse(sessionStorage.getItem('user') || 'null');
      const isGuest = !user;
      const userBookingsKey = user ? `userBookings_${user.email}` : null;
      const userHistory = userBookingsKey ? JSON.parse(localStorage.getItem(userBookingsKey) || '[]') : [];
      const isNewRegisteredUser = user && userHistory.length === 0;

      availableCodesList.innerHTML = '';
      lockedCodesList.innerHTML = '';

      Object.entries(dynamicPromoCodes).forEach(([code, info]) => {
        // Special handling for WELCOME15
        if (code === 'WELCOME15') {
          if (isNewRegisteredUser) {
            const codeItem = document.createElement('div');
            codeItem.className = 'discount-code-item available-code';
            codeItem.innerHTML = `
              <div class="code-details">
                <h4>${info.name}</h4>
                <p class="discount-code-display"><strong>${code}</strong></p>
                <p class="code-description">${info.description}</p>
                <p class="code-badge">✓ Unlocked</p>
              </div>
              <button class="btn-copy-code" onclick="copyToClipboard('${code}')">Copy Code</button>
            `;
            availableCodesList.appendChild(codeItem);
          }
          return; // Skip further processing for WELCOME15 here
        }

        const qualifies = userQualifiesForCode(code, stats);

        if (qualifies) {
          // Available code
          const codeItem = document.createElement('div');
          codeItem.className = 'discount-code-item available-code';
          codeItem.innerHTML = `
            <div class="code-details">
              <h4>${info.name}</h4>
              <p class="discount-code-display"><strong>${code}</strong></p>
              <p class="code-description">${info.description}</p>
              <p class="code-badge">✓ Unlocked</p>
            </div>
            <button class="btn-copy-code" onclick="copyToClipboard('${code}')">Copy Code</button>
          `;
          availableCodesList.appendChild(codeItem);
        } else {
          // Locked code
          const lockItem = document.createElement('div'); // This was missing 'const'
          lockItem.className = 'discount-code-item locked-code';
          
          let requirement = '';
          const needsSpending = stats.totalSpent < info.minSpending;
          const needsBookings = stats.bookingCount < info.minBookings;

          if (needsSpending) {
            const remaining = info.minSpending - stats.totalSpent;
            requirement = `Spend ₱${remaining.toLocaleString()} more`;
          }
          if (needsBookings) {
            const remaining = info.minBookings - stats.bookingCount;
            if (requirement) requirement += ' and ';
            requirement += `Complete ${remaining} more booking${remaining > 1 ? 's' : ''}`;
          }

          lockItem.innerHTML = `
            <div class="code-details">
              <h4>🔒 ${info.name}</h4>
              <p class="discount-code-display locked"><strong>••••••</strong></p>
              <p class="code-description">${info.description}</p>
              <p class="code-requirement">Unlock: ${requirement || 'Keep renting!'}</p>
            </div>
            <button class="btn-copy-code" disabled>Locked</button>
          `;
          lockedCodesList.appendChild(lockItem);
        }
      });
    }

    /**
     * Copies the given promo code string to the user's clipboard.
     * It uses the modern Clipboard API with a fallback for older browsers.
     * @param {string} code - The code to be copied.
     */
    function copyToClipboard(code) {
      navigator.clipboard.writeText(code).then(() => {
        showSuccessNotification(`✓ Code "${code}" copied to clipboard!`);
      }).catch(() => {
        // Fallback for older browsers
        const input = document.createElement('input');
        input.value = code;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showSuccessNotification(`✓ Code "${code}" copied to clipboard!`);
      });
    }

    /**
     * Handles the validation of a promo code entered by the user.
     * It checks if the code exists, if the user is logged in (for member-only codes),
     * and if the user qualifies. It provides UI feedback for each case.
     */
    function validatePromoCode() {
      const input = document.getElementById('promo-code-input');
      const message = document.getElementById('promo-validation-message');
      const stats = getUserLoyaltyStats();
      const code = input.value.trim().toUpperCase();
      const validateBtn = document.getElementById('validate-promo-btn');
      const user = JSON.parse(sessionStorage.getItem('user') || 'null');
      const isGuest = !user;

      // Clear previous messages
      message.style.display = 'block';

      if (!code) {
        message.textContent = '⚠️ Please enter a promo code.';
        message.style.color = '#ff453a';
        return;
      }

      // Show loading state
      const originalText = validateBtn.textContent;
      validateBtn.disabled = true;
      validateBtn.textContent = '⏳ Validating...';

      // Simulate validation delay for better UX feedback
      setTimeout(() => {
        const codeInfo = getPromoCodeDetails(code);

        if (!codeInfo) {
          message.textContent = '✗ Invalid promo code.';
          message.style.color = '#ff453a';
        } else if (isGuest && (code === 'WELCOME15' || code.startsWith('LOYAL') || codeInfo.name.includes('Claimed'))) {
          message.textContent = '✗ This promo code is for registered members only. Please log in or sign up.';
          message.style.color = '#ff453a';
        } else if (userQualifiesForCode(code, stats)) {
          message.textContent = `✓ Code "${code}" is valid! ${codeInfo.discount}% discount applied.`;
          message.style.color = '#a855f7';
          
          // Save to sessionStorage for booking use (this will be the active discount)
          sessionStorage.setItem('discountCode', JSON.stringify({
            code: code,
            discount: codeInfo.discount,
            description: codeInfo.description
          }));

          // Clear input and show success
          input.value = '';
          setTimeout(() => {
            message.style.display = 'none';
          }, 3000);
        } else {
          const info = codeInfo;
          message.textContent = `✗ You don't qualify for "${code}" yet. Requirements: ${info.minBookings} bookings, ₱${info.minSpending.toLocaleString()} spent`;
          message.style.color = '#ff453a';
        }

        // Restore button
        validateBtn.disabled = false;
        validateBtn.textContent = originalText;
      }, 300);
    }

    /**
     * Randomly selects 4 offers from the `allOffers` array and renders them in the offers grid.
     * This function is called periodically to keep the content fresh.
     */
    function rotateOffers() {
      const offersGrid = document.getElementById('offers-grid');
      offersGrid.innerHTML = '';
      
      // Get 4 random offers
      const shuffled = [...allOffers].sort(() => 0.5 - Math.random());
      const selectedOffers = shuffled.slice(0, 4);
      
      selectedOffers.forEach(offer => {
        const offerCard = document.createElement('div');
        offerCard.className = `offer-card ${offer.premium ? 'premium-offer' : ''}`;
        offerCard.innerHTML = `
          <div class="offer-tag">${offer.tag}</div>
          <h3 class="offer-card-title">${offer.title}</h3>
          <p class="offer-card-description">${offer.description}</p>
          <div class="offer-card-footer">
            <span>${offer.info}</span>
            <a href="${offer.link}" class="btn-offer">Book Now</a>
          </div>
        `;
        offersGrid.appendChild(offerCard);
      });
    }

    /**
     * Initializes or loads the user's specific set of claimable rewards from localStorage.
     * If no rewards exist for the user, it creates a deep copy of the default `claimableRewards`
     * and saves it to localStorage, ensuring each user has their own progress tracking.
     * @returns {Array<object>} The user's array of reward objects.
     */
    function initializeUserClaimableRewards() {
      const user = JSON.parse(sessionStorage.getItem('user') || 'null');
      if (!user) return [];

      const userRewardsKey = `claimableRewards_${user.email}`;
      let userRewards = JSON.parse(localStorage.getItem(userRewardsKey) || 'null');
      if (!userRewards) {
        userRewards = JSON.parse(JSON.stringify(claimableRewards)); // Deep copy initial rewards
        localStorage.setItem(userRewardsKey, JSON.stringify(userRewards));
      }
      return userRewards;
    }    

    /**
     * Updates the progress of each claimable reward based on the user's current stats.
     * It checks conditions like total spending and booking count to mark requirements as complete.
     * @returns {Array<object>} The updated array of user rewards.
     */
    function updateRewardsProgress() {
      const user = JSON.parse(sessionStorage.getItem('user') || 'null');
      const stats = getUserLoyaltyStats();
      const rewards = initializeUserClaimableRewards();

      // Update completion status for each reward based on current user stats
      rewards.forEach(reward => {
        reward.completedRequirements = 0;
        
        if (reward.id === 'referral-reward') {
          // Check if referral requirements met
          if (stats.bookingCount > 0) {
            reward.requirements[0].completed = true;
            reward.completedRequirements++;
          }
        } else if (reward.id === 'review-reward') {
          // Check if review requirements met
          if (stats.bookingCount > 0) {
            reward.requirements[0].completed = true;
            reward.completedRequirements++;
          }
        } else if (reward.id === 'loyalty-milestone') {
          // Check if spending ₱5,000
          if (stats.totalSpent >= 5000) {
            reward.requirements[0].completed = true;
            reward.completedRequirements = 1;
          }
        } else if (reward.id === 'social-share') {
          // Check if social requirements met
          if (stats.bookingCount > 0) {
            reward.requirements[0].completed = true;
            reward.requirements[1].completed = true;
            reward.completedRequirements = 2;
          }
        } else if (reward.id === 'weekend-warrior') {
          // Check if 3 weekend bookings
          if (stats.bookingCount >= 3) {
            reward.requirements[0].completed = true;
            reward.completedRequirements = 1;
          }
        } else if (reward.id === 'premium-upgrade') {
          // Check if ₱10,000 spent and 5 bookings
          if (stats.totalSpent >= 10000) {
            reward.requirements[0].completed = true;
            reward.completedRequirements++;
          }
          if (stats.bookingCount >= 5) {
            reward.requirements[1].completed = true;
            reward.completedRequirements++;
          }
        }
      });

      // Save updated rewards
      const storageKey = `claimableRewards_${user.email}`; // Ensure this matches initializeUserClaimableRewards
      localStorage.setItem(storageKey, JSON.stringify(rewards));
      return rewards;
    }

    /**
     * Renders the grid of claimable rewards.
     * For each reward, it displays the title, description, requirements, a progress bar,
     * and a button that is either disabled, says "Claim Reward," or "Claimed."
     */
    function renderClaimableRewards() {
      const rewards = updateRewardsProgress();
      const grid = document.getElementById('claimable-offers-grid');
      grid.innerHTML = '';

      rewards.forEach(reward => {
        const progressPercent = (reward.completedRequirements / reward.totalRequirements) * 100;
        const isCompleted = reward.completedRequirements === reward.totalRequirements;

        const card = document.createElement('div');
        card.className = `claimable-reward-card ${isCompleted ? 'completed' : ''} ${reward.claimed ? 'claimed' : ''}`;
        
        let requirementsHTML = '';
        reward.requirements.forEach(req => {
          requirementsHTML += `
            <div class="requirement-item ${req.completed ? 'completed' : ''}">
              <span class="requirement-checkbox">${req.completed ? '✓' : '○'}</span>
              <span>${req.text}</span>
            </div>
          `;
        });

        let buttonHTML = '';
        if (reward.claimed) {
          buttonHTML = `<button class="btn-claimed" disabled>✓ Claimed</button>`;
        } else if (isCompleted) {
          buttonHTML = `<button class="btn-claim-reward" onclick="claimReward('${reward.id}')">Claim Reward</button>`;
        } else {
          buttonHTML = `<button class="btn-claim-reward disabled" disabled>${reward.completedRequirements}/${reward.totalRequirements} Complete</button>`;
        }

        card.innerHTML = `
          <div class="reward-header">
            <h3>${reward.title}</h3>
            <span class="reward-badge">+${reward.reward.discount}%</span>
          </div>
          <p class="reward-description">${reward.description}</p>
          <div class="requirements-list">
            ${requirementsHTML}
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${progressPercent}%"></div>
          </div>
          <div class="reward-footer">
            ${buttonHTML}
          </div>
        `;
        
        grid.appendChild(card);
      });
    }

    /**
     * A utility function that prevents a function from being called too frequently.
     * It will wait for a specified delay after the last call before executing.
     * @param {Function} func - The function to debounce.
     * @param {number} [delay=300] - The debounce delay in milliseconds.
     * @returns {Function} The debounced function.
     */
    function debounce(func, delay = 300) {
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
      };
    }

    /**
     * Handles the logic when a user clicks the "Claim Reward" button.
     * It marks the reward as claimed, adds the new promo code to the user's dynamic list,
     * saves the state to localStorage, and refreshes the UI.
     * @param {string} rewardId - The ID of the reward being claimed.
     */
    function claimReward(rewardId) {
      const user = JSON.parse(sessionStorage.getItem('user') || 'null');
      const storageKey = `claimableRewards_${user.email}`;
      const rewards = JSON.parse(localStorage.getItem(storageKey) || '[]');

      const reward = rewards.find(r => r.id === rewardId);
      if (!reward || reward.claimed) return;

      // Find the button and disable it temporarily
      const buttons = document.querySelectorAll(`[onclick*="${rewardId}"]`);
      buttons.forEach(btn => {
        const button = btn.closest('.btn-claim-reward');
        if (button) {
          button.disabled = true;
          const originalText = button.textContent;
          button.textContent = '✓ Claiming...';
          
          // Simulate processing
          setTimeout(() => {
            // Mark as claimed
            reward.claimed = true;

            // Add new promo code
            const newCode = reward.reward.code; // Use the code from the reward object
            updateDynamicPromoCodes(newCode, { // Use the new update function
              name: reward.title,
              discount: reward.reward.discount,
              description: reward.description + ' (Claimed)',
              minSpending: 0,
              minBookings: 0,
              locked: false
            });
            // Save changes
            localStorage.setItem(storageKey, JSON.stringify(rewards));
            
            // Add to user's claimed codes
            const claimedKey = `claimedCodes_${user.email}`;
            let claimedCodes = JSON.parse(localStorage.getItem(claimedKey) || '[]');
            claimedCodes.push(newCode);
            localStorage.setItem(claimedKey, JSON.stringify(claimedCodes));

            // Refresh UI
            renderClaimableRewards(); // Re-render to show claimed state
            renderPromoCodeSections();

            // Show success message with better styling
            showSuccessNotification(`🎉 Reward Claimed! You've unlocked ${newCode} - ${reward.reward.discount}% off your next booking!`);
          }, 400);
        }
      });
    }

    /**
     * Displays a styled, temporary notification at the top-right of the screen.
     * Used for providing feedback like "Code copied" or "Reward claimed."
     * @param {string} message - The message to display in the notification.
     */
    function showSuccessNotification(message) {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.75rem;
        box-shadow: 0 8px 24px rgba(168, 85, 247, 0.3);
        font-weight: 600;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        max-width: 90vw;
      `;
      notification.textContent = message;
      document.body.appendChild(notification);

      // Auto remove after 4 seconds
      setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      }, 4000);
    }

    // Add CSS keyframe animations for notifications dynamically.
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(100px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      @keyframes slideOutRight {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(100px);
        }
      }
    `;
    document.head.appendChild(style);

    /**
     * The main entry point for the page, executed when the window loads.
     * It checks for user authentication and initializes all page components.
     */
    window.addEventListener('load', function() {
      const user = JSON.parse(sessionStorage.getItem('user') || 'null');
      if (!user) {
        // If no user is logged in, redirect to the login page with a reason
        window.location.href = 'login.php?reason=offers_unauthorized';
      } else {        
        // If a user is logged in, show the page and update auth buttons
        updateAuthButtons();
        rotateOffers(); // Load initial offers
        renderClaimableRewards(); // Render claimable rewards (which initializes user-specific rewards)
        renderPromoCodeSections(); // Render promo codes based on user (which uses dynamicPromoCodes)

        // Rotate offers every 30 seconds
        setInterval(rotateOffers, 30000);

        // Setup promo code validation
        const validateBtn = document.getElementById('validate-promo-btn');
        const promoInput = document.getElementById('promo-code-input');
        
        validateBtn?.addEventListener('click', validatePromoCode);
        promoInput?.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
            validatePromoCode();
          }
        });
      }
    });

    /**
     * Updates the authentication buttons in the header.
     * Shows a "Logout" button if the user is logged in.
     */
    function updateAuthButtons() {
      const user = JSON.parse(sessionStorage.getItem('user') || 'null');
      const authButtons = document.getElementById('auth-buttons');
      if (user) {
        authButtons.innerHTML = '';
      }
    }

    /**
     * Logs the user out by clearing their session data and redirecting to the home page.
     */
    function logout() 
    { sessionStorage.removeItem('user'); window.location.href = 'index.php'; }