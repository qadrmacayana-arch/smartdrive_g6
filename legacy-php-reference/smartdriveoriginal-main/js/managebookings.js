﻿/**
 * Checks if the currently logged-in user is an administrator.
 * If not, it redirects them to the login page.
 * If they are an admin, it updates the authentication buttons to show a logout option.
 */
function checkAdmin() {
      const user = JSON.parse(sessionStorage.getItem('user') || 'null');
      if (!user || user.email !== 'admin@smartrentals.com') {
        window.location.href = 'login.php';
      } else {
        // If the user is an admin, display the logout button.
        document.getElementById('auth-buttons').innerHTML = `<button onclick="logout()" class="btn-login">Logout</button>`;
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

    /**
     * Retrieves all booking records from all users stored in localStorage.
     * It iterates through localStorage keys, finds ones that start with 'userBookings_',
     * parses the booking data, and returns a single array sorted by the most recent pickup date.
     * @returns {Array<Object>} An array containing all booking objects from all users.
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
        return allBookings.sort((a, b) => new Date(b.pickupDate) - new Date(a.pickupDate));
    }

    /**
     * Loads all booking data from storage and renders it into the admin bookings table.
     * It displays the reference number, customer name, vehicle, dates, total price, and status.
     */
    function loadAllBookings() {
        const tbody = document.getElementById('admin-bookings-body');
        const allBookings = getAllBookingsFromStorage();
        tbody.innerHTML = ''; // Clear any existing rows in the table body.

        if (allBookings.length === 0) {
            // Display a message if no bookings are found.
            tbody.innerHTML = `<tr><td colspan="6" class="text-center p-12 text-muted-foreground">No bookings have been made on the platform yet.</td></tr>`;
            return;
        }

        allBookings.forEach(booking => {
            const row = document.createElement('tr');
            const bookingStatus = booking.status || 'Confirmed';

            // Define the status options for the dropdown
            const statuses = ['Confirmed', 'In Progress', 'Completed', 'Cancelled'];
            const statusOptions = statuses.map(s => 
                `<option value="${s}" ${s === bookingStatus ? 'selected' : ''}>${s}</option>`
            ).join('');

            // Create a status badge that changes color based on the status
            let statusBadgeClass = 'status-badge';
            if (bookingStatus === 'Completed') statusBadgeClass += ' completed';
            else if (bookingStatus === 'Cancelled') statusBadgeClass += ' cancelled';
            else if (bookingStatus === 'In Progress') statusBadgeClass += ' pending'; // Using 'pending' style for 'In Progress'
            else statusBadgeClass += ' confirmed';

            row.innerHTML = `
              <td>${booking.referenceNumber || 'N/A'}</td>
              <td>${booking.customerName || 'N/A'}</td>
              <td>${booking.vehicleName}</td>
              <td>${booking.pickupDate} to ${booking.returnDate}</td>
              <td>₱${(booking.totalPrice || 0).toLocaleString()}</td>
              <td>
                <div class="select-wrapper" style="min-width: 150px;">
                  <select class="status-select" data-booking-ref="${booking.referenceNumber}" data-user-email="${booking.customerEmail}">
                    ${statusOptions}
                  </select>
                </div>
              </td>
            `;
            tbody.appendChild(row);
        });

        // Add event listeners to the new status dropdowns
        addStatusChangeListeners();
    }

    /**
     * Attaches event listeners to all status dropdowns in the bookings table.
     * When a status is changed, it updates the corresponding booking record in localStorage.
     */
    function addStatusChangeListeners() {
        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', function() {
                const newStatus = this.value;
                const ref = this.dataset.bookingRef;
                const email = this.dataset.userEmail;
                updateBookingStatus(email, ref, newStatus);
            });
        });
    }

    /**
     * Exports all booking data to a CSV (Comma Separated Values) file.
     * This allows administrators to download a spreadsheet of all booking records.
     */
    function exportBookingsToCSV() {
        const allBookings = getAllBookingsFromStorage();
        if (allBookings.length === 0) {
            alert('No bookings to export.');
            return;
        }

        const headers = [
            "Reference Number",
            "Customer Name",
            "Customer Email",
            "Vehicle Name",
            "Pickup Date",
            "Return Date",
            "Total Price",
            "Status"
        ];

        const csvRows = [headers.join(',')];

        // Iterate through each booking and format its data into a CSV row.
        for (const booking of allBookings) {
            const values = [
                booking.referenceNumber || '',
                `"${booking.customerName || ''}"`, // Enclose in quotes to handle commas in names.
                booking.customerEmail || '',
                `"${booking.vehicleName || ''}"`, // Enclose in quotes to handle commas in names.
                booking.pickupDate || '',
                booking.returnDate || '',
                booking.totalPrice || 0,
                booking.status || 'Confirmed'
            ].join(',');
            csvRows.push(values);
        }
        
        // Create a Blob containing the CSV data.
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        
        // Create a temporary anchor element to trigger the download.
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `smartdrive_bookings_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Updates the status of a specific booking in localStorage.
     * @param {string} userEmail - The email of the user who made the booking.
     * @param {string} referenceNumber - The unique reference number of the booking to update.
     * @param {string} newStatus - The new status to set for the booking.
     */
    function updateBookingStatus(userEmail, referenceNumber, newStatus) {
        const storageKey = `userBookings_${userEmail}`;
        let userBookings = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const bookingIndex = userBookings.findIndex(b => b.referenceNumber === referenceNumber);

        if (bookingIndex !== -1) {
            userBookings[bookingIndex].status = newStatus;
            localStorage.setItem(storageKey, JSON.stringify(userBookings));
            // Optional: Show a success message
            alert(`Booking ${referenceNumber} has been updated to "${newStatus}".`);
            loadAllBookings(); // Refresh the table to reflect the change
        }
    }

    // Attach the logout function to the logout button in the sidebar (if it exists).
    document.getElementById('logout-btn')?.addEventListener('click', logout);
    
    // When the window loads, perform initial checks and load data.
    window.addEventListener('load', () => {
        checkAdmin(); // Verify admin access.
        loadAllBookings(); // Populate the bookings table.
        document.getElementById('export-csv-btn').addEventListener('click', exportBookingsToCSV); // Attach event listener for CSV export.
    });