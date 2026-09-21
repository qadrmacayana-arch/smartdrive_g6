// --- Legal Modal Logic ---
    /**
     * This section handles the functionality for the legal information modal (Terms & Privacy).
     * It's responsible for opening, closing, and populating the modal with content from the `legalContent` object.
     */
        window.addEventListener('load', function() {
      updateAuthButtons();
      
      // Load current user from session
      const user = JSON.parse(sessionStorage.getItem('user') || 'null');
      
      // If no user is logged in, redirect them to the login page.
      if (!user) {
        window.location.href = 'login.php';
        return;
      }

      // Populate form with existing data
      document.getElementById('settings-name').value = user.fullName || '';
      document.getElementById('settings-email').value = user.email || '';
      document.getElementById('settings-birthday').value = user.birthday || '';
      document.getElementById('settings-address').value = user.address || '';
      document.getElementById('settings-gender').value = user.gender || '';

      /**
       * Handles the submission of the settings form.
       * It validates the input, updates user data in both localStorage and sessionStorage, and provides feedback.
       */
      document.getElementById('settings-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('settings-name').value.trim();
        const email = document.getElementById('settings-email').value.trim();
        const birthday = document.getElementById('settings-birthday').value;
        const address = document.getElementById('settings-address').value.trim();
        const gender = document.getElementById('settings-gender').value;
        const pwd = document.getElementById('settings-password').value;
        const confirm = document.getElementById('settings-confirm').value;

        // --- Form Validation ---
        if (!name || !email) {
          showMessage('Name and email cannot be blank', false);
          return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          showMessage('Please enter a valid email address', false);
          return;
        }
        
        if (pwd && pwd.length < 6) {
          showMessage('Password must be at least 6 characters', false);
          return;
        }
        
        if (pwd && pwd !== confirm) {
          showMessage('Passwords do not match', false);
          return;
        }

        // --- Update Data Stores ---
        // 1. Update the master user list in localStorage (permanent storage).
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const existingIndex = users.findIndex(u => u.email === user.email);
        
        if (existingIndex !== -1) {
          users[existingIndex].name = name;
          users[existingIndex].email = email;
          users[existingIndex].birthday = birthday;
          users[existingIndex].address = address;
          users[existingIndex].gender = gender;
          if (pwd) users[existingIndex].password = pwd;
          
          localStorage.setItem('users', JSON.stringify(users));
        }

        // 2. Update the currently active session in sessionStorage.
        const updatedUser = {
          ...user,
          fullName: name,
          email: email,
          birthday: birthday,
          address: address,
          gender: gender
        };
        sessionStorage.setItem('user', JSON.stringify(updatedUser));

        showMessage('Settings saved successfully!');
        
        // Refresh auth buttons in case the user's email was changed.
        updateAuthButtons();
      });
    });