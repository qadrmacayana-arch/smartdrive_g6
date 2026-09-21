"use strict";

const LOCATION_ENDPOINT = 'api/latest-locations.php';
const REFRESH_INTERVAL_MS = 10000;
const defaultMapCenter = [14.5995, 120.9842];
const metroManilaBounds = [[14.35, 120.93], [14.78, 121.14]];

let trackedLocations = [];

function getCurrentUser() {
	return JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('smartdriveUser') || 'null');
}

function escapeHtml(value) {
	return String(value ?? '').replace(/[&<>'"]/g, character => ({
		'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
	}[character]));
}

function formatLocationTime(value) {
	if (!value) return 'Time unavailable';
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? 'Time unavailable' : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function locationKey(location) {
	return String(location.user_id ?? location.userId ?? location.id ?? location.email ?? location.name);
}

function normalizeLocations(payload) {
	const locations = Array.isArray(payload) ? payload : payload.locations;
	if (!Array.isArray(locations)) throw new Error('The location API must return an array of locations.');

	return locations.map(location => ({
		...location,
		key: locationKey(location),
		name: location.full_name ?? location.fullName ?? location.name ?? `User ${locationKey(location)}`,
		latitude: Number(location.latitude),
		longitude: Number(location.longitude),
		accuracy: Number(location.accuracy),
		speed: Number(location.speed),
		recordedAt: location.recorded_at ?? location.recordedAt ?? location.timestamp
	})).filter(location => Number.isFinite(location.latitude) && Number.isFinite(location.longitude)
		&& location.latitude >= -90 && location.latitude <= 90
		&& location.longitude >= -180 && location.longitude <= 180
		&& location.latitude >= metroManilaBounds[0][0] && location.latitude <= metroManilaBounds[1][0]
		&& location.longitude >= metroManilaBounds[0][1] && location.longitude <= metroManilaBounds[1][1]);
}

function showError(message) {
	const error = document.getElementById('tracking-error');
	error.textContent = message;
	error.style.display = 'block';
}

function clearError() {
	document.getElementById('tracking-error').style.display = 'none';
}

function selectLocation(location) {
	if (!location) return;
	document.getElementById('tracking-map').innerHTML = `<iframe title="${escapeHtml(location.name)} location in Google Maps" src="https://www.google.com/maps?q=${location.latitude},${location.longitude}&z=16&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
	document.querySelectorAll('.tracking-user').forEach(item => item.classList.toggle('active', item.dataset.userKey === location.key));
}

function renderMarkers() {
	document.getElementById('tracking-map').innerHTML = '<iframe title="Metro Manila map" src="https://www.google.com/maps?q=14.5995,120.9842&z=12&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>';
}

function renderUserList() {
	const list = document.getElementById('tracking-users');
	const count = document.getElementById('tracking-count');
	count.textContent = `${trackedLocations.length} user${trackedLocations.length === 1 ? '' : 's'}`;

	if (!trackedLocations.length) {
		list.innerHTML = '<div class="tracking-empty">No location updates yet.<br>Once the phone app sends coordinates, users will appear here.</div>';
		return;
	}

	list.innerHTML = trackedLocations.map(location => `
		<button type="button" class="tracking-user" data-user-key="${escapeHtml(location.key)}">
			<span class="tracking-user-name">${escapeHtml(location.name)}</span>
			<span class="tracking-user-meta"><span>${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}</span><span>${escapeHtml(formatLocationTime(location.recordedAt))}</span></span>
			<span class="tracking-google-link">Show exact location on map</span>
		</button>
	`).join('');

	list.querySelectorAll('.tracking-user').forEach(button => {
		button.addEventListener('click', () => selectLocation(trackedLocations.find(location => location.key === button.dataset.userKey)));
	});
}

async function loadLocations() {
	const status = document.getElementById('tracking-status');
	status.textContent = 'Updating...';

	try {
		const response = await fetch(LOCATION_ENDPOINT, { headers: { Accept: 'application/json' }, cache: 'no-store' });
		if (!response.ok) throw new Error(`Location API returned HTTP ${response.status}.`);
		trackedLocations = normalizeLocations(await response.json());
		renderMarkers();
		renderUserList();
		clearError();
		status.textContent = `Updated ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
	} catch (error) {
		status.textContent = 'Update failed';
		showError(`${error.message} Create api/latest-locations.php and return the latest coordinates as JSON.`);
	}
}

function initTrackingPage() {
	const user = getCurrentUser();
	const isAdmin = Boolean(user && (user.isAdmin || user.email === 'admin@smartrentals.com'));
	if (!isAdmin) {
		window.location.href = 'login.php?reason=admin_unauthorized';
		return;
	}

	renderMarkers();

	document.getElementById('refresh-tracking').addEventListener('click', loadLocations);
	loadLocations();
	window.setInterval(loadLocations, REFRESH_INTERVAL_MS);
}

window.addEventListener('load', initTrackingPage);
