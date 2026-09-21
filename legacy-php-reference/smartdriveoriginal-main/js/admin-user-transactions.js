/**
 * Initializes the User Transactions admin page.
 * Checks if the logged-in user is an admin, otherwise redirects to the login page.
 */
function initUserTransactionsPage() {
      const user = JSON.parse(sessionStorage.getItem('user') || 'null');
      if (!user || user.email !== 'admin@smartrentals.com') { 
        window.location.href = 'login.php';
        return;
      }
      updateAuthButtons();
      loadUserTransactions();
    }

    /**
     * Loads all user transaction data from localStorage and renders it into collapsible cards on the page.
     * It fetches every user's wallet balance, transaction history, bookings, and claimed discounts,
     * then displays them in collapsible cards.
     */
    async function loadUserTransactions() {
      let allUsers;
      try {
        const response = await fetch('api/admin-transactions.php');
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || 'Unable to load transactions.');
        allUsers = result.users || [];
      } catch (error) {
        console.error('Unable to load transactions from database:', error);
        allUsers = JSON.parse(localStorage.getItem('users') || '[]');
      }
      const transactionsListDiv = document.getElementById('user-transactions-list');
      transactionsListDiv.innerHTML = '';

      if (allUsers.length === 0) {
        transactionsListDiv.innerHTML = '<p class="no-data-message">No registered users found.</p>';
        return;
      }

      allUsers.forEach(user => {
        if (user.email === 'admin@smartrentals.com') return; // Skip admin user

        const walletBalance = user.walletBalance ?? parseFloat(localStorage.getItem(`wallet_${user.email}`) || '0');
        const walletHistory = user.walletHistory || JSON.parse(localStorage.getItem(`wallet_history_${user.email}`) || '[]');
        const userBookings = user.bookings || JSON.parse(localStorage.getItem(`userBookings_${user.email}`) || '[]');
        const claimedCodes = JSON.parse(localStorage.getItem(`claimedCodes_${user.email}`) || '[]');

        const userCard = document.createElement('div');
        userCard.className = 'user-transaction-card';
        userCard.innerHTML = `
          <div class="user-transaction-card-header" data-target="content-${user.email.replace(/[^a-zA-Z0-9]/g, '')}">
            <h3>${user.name} (${user.email})</h3>
            <span>&#9654;</span>
          </div>
          <div id="content-${user.email.replace(/[^a-zA-Z0-9]/g, '')}" class="user-transaction-card-content">
            <div class="transaction-section">
              <h4>Current Wallet Balance: <span style="color: var(--primary);">${formatCurrency(walletBalance)}</span></h4>
            </div>

            <div class="transaction-section">
              <h4>Wallet History (Top-ups & Points)</h4>
              ${walletHistory.length > 0 ? `
                <table>
                  <thead>
                    <tr><th>Date</th><th>Description</th><th>Amount</th></tr>
                  </thead>
                  <tbody>
                    ${walletHistory.map(tx => `
                      <tr>
                        <td>${new Date(tx.date).toLocaleDateString()}</td>
                        <td>${tx.description}</td>
                        <td class="${tx.amount > 0 ? 'amount-positive' : 'amount-negative'}">${tx.amount > 0 ? '+' : ''}${formatCurrency(tx.amount)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : '<p class="no-data-message">No wallet transactions.</p>'}
            </div>

            <div class="transaction-section">
              <h4>Booked Cars</h4>
              ${userBookings.length > 0 ? `
                <table>
                  <thead>
                    <tr><th>Ref #</th><th>Vehicle</th><th>Pickup</th><th>Return</th><th>Total Price</th></tr>
                  </thead>
                  <tbody>
                    ${userBookings.map(booking => `
                      <tr>
                        <td>${booking.referenceNumber}</td>
                        <td>${booking.vehicleName}</td>
                        <td>${new Date(booking.pickupDate).toLocaleDateString()}</td>
                        <td>${new Date(booking.returnDate).toLocaleDateString()}</td>
                        <td>${formatCurrency(booking.totalPrice)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : '<p class="no-data-message">No car bookings.</p>'}
            </div>

            <div class="transaction-section">
              <h4>Claimed Discounts</h4>
              ${claimedCodes.length > 0 ? `
                <ul>
                  ${claimedCodes.map(code => `<li><span>Code:</span> <span>${code}</span></li>`).join('')}
                </ul>
              ` : '<p class="no-data-message">No discounts claimed.</p>'}
            </div>
          </div>
        `;
        transactionsListDiv.appendChild(userCard);
      });

      // Add event listeners for expand/collapse
      document.querySelectorAll('.user-transaction-card-header').forEach(header => {
        header.addEventListener('click', function() {
          const targetId = this.dataset.target;
          const content = document.getElementById(targetId);
          if (content) {
            content.classList.toggle('expanded');
            this.classList.toggle('expanded');
          }
        });
      });
    }

    /**
     * Formats a number as Philippine Peso currency.
     * @param {number} amount - The amount to format.
     * @returns {string} The formatted currency string (e.g., "₱1,234.56").
     */
    function formatCurrency(amount) {
      return '₱' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    /**
     * Updates the authentication buttons in the header to show a "Logout" button.
     */
    function updateAuthButtons() {
      const container = document.getElementById('auth-buttons');
      container.innerHTML = `<button onclick="logout()" class="btn-login">Logout</button>`;
    }

    /**
     * Logs the admin user out by removing their data from sessionStorage and redirecting to the home page.
     */
    function logout() {
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('isNewUser');
      localStorage.removeItem('smartdriveUser');
      localStorage.removeItem('smartdriveUsers');
      window.location.href = 'index.php';
    }

    document.getElementById('logout-btn')?.addEventListener('click', logout);
    // Initializes the page when the window has finished loading.
    window.addEventListener('load', initUserTransactionsPage);