<?php
// admin.php
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard - SmartDrive™</title>
  <link rel="stylesheet" href="css/style.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link rel="preload" href="js/data.js" as="script">
</head>
<body id="dashboard-page" class="admin-page">
<div class="aurora-orb aurora-orb--1"></div>
  <div class="aurora-orb aurora-orb--2"></div>
  <div class="aurora-orb aurora-orb--3"></div>

  <header class="header">
    <div class="container">
      <a href="index.php" class="logo">
        <div class="logo-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
        </div>
        <span>SmartDrive™ <span style="font-size: 10px; background: var(--primary); color: var(--primary-foreground); padding: 2px 5px; border-radius: 4px; margin-left: 5px;">ADMIN</span></span>
      </a>
      <nav class="nav-links">
        <a href="admin.php" class="nav-link active">Admin Dashboard</a>
      </nav>
      <div class="nav-actions" id="auth-buttons"></div>
          <button class="mobile-menu-btn">☰</button>
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
            <a href="admin.php" class="nav-item active">Overview</a>
            <a href="managebookings.php" class="nav-item">Manage Bookings</a>
            <a href="manageusers.php" class="nav-item">Manage Users</a>
            <a href="managefleetings.php" class="nav-item">Fleet Management</a>
            <a href="vehicletracking.php" class="nav-item">Vehicle Tracking</a>
            <a href="admin-user-transactions.php" class="nav-item">User Transactions</a>
            <a href="reviews.php" class="nav-item">Reviews & Ratings</a>
          </nav>
        </div>
      </aside>

      <main class="dashboard-main" style="max-width: none;">
        <div class="dashboard-header">
          <h1 class="dashboard-title" id="welcome-message">Admin Overview</h1>
          <p class="dashboard-subtitle">Here's a snapshot of your platform's activity.</p>
        </div>

        <div class="dashboard-content" style="gap: 2.5rem;">
          <!-- Top Stats Grid -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">💰</div>
              <p class="stat-label">Total Revenue</p>
              <p class="stat-value" id="stat-revenue">₱0</p>
            </div>
            <div class="stat-card">
              <div class="stat-icon">📅</div>
              <p class="stat-label">Total Bookings</p>
              <p class="stat-value" id="stat-total-bookings">0</p>
            </div>
            <div class="stat-card">
              <div class="stat-icon">👥</div>
              <p class="stat-label">Registered Users</p>
              <p class="stat-value" id="stat-users">0</p>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🚗</div>
              <p class="stat-label">Vehicles in Fleet</p>
              <p class="stat-value" id="stat-vehicles">0</p>
            </div>
          </div>

          <!-- Main Dashboard Grid -->
          <div class="admin-grid-main">
            <!-- Left Column -->
            <div class="admin-grid-col-main">
              <section class="bookings-section">
                <div class="admin-table-header">
                  <h2 class="admin-table-title">📊 Monthly Revenue</h2>
                </div>
                <div class="chart-container" style="height:35vh;"><canvas id="revenueChart"></canvas></div>
              </section>

              <section class="bookings-section">
                <div class="admin-table-header">
                  <h2 class="admin-table-title">🚗 Vehicle Performance</h2>
                </div>
                <div class="chart-container" style="height:45vh;"><canvas id="vehiclePerformanceChart"></canvas></div>
              </section>
            </div>

            <!-- Right Column -->
            <div class="admin-grid-col-side">
              <div class="quick-action-card">
                <div class="quick-action-content" style="align-items: flex-start; flex-direction: column; text-align: left;">
                  <div>
                    <h3>⚡ Quick Actions</h3>
                    <p>Manage your platform efficiently.</p>
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 0.9rem; width: 100%; margin-top: 0.5rem;">
                    <a href="managefleetings.php" class="btn-book-new" style="width: 100%; text-align: center;">➕ Add New Vehicle</a>
                    <a href="manageusers.php" class="btn-book-new" style="width: 100%; text-align: center;">👥 Manage Users</a>
                  </div>
                </div>
              </div>

              <section class="bookings-section">
                <div class="admin-table-header">
                  <h2 class="admin-table-title">👥 User Demographics</h2>
                </div>
                <div class="chart-container" style="height:28vh; max-width: 300px; margin: auto;"><canvas id="genderDistributionChart"></canvas></div>
              </section>
            </div>
          </div>

          <!-- Bottom Tables -->
          <div class="admin-grid-layout" style="grid-template-columns: 1fr;">
            <section class="bookings-section">
              <div class="admin-table-header">
                <h2 class="admin-table-title">Recent Bookings</h2>
                <a href="managebookings.php" class="view-all-link">View All →</a>
              </div>
              <div class="bookings-table-wrapper">
                <table class="bookings-table">
                  <thead><tr><th>Ref #</th><th>Customer</th><th>Vehicle</th><th>Total</th><th>Status</th></tr></thead>
                  <tbody id="admin-bookings-body">
                    <tr><td colspan="5" class="text-center p-8 text-muted-foreground">Loading bookings...</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section class="bookings-section">
              <div class="admin-table-header">
                <h2 class="admin-table-title">Top Spending Users</h2>
                <a href="manageusers.php" class="view-all-link">View All →</a>
              </div>
              <div class="bookings-table-wrapper">
                <table class="bookings-table">
                  <thead><tr><th>Full Name</th><th>Email</th><th>Total Spent</th><th>Actions</th></tr></thead>
                  <tbody id="admin-users-body">
                    <tr><td colspan="4" class="text-center p-8 text-muted-foreground">Loading users...</td></tr>
                  </tbody>
                </table>
              </div>
            </section>
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

  <footer class="footer">
    <div class="footer-content">
      <div class="footer-section">
        <h3 class="footer-title">SmartDrive™ Admin</h3>
        <p class="footer-text">Manage bookings, users, vehicles, and platform performance from one dashboard.</p>
      </div>

      <div class="footer-section">
        <h3 class="footer-title">Operations</h3>
        <div class="footer-links">
          <a href="admin.php">Admin Dashboard</a>
          <a href="managebookings.php">Manage Bookings</a>
          <a href="manageusers.php">Manage Users</a>
          <a href="managefleetings.php">Fleet Management</a>
        </div>
      </div>

      <div class="footer-section">
        <h3 class="footer-title">Tracking</h3>
        <div class="footer-links">
          <a href="vehicletracking.php">Vehicle Tracking</a>
          <a href="admin-user-transactions.php">User Transactions</a>
          <a href="index.php">Public Site</a>
        </div>
      </div>

      <div class="footer-section">
        <h3 class="footer-title">Support</h3>
        <div class="footer-links">
          <a href="#">System Alerts</a>
          <a href="#">Assist Desk</a>
          <a href="#">Reports</a>
          <a href="#">Help Center</a>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <p>&copy; 2026 SmartDrive™. All rights reserved. | Admin operations dashboard</p>
    </div>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="js/supabase.js"></script>
  <script defer src="js/data.js"></script>
  <script defer src="js/admin.js"></script>
</body>
</html>