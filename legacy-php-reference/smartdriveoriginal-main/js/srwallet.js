    "use strict";

    // --- UTILITY FUNCTIONS ---
    /**
     * Formats a number into a currency string (e.g., ₱1,234.56).
     * @param {number} amount - The number to format.
     * @returns {string} The formatted currency string.
     */
    const formatCurrency = (amount) => `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // --- UI RENDERING FUNCTIONS ---
    /**
     * Downloads a text file receipt for the user's most recent SR Points activity.
     */
    function downloadReceipt() {
      const user = JSON.parse(sessionStorage.getItem('user') || 'null');
      if (!user) return;

      const lastTopUp = JSON.parse(localStorage.getItem(`lastTopUp_${user.email}`) || 'null');
      if (!lastTopUp) {
        alert('No top-up transaction found to generate a receipt.');
        return;
      }

      const receiptContent = `
        ========================================
        SMARTDRIVE™ WALLET TOP-UP RECEIPT
        ========================================

        Transaction Date: ${new Date(lastTopUp.date).toLocaleString()}

        ----------------------------------------
        CUSTOMER DETAILS
        ----------------------------------------
        Name:    ${user.fullName}
        Email:   ${user.email}

        ----------------------------------------
        TOP-UP DETAILS
        ----------------------------------------
        Amount:      PHP ${lastTopUp.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        Method:      ${lastTopUp.method}

        ========================================

        Thank you for using SR Wallet!
      `;

      const blob = new Blob([receiptContent.trim()], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SR_Wallet_TopUp_Receipt_${new Date(lastTopUp.date).getTime()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }

    /**
     * Fetches the user's wallet balance from localStorage and updates the UI.
     * @param {object} user - The currently logged-in user object.
     */
    function updateWalletDisplay(user) {
        const balance = parseInt(localStorage.getItem(`srPoints_${user.email}`) || '0', 10);
        const walletBalanceEl = document.getElementById('wallet-balance');
        if (walletBalanceEl) {
            walletBalanceEl.textContent = `${balance.toLocaleString()} pts`;
            walletBalanceEl.classList.toggle('empty-wallet', balance === 0);
        }
    }

    /**
     * Renders the user's SR Points earning and spending history.
     * @param {object} user - The currently logged-in user object.
     */
    function renderTransactionHistory(user) {
        const history = getTransactionHistory(user.email); // from shared.js
        const tbody = document.getElementById('transaction-history-body');
        tbody.innerHTML = '';

        if (history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 2rem; color: var(--muted-foreground);">No SR Points activity yet.</td></tr>';
            return;
        }

        history.forEach(tx => {
            const row = document.createElement('tr');
            const amountClass = tx.amount > 0 ? 'text-primary' : 'text-destructive';
            const amountSign = tx.amount > 0 ? '+' : '';
            row.innerHTML = `
              <td>${new Date(tx.date).toLocaleString()}</td>
              <td><strong>${tx.amount > 0 ? 'Earned' : 'Used'}</strong> - ${tx.description}</td>
              <td class="${amountClass}" style="font-weight: 600;">${amountSign}${tx.amount.toLocaleString()} pts</td>
            `;
            tbody.appendChild(row);
        });
    }

    /**
     * Displays the details of the most recent SR Points activity.
     * @param {object} user - The currently logged-in user object.
     */
    function renderRecentTopUp(user) {
        const history = getTransactionHistory(user.email);
        const latestActivity = history.length ? history[0] : null;
        const recentTopUpCard = document.getElementById('recent-top-up-card');
        const lastTopUpContent = document.getElementById('last-top-up-content');
        const noTopUpMessage = document.getElementById('no-top-up-message');

        recentTopUpCard.style.display = 'block';

        if (latestActivity) {
            document.getElementById('last-top-up-amount').textContent = `${latestActivity.amount > 0 ? '+' : ''}${latestActivity.amount.toLocaleString()} pts`;
            document.getElementById('last-top-up-date').textContent = new Date(latestActivity.date).toLocaleString();
            document.getElementById('last-top-up-method').textContent = latestActivity.description;
            lastTopUpContent.style.display = 'block';
            noTopUpMessage.style.display = 'none';
        } else {
            lastTopUpContent.style.display = 'none';
            noTopUpMessage.style.display = 'block';
        }
    }

    // --- EVENT HANDLERS & INITIALIZATION ---
        function getWalletUser() {
            try {
                return JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('smartdriveUser') || 'null');
            } catch (error) {
                return null;
            }
        }

    /**
     * Sets up legacy wallet form handlers when that form is present.
     * @param {object} user - The currently logged-in user object.
     */
    function handleTopUpForm(user) {
        const form = document.getElementById('top-up-form');
        const amountInput = document.getElementById('top-up-amount');
        const paymentDetails = {
            'Credit Card': document.getElementById('topup-credit-card-details'),
            'GCash': document.getElementById('topup-gcash-details'),
            'Maya': document.getElementById('topup-maya-details')
        };

        // Quick amount buttons
        document.querySelectorAll('.quick-amounts button').forEach(btn => {
            btn.addEventListener('click', () => amountInput.value = btn.dataset.amount);
        });

        // Payment method selection
        function selectPaymentMethod(radio) {
                radio.checked = true;
                document.querySelectorAll('.wallet-payment-label').forEach(label => label.classList.remove('active'));
                document.querySelector(`label[for="${radio.id}"]`).classList.add('active');
                Object.values(paymentDetails).forEach(el => el.style.display = 'none');
                if (paymentDetails[radio.value]) {
                    paymentDetails[radio.value].style.display = 'block';
                }
        }

        document.querySelectorAll('input[name="topup_method"]').forEach(radio => {
            radio.addEventListener('change', () => selectPaymentMethod(radio));
            document.querySelector(`label[for="${radio.id}"]`).addEventListener('click', () => selectPaymentMethod(radio));
        });

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = parseFloat(amountInput.value);
            const paymentMethod = document.querySelector('input[name="topup_method"]:checked').value;

            if (isNaN(amount) || amount < 100) {
                showToast('Please enter a valid amount (minimum ₱100).', 'error');
                return;
            }

            // Basic validation for payment details
            if (paymentMethod === 'Credit Card' && document.getElementById('topup-card-number').value.length < 19) {
                showToast('Please enter a valid credit card number.', 'error'); return;
            }
            if (paymentMethod === 'GCash' && !document.getElementById('topup-gcash-ref').value.trim()) {
                showToast('Please enter the GCash reference number.', 'error'); return;
            }
            if (paymentMethod === 'Maya' && !document.getElementById('topup-maya-ref').value.trim()) {
                showToast('Please enter the Maya transaction ID.', 'error'); return;
            }

            // Simulate API call
            showToast('Processing your top-up...', 'info');
            setTimeout(() => {
                const currentBalance = parseFloat(localStorage.getItem(`wallet_${user.email}`) || '0');
                const newBalance = currentBalance + amount;
                localStorage.setItem(`wallet_${user.email}`, newBalance);

                addTransaction(user.email, `Top-up via ${paymentMethod}`, amount);
                localStorage.setItem(`lastTopUp_${user.email}`, JSON.stringify({ amount, date: new Date().toISOString(), method: paymentMethod }));

                // Update UI
                updateWalletDisplay(user);
                renderTransactionHistory(user);
                renderRecentTopUp(user);
                form.reset();
                document.querySelectorAll('.wallet-payment-label').forEach(l => l.classList.remove('active')); document.querySelector('label[for="topup-credit-card"]').classList.add('active');
                showToast('Top-up successful!', 'success');
            }, 1500);
        });
    }

    /**
     * Main entry point for the wallet page.
     * It authenticates the user and initializes all UI components and event handlers.
     */
    function initWalletPage() {
        const user = getWalletUser();
        if (!user) {
            window.location.href = 'login.php?reason=wallet_unauthorized';
            return;
        }

        updateAuthButtons();
        updateWalletDisplay(user);
        renderTransactionHistory(user);
        renderRecentTopUp(user);

    }

    window.addEventListener('load', initWalletPage);