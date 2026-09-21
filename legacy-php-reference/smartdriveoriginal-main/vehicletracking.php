<?php
// vehicletracking.php
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="description" content="SmartDrive admin vehicle and user location tracking.">
	<title>Live Tracking - SmartDrive</title>
	<link rel="stylesheet" href="css/style.css">
	<style>
		.tracking-page { padding: 2.5rem 1rem; position: relative; z-index: 2; }
		.tracking-shell { max-width: 1600px; margin: 0 auto; }
		.tracking-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; }
		.tracking-actions { display: flex; align-items: center; gap: 1rem; }
		.tracking-status { color: var(--muted-foreground); font-size: 0.9rem; }
		.tracking-layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 1.5rem; align-items: start; }
		.tracking-panel { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); overflow: hidden; }
		#tracking-map { height: min(70vh, 720px); min-height: 480px; width: 100%; display: grid; place-items: center; background: #eef2f6; }
		#tracking-map iframe { width: 100%; height: 100%; border: 0; display: block; }
		.tracking-google-link { display: block; margin-top: 0.45rem; color: #1a73e8; font-size: 0.78rem; font-weight: 700; }
		.tracking-panel-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); }
		.tracking-panel-header h2 { margin: 0; font-size: 1.05rem; color: var(--heading); }
		.tracking-count { color: var(--muted-foreground); font-size: 0.85rem; }
		.tracking-users { max-height: 680px; overflow-y: auto; }
		.tracking-user { display: block; width: 100%; padding: 1rem 1.5rem; border: 0; border-bottom: 1px solid var(--border); background: transparent; color: var(--foreground); text-align: left; cursor: pointer; }
		.tracking-user:hover, .tracking-user.active { background: var(--primary-soft); }
		.tracking-user-name { display: block; color: var(--heading); font-weight: 700; margin-bottom: 0.3rem; }
		.tracking-user-meta { display: flex; justify-content: space-between; gap: 0.75rem; color: var(--muted-foreground); font-size: 0.78rem; }
		.tracking-empty { padding: 2rem 1.5rem; color: var(--muted-foreground); text-align: center; line-height: 1.6; }
		.tracking-error { display: none; margin-bottom: 1rem; padding: 0.9rem 1rem; border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 0.6rem; background: rgba(239, 68, 68, 0.1); color: var(--destructive); }
		@media (max-width: 900px) { .tracking-layout { grid-template-columns: 1fr; } .tracking-users { max-height: 360px; } }
		@media (max-width: 600px) { .tracking-toolbar { align-items: flex-start; flex-direction: column; } .tracking-actions { width: 100%; justify-content: space-between; } #tracking-map { min-height: 420px; } }
	</style>
</head>
<body id="dashboard-page" class="admin-page">
	<div class="aurora-orb aurora-orb--1"></div>
	<div class="aurora-orb aurora-orb--2"></div>
	<div class="aurora-orb aurora-orb--3"></div>

	<header class="header">
		<div class="container">
			<a href="admin.php" class="logo">
				<div class="logo-icon"><span aria-hidden="true">SD</span></div>
				<span>SmartDrive <span style="font-size: 10px; background: var(--primary); color: var(--primary-foreground); padding: 2px 5px; border-radius: 4px; margin-left: 5px;">ADMIN</span></span>
			</a>
			<nav class="nav-links">
				<a href="admin.php" class="nav-link">Admin Dashboard</a>
				<a href="vehicletracking.php" class="nav-link active">Vehicle Tracking</a>
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
						<a href="managefleetings.php" class="nav-item">Fleet Management</a>
						<a href="vehicletracking.php" class="nav-item active">Vehicle Tracking</a>
						<a href="admin-user-transactions.php" class="nav-item">User Transactions</a>
						<a href="reviews.php" class="nav-item">Reviews & Ratings</a>
					</nav>
				</div>
			</aside>

			<main class="dashboard-main">
				<div class="tracking-toolbar">
					<div class="dashboard-header" style="margin-bottom: 0;">
						<h1 class="dashboard-title">Live Location Tracking</h1>
						<p class="dashboard-subtitle">Monitor location updates shared by active users.</p>
					</div>
					<div class="tracking-actions">
						<span id="tracking-status" class="tracking-status" role="status">Waiting for location data</span>
						<button type="button" id="refresh-tracking" class="btn-submit" style="width: auto;">Refresh</button>
					</div>
				</div>
				<div id="tracking-error" class="tracking-error" role="alert"></div>

				<div class="tracking-layout">
					<section class="tracking-panel" aria-label="Live user map">
						<div id="tracking-map"></div>
					</section>
					<aside class="tracking-panel" aria-label="Tracked users">
						<div class="tracking-panel-header">
							<h2>Tracked Users</h2>
							<span id="tracking-count" class="tracking-count">0 users</span>
						</div>
						<div id="tracking-users" class="tracking-users">
							<div class="tracking-empty">No location updates yet.<br>Once the phone app sends coordinates, users will appear here.</div>
						</div>
					</aside>
				</div>
			</main>
		</div>
	</div>

	<footer class="footer">
	  <div class="footer-content">
	    <div class="footer-section">
	      <h3 class="footer-title">SmartDrive™ Admin</h3>
	      <p class="footer-text">Monitor real-time vehicle and user location data to support bookings and operational decisions.</p>
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

	<script defer src="js/shared.js?v=20260906"></script>
	<script defer src="js/vehicletracking.js"></script>
</body>
</html>
