const reviewRatingLabels = {
  1: 'Very dissatisfied',
  2: 'Dissatisfied',
  3: 'Neutral',
  4: 'Satisfied',
  5: 'Very satisfied'
};

function getReviewUser() {
  try {
    return JSON.parse(sessionStorage.getItem('user') || 'null');
  } catch (error) {
    return null;
  }
}

function getLocalReviews() {
  try {
    const reviews = JSON.parse(localStorage.getItem('smartdriveReviews') || '[]');
    return Array.isArray(reviews) ? reviews : [];
  } catch (error) {
    return [];
  }
}

function setReviewMessage(message, isError = false) {
  const messageElement = document.getElementById('review-form-message');
  if (!messageElement) return;
  messageElement.textContent = message;
  messageElement.style.color = isError ? 'var(--destructive)' : 'var(--primary)';
}

async function saveReview(review) {
  const supabase = window.smartdriveSupabase;
  if (supabase) {
    const { data: authData } = await supabase.auth.getUser();
    // Multiple review submissions are intentionally allowed for each customer.
    const payload = {
      user_id: authData?.user?.id || null,
      customer_email: review.customer_email,
      customer_name: review.customer_name,
      rating: review.rating,
      comment: review.comment || null
    };
    const { error } = await supabase.from('reviews').insert(payload);
    if (!error) return;
    console.warn('Could not save review to Supabase:', error.message);
  }

  const reviews = getLocalReviews();
  reviews.unshift(review);
  localStorage.setItem('smartdriveReviews', JSON.stringify(reviews.slice(0, 100)));
}

function initializeReviewForm() {
  const reviewForm = document.getElementById('review-form');
  if (!reviewForm) return;

  let selectedRating = 0;
  document.querySelectorAll('.satisfaction-btn').forEach(button => {
    button.addEventListener('click', () => {
      selectedRating = Number(button.dataset.value);
      document.querySelectorAll('.satisfaction-btn').forEach(item => {
        item.classList.toggle('active', Number(item.dataset.value) === selectedRating);
      });
      document.getElementById('satisfaction-feedback').textContent = reviewRatingLabels[selectedRating];
    });
  });

  reviewForm.addEventListener('submit', async event => {
    event.preventDefault();
    const user = getReviewUser();
    const comment = document.getElementById('review-comment').value.trim();
    const submitButton = document.getElementById('review-submit-btn');

    if (!selectedRating) {
      setReviewMessage('Please select an emoji rating first.', true);
      return;
    }
    if (!user?.email) {
      setReviewMessage('Please sign in before submitting a review.', true);
      return;
    }

    submitButton.disabled = true;
    setReviewMessage('Saving your review...');
    try {
      await saveReview({
        customer_email: user.email,
        customer_name: user.fullName || user.name || user.email.split('@')[0],
        rating: selectedRating,
        comment,
        created_at: new Date().toISOString()
      });
      reviewForm.reset();
      selectedRating = 0;
      document.querySelectorAll('.satisfaction-btn').forEach(item => item.classList.remove('active'));
      document.getElementById('satisfaction-feedback').textContent = 'Select a rating';
      setReviewMessage('Thanks! Your rating and comment were sent to SmartDrive. You can submit more reviews anytime.');
    } catch (error) {
      setReviewMessage('We could not save your review. Please try again.', true);
      console.error('Review submission failed:', error);
    } finally {
      submitButton.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', initializeReviewForm);
