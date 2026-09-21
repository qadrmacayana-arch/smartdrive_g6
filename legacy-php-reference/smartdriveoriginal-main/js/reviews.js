function escapeReviewText(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
}

function getStoredReviews() {
  try {
    const reviews = JSON.parse(localStorage.getItem('smartdriveReviews') || '[]');
    return Array.isArray(reviews) ? reviews : [];
  } catch (error) {
    return [];
  }
}

async function loadReviews() {
  let reviews = [];
  if (window.smartdriveSupabase) {
    const { data, error } = await window.smartdriveSupabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && Array.isArray(data)) {
      reviews = data;
    } else if (error) {
      console.warn('Could not load Supabase reviews:', error.message);
    }
  }
  if (!reviews.length) reviews = getStoredReviews();

  const count = reviews.length;
  const average = count ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / count : 0;
  document.getElementById('review-count').textContent = count;
  document.getElementById('review-average').textContent = `${average.toFixed(1)} ⭐`;

  const body = document.getElementById('reviews-body');
  if (!count) {
    body.innerHTML = '<tr><td colspan="4" class="text-center p-12 text-muted-foreground">No reviews have been submitted yet.</td></tr>';
    return;
  }
  body.innerHTML = reviews.map(review => {
    const starCount = Math.max(0, Math.min(5, Number(review.rating) || 0));
    const stars = Array.from({ length: 5 }, (_, index) => index < starCount ? '★' : '☆').join('');
    return `
      <tr>
        <td><strong>${escapeReviewText(review.customer_name || 'Anonymous')}</strong><br><small>${escapeReviewText(review.customer_email || '')}</small></td>
        <td><span class="review-stars">${stars}</span><span class="review-score">${escapeReviewText(review.rating)}/5</span></td>
        <td>${escapeReviewText(review.comment || 'No comment provided.')}</td>
        <td>${escapeReviewText(new Date(review.created_at || Date.now()).toLocaleDateString())}</td>
      </tr>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  loadReviews();
  document.getElementById('refresh-reviews-btn')?.addEventListener('click', loadReviews);
});
