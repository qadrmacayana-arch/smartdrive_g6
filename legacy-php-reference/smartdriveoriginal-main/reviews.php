<?php
// reviews.php
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reviews & Ratings - SmartDrive™ Admin</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body id="dashboard-page" class="admin-page">
  <div class="aurora-orb aurora-orb--1"></div>
  <div class="aurora-orb aurora-orb--2"></div>
  <div class="aurora-orb aurora-orb--3"></div>

  <header class="header">
    <div class="container">
      <a href="admin.php" class="logo">
        <div class="logo-icon">🚗</div>
        <span>SmartDrive™ <span style="font-size: 10px; background: var(--primary); color: var(--primary-foreground); padding: 2px 5px; border-radius: 4px; margin-left: 5px;">ADMIN</span></span>
      </a>
      <nav class="nav-links"><a href="admin.php" class="nav-link">Admin Dashboard</a></nav>
      <div class="nav-actions" id="auth-buttons"></div>
    </div>
  </header>

  <div class="dashboard-container">
    <div class="dashboard-layout">
      <aside class="dashboard-sidebar">
        <div class="profile-card">
          <div class="profile-header">
            <div class="profile-avatar">⭐</div>
            <div class="profile-info"><h3>Admin User</h3><p class="profile-badge" style="background-color: var(--destructive); color: white;">Admin</p></div>
          </div>
          <nav class="sidebar-nav">
            <a href="admin.php" class="nav-item">Overview</a>
            <a href="managebookings.php" class="nav-item">Manage Bookings</a>
            <a href="manageusers.php" class="nav-item">Manage Users</a>
            <a href="managefleetings.php" class="nav-item">Fleet Management</a>
            <a href="vehicletracking.php" class="nav-item">Vehicle Tracking</a>
            <a href="admin-user-transactions.php" class="nav-item">User Transactions</a>
            <a href="reviews.php" class="nav-item active">Reviews & Ratings</a>
          </nav>
        </div>
      </aside>

      <main class="dashboard-main">
        <div class="dashboard-header">
          <h1 class="dashboard-title">Reviews & Ratings</h1>
          <p class="dashboard-subtitle">Read customer feedback and monitor satisfaction across the platform.</p>
        </div>
        <div class="stats-grid">
          <div class="stat-card"><p class="stat-label">Total Reviews</p><p class="stat-value" id="review-count">0</p></div>
          <div class="stat-card"><p class="stat-label">Average Rating</p><p class="stat-value" id="review-average">0.0 ⭐</p></div>
        </div>
        <section class="bookings-section">
          <div class="admin-table-header">
            <h2 class="admin-table-title">Customer Comments</h2>
            <button class="btn-small" id="refresh-reviews-btn">↻ Refresh</button>
          </div>
          <div class="bookings-table-wrapper">
            <table class="bookings-table">
              <thead><tr><th>Customer</th><th>Rating</th><th>Comment</th><th>Date</th></tr></thead>
              <tbody id="reviews-body"><tr><td colspan="4" class="text-center p-12 text-muted-foreground">Loading reviews...</td></tr></tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="js/supabase.js?v=20260907"></script>
  <script defer src="js/reviews.js?v=20260907"></script>
</body>
</html>
