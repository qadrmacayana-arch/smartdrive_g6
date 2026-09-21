// Mobile menu toggle function
    function toggleMobileMenu() {
      const mobileMenu = document.querySelector('.mobile-menu');
      if (mobileMenu) {
        const isActive = mobileMenu.style.display === 'flex';
        mobileMenu.style.display = isActive ? 'none' : 'flex';
      }
    }

    // Load confirmation data and SYNC to Dashboard History
    function loadConfirmationData() {
      const bookingDataString = sessionStorage.getItem('bookingData');

      if (!bookingDataString) {
        console.warn('Missing booking data. Redirecting to start.');
        // Optional: Redirect if no data is found at all
        // window.location.href = 'rent-a-car.php';
        return;
      }

      try {
        const booking = JSON.parse(bookingDataString);
        const activeBooking = getActiveBooking();
        if (activeBooking) {
          showActiveBookingRequired(activeBooking);
          return;
        }
        const customer = booking.customer || {};
        const payment = booking.payment || {};

        // --- NEW: Apply color theme to the UI based on payment method ---
        let themeColor = '#a855f7'; // Default green
        const paymentMethodValue = booking.paymentMethod;

        if (paymentMethodValue === 'credit-card') themeColor = '#FFBF00'; // Yellow
        else if (paymentMethodValue === 'maya') themeColor = '#00C7B7'; // Maya Green
        else if (paymentMethodValue === 'gcash') themeColor = '#007AFF'; // GCash Blue
        else if (paymentMethodValue === 'srwallet') themeColor = '#8A2BE2'; // Purple

        // Apply the theme
        const confirmationIcon = document.querySelector('.confirmation-icon');
        if (confirmationIcon) {
          confirmationIcon.style.background = `linear-gradient(135deg, ${themeColor} 0%, ${themeColor} 100%)`;
          confirmationIcon.style.boxShadow = `0 0 30px ${themeColor.replace(')', ', 0.4)').replace('rgb', 'rgba')}`;
        }
        const detailValues = document.querySelectorAll('.detail-value');
        detailValues.forEach(el => el.style.color = themeColor);

        // Apply theme to total price
        const totalAmountEl = document.getElementById('total-amount');
        if (totalAmountEl) totalAmountEl.style.color = themeColor;

        // Apply theme to the total row background
        const pricingTotalRow = document.querySelector('.pricing-total');
        if (pricingTotalRow) pricingTotalRow.style.background = themeColor.replace(')', ', 0.1)').replace('rgb', 'rgba');

        const cardBorder = document.querySelector('.confirmation-card');
        if(cardBorder) cardBorder.style.borderColor = themeColor;


        // 1. Update UI Elements
        if (booking) {
          document.getElementById('ref-number').textContent = booking.referenceNumber || 'REF-2024-000000';
          document.getElementById('vehicle-info').textContent = booking.vehicleName || 'Loading...';
          document.getElementById('pickup-date').textContent = booking.pickupDate || 'Loading...';
          document.getElementById('return-date').textContent = booking.returnDate || 'Loading...';
          document.getElementById('location').textContent = booking.location || 'Loading...';
          document.getElementById('payment-method-info').textContent = booking.paymentMethod
            ? booking.paymentMethod
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
            : 'N/A';
        }

        const subtotal = (payment.dailyRate || 0) * (payment.days || 0);
        document.getElementById('subtotal-cost').textContent = `₱${subtotal.toLocaleString()}`;
        document.getElementById('insurance-cost').textContent = `₱${(payment.insurance || 0).toLocaleString()}`;
        
        if (payment.discount && payment.discount > 0) {
          document.getElementById('discount-row').style.display = 'flex';
          document.getElementById('discount-label').textContent = payment.discountLabel || 'Discount';
          document.getElementById('discount-cost').textContent = `-₱${(payment.discount || 0).toLocaleString()}`;
        } else {
          document.getElementById('discount-row').style.display = 'none';
        }

        document.getElementById('total-amount').textContent = `₱${(payment.totalAmount || 0).toLocaleString()}`;
        
        if (customer) {
          document.getElementById('customer-name').textContent = customer.fullName || 'Loading...';
          document.getElementById('customer-email').textContent = customer.email || 'Loading...';
          document.getElementById('customer-phone').textContent = customer.phone || 'Loading...';
          document.getElementById('license-type').textContent = customer.licenseType || 'Loading...';
          
          // Apply theme to customer info values as well
          const infoValues = document.querySelectorAll('.info-value');
          infoValues.forEach(el => el.style.color = themeColor);
        }

        // --- This is the key part for saving to history ---
        const finalBookingRecord = { 
          ...booking, 
          customerName: customer.fullName, // Flatten for easier display in history
          customerEmail: customer.email,
          totalPrice: payment.totalAmount,
          status: 'Confirmed', 
          rating: 0 
        };
        sessionStorage.setItem('pendingBooking', JSON.stringify(finalBookingRecord));
        
        // --- NEW: Save the booking to the database via API ---
        saveBookingToDatabase(finalBookingRecord);
        
        updateAuthButtons();
      } catch (error) {
        console.error('Error loading confirmation data:', error);
      }
    }

    /**
     * Sends the final booking record to the backend API to be saved in the database.
     * It also saves a copy to localStorage for client-side history access.
     * @param {object} bookingRecord - The complete booking object to be saved.
     */
    async function saveBookingToDatabase(bookingRecord) {
      // Also save to localStorage for immediate UI feedback and offline access
      const storageKey = `userBookings_${bookingRecord.customerEmail}`;
      let history = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (!history.find(b => b.referenceNumber === bookingRecord.referenceNumber)) {
        history.unshift(bookingRecord);
        localStorage.setItem(storageKey, JSON.stringify(history));
      }

      try {
        const response = await fetch('api/bookings.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingRecord)
        });
        const result = await response.json();
        if (!result.success) {
          console.error('API Error:', result.message);
        }
      } catch (error) {
        console.error('Failed to save booking to database:', error);
      }
    }

    function updateAuthButtons() {
      const user = JSON.parse(sessionStorage.getItem('user') || 'null');
      const navLogin = document.getElementById('nav-login');
      const navSignup = document.getElementById('nav-signup');

      if (user && user.email) {
        if (navLogin) {
          navLogin.innerHTML = '';
          navLogin.onclick = null;
        }
        if (navSignup) navSignup.style.display = 'none';
      }
    }

    function logout() {
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('isNewUser');
      localStorage.removeItem('smartdriveUser');
      localStorage.removeItem('smartdriveUsers');
      window.location.href = 'index.php';
    }

    // Download receipt functionality
    document.getElementById('download-receipt')?.addEventListener('click', function() {
      const booking = JSON.parse(sessionStorage.getItem('bookingData') || '{}');

      if (!booking || !booking.customer || !booking.payment) {
        alert('Could not generate receipt. Data is missing.');
        return;
      }

      const receiptContent = `
        Booking Reference: ${booking.referenceNumber}
        Date Issued: ${new Date().toLocaleDateString()}
        ----------------------------------------
        CUSTOMER DETAILS
        Name:    ${booking.customer.fullName}
        Email:   ${booking.customer.email || 'N/A'}
        Phone:   ${booking.customer.phone || 'N/A'}
        Address: ${booking.customer.address || 'N/A'}
        ----------------------------------------
        BOOKING DETAILS
        Vehicle:     ${booking.vehicleName}
        Pick-up:     ${booking.pickupDate}
        Return:      ${booking.returnDate}
        Payment Via: ${booking.paymentMethod 
          ? booking.paymentMethod
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ') 
          : 'N/A'}
        ----------------------------------------
        PAYMENT SUMMARY
        Subtotal:    PHP ${(booking.payment.dailyRate * booking.payment.days).toLocaleString()}
        Insurance:   PHP ${booking.payment.insurance.toLocaleString()}
        ${booking.payment.discount > 0 ? `Discount (${booking.payment.discountLabel}): -PHP ${booking.payment.discount.toLocaleString()}` : ''}
        ========================================
        TOTAL PAID:  PHP ${booking.payment.totalAmount.toLocaleString()}
        ========================================
        Thank you for choosing SmartDrive™!
      `;

      const blob = new Blob([`<pre>${receiptContent.trim()}</pre>`], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SmartDrive_Receipt_${booking.referenceNumber}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    });

    window.addEventListener('load', loadConfirmationData);