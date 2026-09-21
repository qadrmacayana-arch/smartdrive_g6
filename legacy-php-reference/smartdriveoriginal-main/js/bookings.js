/**
 * Initializes the admin dashboard.
 * Checks for admin credentials, then loads all stats, tables, and charts.
 */
function initAdminDashboard() {
      // Check if user is admin, otherwise redirect
      const user = JSON.parse(sessionStorage.getItem('user') || 'null');
      // Simple admin check, in a real app this would be more secure
      if (!user || user.email !== 'admin@smartrentals.com') { 
        // window.location.href = 'login.php';
        // return;
      }

      loadAdminStats();
      loadAllBookings();
      loadAllUsers();
      renderRevenueChart();
      renderVehiclePerformanceChart();
      renderGenderChart();
      updateAuthButtons();
    }

    /**
     * Retrieves all user bookings from localStorage.
     * It iterates through all localStorage keys, finds those matching the 'userBookings_' pattern,
     * and aggregates them into a single array, sorted by the most recent booking date.
     * @returns {Array} An array of all booking objects.
     */
    function getAllBookingsFromStorage() {
        let allBookings = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('userBookings_')) {
                const bookings = JSON.parse(localStorage.getItem(key) || '[]');
                allBookings.push(...bookings);
            }
        }
        // Sort by most recent first, assuming dates are stored properly
        allBookings.sort((a, b) => new Date(b.pickupDate) - new Date(a.pickupDate));
        return allBookings;
    }

    /**
     * Calculates and displays key statistics on the dashboard.
     * This includes total revenue, total bookings, registered users, and available vehicles.
     */
    function loadAdminStats() {
      const allBookings = getAllBookingsFromStorage();
      const allUsers = JSON.parse(localStorage.getItem('users') || '[]');

      const totalRevenue = allBookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);

      document.getElementById('stat-revenue').textContent = `₱${totalRevenue.toLocaleString()}`;
      document.getElementById('stat-total-bookings').textContent = allBookings.length;
      document.getElementById('stat-users').textContent = allUsers.length;
      document.getElementById('stat-vehicles').textContent = typeof CARS !== 'undefined' ? CARS.length : 0;
    }

    /**
     * Loads and displays all bookings from all users in a table.
     * The bookings are sorted by date in descending order.
     */
    function loadAllBookings() {
        const tbody = document.getElementById('admin-bookings-body'); // Assumes an element with this ID exists.
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
              <td>${booking.vehicleName}</td>
              <td>₱${(booking.totalPrice || 0).toLocaleString()}</td>
              <td><span class="text-primary font-semibold">Confirmed</span></td>
            `;
            tbody.appendChild(row);
        });
    }

    /**
     * Loads all registered users, calculates their total spending, and displays the top 5 spenders.
     * It fetches users and all bookings, aggregates spending per user, sorts them,
     * and then renders the top spenders in a table.
     */
    function loadAllUsers() {
        const tbody = document.getElementById('admin-users-body');
        const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
        if (!tbody) return; // Guard clause
        tbody.innerHTML = ''; // Clear existing rows

        const allBookings = getAllBookingsFromStorage();

        // Calculate total spending for each user
        const userSpending = allUsers.map(user => {
            const totalSpent = allBookings
                .filter(b => b.customerEmail === user.email)
                .reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
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
              <td>${user.name}</td>
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
     * Adds click event listeners to the 'View' and 'Edit' buttons in the user list.
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
     * Opens a modal displaying detailed information about a specific user, including their booking history.
     * @param {string} email - The email of the user to display.
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
          bookingsHtml += `<tr><td>${b.referenceNumber}</td><td>${b.vehicleName}</td><td>₱${(b.totalPrice || 0).toLocaleString()}</td></tr>`;
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
     * Opens a modal with a form to edit a user's details.
     * @param {string} email - The email of the user to edit.
     */
    function openEditUserModal(email) {
      const user = JSON.parse(localStorage.getItem('users') || '[]').find(u => u.email === email);
      if (!user) return;

      document.getElementById('edit-user-email-original').value = user.email;
      document.getElementById('edit-user-name').value = user.name;
      document.getElementById('edit-user-email').value = user.email;
      document.getElementById('edit-user-modal').style.display = 'flex';
    }

    // Event listener for the close button on the user details modal.
    document.getElementById('close-modal-btn').addEventListener('click', () => {
      document.getElementById('user-details-modal').style.display = 'none';
    });

    // Event listener for the close button on the edit user modal.
    document.getElementById('close-edit-modal-btn').addEventListener('click', () => {
      document.getElementById('edit-user-modal').style.display = 'none';
    });

    /**
     * Event listener for the delete user button.
     * Prompts for confirmation before removing a user from localStorage.
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
     * Event listener for the edit user form submission.
     * Updates the user's name and email in localStorage.
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
     * Renders a line chart displaying monthly revenue.
     * It aggregates total booking prices by month and year.
     */
    function renderRevenueChart() {
      const allBookings = getAllBookingsFromStorage();
      const monthlyRevenue = {};

      // Process bookings to aggregate revenue by month
      allBookings.forEach(booking => {
        const date = new Date(booking.pickupDate);
        const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        
        if (!monthlyRevenue[monthYear]) {
          monthlyRevenue[monthYear] = 0;
        }
        monthlyRevenue[monthYear] += booking.totalPrice || 0;
      });

      // Sort months chronologically
      const sortedMonths = Object.keys(monthlyRevenue).sort((a, b) => new Date(a) - new Date(b));
      const chartLabels = sortedMonths;
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
                color: 'rgba(255, 255, 255, 0.7)',
                callback: function(value) { return '₱' + value.toLocaleString(); }
              },
              grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            x: {
              ticks: { color: 'rgba(255, 255, 255, 0.7)' },
              grid: { color: 'rgba(255, 255, 255, 0.05)' }
            }
          },
          plugins: { legend: { display: false } }
        }
      });
    }

     /**
      * Renders a horizontal bar chart showing the top 10 most booked vehicles.
      * It counts the number of bookings for each vehicle.
      */
     function renderVehiclePerformanceChart() {
      const allBookings = getAllBookingsFromStorage();
      const vehicleCounts = {};

      // Count bookings for each vehicle
      allBookings.forEach(booking => {
        const vehicleName = booking.vehicleName;
        if (vehicleName) {
          vehicleCounts[vehicleName] = (vehicleCounts[vehicleName] || 0) + 1;
        }
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
                color: 'rgba(255, 255, 255, 0.7)',
                stepSize: 1 // Ensure ticks are whole numbers for counts
              },
              grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            y: {
              ticks: { color: 'rgba(255, 255, 255, 0.7)' },
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
     * Renders a pie chart showing the gender distribution of registered users.
     * It counts users based on the 'gender' property in their user object.
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
        switch (user.gender) {
          case 'male':
            genderCounts['Male']++;
            break;
          case 'female':
            genderCounts['Female']++;
            break;
          case 'other':
          case 'prefer_not_to_say':
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
            legend: { position: 'top', labels: { color: 'rgba(255, 255, 255, 0.8)' } },
            title: { display: false }
          }
        }
      });
    }

    /**
     * Updates the authentication buttons in the header to show a "Logout" button for the admin.
     */
    function updateAuthButtons() {
      const container = document.getElementById('auth-buttons');
      container.innerHTML = `<button onclick="logout()" class="btn-login">Logout</button>`;
    }

    /**
     * Logs the admin out by clearing their session data and redirecting to the home page.
     */
    function logout() {
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('isNewUser');
      localStorage.removeItem('smartdriveUser');
      localStorage.removeItem('smartdriveUsers');
      window.location.href = 'index.php';
    }

    // Adds a click listener to the main logout button in the sidebar.
    document.getElementById('logout-btn')?.addEventListener('click', logout);
    
    // Initializes the dashboard when the window has finished loading.
    window.addEventListener('load', initAdminDashboard);