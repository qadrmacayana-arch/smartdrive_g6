const bookingsBody = document.getElementById('user-bookings-body');
const currentUser = JSON.parse(sessionStorage.getItem('user') || 'null');

function escapeBookingText(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
}

function getLocalBookings() {
  const storageKey = currentUser ? `userBookings_${currentUser.email}` : 'userBookings_guest';
  return JSON.parse(localStorage.getItem(storageKey) || '[]');
}

function renderBookings(bookings) {
  if (!bookings.length) {
    if (!currentUser?.email) {
      bookingsBody.innerHTML = '<tr><td colspan="5" class="text-center p-12 text-muted-foreground">Create an account to unlock your bookings. <a href="login.php" class="text-primary no-underline">Log in</a> or <a href="signup.php" class="text-primary no-underline">sign up</a>.</td></tr>';
      return;
    }
    bookingsBody.innerHTML = '<tr><td colspan="5" class="text-center p-12 text-muted-foreground">No bookings yet. <a href="rent-a-car.php" class="text-primary no-underline">Book your first vehicle</a>.</td></tr>';
    return;
  }

  bookingsBody.innerHTML = bookings.map(booking => `
    <tr>
      <td class="font-semibold">${escapeBookingText(booking.referenceNumber || booking.reference_number || 'N/A')}</td>
      <td>${escapeBookingText(booking.vehicleName || booking.vehicle_name || 'Vehicle')}</td>
      <td>${escapeBookingText(booking.pickupDate || booking.pickup_date || '')} - ${escapeBookingText(booking.returnDate || booking.return_date || '')}</td>
      <td>₱${Number(booking.totalPrice || booking.total_price || 0).toLocaleString()}</td>
      <td><span class="text-primary font-semibold">${escapeBookingText(booking.status || booking.booking_status || 'Confirmed')}</span></td>
    </tr>
  `).join('');
}

async function loadUserBookings() {
  if (!currentUser?.email) {
    renderBookings(getLocalBookings());
    return;
  }

  try {
    const response = await fetch(`api/bookings.php?email=${encodeURIComponent(currentUser.email)}`);
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to load bookings');
    renderBookings(result.bookings);
  } catch (error) {
    console.warn('Using local booking history:', error);
    renderBookings(getLocalBookings());
  }
}

loadUserBookings();
