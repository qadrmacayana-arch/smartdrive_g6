/**
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
     * Loads all registered users from local storage, calculates their total bookings and spending,
     * and renders them into the admin users table.
     */
    let managedUsers = [];
    const ADMIN_EMAIL = 'admin@smartrentals.com';

    function isRegularUser(user) {
      return String(user?.email || '').toLowerCase() !== ADMIN_EMAIL;
    }

    function normalizeUserRecord(user) {
      return {
        ...user,
        id: user.id || user.user_id || null,
        email: user.email || user.userEmail || '',
        name: user.name || user.fullName || user.full_name || 'Unnamed User',
        fullName: user.fullName || user.full_name || user.name || 'Unnamed User',
        registrationDate: user.registrationDate || user.registration_date || user.created_at || user.createdAt || new Date().toISOString(),
        isActive: user.isActive ?? user.is_active ?? true,
        totalBookings: user.totalBookings ?? user.total_bookings ?? null,
        totalSpent: user.totalSpent ?? user.total_spent ?? null
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

      const normalized = candidates.filter(Boolean).map(normalizeUserRecord).filter(user => user.email);
      return normalized.filter(isRegularUser).filter((user, index, list) => {
        const lowerEmail = String(user.email).toLowerCase();
        return list.findIndex(item => String(item.email).toLowerCase() === lowerEmail) === index;
      });
    }

    async function getSupabaseUsers() {
      if (!window.smartdriveSupabase) {
        throw new Error('Supabase is not configured. Restore the anon key in js/supabase.js.');
      }

      const { data: sessionData, error: sessionError } = await window.smartdriveSupabase.auth.getSession();
      if (sessionError) throw new Error(`Supabase session check failed: ${sessionError.message}`);
      if (!sessionData.session) {
        throw new Error('No Supabase Auth session found. Log in with the admin account through Supabase Auth.');
      }

      const { data, error } = await window.smartdriveSupabase.rpc('admin_list_auth_users');
      if (error) {
        if (/could not find the function .*admin_list_auth_users|schema cache/i.test(error.message)) {
          throw new Error('Supabase function admin_list_auth_users is missing. Run its SQL in the Supabase SQL Editor.');
        }
        throw new Error(`Unable to read Supabase Auth users: ${error.message}`);
      }
      if (!Array.isArray(data)) {
        throw new Error('Supabase Auth returned an invalid users response.');
      }

      return data.map(normalizeUserRecord).filter(isRegularUser);
    }

    function syncLocalUsersWithSupabase(users) {
      const normalizedUsers = users.map(normalizeUserRecord);
      localStorage.setItem('users', JSON.stringify(normalizedUsers));
      localStorage.setItem('smartdriveUsers', JSON.stringify(normalizedUsers));
    }

    function removeUserFromLocalStorage(email) {
      const keys = ['users', 'smartdriveUsers', 'smartdriveUser'];
      const normalizedEmail = String(email || '').toLowerCase();

      keys.forEach((key) => {
        try {
          const storedValue = JSON.parse(localStorage.getItem(key) || 'null');
          if (!storedValue) return;

          if (Array.isArray(storedValue)) {
            const updated = storedValue.filter((user) => String(user?.email || '').toLowerCase() !== normalizedEmail);
            localStorage.setItem(key, JSON.stringify(updated));
            return;
          }

          if (storedValue && String(storedValue.email || '').toLowerCase() === normalizedEmail) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          console.warn(`Unable to sync ${key} local storage after user deletion:`, error);
        }
      });

      const bookingKey = `userBookings_${email}`;
      localStorage.removeItem(bookingKey);
    }

    async function deleteUserFromSupabase(email) {
      if (!window.smartdriveSupabase) return false;

      try {
        const { data, error } = await window.smartdriveSupabase.rpc('admin_delete_user_by_email', {
          target_email: email
        });

        if (!error) {
          return data === true;
        }

        console.warn('Supabase auth user deletion failed:', error.message);
      } catch (error) {
        console.warn('Supabase auth user deletion request failed:', error);
      }

      const tableNames = ['profiles', 'users'];
      for (const tableName of tableNames) {
        try {
          const { data, error: lookupError } = await window.smartdriveSupabase
            .from(tableName)
            .select('id,email')
            .eq('email', email)
            .limit(1);

          if (lookupError) {
            const isMissingColumn = /does not exist|column .* does not exist|not found/i.test(lookupError.message);
            if (isMissingColumn) continue;
            console.warn(`Could not find ${tableName} record for deletion:`, lookupError.message);
            continue;
          }

          if (!Array.isArray(data) || data.length === 0) continue;

          const { error: deleteError } = await window.smartdriveSupabase
            .from(tableName)
            .delete()
            .eq('id', data[0].id);

          if (!deleteError) {
            return true;
          }

          console.warn(`Supabase delete failed for ${tableName}:`, deleteError.message);
        } catch (error) {
          console.warn(`Supabase deletion for ${tableName} failed:`, error);
        }
      }

      return false;
    }

    async function updateUserInSupabase(originalEmail, newName, newEmail) {
      if (!window.smartdriveSupabase) return false;

      const tableNames = ['profiles', 'users'];
      for (const tableName of tableNames) {
        try {
          const { data, error: lookupError } = await window.smartdriveSupabase
            .from(tableName)
            .select('id,email')
            .or(`email.eq.${originalEmail},email.eq.${newEmail}`)
            .limit(1);

          if (lookupError) {
            const isMissingColumn = /does not exist|column .* does not exist|not found/i.test(lookupError.message);
            if (isMissingColumn) continue;
            console.warn(`Could not find ${tableName} record for update:`, lookupError.message);
            continue;
          }

          if (!Array.isArray(data) || data.length === 0) continue;

          const payload = { name: newName, full_name: newName, email: newEmail, userEmail: newEmail };
          const { error } = await window.smartdriveSupabase
            .from(tableName)
            .update(payload)
            .eq('id', data[0].id);

          if (!error) {
            return true;
          }

          console.warn(`Supabase update failed for ${tableName}:`, error.message);
        } catch (error) {
          console.warn(`Supabase update for ${tableName} failed:`, error);
        }
      }

      return false;
    }

    async function loadAllUsers() {
        const tbody = document.getElementById('admin-users-body');
      const count = document.getElementById('total-users-count');
        tbody.innerHTML = '';
        let loadError = null;

      try {
        if (!window.smartdriveSupabase) {
          throw new Error('Supabase is not configured. Restore the anon key in js/supabase.js.');
        }

        managedUsers = await getSupabaseUsers();
        syncLocalUsersWithSupabase(managedUsers);
      } catch (error) {
        console.error('Unable to load users from Supabase.', error);
        loadError = error;
        managedUsers = [];
      }

      count.textContent = managedUsers.length;

      if (loadError) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center p-12 text-muted-foreground">${escapeHtml(loadError.message)}</td></tr>`;
        return;
      }

      if (managedUsers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center p-12 text-muted-foreground">No users have registered yet.</td></tr>`;
            return;
        }

      managedUsers.forEach(user => {
            const storageKey = `userBookings_${user.email}`;
            const userBookings = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const totalBookings = user.totalBookings ?? userBookings.length;
        const totalSpent = user.totalSpent ?? userBookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);

            // Determine the member since date, defaulting to 'N/A' if not available.
            // In a real app, you'd store the registration date.
            const memberSince = user.registrationDate ? new Date(user.registrationDate).toLocaleDateString() : 'N/A';

            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${user.name || user.fullName || 'N/A'}</td>
              <td>${user.email}</td>
              <td>${memberSince}</td>
              <td>${totalBookings}</td>
              <td>₱${totalSpent.toLocaleString()}</td>
              <td>${user.isActive === false ? 'Inactive' : 'Active'}</td>
              <td class="action-cell">
                <button class="btn-small view-btn" data-email="${user.email}">View</button>
                <button class="btn-small edit-btn" data-email="${user.email}" style="background-color: var(--primary); color: var(--primary-foreground);">Edit</button>
              </td>
            `;
            tbody.appendChild(row);
        });

        // Add event listeners for the new buttons
        addUserActionListeners();
    }

    /**
     * Attaches event listeners to the 'View' and 'Edit' buttons for each user in the user list.
     */
    function addUserActionListeners() {
      document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const userEmail = this.dataset.email;
          openUserDetailsModal(userEmail);
        });
      });

      document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const userEmail = this.dataset.email;
          openEditUserModal(userEmail);
        });
      });
    }

    /**
     * Opens a modal displaying detailed information about a specific user, including their booking history.
     * @param {string} email - The email of the user to display.
     */
    function openUserDetailsModal(email) {
      const user = managedUsers.find(u => u.email === email);
      const storageKey = `userBookings_${email}`;
      const userBookings = JSON.parse(localStorage.getItem(storageKey) || '[]');

      // If user is not found, exit the function.
      if (!user) return;

      const modalBody = document.getElementById('user-modal-body');
      let bookingsHtml = '<h4>Booking History</h4>';
      if (userBookings.length > 0) {
        bookingsHtml += `
          <table class="bookings-table">
            <thead><tr><th>Ref #</th><th>Vehicle</th><th>Total</th></tr></thead>
            <tbody>
              ${userBookings.map(b => `
                <tr>
                  <td>${b.referenceNumber}</td>
                  <td>${b.vehicleName}</td>
                  <td>₱${(b.totalPrice || 0).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
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
      const user = managedUsers.find(u => u.email === email);
      // If user is not found, exit the function.
      if (!user) return;

      // Populate the edit form fields with the user's current data.
      document.getElementById('edit-user-email-original').value = user.email;
      document.getElementById('edit-user-name').value = user.name;
      document.getElementById('edit-user-email').value = user.email;
      document.getElementById('edit-user-modal').style.display = 'flex';
    }

    // Event listener to close the user details modal.
    document.getElementById('close-modal-btn').addEventListener('click', () => {
      document.getElementById('user-details-modal').style.display = 'none';
    });

    document.getElementById('close-edit-modal-btn').addEventListener('click', () => {
      document.getElementById('edit-user-modal').style.display = 'none';
    });

    /**
     * Event listener for the delete user button.
     * Prompts for confirmation before removing a user from localStorage.
     */
    document.getElementById('delete-user-btn').addEventListener('click', async function() {
        const originalEmail = document.getElementById('edit-user-email-original').value;
        if (!confirm(`Are you sure you want to delete the user ${originalEmail}? This action cannot be undone.`)) return;

        try {
            const deletedInSupabase = await deleteUserFromSupabase(originalEmail);
            if (window.smartdriveSupabase && !deletedInSupabase) {
              throw new Error('The user could not be deleted from Supabase. No local data was removed.');
            }

            if (deletedInSupabase) {
              removeUserFromLocalStorage(originalEmail);
            } else {
              const storedUsers = getStoredUsers();
              const updatedUsers = storedUsers.filter((user) => String(user.email || '').toLowerCase() !== String(originalEmail).toLowerCase());
              localStorage.setItem('users', JSON.stringify(updatedUsers));
              localStorage.setItem('smartdriveUsers', JSON.stringify(updatedUsers));
              localStorage.removeItem('smartdriveUser');
            }

            document.getElementById('edit-user-modal').style.display = 'none';
            await loadAllUsers();
            alert('User has been deleted.');
        } catch (error) {
            console.error('Delete user failed:', error);
            alert(error.message || 'Unable to delete this user.');
        }
    });

    /**
     * Event listener for the edit user form submission.
     * Updates the user's name and email in localStorage.
     */
    document.getElementById('edit-user-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      const originalEmail = document.getElementById('edit-user-email-original').value;
      const newName = document.getElementById('edit-user-name').value.trim();
      const newEmail = document.getElementById('edit-user-email').value.trim();

      if (!newName || !newEmail) {
        alert('Please provide both a name and an email address.');
        return;
      }

      try {
        const updatedInSupabase = await updateUserInSupabase(originalEmail, newName, newEmail);
        if (!updatedInSupabase) {
          const storedUsers = getStoredUsers();
          const updatedUsers = storedUsers.map((user) => {
            if (String(user.email || '').toLowerCase() === String(originalEmail).toLowerCase()) {
              return { ...user, name: newName, fullName: newName, email: newEmail };
            }
            return user;
          });
          localStorage.setItem('users', JSON.stringify(updatedUsers));
          localStorage.setItem('smartdriveUsers', JSON.stringify(updatedUsers));
        }

        const currentUser = JSON.parse(sessionStorage.getItem('user') || 'null');
        if (currentUser && currentUser.email === originalEmail) {
          currentUser.fullName = newName;
          currentUser.name = newName;
          currentUser.email = newEmail;
          sessionStorage.setItem('user', JSON.stringify(currentUser));
        }
        document.getElementById('edit-user-modal').style.display = 'none';
        await loadAllUsers();
      } catch (error) {
        console.error('Update user failed:', error);
        alert(error.message || 'Unable to update user details.');
      }
    });

    // Simple FAQ entries used by the AI assistant and FAQ modal.
    const FAQ_ENTRIES = [
      { q: 'How do I book a vehicle?', a: 'To book, browse vehicles, choose dates, fill required details and confirm payment via our checkout.' },
      { q: 'What payment methods are accepted?', a: 'We accept major credit cards, GCash, and bank transfers.' },
      { q: 'How do I cancel a booking?', a: 'Contact support within 24 hours before rental to request cancellation; fees may apply.' },
      { q: 'How do I become a member?', a: 'Register an account using the Sign Up form. Members get exclusive discounts.' }
    ];
    
    // Create FAQ modal and floating button
    function createFAQWidget() {
      if (document.getElementById('faq-float-btn')) return;
      const btn = document.createElement('button');
      btn.id = 'faq-float-btn';
      btn.textContent = 'FAQ';
      btn.style = 'position:fixed;right:20px;bottom:100px;z-index:10000;padding:10px 14px;border-radius:8px;background:#0b5fff;color:#fff;border:none;cursor:pointer;box-shadow:0 4px 12px rgba(11,95,255,0.2)';
      document.body.appendChild(btn);
      const modal = document.createElement('div');
      modal.id = 'faq-modal';
      modal.style = 'display:none;position:fixed;right:20px;bottom:160px;width:320px;max-height:60vh;overflow:auto;background:#fff;border:1px solid #ddd;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.15);z-index:10000;padding:12px;font-family:inherit';
      modal.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><strong>FAQs</strong><button id="close-faq" style="background:none;border:none;font-size:16px;cursor:pointer">✕</button></div><div id="faq-list"></div>`;
      document.body.appendChild(modal);
      function renderFAQs() {
        const list = modal.querySelector('#faq-list');
        list.innerHTML = FAQ_ENTRIES.map(f=>`<div style="padding:8px;border-bottom:1px solid #f1f1f1"><div style="font-weight:600">${escapeHtml(f.q)}</div><div style="margin-top:6px;color:#333">${escapeHtml(f.a)}</div></div>`).join('');
      }
      btn.addEventListener('click', ()=>{ renderFAQs(); modal.style.display = 'block'; });
      modal.querySelector('#close-faq').addEventListener('click', ()=> modal.style.display = 'none');
    }
    
    // Simple AI assistant with keyword-based matching against FAQ_ENTRIES.
    function createAIAssistant() {
      if (document.getElementById('ai-assistant')) return;
      const container = document.createElement('div');
      container.id = 'ai-assistant';
      container.style = 'position:fixed;right:20px;bottom:20px;width:360px;max-height:70vh;background:#fff;border:1px solid #ddd;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,0.2);z-index:10000;display:flex;flex-direction:column;overflow:hidden;font-family:inherit';
      container.innerHTML = `
        <div style="background:#0b5fff;color:#fff;padding:10px 12px;display:flex;justify-content:space-between;align-items:center">
          <strong>AI Assistant</strong>
          <button id="ai-close" style="background:none;border:none;color:#fff;font-size:16px;cursor:pointer">–</button>
        </div>
        <div id="ai-messages" style="padding:12px;overflow:auto;flex:1;min-height:120px"></div>
        <div style="padding:8px;border-top:1px solid #eee;display:flex;gap:8px">
          <input id="ai-input" placeholder="Ask a question..." style="flex:1;padding:8px;border:1px solid #ddd;border-radius:6px" />
          <button id="ai-send" style="background:#0b5fff;color:#fff;border:none;padding:8px 12px;border-radius:6px;cursor:pointer">Send</button>
        </div>
      `;
      document.body.appendChild(container);
      const messages = container.querySelector('#ai-messages');
      const input = container.querySelector('#ai-input');
      container.querySelector('#ai-send').addEventListener('click', handleSend);
      input.addEventListener('keypress', (e)=> { if (e.key === 'Enter') handleSend(); });
      container.querySelector('#ai-close').addEventListener('click', ()=> container.style.display = container.style.display === 'none' ? 'flex' : 'none');
      function appendMessage(from, text) {
        const div = document.createElement('div');
        div.style = 'margin-bottom:8px';
        div.innerHTML = `<div style="font-size:12px;color:#666;margin-bottom:4px">${from}</div><div style="background:${from==='You'?'#f1f5f9':'#eef2ff'};padding:8px;border-radius:6px">${escapeHtml(text)}</div>`;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
      }
      function handleSend() {
        const q = input.value.trim();
        if (!q) return;
        appendMessage('You', q);
        input.value = '';
        appendMessage('Assistant', 'Thinking...');
        setTimeout(()=> {
          // Remove the 'Thinking...' placeholder and add actual response
          messages.lastChild.remove();
          const resp = aiRespond(q);
          appendMessage('Assistant', resp);
        }, 400);
      }
    }
    
    // Basic keyword-based responder that searches FAQ_ENTRIES for best match.
    function aiRespond(query) {
      const q = query.toLowerCase();
      // exact contains match
      let best = null;
      let bestScore = 0;
      FAQ_ENTRIES.forEach(entry=>{
        const combined = (entry.q + ' ' + entry.a).toLowerCase();
        let score = 0;
        // increase score for words found
        q.split(/\s+/).forEach(term=> {
          if (!term) return;
          if (combined.includes(term)) score += 2;
          // partial match
          if (entry.q.toLowerCase().includes(term)) score += 1;
        });
        if (score > bestScore) { bestScore = score; best = entry; }
      });
      if (best && bestScore > 0) return best.a;
      // fallback: search for numbers or intents
      if (q.includes('price') || q.includes('cost') || q.includes('fee')) return 'Prices vary by vehicle and duration. Check the vehicle listing for exact pricing or contact support.';
      if (q.includes('cancel')) return 'To cancel a booking, contact support at least 24 hours before pickup. Cancellation fees may apply.';
      return 'Sorry, I could not find an exact answer. Try rephrasing or check the FAQs (click the FAQ button).';
    }
    
    // small helper to escape html in inserted strings
    function escapeHtml(str) {
      return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
    }
    
    // Attach the logout function to the logout button in the sidebar (if it exists).
    document.getElementById('logout-btn')?.addEventListener('click', logout);
    // When the window loads, perform initial checks and load data.
    window.addEventListener('load', () => {
        checkAdmin();
        loadAllUsers();
    });