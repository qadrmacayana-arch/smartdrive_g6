/**
 * @file login.js
 * This file contains the logic for the login page, including form validation,
 * user authentication via backend API, password visibility toggle,
 * "Forgot Password" modal, and Google Sign-In handling.
 */

const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mobileMenu = document.querySelector('.mobile-menu');

function detectLoginSource() {
  const userAgent = navigator.userAgent || '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  return isMobile ? 'app' : 'web';
}

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', () => {
    mobileMenu?.classList.toggle('active');
  });
}

/**
 * Toggles the visibility of the password input field between 'password' and 'text'
 * and updates the eye icon accordingly.
 */
const togglePasswordBtn = document.getElementById('toggle-password-btn');
const passwordInput = document.getElementById('password');
const eyeIcon = document.getElementById('eye-icon');

if (togglePasswordBtn) {
  togglePasswordBtn.addEventListener('click', function(e) {
    e.preventDefault();
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    
    if (isPassword) {
      eyeIcon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
    } else {
      eyeIcon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
      eyeIcon.setAttribute('stroke-width', '2');
    }
  });
}

/**
 * Handles the submission of the main login form.
 */
document.getElementById('login-form').addEventListener('submit', async function(e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const rememberMe = document.getElementById('remember-me').checked;

  if (!email || !password) {
    showError('Please fill in all fields');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showError('Please enter a valid email address');
    return;
  }

  if (password.length < 6) {
    showError('Password must be at least 6 characters');
    return;
  }

  await authenticateUser(email, password, rememberMe);
});

/**
 * Handles the user authentication process via backend API.
 * Falls back to localStorage if API is unavailable.
 */
