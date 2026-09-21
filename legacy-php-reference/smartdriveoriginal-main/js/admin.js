/**
 * Initializes the admin dashboard.
 * It verifies admin access and then triggers functions to load all statistics, tables, and charts.
 */
async function initAdminDashboard() {
      const user = JSON.parse(sessionStorage.getItem('user') || 'null');
      const isAdmin = Boolean(user && (user.isAdmin || user.email === 'admin@smartrentals.com'));
      if (!isAdmin) {
        window.location.replace('login.php?reason=admin_unauthorized');
        return;
      }
 
      await Promise.all([
        loadAdminStats(),
        loadAllBookings(),
        loadAllUsers(),
        Promise.resolve().then(() => {
          renderRevenueChart();
          renderVehiclePerformanceChart();
          renderGenderChart();
        })
      ]);
      updateAuthButtons();
    }

    /**
     * Retrieves all booking records from all users stored in localStorage.
     * It iterates through localStorage keys, finds ones that start with 'userBookings_',
     * parses the booking data, and returns a single array sorted by the most recent pickup date.
     * @returns {Array} An array of all booking objects.
     */
    function getAllBookingsFromStorage() {
        let allBookings = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('userBookings_')) {
          try {
            const bookings = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(bookings)) allBookings.push(...bookings);
          } catch (error) {
            console.warn(`Could not read bookings from ${key}`, error);
          }
            }
        }
        // Sort by most recent first, assuming dates are stored properly
        allBookings.sort((a, b) => new Date(b.pickupDate) - new Date(a.pickupDate));
        return allBookings;
    }

      function getBookingAmount(booking) {
        return Number(booking.totalPrice ?? booking.total_price ?? 0) || 0;
      }

      function getBookingVehicleName(booking) {
        return booking.vehicleName || booking.vehicle_name || 'Unknown Vehicle';
      }

    /**
     * Calculates and displays the primary statistics on the admin dashboard.
     * This includes total revenue, total number of bookings, registered user count, and available vehicles.
     */
    function normalizeUserRecord(user) {
      return {
        ...user,
        id: user.id || user.user_id || null,
        email: user.email || user.userEmail || '',
        name: user.name || user.fullName || user.full_name || 'Unnamed User',
        fullName: user.fullName || user.full_name || user.name || 'Unnamed User',
        registrationDate: user.registrationDate || user.registration_date || user.created_at || user.createdAt || new Date().toISOString(),
        isActive: user.isActive ?? user.is_active ?? true
      };
    }

    function getStoredUsers() {
      const candidates = [];
      const usersFromStorage = JSON.parse(localStorage.getItem('users') || '[]');
      const smartdriveUsers = JSON.parse(localStorage.getItem('smartdriveUsers') || '[]');
      const smartdriveUser = JSON.parse(localStorage.getItem('smartdriveUser') || 'null');
      const sessionUser = JSON.parse(sessionStorage.getItem('user') || 'null');

      if (Array.isArray(usersFromStorage)) candidates.push(...usersFromStorage);
      if (Array.isArray(smartdriveUsers)) candidates.push(...smartdriveUsers);
      if (smartdriveUser && smartdriveUser.email) candidates.push(smartdriveUser);
      if (sessionUser && sessionUser.email) candidates.push(sessionUser);

      return candidates
        .filter(Boolean)
        .map(normalizeUserRecord)
        .filter(user => user.email)
        .filter((user, index, list) => list.findIndex(item => String(item.email).toLowerCase() === String(user.email).toLowerCase()) === index);
    }

    async function getSupabaseUsers() {
      if (!window.smartdriveSupabase) return null;

      const tableNames = ['profiles', 'users'];
      for (const tableName of tableNames) {
        try {
          const { data, error } = await window.smartdriveSupabase
            .from(tableName)
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            const isMissingTable = /does not exist|relation .* does not exist|not found/i.test(error.message);
            if (isMissingTable) continue;
            console.warn(`Unable to read ${tableName} from Supabase:`, error.message);
            return null;
          }

          if (Array.isArray(data)) {
            return data.map(normalizeUserRecord);
          }
        } catch (error) {
          console.warn(`Supabase user query failed for ${tableName}:`, error);
          return null;
        }
      }

      return [];
    }

    async function loadAdminStats() {
      const allBookings = getAllBookingsFromStorage();
      let allUsers = getStoredUsers();

      try {
        const supabaseUsers = await getSupabaseUsers();
        if (supabaseUsers !== null) {
          allUsers = supabaseUsers;
        }
      } catch (error) {
        console.warn('Falling back to local users for admin stats.', error);
      }

      const totalRevenue = allBookings.reduce((sum, booking) => sum + getBookingAmount(booking), 0);

      document.getElementById('stat-revenue').textContent = `₱${totalRevenue.toLocaleString()}`;
      document.getElementById('stat-total-bookings').textContent = allBookings.length;
      document.getElementById('stat-users').textContent = allUsers.length;
      document.getElementById('stat-vehicles').textContent = typeof CARS !== 'undefined' ? CARS.length : 0;
    }

    /**
     * Loads all booking data from storage and renders it into the admin bookings table.
     * It displays the reference number, customer name, vehicle, total price, and status.
     */
    function loadAllBookings() {
        const tbody = document.getElementById('admin-bookings-body');
        const allBookings = getAllBookingsFromStorage();
        if (!tbody) return; // Guard clause if the element isn't on the page
        tbody.innerHTML = ''; // Clear existing rows

        if (allBookings.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center p-12 text-muted-foreground">No bookings have been made yet.</td></tr>`;
            return;
        }

        allBookings.forEach(booking => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${booking.referenceNumber || 'N/A'}</td>
              <td>${booking.customerName || 'N/A'}</td>
              <td>${getBookingVehicleName(booking)}</td>
              <td>₱${getBookingAmount(booking).toLocaleString()}</td>
              <td><span class="text-primary font-semibold">Confirmed</span></td>
            `;
            tbody.appendChild(row);
        });
    }

    /**
     * Loads all registered users and identifies the top 5 spenders.
     * It calculates each user's total spending by aggregating their booking costs,
     * sorts them, and displays the top spenders in a table.
     */
    async function loadAllUsers() {
        const tbody = document.getElementById('admin-users-body');
        let allUsers = getStoredUsers();
        if (!tbody) return; // Guard clause
        tbody.innerHTML = ''; // Clear existing rows

        try {
          const supabaseUsers = await getSupabaseUsers();
          if (supabaseUsers !== null) {
            allUsers = supabaseUsers;
          }
        } catch (error) {
          console.warn('Falling back to local storage for user list.', error);
        }

        const allBookings = getAllBookingsFromStorage();

        // Calculate total spending for each user
        const userSpending = allUsers.map(user => {
            const totalSpent = allBookings
                .filter(b => (b.customerEmail || b.customer_email) === user.email)
                .reduce((sum, booking) => sum + getBookingAmount(booking), 0);
            return { ...user, totalSpent };
        }).filter(user => user.email !== 'admin@smartrentals.com'); // Exclude admin

        // Sort users by total spending in descending order
        const topSpenders = userSpending.sort((a, b) => b.totalSpent - a.totalSpent);

        if (topSpenders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center p-12 text-muted-foreground">No user spending data available.</td></tr>`;
            return;
        }

        topSpenders.slice(0, 5).forEach(user => { // Show only the top 5 spenders
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${user.name || user.fullName || 'Unnamed User'}</td>
              <td>${user.email}</td>
              <td>₱${user.totalSpent.toLocaleString()}</td>
              <td class="action-cell">
                <button class="btn-small view-btn" data-email="${user.email}">View</button>
              </td>
            `;
            tbody.appendChild(row);
        });

        addUserActionListeners();
    }

    /**
     * Attaches event listeners to the 'View' and 'Edit' buttons for each user in the user list.
     */
    function addUserActionListeners() {
      document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          openUserDetailsModal(this.dataset.email);
        });
      });

      document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          openEditUserModal(this.dataset.email);
        });
      });
    }

    /**
     * Opens a modal to show detailed information for a specific user, including their complete booking history.
     * @param {string} email - The email of the user whose details are to be viewed.
     */
    function openUserDetailsModal(email) {
      const user = JSON.parse(localStorage.getItem('users') || '[]').find(u => u.email === email);
      const storageKey = `userBookings_${email}`;
      const userBookings = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (!user) return;

      const modalBody = document.getElementById('user-modal-body');
      let bookingsHtml = '<h4>Booking History</h4>';
      if (userBookings.length > 0) {
        bookingsHtml += `<table class="bookings-table"><thead><tr><th>Ref #</th><th>Vehicle</th><th>Total</th></tr></thead><tbody>`;
        userBookings.forEach(b => {
          bookingsHtml += `<tr><td>${b.referenceNumber}</td><td>${getBookingVehicleName(b)}</td><td>₱${getBookingAmount(b).toLocaleString()}</td></tr>`;
        });
        bookingsHtml += `</tbody></table>`;
      } else {
        bookingsHtml += '<p>No bookings found for this user.</p>';
      }

      modalBody.innerHTML = `
        <div class="user-details-grid">
          <div><strong>Name:</strong> ${user.name}</div>
          <div><strong>Email:</strong> ${user.email}</div>
          <div><strong>Birthday:</strong> ${user.birthday || 'N/A'}</div>
          <div><strong>Address:</strong> ${user.address || 'N/A'}</div>
        </div>
        <hr style="border-color: var(--border); margin: 1.5rem 0;">
        ${bookingsHtml}
      `;
      document.getElementById('user-details-modal').style.display = 'flex';
    }

    /**
     * Opens a modal pre-filled with a user's information, allowing an admin to edit their details.
     * @param {string} email - The email of the user to be edited.
     */
    function openEditUserModal(email) {
      const user = JSON.parse(localStorage.getItem('users') || '[]').find(u => u.email === email);
      if (!user) return;

      document.getElementById('edit-user-email-original').value = user.email;
      document.getElementById('edit-user-name').value = user.name;
      document.getElementById('edit-user-email').value = user.email;
      document.getElementById('edit-user-modal').style.display = 'flex';
    }

    // Event listener to close the user details modal.
    document.getElementById('close-modal-btn').addEventListener('click', () => {
      document.getElementById('user-details-modal').style.display = 'none';
    });

    // Event listener to close the edit user modal.
    document.getElementById('close-edit-modal-btn').addEventListener('click', () => {
      document.getElementById('edit-user-modal').style.display = 'none';
    });

    /**
     * Handles the click event for the delete user button.
     * It shows a confirmation prompt before permanently deleting a user and their associated data.
     */
    document.getElementById('delete-user-btn').addEventListener('click', function() {
      const originalEmail = document.getElementById('edit-user-email-original').value;
      if (confirm(`Are you sure you want to delete the user ${originalEmail}? This action cannot be undone.`)) {
        let users = JSON.parse(localStorage.getItem('users') || '[]');
        const updatedUsers = users.filter(u => u.email !== originalEmail);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        document.getElementById('edit-user-modal').style.display = 'none';
        loadAllUsers();
        alert('User has been deleted.');
      }
    });

    /**
     * Handles the submission of the edit user form.
     * It updates the user's details in localStorage and refreshes the user list.
     */
    document.getElementById('edit-user-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const originalEmail = document.getElementById('edit-user-email-original').value;
      const newName = document.getElementById('edit-user-name').value;
      const newEmail = document.getElementById('edit-user-email').value;
      let users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex(u => u.email === originalEmail);
      if (userIndex !== -1) {
        users[userIndex].name = newName;
        users[userIndex].email = newEmail;
        localStorage.setItem('users', JSON.stringify(users));
      }
      document.getElementById('edit-user-modal').style.display = 'none';
      loadAllUsers();
      });

    /**
     * Renders a line chart to visualize monthly revenue over time.
     * It processes all bookings to aggregate revenue by month and then plots the data.
     */
    function renderRevenueChart() {
      const allBookings = getAllBookingsFromStorage();
      const monthlyRevenue = {};

      // Process bookings to aggregate revenue by month
      allBookings.forEach(booking => {
        const date = new Date(booking.createdAt || booking.paymentDate || booking.pickupDate);
        if (Number.isNaN(date.getTime())) return;
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyRevenue[monthYear]) {
          monthlyRevenue[monthYear] = 0;
        }
        monthlyRevenue[monthYear] += getBookingAmount(booking);
      });

      // Sort months chronologically
      const sortedMonths = Object.keys(monthlyRevenue).sort((a, b) => new Date(a) - new Date(b));
      const chartLabels = sortedMonths.map(month => {
        const [year, monthNumber] = month.split('-');
        return new Date(Number(year), Number(monthNumber) - 1, 1).toLocaleString('default', { month: 'short', year: 'numeric' });
      });
      const chartData = sortedMonths.map(month => monthlyRevenue[month]);

      const ctx = document.getElementById('revenueChart').getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: chartLabels,
          datasets: [{
            label: 'Monthly Revenue',
            data: chartData,
            backgroundColor: 'rgba(168, 85, 247, 0.2)',
            borderColor: 'rgba(168, 85, 247, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(168, 85, 247, 1)',
            pointBorderColor: '#fff',
            pointHoverRadius: 7,
            tension: 0.3,
            fill: true,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: '#6b6384',
                callback: function(value) { return '₱' + value.toLocaleString(); }
              },
              grid: { color: 'rgba(107, 99, 132, 0.16)' }
            },
            x: {
              ticks: { color: '#6b6384' },
              grid: { color: 'rgba(107, 99, 132, 0.1)' }
            }
          },
          plugins: { legend: { display: false } }
        }
      });
    }

     /**
      * Renders a horizontal bar chart displaying the top 10 most frequently booked vehicles.
      * This helps visualize vehicle popularity.
      */
     function renderVehiclePerformanceChart() {
      const allBookings = getAllBookingsFromStorage();
      const vehicleCounts = {};

      // Count bookings for each vehicle
      allBookings.forEach(booking => {
        const vehicleName = getBookingVehicleName(booking);
        vehicleCounts[vehicleName] = (vehicleCounts[vehicleName] || 0) + 1;
      });

      // Sort vehicles by booking count in descending order
      const sortedVehicles = Object.entries(vehicleCounts).sort(([, a], [, b]) => b - a).slice(0, 10); // Get top 10


      const chartLabels = sortedVehicles.map(([name]) => name);
      const chartData = sortedVehicles.map(([, count]) => count);

      const ctx = document.getElementById('vehiclePerformanceChart').getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: chartLabels,
          datasets: [{
            label: 'Number of Bookings',
            data: chartData,
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
          }]
        },
        options: {
          indexAxis: 'y', // This makes the bar chart horizontal
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                color: '#6b6384',
                stepSize: 1 // Ensure ticks are whole numbers for counts
              },
              grid: { color: 'rgba(107, 99, 132, 0.16)' }
            },
            y: {
              ticks: { color: '#6b6384' },
              grid: { display: false }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            title: { display: false }
          }
        }
      });
    }

    /**
     * Renders a pie chart to show the gender distribution of all registered users.
     * It categorizes users by gender and visualizes the proportions.
     */
    function renderGenderChart() {
      const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const genderCounts = {
        'Male': 0,
        'Female': 0,
        'Other': 0,
        'Not Specified': 0
      };

      allUsers.forEach(user => {
        switch (String(user.gender || '').trim().toLowerCase()) {
          case 'male':
            genderCounts['Male']++;
            break;
          case 'female':
            genderCounts['Female']++;
            break;
          case 'other':
          case 'prefer_not_to_say':
          case 'prefer not to say':
            genderCounts['Other']++;
            break;
          default:
            if (user.gender) { // Catch any other non-empty values
              genderCounts['Other']++;
            } else {
              genderCounts['Not Specified']++;
            }
            break;
        }
      });

      const ctx = document.getElementById('genderDistributionChart').getContext('2d');
      new Chart(ctx, {
        type: 'pie',
        data: {
          labels: Object.keys(genderCounts),
          datasets: [{
            label: 'User Count',
            data: Object.values(genderCounts),
            backgroundColor: [
              'rgba(59, 130, 246, 0.7)',  // Blue for Male
              'rgba(236, 72, 153, 0.7)', // Pink for Female
              'rgba(168, 85, 247, 0.7)', // Purple for Other
              'rgba(107, 114, 128, 0.7)' // Gray for Not Specified
            ],
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { color: '#1c1430', font: { weight: '600' } } },
            title: { display: false }
          }
        }
      });
    }

    /**
     * Updates the authentication buttons in the header to show a "Logout" button.
     */
    function updateAuthButtons() {
      const container = document.getElementById('auth-buttons');
      if (container) {
        container.innerHTML = `<button onclick="logout()" class="btn-login">Logout</button>`;
      }
    }

    /**
     * Logs the current user out by clearing sessionStorage and redirecting to the homepage.
     */
    function logout() {
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('isNewUser');
      localStorage.removeItem('smartdriveUser');
      localStorage.removeItem('smartdriveUsers');
      window.location.href = 'index.php';
    }

    // Attach the logout function to the logout button if it exists.
    document.getElementById('logout-btn')?.addEventListener('click', logout);

    // Run the main initialization function when the page has fully loaded.
    window.addEventListener('load', () => {
      initAdminDashboard();
    });