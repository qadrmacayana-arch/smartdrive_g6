<?php
// managefleetings.php
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Manage Fleet - SmartDrive™ Admin</title>
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
            <a href="manageusers.php" class="nav-item">Manage Users</a>
            <a href="managefleetings.php" class="nav-item active">Fleet Management</a>
            <a href="vehicletracking.php" class="nav-item">Vehicle Tracking</a>
            <a href="admin-user-transactions.php" class="nav-item">User Transactions</a>
            <a href="reviews.php" class="nav-item">Reviews & Ratings</a>
          </nav>
        </div>
      </aside>

      <main class="dashboard-main">
        <div class="dashboard-header">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1.5rem;">
            <div>
              <h1 class="dashboard-title">Fleet Management</h1>
              <p class="dashboard-subtitle">Add, edit, or remove vehicles from your fleet.</p>
            </div>
            <button id="add-vehicle-btn" class="btn-small" style="padding: 0.75rem 1.5rem; font-size: 0.9rem; white-space: nowrap; align-self: center;">➕ Add New Vehicle</button>
          </div>
        </div>
        <div class="admin-search-container">
          <span class="admin-search-icon">🔍</span>
          <input type="text" class="admin-search-input" placeholder="Search vehicles by name, type, or plate number...">
        </div>
        <div class="dashboard-content">
            <div class="bookings-section">
            <div class="admin-table-header">
              <h2 class="admin-table-title">Active Vehicles</h2>
              <div class="admin-table-actions">
                <span style="font-size: 0.85rem; color: var(--muted-foreground); font-weight: 600;">Total: <span id="total-vehicles-count" style="color: var(--primary); font-weight: 800;">0</span></span>
              </div>
            </div>
            <div class="bookings-table-wrapper">
                <table class="bookings-table">
                  <thead>
                    <tr>
                      <th style="width: 35%;">Vehicle</th>
                      <th>Type</th>
                      <th>Daily Rate</th>
                      <th>Status</th>
                      <th style="text-align: right;">Actions</th>
                    </tr>
                  </thead>
                  <tbody id="fleet-list-body">
                  </tbody>
                </table>
              </div>
            </div>

              <!-- Archived Vehicles Section -->
              <div class="bookings-section" style="margin-top: 3rem;">
                <div class="admin-table-header">
                <h2 class="admin-table-title">📦 Archived Vehicles</h2>
                <div class="admin-table-actions">
                  <span style="font-size: 0.85rem; color: var(--muted-foreground); font-weight: 600;">These vehicles are hidden from users but can be recovered.</span>
                </div>
                </div>
                <div class="bookings-table-wrapper">
                <table class="bookings-table">
                  <thead>
                    <tr>
                      <th style="width: 35%;">Vehicle</th>
                      <th>Type</th>
                      <th>Daily Rate</th>
                      <th>Status</th>
                      <th style="text-align: right;">Actions</th>
                    </tr>
                  </thead>
                  <tbody id="archived-fleet-list-body"></tbody>
                </table>
              </div>
              </div>
          </div>
      </main>
    </div>
  </div>

  <!-- Fleet Management Modal -->
  <div id="fleet-modal" class="modal" style="display: none;">
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h2 id="modal-title">Add New Vehicle</h2>
        <span class="close-btn" id="close-fleet-modal">&times;</span>
      </div>
      <div class="modal-body">
        <form id="fleet-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
          <input type="hidden" id="vehicle-id">
          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label">Vehicle Name</label>
            <input type="text" id="vehicle-name" class="form-input" required>
          </div>
          <div class="form-group">
            <label class="form-label">Vehicle Type</label>
            <input type="text" id="vehicle-type" class="form-input" required>
          </div>
          <div class="form-group">
            <label class="form-label">Daily Rate (₱)</label>
            <input type="number" id="vehicle-price" class="form-input" required>
          </div>
          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label">Image URL</label>
            <input type="text" id="vehicle-image" class="form-input" required>
          </div>
          <button type="submit" class="btn-submit" style="grid-column: span 2; margin-top: 1rem;">Save Vehicle</button>
        </form>
      </div>
    </div>
  </div>

  <footer class="footer">
    <div class="footer-content">
      <div class="footer-section">
        <h3 class="footer-title">SmartDrive™ Admin</h3>
        <p class="footer-text">Keep the fleet healthy, accurate, and customer-ready with complete visibility over every listing.</p>
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
  <script src="js/data.js"></script>
  <script src="js/managefleetings.js"></script>
</body>
</html>