async function authenticateUser(email, password, rememberMe) {
  const submitBtn = document.querySelector('.btn-submit');
  const originalText = submitBtn.innerHTML;

  submitBtn.disabled = true;
  submitBtn.innerHTML = 'Logging in...';

  try {
    if (window.smartdriveSupabase) {
      const { data, error } = await window.smartdriveSupabase.auth.signInWithPassword({ email, password });

      if (error) {
        throw new Error(error.message);
      }

      const loginSource = detectLoginSource();
      try {
        const { error: profileUpdateError } = await window.smartdriveSupabase
          .from('profiles')
          .update({ login_source: loginSource, last_login: new Date().toISOString() })
          .eq('id', data.user.id);

        if (profileUpdateError) {
          console.warn('Could not update login details in the user profile:', profileUpdateError.message);
        }
      } catch (profileUpdateError) {
        console.warn('Could not update login details in the user profile:', profileUpdateError);
      }

      const user = {
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name || data.user.email.split('@')[0],
        memberType: data.user.user_metadata?.memberType || 'Member',
        registrationDate: data.user.created_at || new Date().toISOString(),
        isAdmin: Boolean(data.user.user_metadata?.is_admin),
        loginTime: new Date().toISOString(),
        loginSource
      };

      sessionStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('smartdriveUser', JSON.stringify(user));
      sessionStorage.removeItem('isNewUser');

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      showSuccess('Login successful! Redirecting to dashboard...');

      setTimeout(() => {
        if (user.isAdmin || user.email === 'admin@smartrentals.com') {
          window.location.href = 'admin.php';
        } else {
          window.location.href = 'dashboard.php';
        }
      }, 1500);
      return;
    }

    // Try backend API first
    const response = await fetch('api/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (result.success) {
      const found = result.user;

      const user = {
        email: found.email,
        fullName: found.fullName,
        memberType: found.memberType || 'Member',
        registrationDate: found.registrationDate,
        isAdmin: Boolean(found.isAdmin || found.email === 'admin@smartrentals.com'),
        loginTime: new Date().toISOString()
      };

      sessionStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('smartdriveUser', JSON.stringify(user));
      sessionStorage.removeItem('isNewUser');

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      showSuccess('Login successful! Redirecting to dashboard...');

      setTimeout(() => {
        if (found.isAdmin || found.email === 'admin@smartrentals.com') {
          window.location.href = 'admin.php';
        } else {
          window.location.href = 'dashboard.php';
        }
      }, 1500);
      return;
    }

    // API returned error — fallback to localStorage
    fallbackAuth(email, password, rememberMe, submitBtn, originalText, result.message);

  } catch (error) {
    console.error('Login API error:', error);

    // Use the local account created during Supabase email-rate-limit fallback.
    const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const hasLocalAccount = localUsers.some(user => user.email === email && user.password === password);
    if (!window.smartdriveSupabase || hasLocalAccount) {
      fallbackAuth(email, password, rememberMe, submitBtn, originalText, 'Invalid email or password');
      return;
    }

    showError(error.message || 'Unable to sign in through Supabase.');
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

/**
 * Fallback authentication using localStorage (backward compatibility).
 */
function fallbackAuth(email, password, rememberMe, submitBtn, originalText, errorMessage) {
  let found = null;

  // Check hardcoded admin
  if (email === 'admin@smartrentals.com' && password === 'adminpassword') {
    found = {
      email: 'admin@smartrentals.com',
      name: 'Admin User',
      memberType: 'Admin',
      isAdmin: true
    };
  } else {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    found = users.find(u => u.email === email && u.password === password);
  }

  if (!found) {
    showError(errorMessage || 'Invalid email or password');
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
    return;
  }

  const user = {
    email: found.email,
    fullName: found.name || email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
    memberType: found.memberType || 'Member',
    registrationDate: found.registrationDate,
    isAdmin: Boolean(found.isAdmin || found.email === 'admin@smartrentals.com'),
    loginTime: new Date().toISOString()
  };

  sessionStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('smartdriveUser', JSON.stringify(user));
  sessionStorage.removeItem('isNewUser');

  if (rememberMe) {
    localStorage.setItem('rememberedEmail', email);
  } else {
    localStorage.removeItem('rememberedEmail');
  }

  showSuccess('Login successful! Redirecting to dashboard...');

  setTimeout(() => {
    if (user.email === 'admin@smartrentals.com') {
      window.location.href = 'admin.php';
    } else {
      window.location.href = 'dashboard.php';
    }
  }, 1500);
}

function showError(message) {
  clearMessages();
  
  const errorDiv = document.createElement('div');
  errorDiv.id = 'error-message';
  errorDiv.style.cssText = `
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 0.5rem;
    padding: 1rem;
    color: #dc2626;
    margin-bottom: 1.5rem;
    font-size: 0.875rem;
    animation: slideDown 0.3s ease;
  `;
  errorDiv.textContent = message;

  const form = document.getElementById('login-form');
  form.insertBefore(errorDiv, form.firstChild);

  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

function showSuccess(message) {
  clearMessages();
  
  const successDiv = document.createElement('div');
  successDiv.id = 'success-message';
  successDiv.style.cssText = `
    background: rgba(168, 85, 247, 0.1);
    border: 1px solid rgba(168, 85, 247, 0.3);
    border-radius: 0.5rem;
    padding: 1rem;
    color: #a855f7;
    margin-bottom: 1.5rem;
    font-size: 0.875rem;
    animation: slideDown 0.3s ease;
  `;
  successDiv.textContent = message;

  const form = document.getElementById('login-form');
  form.insertBefore(successDiv, form.firstChild);
}

function clearMessages() {
  const errorMsg = document.getElementById('error-message');
  const successMsg = document.getElementById('success-message');
  
  if (errorMsg) errorMsg.remove();
  if (successMsg) successMsg.remove();
}

// --- Forgot Password Modal Logic ---
const forgotModal = document.getElementById('forgot-password-modal');
const forgotBtn = document.getElementById('forgot-password-btn');
const closeForgotBtn = document.getElementById('close-forgot-modal');
const forgotForm = document.getElementById('forgot-password-form');
const forgotMessage = document.getElementById('forgot-message'); 

forgotBtn?.addEventListener('click', function(e) {
  e.preventDefault();
  forgotMessage.style.display = 'none';
  forgotForm.style.display = 'block';
  forgotForm.reset();
  forgotModal.style.display = 'flex';
});

if(closeForgotBtn) closeForgotBtn.onclick = () => forgotModal.style.display = 'none';

forgotForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const email = document.getElementById('forgot-email').value;
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const user = users.find(u => u.email === email);

  forgotMessage.style.display = 'block';

  if (user) {
    forgotMessage.style.background = 'rgba(168, 85, 247, 0.1)';
    forgotMessage.style.border = '1px solid rgba(168, 85, 247, 0.3)';
    forgotMessage.style.color = '#a855f7';
    forgotForm.style.display = 'none';
    forgotMessage.innerHTML = `<strong>Success!</strong> If an account exists for ${email}, we have sent the password to it.`;
  } else {
    forgotMessage.style.background = 'rgba(239, 68, 68, 0.1)';
    forgotMessage.style.border = '1px solid rgba(239, 68, 68, 0.3)';
    forgotMessage.style.color = '#ef4444';
    forgotMessage.innerHTML = `<strong>Success!</strong> If an account exists for ${email}, we have sent the password to it.`;
  }
});

window.addEventListener('click', function(event) {
  if (event.target == forgotModal) {
    forgotModal.style.display = "none";
  }
});

// --- Google OAuth ---
async function signInWithGoogle() {
  const button = document.getElementById('google-sign-in-btn');
  if (!window.smartdriveSupabase) {
    showError(window.smartdriveSupabaseConfigError || 'Google sign-in is temporarily unavailable.');
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

async function finishGoogleSignIn() {
  if (!window.smartdriveSupabase) return;
  const { data, error } = await window.smartdriveSupabase.auth.getSession();
  if (error || !data.session?.user) return;

  const authUser = data.session.user;
  const sessionUser = {
    email: authUser.email,
    fullName: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email.split('@')[0],
    memberType: authUser.user_metadata?.memberType || 'Member',
    registrationDate: authUser.created_at || new Date().toISOString(),
    isAdmin: Boolean(authUser.user_metadata?.is_admin),
    loginTime: new Date().toISOString(),
    loginSource: detectLoginSource()
  };
  sessionStorage.setItem('user', JSON.stringify(sessionUser));
  localStorage.setItem('smartdriveUser', JSON.stringify(sessionUser));
  sessionStorage.removeItem('isNewUser');
  showSuccess('Google sign-in successful! Redirecting...');
  setTimeout(() => { window.location.href = 'dashboard.php'; }, 1000);
}

document.getElementById('google-sign-in-btn')?.addEventListener('click', signInWithGoogle);

// --- Dynamic Styles and Page Load Logic ---
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);

function checkAuth() {
  const user = JSON.parse(sessionStorage.getItem('user') || 'null');
  if (user) {
    const isAdmin = Boolean(user.isAdmin || user.email === 'admin@smartrentals.com');
    window.location.replace(isAdmin ? 'admin.php' : 'dashboard.php');
  }
}

window.addEventListener('load', function() {
  checkAuth();
  finishGoogleSignIn();

  const params = new URLSearchParams(window.location.search);
  if (params.get('reason') === 'offers_unauthorized') {
    showError('You must be logged in to view exclusive offers.');
  }

  const rememberedEmail = localStorage.getItem('rememberedEmail');
  if (rememberedEmail) {
    document.getElementById('email').value = rememberedEmail;
    document.getElementById('remember-me').checked = true;
  }

  updateAuthButtons();
});

function updateAuthButtons() {
  const user = JSON.parse(sessionStorage.getItem('user') || 'null');
  const authButtons = document.getElementById('auth-buttons');

  if (user) {
    authButtons.innerHTML = '';
  } else {
    authButtons.innerHTML = `
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
  window.location.href = 'index.php';
}
