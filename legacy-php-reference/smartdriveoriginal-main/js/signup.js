// --- Legal Modal Logic ---
        // Check if already logged in
    window.addEventListener('load', function() {
      const user = JSON.parse(sessionStorage.getItem('user'));
      if (user) {
        window.location.href = 'dashboard.php';
      }
      updateAuthButtons();
    });

    // Format and validate email
    function isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }

    // Validate form with all fields
    function validateForm(name, email, birthday, address, gender, password, confirmPassword) {
      let isValid = true;
      
      document.getElementById('password-error').style.display = 'none';
      document.getElementById('confirm-error').style.display = 'none';
      document.getElementById('error-message').style.display = 'none';

      if (!name || name.trim().length < 3) {
        showError('Please enter your full name (minimum 3 characters)');
        isValid = false;
      }

      if (!birthday) {
        showError('Please select your birthday');
        isValid = false;
      }

      if (!address || address.trim().length < 5) {
        showError('Please enter a complete address');
        isValid = false;
      }

      if (!isValidEmail(email)) {
        showError('Please enter a valid email address');
        isValid = false;
      }

      if (password.length < 6) {
        document.getElementById('password-error').style.display = 'block';
        showError('Password must be at least 6 characters');
        isValid = false;
      }

      if (password !== confirmPassword) {
        document.getElementById('confirm-error').style.display = 'block';
        showError('Passwords do not match');
        isValid = false;
      }

      return isValid;
    }

    function showError(message) {
      const errorDiv = document.getElementById('error-message');
      const successDiv = document.getElementById('success-message');
      successDiv.style.display = 'none';
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    }

    function showSuccess(message) {
      const successDiv = document.getElementById('success-message');
      const errorDiv = document.getElementById('error-message');
      errorDiv.style.display = 'none';
      successDiv.textContent = message;
      successDiv.style.display = 'block';
    }

    function toggleMobileMenu() {
      const mobileLinks = document.querySelector('.mobile-nav-links');
      if (mobileLinks) {
        mobileLinks.style.display = mobileLinks.style.display === 'flex' ? 'none' : 'flex';
      }
    }

    function updateAuthButtons() {
      const navActions = document.querySelector('.nav-actions');
      const user = JSON.parse(sessionStorage.getItem('user'));
      
      if (!navActions) return;

      if (user && user.email) {
        navActions.innerHTML = '';
      } else {
        navActions.innerHTML = `
          <a href="login.php" class="btn-login">Login</a>
          <a href="signup.php" class="btn-signup">Sign Up</a>
        `;
      }
    }

    function logout() {
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('isNewUser');
      localStorage.removeItem('smartdriveUser');
      localStorage.removeItem('smartdriveUsers');
      setTimeout(() => { window.location.href = 'index.php'; }, 500);
    }

    function detectLoginSource() {
      const userAgent = navigator.userAgent || '';
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      return isMobile ? 'app' : 'web';
    }

    // --- Google OAuth ---
    async function signUpWithGoogle() {
      const button = document.getElementById('google-sign-up-btn');
      if (!window.smartdriveSupabase) {
        showError(window.smartdriveSupabaseConfigError || 'Google sign-up is temporarily unavailable.');
        return;
      }

      button.disabled = true;
      button.textContent = 'Connecting to Google...';
      const { error } = await window.smartdriveSupabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}${window.location.pathname}` }
      });
      if (error) {
        showError(error.message);
        button.disabled = false;
        button.innerHTML = '<span aria-hidden="true" style="font-weight: 800; font-size: 1.1rem;">G</span> Continue with Google';
      }
    }

    async function finishGoogleSignUp() {
      if (!window.smartdriveSupabase) return;
      const { data, error } = await window.smartdriveSupabase.auth.getSession();
      if (error || !data.session?.user) return;

      const authUser = data.session.user;
      const sessionUser = {
        email: authUser.email,
        fullName: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email.split('@')[0],
        memberType: 'Premium',
        registrationDate: authUser.created_at || new Date().toISOString(),
        loginTime: new Date().toISOString(),
        loginSource: detectLoginSource()
      };
      sessionStorage.setItem('user', JSON.stringify(sessionUser));
      localStorage.setItem('smartdriveUser', JSON.stringify(sessionUser));
      sessionStorage.setItem('isNewUser', 'true');
      showSuccess('Account created successfully with Google! Redirecting...');
      setTimeout(() => { window.location.href = 'dashboard.php'; }, 1000);
    }

    document.getElementById('google-sign-up-btn')?.addEventListener('click', signUpWithGoogle);
    window.addEventListener('load', finishGoogleSignUp);

    // Handle form submission via backend API
    document.getElementById('signup-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const name = document.getElementById('name').value.trim();
      const birthday = document.getElementById('birthday').value;
      const address = document.getElementById('address').value.trim();
      const email = document.getElementById('email').value.trim();
      const gender = document.getElementById('gender').value;
      const phone = document.getElementById('phone').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const submitBtn = document.getElementById('submit-btn');

      if (!phone) {
        showError('Please enter your phone number');
        return;
      }

      if (!validateForm(name, email, birthday, address, gender, password, confirmPassword)) {
        return;
      }

      // Also check localStorage for duplicate (backward compatibility)
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      if (users.find(u => u.email === email)) {
        showError('An account with that email already exists');
        return;
      }

      document.getElementById('loading').style.display = 'block';
      submitBtn.disabled = true;

      try {
        if (!window.smartdriveSupabase) {
          document.getElementById('loading').style.display = 'none';
          submitBtn.disabled = false;
          showError(window.smartdriveSupabaseConfigError || 'Supabase is not configured. Add your project URL and anon key in js/supabase.js.');
          return;
        }

        if (window.smartdriveSupabase) {
          const { data, error } = await window.smartdriveSupabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: name,
                birthday,
                address,
                gender,
                phone,
                memberType: 'Premium',
                login_source: detectLoginSource()
              }
            }
          });

          if (error) {
            throw new Error(error.message);
          }

          if (!data.user) {
            throw new Error('Account created, but the user profile could not be initialized.');
          }

          const registrationDate = data.user.created_at || new Date().toISOString();

          // The database trigger creates the profile for unconfirmed signups.
          // Only upsert from the client when signup also returned a session.
          if (data.session) {
            const profilePayload = {
              id: data.user.id,
              email,
              full_name: name,
              birthday,
              address,
              gender,
              phone,
              login_source: detectLoginSource(),
              created_at: registrationDate
            };

            const { error: profileError } = await window.smartdriveSupabase
              .from('profiles')
              .upsert([profilePayload], { onConflict: 'id' });

            if (profileError) {
              throw new Error(`User profile could not be saved: ${profileError.message}`);
            }
          }

          // Keep the admin pages' legacy localStorage fallback in sync with Supabase.
          users.push({
            id: data.user.id,
            email,
            name,
            fullName: name,
            birthday,
            address,
            gender,
            phone,
            memberType: 'Premium',
            registrationDate
          });
          localStorage.setItem('users', JSON.stringify(users));

          const userData = {
            email: email,
            fullName: name,
            registrationDate,
            birthday: birthday,
            address: address,
            gender: gender,
            phone: phone,
            memberType: 'Premium'
          };
          sessionStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('smartdriveUser', JSON.stringify(userData));
          sessionStorage.setItem('isNewUser', 'true');

          document.getElementById('loading').style.display = 'none';
          showSuccess('Account created successfully! Redirecting...');

          setTimeout(() => {
            window.location.href = 'dashboard.php';
          }, 1500);
          return;
        }

        // Send registration data to backend API
        const response = await fetch('api/signup.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: name,
            email: email,
            password: password,
            birthday: birthday,
            address: address,
            gender: gender,
            phone
          })
        });

        const result = await response.json();

        if (result.success) {
          // Also save to localStorage for backward compatibility
          const newUser = { email, name, birthday, address, gender, phone, password, memberType: 'Premium', registrationDate: new Date().toISOString() };
          users.push(newUser);
          localStorage.setItem('users', JSON.stringify(users));

          // Create session
          const userData = {
            email: email,
            fullName: name,
            registrationDate: new Date().toISOString(),
            birthday: birthday,
            address: address,
            gender: gender,
            phone: phone,
            memberType: 'Premium'
          };
          sessionStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('smartdriveUser', JSON.stringify(userData));
          sessionStorage.setItem('isNewUser', 'true');

          document.getElementById('loading').style.display = 'none';
          showSuccess('Account created successfully! Redirecting...');

          setTimeout(() => {
            window.location.href = 'dashboard.php';
          }, 1500);
        } else {
          // If API fails (e.g., duplicate email on server side), fallback message
          document.getElementById('loading').style.display = 'none';
          submitBtn.disabled = false;
          showError(result.message || 'Registration failed. Please try again.');
        }
      } catch (error) {
        console.error('Signup API error:', error);

        if (window.smartdriveSupabase) {
          const isEmailRateLimited = /rate limit|too many requests/i.test(error.message || '');

          if (isEmailRateLimited) {
            showError('Supabase is temporarily rate-limited. No account was saved. Please wait and try again.');
          } else {
            showError(error.message || 'Registration failed. Please try again.');
          }

          document.getElementById('loading').style.display = 'none';
          submitBtn.disabled = false;
          return;
        }
        
        document.getElementById('loading').style.display = 'none';
        submitBtn.disabled = false;
        showError(window.smartdriveSupabaseConfigError || 'Supabase is not configured. Account was not saved.');
      }
    });

    document.addEventListener('DOMContentLoaded', function() {
      const mobileLinks = document.querySelectorAll('.mobile-nav-links a, .mobile-nav-links button');
      mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
          const menu = document.querySelector('.mobile-nav-links');
          if (menu) menu.style.display = 'none';
        });
      });
    });

    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin { to { transform: rotate(360deg); } }
      @media (max-width: 768px) {
        .mobile-nav-links {
          display: none;
          position: absolute;
          top: 70px;
          left: 0;
          right: 0;
          background-color: rgba(10, 10, 10, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          flex-direction: column;
          padding: 1rem 0;
          z-index: 100;
        }
        .nav-links { display: none; }
      }
    `;
    document.head.appendChild(style);
