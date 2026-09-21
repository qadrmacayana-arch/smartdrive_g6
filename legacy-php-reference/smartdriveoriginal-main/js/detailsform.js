    /**
     * Initializes the driver details form page.
     * It loads the booking data from the previous step and updates authentication buttons.
     */
    function initDetailsForm() {
      loadBookingData();
      updateAuthButtons();
    }

    /**
     * Retrieves booking data from sessionStorage.
     * If data exists, it's parsed and displayed. If not, or if an error occurs,
     * it loads demo data as a fallback.
     */
    function loadBookingData() {
      const bookingData = sessionStorage.getItem('bookingData');

      if (!bookingData) {
        console.warn('No booking data found. Using demo data.');
        loadDemoBookingData();
        return;
      }

      try {
        const booking = JSON.parse(bookingData);
        displayBookingSummary(booking);
      } catch (error) {
        console.error('Error loading booking data:', error);
        loadDemoBookingData();
      }
    }

    /**
     * Loads a default booking object for demonstration or testing purposes.
     * This ensures the page is functional even if accessed directly without completing the previous steps.
     */
    function loadDemoBookingData() {
      // Demo booking for testing
      const demoBooking = {
        vehicleId: '1',
        vehicleName: 'Tesla Model 3',
        vehicleType: 'Electric',
        pickupDate: '2026-03-15',
        returnDate: '2026-03-18',
        dailyRate: 2500,
        location: 'Manila'
      };

      displayBookingSummary(demoBooking);
      sessionStorage.setItem('bookingData', JSON.stringify(demoBooking));
    }

    /**
     * Renders the booking summary on the right side of the page.
     * It calculates the rental duration and total price, including any applicable discounts.
     * @param {object} booking - The booking data object from sessionStorage.
     */
    function displayBookingSummary(booking) {
      // Find vehicle from CARS array
      const vehicle = typeof CARS !== 'undefined' 
        ? CARS.find(car => car.id === booking.vehicleId || car.name === booking.vehicleName)
        : null;

      // Build summary HTML
      let summaryHTML = `
        <div style="margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <h4 style="font-size: 0.875rem; font-weight: 700; color: var(--heading); margin-bottom: 0.75rem;">Selected Vehicle</h4>
          <p style="color: var(--primary); font-weight: 700; font-size: 1.1rem; margin: 0.25rem 0;">${vehicle?.name || booking.vehicleName}</p>
          <p style="color: var(--muted-foreground); font-size: 0.875rem; margin: 0;">${vehicle?.type || booking.vehicleType}</p>
        </div>

        <div style="margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <h4 style="font-size: 0.875rem; font-weight: 700; color: var(--heading); margin-bottom: 0.75rem;">Rental Period</h4>
          <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.875rem;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--muted-foreground);">Pick-up:</span>
              <span style="color: var(--heading); font-weight: 600;">${formatDate(booking.pickupDate)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--muted-foreground);">Return:</span>
              <span style="color: var(--heading); font-weight: 600;">${formatDate(booking.returnDate)}</span>
            </div>
          </div>
        </div>
      `;

      // Calculate duration and pricing
      const pickup = new Date(booking.pickupDate);
      const returnDate = new Date(booking.returnDate);
      const days = Math.ceil((returnDate - pickup) / (1000 * 60 * 60 * 24));
      const dailyRate = booking.dailyRate || vehicle?.price || 2500;
      
      // NEW: Get PWD/Senior status
      const isPwdOrSenior = document.querySelector('input[name="pwd_senior_status"]:checked').value === 'yes';
      
      // Calculate pricing
      const subtotal = dailyRate * days;
      const insurance = 500;
      const discount = isPwdOrSenior ? subtotal * 0.20 : 0;
      const total = subtotal + insurance - discount;

      document.getElementById('booking-summary-display').innerHTML = summaryHTML;
      document.getElementById('summary-days').textContent = days;
      document.getElementById('subtotal').textContent = `₱${subtotal.toLocaleString()}`;
      document.getElementById('total-price-display').textContent = `₱${total.toLocaleString()}`;

      // Update discount display
      updateDiscountDisplay(discount);

      // Store pricing info for the next step
      const paymentData = {
        dailyRate,
        days,
        insurance,
        discount,
        totalAmount: total
      };
      sessionStorage.setItem('paymentData', JSON.stringify(paymentData));
    }

    /**
     * Shows or hides the discount line item in the booking summary.
     * @param {number} discount - The calculated discount amount.
     */
    function updateDiscountDisplay(discount) {
      const discountRow = document.getElementById('discount-summary-row');
      const discountAmountEl = document.getElementById('discount-amount');

      if (discount > 0) {
        discountAmountEl.textContent = `-₱${discount.toLocaleString()}`;
        discountRow.style.display = 'flex';
      } else {
        discountRow.style.display = 'none';
      }
    }

    /**
     * Formats a date string into a more readable format (e.g., "Mar 15, 2026").
     * @param {string} dateString - The date string to format (e.g., "2026-03-15").
     * @returns {string} The formatted date string.
     */
    function formatDate(dateString) {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-US', options);
    }

    /**
     * Handles the booking form submission.
     * It validates user input, checks for required PWD/Senior ID uploads,
     * updates the booking data in sessionStorage with customer details,
     * and redirects to the payment page.
     */
    document.getElementById('booking-form').addEventListener('submit', function(e) {
      e.preventDefault();

      // Validate form
      const firstName = document.getElementById('firstName').value.trim();
      const lastName = document.getElementById('lastName').value.trim();
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const isPwdOrSenior = document.querySelector('input[name="pwd_senior_status"]:checked').value === 'yes';
      const pwdFile = document.getElementById('pwd-file-input').files[0];

      if (!firstName || !lastName || !email || !phone) {
        showError('Please fill in all fields');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showError('Please enter a valid email address');
        return;
      }

      // NEW: Check if PWD/Senior is selected but no file is uploaded
      if (isPwdOrSenior && !pwdFile) {
        showError('Please upload your PWD/Senior ID to proceed with the discount.');
        return;
      }

      // Validate phone format
      if (phone.length < 10) {
        showError('Please enter a valid phone number');
        return;
      }

      // Retrieve the existing booking object
      const bookingData = JSON.parse(sessionStorage.getItem('bookingData') || '{}');

      // Add customer details to it
      bookingData.customer = {
        fullName: `${firstName} ${lastName}`,
        firstName,
        lastName,
        email,
        phone,
        licenseType: 'Non-Professional Driver\'s License', // Default, can be changed
        isPwdOrSenior: isPwdOrSenior
      };

      // Save the updated object back to sessionStorage
      sessionStorage.setItem('bookingData', JSON.stringify(bookingData));

      // Redirect to payment page
      window.location.href = 'payment.php';
    });

    /**
     * Logic for the PWD/Senior discount radio buttons.
     * Toggles the visibility of the ID upload section and recalculates the total price.
     */
    const pwdUploadSection = document.getElementById('pwd-upload-section');
    document.querySelectorAll('input[name="pwd_senior_status"]').forEach(radio => {
      radio.addEventListener('change', function() {
        if (this.value === 'yes') {
          pwdUploadSection.style.display = 'block';
          loadBookingData(); // Recalculate price with discount
        } else {
          pwdUploadSection.style.display = 'none';
        }
      });
    });

    /**
     * Updates the text of the file input label to show the name of the selected file.
     * providing user feedback that the file has been chosen.
     */
    const pwdFileInput = document.getElementById('pwd-file-input');
    const fileUploadText = document.getElementById('file-upload-text');

    pwdFileInput.addEventListener('change', function() {
      if (this.files && this.files.length > 0) {
        fileUploadText.textContent = `File selected: ${this.files[0].name}`;
      }
    });

    /**
     * Displays an error message in the form.
     * The message automatically disappears after 5 seconds.
     * @param {string} message - The error message to display.
     */
    function showError(message) {
      const errorDiv = document.getElementById('form-error-message');
      if (!errorDiv) return;

      errorDiv.textContent = message;
      errorDiv.style.display = 'block';

      // Remove after 5 seconds
      setTimeout(() => {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
      }, 5000);
    }

    /**
     * Updates the header authentication buttons based on the user's login status.
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
     * Logs the user out by clearing their session data and redirecting to the homepage.
     */
    function logout() {
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('isNewUser');
      localStorage.removeItem('smartdriveUser');
      localStorage.removeItem('smartdriveUsers');
      window.location.href = 'index.php';
    }

    /**
     * Attaches the main initialization function to the window's 'load' event.
     */
    window.addEventListener('load', initDetailsForm);