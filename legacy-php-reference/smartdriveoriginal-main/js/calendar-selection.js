// --- Calendar State and Configuration ---

    // Initialize calendar to the current month and year.
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    // Variables to store the user's selected pickup and drop-off dates.
    let selectedPickupDate = null;
    let selectedDropoffDate = null;
    // Stores the vehicle object selected on the previous page.
    let selectedVehicle = null;

    // Array of month names for display purposes.
    const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 
                   'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

    /**
     * Initializes the calendar page.
     * It retrieves the selected vehicle's ID from the URL, finds the vehicle data,
     * updates the UI, and renders the initial calendar view.
     */
    function initCalendar() {
      if (!getCurrentUser()) {
        showBookingAccountRequired();
        return;
      }
      if (!requireBookingAvailability()) {
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const vehicleId = params.get('vehicle');
      
      if (vehicleId && typeof CARS !== 'undefined') {
        selectedVehicle = CARS.find(car => car.id === vehicleId);
        if (selectedVehicle) {
          document.getElementById('car-name').textContent = selectedVehicle.name;
        }
      }
      renderCalendar();
      updateAuthButtons();
    }

    /**
     * Renders the calendar grid for the current month and year.
     * It calculates the starting day, generates day cells, disables past dates,
     * and applies styling for selected dates and date ranges.
     */
    function renderCalendar() {
      const firstDay = new Date(currentYear, currentMonth, 1);
      const lastDay = new Date(currentYear, currentMonth + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();

      const calendarGrid = document.getElementById('main-calendar');
      calendarGrid.innerHTML = '';
      document.getElementById('current-month-display').textContent = `${months[currentMonth]} ${currentYear}`;

      // Create and add day labels (SUN, MON, etc.) to the grid.
      const dayLabels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      dayLabels.forEach(day => {
        const dayLabel = document.createElement('div');
        dayLabel.className = 'calendar-day-label';
        dayLabel.textContent = day;
        calendarGrid.appendChild(dayLabel);
      });

      // Add empty cells to align the first day of the month correctly.
      for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyCell);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Create a button for each day of the month.
      for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('button');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;
        dayCell.type = 'button';

        const cellDate = new Date(currentYear, currentMonth, day);
        cellDate.setHours(0, 0, 0, 0);

        // Disable dates that are in the past.
        if (cellDate < today) {
          dayCell.disabled = true;
          dayCell.classList.add('disabled');
        }

        // Apply styling based on whether the date is a pickup, drop-off, or in-range date.
        if (selectedPickupDate && selectedPickupDate.toDateString() === cellDate.toDateString()) {
          dayCell.classList.add('selected-pickup');
        }
        if (selectedDropoffDate && selectedDropoffDate.toDateString() === cellDate.toDateString()) {
          dayCell.classList.add('selected-dropoff');
        }
        if (selectedPickupDate && selectedDropoffDate && cellDate > selectedPickupDate && cellDate < selectedDropoffDate) {
          dayCell.classList.add('in-range');
        }

        dayCell.addEventListener('click', () => selectDate(cellDate));
        calendarGrid.appendChild(dayCell);
      }
    }

    /**
     * Handles the logic when a user clicks a date on the calendar.
     * - If no pickup date is set, it sets the clicked date as the new pickup date.
     * - If a pickup date is set but no dropoff date, it sets the clicked date as the dropoff date.
     * - If the clicked date is before the pickup date, it resets the pickup date.
     * - If both dates are set, it resets the selection and starts over with a new pickup date.
     * @param {Date} date - The date that was clicked.
     */
    function selectDate(date) {
      if (!selectedPickupDate || (selectedPickupDate && selectedDropoffDate)) { // Start new selection
        selectedPickupDate = new Date(date);
        selectedDropoffDate = null;
      } else if (date <= selectedPickupDate) {
        selectedPickupDate = new Date(date);
      } else {
        selectedDropoffDate = new Date(date);
      }
      updateDateDisplay();
      renderCalendar();
    }

    /**
     * Updates the display cards with the selected pickup and drop-off dates.
     * If both dates are selected, it calculates the total duration and price,
     * and enables the "Continue" button.
     */
    function updateDateDisplay() {
      if (selectedPickupDate) {
        document.getElementById('display-pickup').textContent = selectedPickupDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        document.getElementById('display-pickup-year').textContent = selectedPickupDate.getFullYear();
        document.getElementById('card-pickup').classList.add('active');
      }

      if (selectedDropoffDate) {
        document.getElementById('display-dropoff').textContent = selectedDropoffDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        document.getElementById('display-dropoff-year').textContent = selectedDropoffDate.getFullYear();
        document.getElementById('card-dropoff').classList.add('active');

        // Calculate the duration in days.
        const duration = Math.ceil((selectedDropoffDate - selectedPickupDate) / (1000 * 60 * 60 * 24));
        document.getElementById('total-days').textContent = `${duration} Day${duration !== 1 ? 's' : ''}`;

        // Calculate the total price based on the vehicle's daily rate.
        const dailyRate = selectedVehicle?.price || 2500;
        document.getElementById('total-price').textContent = (dailyRate * duration).toLocaleString();

        // Enable the continue button.
        const btn = document.getElementById('continue-btn');
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
      }
    }

    // Event listener for the "previous month" button.
    document.getElementById('prev-month').addEventListener('click', () => {
      currentMonth--; if (currentMonth < 0) { currentMonth = 11; currentYear--; } renderCalendar();
    });

    // Event listener for the "next month" button.
    document.getElementById('next-month').addEventListener('click', () => {
      currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; } renderCalendar();
    });

    /**
     * Event listener for the "Continue" button.
     * It saves the booking details (vehicle, dates, price) to sessionStorage
     * and redirects the user to the details form page.
     */
    document.getElementById('continue-btn').addEventListener('click', function(e) {
      if (!selectedPickupDate || !selectedDropoffDate || !selectedVehicle) return;
      const bookingData = {
        vehicleId: selectedVehicle.id,
        vehicleName: selectedVehicle.name,
        pickupDate: selectedPickupDate.toISOString().split('T')[0],
        returnDate: selectedDropoffDate.toISOString().split('T')[0],
        dailyRate: selectedVehicle.price,
        location: 'Manila'
      };
      sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
      window.location.href = 'detailsform.php';
    });

    /**
     * Updates the header authentication buttons based on the user's login status.
     */
    function updateAuthButtons() {
      const user = JSON.parse(sessionStorage.getItem('user') || 'null');
      const authButtons = document.getElementById('auth-buttons');
      if (user) {
        authButtons.innerHTML = '';
      } else {
        authButtons.innerHTML = `<a href="login.php" class="btn-login">Login</a> <a href="signup.php" class="btn-signup">Sign Up</a>`;
      }
    }

    /**
     * Logs the user out by removing their data from sessionStorage and redirecting to the home page.
     */
    function logout() {
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('isNewUser');
      localStorage.removeItem('smartdriveUser');
      localStorage.removeItem('smartdriveUsers');
      window.location.href = 'index.php';
    }

    // Initialize the calendar when the page has finished loading.
    window.addEventListener('load', initCalendar);