<?php
// manageusers.php
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Manage Users - SmartDrive™ Admin</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body id="dashboard-page" class="admin-page">
<div class="aurora-orb aurora-orb--1"></div>
  <div class="aurora-orb aurora-orb--2"></div>
  <div class="aurora-orb aurora-orb--3"></div>

  <header class="header">
    <div class="container">
      <a href="admin.php" class="logo">
        <div class="logo-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
        </div>
        <span>SmartDrive™ <span style="font-size: 10px; background: var(--primary); color: var(--primary-foreground); padding: 2px 5px; border-radius: 4px; margin-left: 5px;">ADMIN</span></span>
      </a>
      <nav class="nav-links">
        <a href="admin.php" class="nav-link">Admin Dashboard</a>
      </nav>
      <div class="nav-actions" id="auth-buttons"></div>
    </div>
  </header>

  <div class="dashboard-container">
    <div class="dashboard-layout">
      <aside class="dashboard-sidebar">
        <div class="profile-card">
          <div class="profile-header">
            <div class="profile-avatar" id="user-avatar-container">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div class="profile-info">
              <h3 id="user-name">Admin User</h3>
              <p class="profile-badge" style="background-color: var(--destructive); color: white;">Admin</p>
            </div>
          </div>
          <nav class="sidebar-nav">
            <a href="admin.php" class="nav-item">Overview</a>
            <a href="managebookings.php" class="nav-item">Manage Bookings</a>
            <a href="manageusers.php" class="nav-item active">Manage Users</a>
            <a href="managefleetings.php" class="nav-item">Fleet Management</a>
            <a href="vehicletracking.php" class="nav-item">Vehicle Tracking</a>
            <a href="admin-user-transactions.php" class="nav-item">User Transactions</a>
            <a href="reviews.php" class="nav-item">Reviews & Ratings</a>
          </nav>
        </div>
      </aside>

      <main class="dashboard-main" style="max-width: none;">
        <div class="dashboard-header">
          <h1 class="dashboard-title">User Management</h1>
          <p class="dashboard-subtitle">View, edit, or suspend user accounts with full control.</p>
        </div>
        <div class="admin-search-container">
          <span class="admin-search-icon">🔍</span>
          <input type="text" class="admin-search-input" placeholder="Search users by name, email, or phone number...">
        </div>
        <div class="dashboard-content bookings-section">
            <div class="admin-table-header">
              <h2 class="admin-table-title">All Users</h2>
              <div class="admin-table-actions">
                <span style="font-size: 0.85rem; color: var(--muted-foreground); font-weight: 600;">Total: <span id="total-users-count" style="color: var(--primary); font-weight: 800;">0</span></span>
              </div>
            </div>
            <div class="bookings-table-wrapper">
                <table class="bookings-table">
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Member Since</th>
                      <th>Total Bookings</th>
                      <th>Total Spent</th>
                      <th>Status</th>
                      <th style="text-align: right;">Actions</th>
                    </tr>
                  </thead>
                  <tbody id="admin-users-body">
                  </tbody>
                </table>
              </div>
          </div>
      </main>
    </div>
  </div>

  <!-- Edit User Modal -->
  <div id="edit-user-modal" class="modal" style="display: none;">
    <div class="modal-content" style="max-width: 500px;">
      <div class="modal-header">
        <h2>Edit User</h2>
        <span class="close-btn" id="close-edit-modal-btn">&times;</span>
      </div>
      <div class="modal-body">
        <form id="edit-user-form">
          <input type="hidden" id="edit-user-email-original">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" id="edit-user-name" class="form-input" required>
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" id="edit-user-email" class="form-input" required>
          </div>
          <div style="grid-column: span 2; display: flex; gap: 1rem; margin-top: 1rem;">
            <button type="submit" class="btn-submit" style="width: 100%;">Save Changes</button>
            <button type="button" id="delete-user-btn" class="btn-submit" style="width: auto; background-color: var(--destructive); padding: 0 2rem;">Delete</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- User Details Modal -->
  <div id="user-details-modal" class="modal" style="display: none;">
    <div class="modal-content" style="max-width: 800px;">
      <div class="modal-header">
        <h2>User Details</h2>
        <span class="close-btn" id="close-modal-btn">&times;</span>
      </div>
      <div class="modal-body" id="user-modal-body">
        <!-- User details will be populated here -->
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="js/supabase.js"></script>
  <script src="js/manageusers.js"></script>
</body>
</html>