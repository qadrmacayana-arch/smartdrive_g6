// Payment form handling
    const paymentForm = document.getElementById('payment-form');
    const paymentMethod = document.querySelectorAll('input[name="payment_method"]');
    const creditCardSection = document.getElementById('credit-card-section');
    const gcashSection = document.getElementById('gcash-section');
    const mayaSection = document.getElementById('maya-section');
    const srpaySection = document.getElementById('srpay-section');
    const billingAddressSection = document.getElementById('billing-address-section');

    /**
     * Attaches event listeners to payment method radio buttons.
     * Toggles the visibility of different payment detail sections based on user selection.
     */
    paymentMethod.forEach(method => {
      method.addEventListener('change', function() {
        // Hide all sections first
        creditCardSection.style.display = 'none';
        billingAddressSection.style.display = 'none';
        gcashSection.style.display = 'none';
        mayaSection.style.display = 'none';
        srpaySection.style.display = 'none';

        // Show the selected one
        if (this.value === 'credit-card') {
          creditCardSection.style.display = 'block';
          billingAddressSection.style.display = 'block';
        } else if (this.value === 'gcash') {
          gcashSection.style.display = 'block';
        } else if (this.value === 'maya') {
          mayaSection.style.display = 'block';
        } else if (this.value === 'srpoints') {
          srpaySection.style.display = 'block';
          updateWalletDisplay(); // Fetch and show balance when selected
        }
      });
    });

    /**
     * Adds a visual 'active' class to the label of the selected payment method.
     * This provides clear visual feedback to the user.
     */
    document.querySelectorAll('.payment-method-option input').forEach(input => {
      input.addEventListener('change', function() {
        document.querySelectorAll('.payment-method-option label').forEach(label => {
          label.classList.remove('active');
        });
        if (this.checked) {
          this.nextElementSibling.classList.add('active');
        }
      });
    });
    // Ensure the default active class is set on load
    const defaultActiveRadio = document.querySelector('.payment-method-option input:checked');
    if (defaultActiveRadio) {
      defaultActiveRadio.nextElementSibling.classList.add('active');
    }


    /**
     * Automatically formats the credit card number input by adding spaces every 4 digits.
     */
    document.getElementById('card-number')?.addEventListener('input', function(e) {
      const value = e.target.value.replace(/\D/g, '').slice(0, 16);
      const formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
      e.target.value = formattedValue;
    });

    /**
     * Automatically formats the credit card expiry date input by adding a '/' after the month.
     */
    document.getElementById('expiry-date')?.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '').slice(0, 4);
      if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
      }
      e.target.value = value;
    });

    document.getElementById('cvv')?.addEventListener('input', function(e) {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
    });

    /**
     * @type {number}
     * Global variable to hold the current user's wallet balance.
     */
    let walletBalance = 0;

    /**
     * Fetches the current user's SR Wallet balance from localStorage and updates the display.
     * If no user is logged in, the balance is considered 0.
     */
    function updateWalletDisplay() {
      const user = JSON.parse(sessionStorage.getItem('user') || 'null');
      if (!user) {
        walletBalance = 0;
      } else {
        walletBalance = parseInt(localStorage.getItem(`srPoints_${user.email}`) || '0', 10);
      }
      const walletBalanceEl = document.getElementById('wallet-balance');
      if(walletBalanceEl) {
        walletBalanceEl.textContent = `${walletBalance.toLocaleString()} pts`;
      }
    }

    function updateSRWalletAvailability() {
      const user = JSON.parse(sessionStorage.getItem('user') || 'null');
      const walletOption = document.querySelector('.payment-method-option[data-method="srpoints"]');

      if (!walletOption) return;

      walletOption.style.display = user ? '' : 'none';

      if (!user && walletOption.querySelector('input')?.checked) {
        const cardOption = document.getElementById('card-option');
        if (cardOption) {
          cardOption.checked = true;
          cardOption.dispatchEvent(new Event('change'));
        }
      }
    }

    /**
     * Loads booking and customer data from sessionStorage to populate the payment page.
     * It updates the payment summary and pre-fills form fields like cardholder name and billing address.
     * If data is missing, it falls back to loading demo data.
     */
    function loadPaymentData() {
      const bookingData = sessionStorage.getItem('bookingData');
      const parsedBookingData = JSON.parse(bookingData || '{}');

      if (!bookingData || !parsedBookingData.customer) {
        console.warn('Missing booking data. Using demo data.');
        // Load demo data if available
        loadDemoData();
        return;
      }

      try {
        const booking = parsedBookingData;
        const customer = parsedBookingData.customer;

        // Populate payment summary
        updatePaymentSummary(booking, customer);

        // Populate customer info in payment form if available
        if (customer.fullName) {
          document.getElementById('card-holder').value = customer.fullName;
        }
        
        // NEW: If user is logged in, pre-fill billing address from their main account info
        const loggedInUser = JSON.parse(sessionStorage.getItem('user') || 'null');
        if (loggedInUser && loggedInUser.address) {
          document.getElementById('billing-address').value = loggedInUser.address;
          // You can add logic here to parse city/postal from the full address if needed
        }


      } catch (error) {
        console.error('Error loading booking data:', error);
        loadDemoData();
      }
    }

    /**
     * Loads a set of demo booking and customer data as a fallback.
     * This ensures the page is still functional for testing or direct access.
     */
    function loadDemoData() {
      // Use demo booking data
      const demoBooking = {
        vehicleId: '1',
        vehicleName: 'Tesla Model 3',
        vehicleType: 'Electric',
        pickupDate: '2026-03-15',
        returnDate: '2026-03-18',
        dailyRate: 2500
      };

      const demoCustomer = {
        fullName: 'John Doe'
      };

      updatePaymentSummary(demoBooking, demoCustomer);
    }

    /**
     * Calculates and displays the full payment summary.
     * This includes rental duration, subtotal, insurance, and the best applicable discount
     * (promo code, PWD/Senior, or new user).
     * @param {object} booking - The core booking details object.
     * @param {object} customer - The customer details object.
     */
    function updatePaymentSummary(booking, customer) {
      // Find vehicle from CARS array
      const vehicle = CARS.find(car => car.id === booking.vehicleId || car.name === booking.vehicleName);

      if (vehicle) {
        document.getElementById('vehicle-image').src = vehicle.image;
        document.getElementById('vehicle-image').style.display = 'block';
        document.getElementById('vehicle-name').textContent = vehicle.name;
        document.getElementById('vehicle-type').textContent = vehicle.type;
      }

      // Update booking details
      document.getElementById('summary-pickup').textContent = formatDate(booking.pickupDate);
      document.getElementById('summary-return').textContent = formatDate(booking.returnDate);

      // Calculate duration
      const pickup = new Date(booking.pickupDate);
      const returnDate = new Date(booking.returnDate);
      const duration = Math.ceil((returnDate - pickup) / (1000 * 60 * 60 * 24));

      // Check for discounts
      const loggedInUser = JSON.parse(sessionStorage.getItem('user') || 'null');
      const userBookingsKey = loggedInUser ? `userBookings_${loggedInUser.email}` : null;
      const userHistory = userBookingsKey ? JSON.parse(localStorage.getItem(userBookingsKey) || '[]') : [];
      const isNewUser = loggedInUser && userHistory.length === 0;
      const isPwdOrSenior = customer.isPwdOrSenior;

      document.getElementById('summary-duration').textContent = `${duration} day${duration !== 1 ? 's' : ''}`;
      document.getElementById('summary-days').textContent = duration;
      document.getElementById('summary-daily-rate').textContent = `₱${(booking.dailyRate || vehicle?.price || 0).toLocaleString()}`;

      // Calculate pricing
      const dailyRate = booking.dailyRate || vehicle?.price || 0;
      let subtotal = dailyRate * duration;
      const insurance = 500;
      
      // --- Discount Logic: Find the best available discount for the user ---
      let bestDiscount = 0;
      let discountLabel = "N/A";

      // 1. Check for promo code from offers page
      const promoCodeData = JSON.parse(sessionStorage.getItem('discountCode') || 'null');
      if (promoCodeData && promoCodeData.discount) {
        bestDiscount = subtotal * (promoCodeData.discount / 100);
        discountLabel = `${promoCodeData.description} (${promoCodeData.code})`;
      }

      // 2. Check for PWD/Senior discount and apply if it's better
      if (isPwdOrSenior) {
        const pwdDiscount = subtotal * 0.20;
        if (pwdDiscount > bestDiscount) {
          bestDiscount = pwdDiscount;
          discountLabel = "PWD/Senior Discount (20%)";
        }
      }
      // 3. Check for new user discount and apply if it's better
      if (isNewUser) {
        const newUserDiscount = subtotal * 0.15;
        if (newUserDiscount > bestDiscount) {
          bestDiscount = newUserDiscount;
          discountLabel = "New Member Discount (15%)";
        }
      }

      const total = subtotal + insurance - bestDiscount;

      document.getElementById('subtotal').textContent = `₱${subtotal.toLocaleString()}`;
      document.getElementById('discount-amount').textContent = `-₱${bestDiscount.toLocaleString()}`;
      document.getElementById('total-price-display').textContent = `₱${total.toLocaleString()}`;

      // Store for later use
      const bookingData = JSON.parse(sessionStorage.getItem('bookingData') || '{}');
      bookingData.payment = {
        dailyRate,
        days: duration,
        insurance,
        discount: bestDiscount,
        totalAmount: total,
        discountLabel: bestDiscount > 0 ? discountLabel : "N/A"
      };
      sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
    }

    /**
     * Formats a date string (e.g., "2026-03-15") into a more readable format (e.g., "Mar 15, 2026").
     * @param {string} dateString - The date string to format.
     * @returns {string} The formatted date string.
     */
    function formatDate(dateString) {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-US', options);
    }

    /**
     * Handles the main payment form submission.
     * It validates the selected payment method's fields and then calls the payment processing function.
     */
    paymentForm?.addEventListener('submit', async function(e) {
      e.preventDefault();

      const termsCheckbox = document.getElementById('terms-agree');
      if (!termsCheckbox.checked) {
        showError('Please accept the terms and conditions');
        return;
      }

      const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;
      let isValid = true;

      if (paymentMethod === 'srpoints' && !JSON.parse(sessionStorage.getItem('user') || 'null')) {
        showError('Please log in to use SR Points.');
        return;
      }

      if (paymentMethod === 'credit-card') {
        isValid = validateCreditCard();
      } else if (paymentMethod === 'gcash') {
        isValid = validateGCash();
      } else if (paymentMethod === 'maya') {
        isValid = validateMaya();
      } else if (paymentMethod === 'srpoints') {
        isValid = validateSRPoints();
      }

      if (!isValid) return;

      await processPayment(paymentMethod);
    });

    /**
     * Validates the credit card input fields.
     * @returns {boolean} - True if all fields are valid, otherwise false.
     */
    function validateCreditCard() {
      const cardHolder = document.getElementById('card-holder').value.trim();
      const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
      const expiryDate = document.getElementById('expiry-date').value.trim();
      const cvv = document.getElementById('cvv').value;

      if (!cardHolder) {
        showError('Please enter cardholder name');
        return false;
      }

      if (cardNumber.length !== 16 || !/^\d+$/.test(cardNumber)) {
        showError('Please enter a valid 16-digit card number');
        return false;
      }

      if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
        showError('Please enter a valid expiry date (MM/YY)');
        return false;
      }

      const [monthText, yearText] = expiryDate.split('/');
      const month = Number(monthText);
      const expiryYear = 2000 + Number(yearText);
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const expiryMonth = new Date(expiryYear, month - 1, 1);

      if (month < 1 || month > 12 || expiryMonth < currentMonth) {
        showError('Please enter an expiry date that has not passed');
        return false;
      }

      if (cvv.length < 3 || cvv.length > 4 || !/^\d+$/.test(cvv)) {
        showError('Please enter a valid CVV');
        return false;
      }

      return true;
    }

    /**
     * Validates the GCash input fields.
     * @returns {boolean} - True if all fields are valid, otherwise false.
     */
    function validateGCash() {
      const gcashRef = document.getElementById('gcash-ref').value.trim();
      const gcashName = document.getElementById('gcash-name').value.trim();
      const gcashAddress = document.getElementById('gcash-address').value.trim();
      const gcashPhone = document.getElementById('gcash-phone').value.trim();
      const gcashLicense = document.getElementById('gcash-license').value.trim();

      if (!gcashRef || !gcashName || !gcashAddress || !gcashPhone || !gcashLicense) {
        showError('Please fill in all GCash payment and customer details');
        return false;
      }

      return true;
    }

    /**
     * Validates the Maya input fields.
     * @returns {boolean} - True if all fields are valid, otherwise false.
     */
    function validateMaya() {
      const mayaRef = document.getElementById('maya-ref').value.trim();
      const mayaName = document.getElementById('maya-name').value.trim();
      const mayaAddress = document.getElementById('maya-address').value.trim();
      const mayaPhone = document.getElementById('maya-phone').value.trim();
      const mayaLicense = document.getElementById('maya-license').value.trim();

      if (!mayaRef || !mayaName || !mayaAddress || !mayaPhone || !mayaLicense) {
        showError('Please fill in all Maya payment and customer details');
        return false;
      }
      return true;
    }

    /**
     * Validates that the user has enough SR Points to cover the total amount.
     * @returns {boolean} - True if the balance is sufficient, otherwise false.
     */
    function validateSRPoints() {
        const bookingData = JSON.parse(sessionStorage.getItem('bookingData') || '{}');
        const totalDue = bookingData.payment?.totalAmount || 0;
        const user = JSON.parse(sessionStorage.getItem('user') || 'null');

        // Directly fetch the latest balance for accurate validation
        const currentWalletBalance = user ? parseInt(localStorage.getItem(`srPoints_${user.email}`) || '0', 10) : 0;
        updateWalletDisplay(); // Update UI

        if (currentWalletBalance < totalDue) {
            showError(`Insufficient SR Points. You need ${totalDue.toLocaleString()} points but only have ${currentWalletBalance.toLocaleString()}. Choose another payment method.`);
            const walletStatus = document.getElementById('wallet-status-message');
            if(walletStatus) {
              walletStatus.textContent = 'Insufficient Balance';
              walletStatus.classList.add('insufficient-balance');
            }
            const walletBalanceEl = document.getElementById('wallet-balance');
            if(walletBalanceEl) walletBalanceEl.classList.add('insufficient-balance');
            
            return false;
        }
        return true;
    }

    /**
     * Simulates the payment processing flow.
     * It shows a loading state, awards SR points to logged-in users, deducts from the SR Wallet if used,
     * finalizes the booking data with a reference number, and redirects to the confirmation page.
     * @param {string} method - The payment method being used (e.g., 'credit-card', 'srwallet').
     */
    async function processPayment(method) {
      const loadingDiv = document.getElementById('payment-loading');
      const submitButton = document.querySelector('#payment-form button[type="submit"]');

      loadingDiv.style.display = 'block';
      if (submitButton) submitButton.disabled = true;

      try {
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        const user = JSON.parse(sessionStorage.getItem('user') || 'null');
        const bookingDetails = JSON.parse(sessionStorage.getItem('bookingData') || '{}'); // Use the main bookingData
        const vehicle = CARS.find(car => car.id === bookingDetails.vehicleId);

        // --- Award SR Points for registered users ---
        if (user && bookingDetails.payment?.totalAmount > 0) {
          const pointsEarned = vehicle?.srPoints || 0;
          if (pointsEarned > 0) {
            const currentBalance = parseInt(localStorage.getItem(`srPoints_${user.email}`) || '0', 10);
            const newBalance = currentBalance + pointsEarned;
            localStorage.setItem(`srPoints_${user.email}`, newBalance);
            addTransaction(user.email, `Earned from booking: ${vehicle.name}`, pointsEarned);
          }
        }

        // Deduct the booking total from SR Points when selected.
        if (method === 'srpoints') {
          const totalDue = bookingDetails.payment?.totalAmount || 0;
          const currentBalance = user ? parseInt(localStorage.getItem(`srPoints_${user.email}`) || '0', 10) : 0;
          const newBalance = currentBalance - totalDue;
          
          if (user) {
            localStorage.setItem(`srPoints_${user.email}`, newBalance);
            addTransaction(user.email, `Used for booking #${bookingDetails.referenceNumber}`, -totalDue);
          }
        }

        // Generate reference number (moved here to ensure it's always generated)
        const referenceNumber = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Update booking data with payment method and reference number
        const currentBookingData = JSON.parse(sessionStorage.getItem('bookingData') || '{}');
        const updatedBookingData = { 
          ...currentBookingData,
          referenceNumber: referenceNumber,
          paymentMethod: method
        };
        sessionStorage.setItem('bookingData', JSON.stringify(updatedBookingData));

        showSuccess('Payment processed successfully!');
        loadingDiv.style.display = 'none';

        // Redirect to confirmation page
        setTimeout(() => {
          window.location.href = 'confirmation.php';
        }, 1500);

      } catch (error) {
        console.error('Payment error:', error);
        showError('Payment failed. Please try again.');
        if (loadingDiv) loadingDiv.style.display = 'none';
        if (submitButton) submitButton.disabled = false;
      }
    }

    /**
     * Displays a temporary error message at the top of the payment form.
     * @param {string} message - The error message to show.
     */
    function showError(message) {
      const errorDiv = document.getElementById('payment-error');
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      setTimeout(() => {
        errorDiv.style.display = 'none';
      }, 5000);
    }

    /**
     * Displays a success message. Used to confirm payment processing before redirection.
     * @param {string} message - The success message to show.
     */
    function showSuccess(message) {
      const successDiv = document.getElementById('payment-success');
      successDiv.textContent = message;
      successDiv.style.display = 'block';
    }

    /**
     * Main entry point for the page, executed when the window loads.
     * It initializes payment data, auth buttons, and the wallet display.
     */
    window.addEventListener('load', () => {
      loadPaymentData();
      updateAuthButtons();
      updateSRWalletAvailability();
      updateWalletDisplay();
    });

    /**
     * Updates the authentication buttons in the header based on the user's login status.
     */
    function updateAuthButtons() {
      const user = JSON.parse(sessionStorage.getItem('user') || 'null');
      const authButtons = document.getElementById('auth-buttons');

      if (user) {
        authButtons.innerHTML = '';
      } else {
        authButtons.innerHTML = `
          <a href="login.php" class="btn-login">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
            Login
          </a>
          <a href="signup.php" class="btn-signup">Sign Up</a>
        `;
      }
    }

    /**
     * Logs the user out by clearing their session data and redirecting to the home page.
     */
    function logout() {
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('isNewUser');
      localStorage.removeItem('smartdriveUser');
      localStorage.removeItem('smartdriveUsers');
      window.location.href = 'index.php';
    }

    // Dynamically injects the CSS keyframe animation for the loading spinner.
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);