/**
 * @file index.js
 * This file contains the JavaScript logic for the homepage (index.php).
 * It handles rendering featured vehicles, the hero image carousel, and the quick search form.
 */

/**
 * Utility function to format numbers with commas for thousands.
 * @param {number} num - The number to format.
 * @returns {string} The formatted number as a string.
 */
function formatNumber(num) {
  return num.toLocaleString('en-US');
}

document.addEventListener('DOMContentLoaded', function() {
  // --- Featured Cars Section Logic ---

  // Check if the global CARS data array (presumably from data.js) is available.
  if (typeof CARS === 'undefined') {
    console.error('CARS data not loaded. Make sure data.js is included.');
    return; // Exit if essential data is missing.
  }

  // Select the first 3 cars from the CARS array to display as featured.
  const featuredCars = CARS.slice(0, 3);
  // Get the container element where featured cars will be rendered.
  const container = document.getElementById('featured-cars');
  
  // If the container element is not found, log an error and exit.
  if (!container) {
    console.error('Featured cars container not found');
    return;
  }

  // Generate HTML for each featured car and insert it into the container.
  container.innerHTML = featuredCars.map(car => `
    <div class="car-card animate-fade-in">
      <div class="car-image">
        <img src="${car.image}" alt="${car.name}" loading="lazy">
        <div class="car-badge">${car.type}</div>
      </div>
      <div class="car-content">
        <h3 class="car-name">${car.name}</h3>
        <p class="car-condition">High Quality Condition</p>
        
        <div class="car-specs">
          <div class="car-spec">
            <div class="spec-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <span class="spec-label">${car.specs.seats} Seats</span>
          </div>
          <div class="car-spec">
            <div class="spec-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <span class="spec-label">${car.specs.transmission}</span>
          </div>
          <div class="car-spec">
            <div class="spec-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" x2="15" y1="22" y2="22"/><line x1="4" x2="14" y1="9" y2="9"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/></svg>
            </div>
            <span class="spec-label">${car.specs.fuel}</span>
          </div>
        </div>
        
        <div class="car-footer">
          <div class="car-price">
            <span class="price-currency">₱</span>
            <span class="price-amount">${formatNumber(car.price)}</span>
            <span class="price-period">/day</span>
          </div>
          <a href="rent-a-car.php?vehicle=${car.id}" class="btn-view-details">View Details</a>
        </div>
      </div>
    </div>
  `).join(''); // Join the array of HTML strings into a single string.
});

/**
 * Initializes the hero section's background image carousel.
 * It dynamically creates slides from a list of images and cycles through them
 * at a set interval to create a visually engaging hero section.
 */
document.addEventListener('DOMContentLoaded', function() {
  const heroBg = document.querySelector('.hero-bg'); // Get the background element for the carousel.
  // Define an array of image URLs for the carousel slides.
  const carouselImages = [
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2000&auto=format&fit=crop",
    "https://www.topgear.com/sites/default/files/2023/09/1%20Tesla%20Model%203.jpg",
    "https://images.unsplash.com/photo-1653641305372-a084f9b78858?auto=format&fit=crop&w=1080&q=80",
    "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1080&q=80"
  ];

  // Dynamically create and append carousel slide elements to the hero background.
  carouselImages.forEach((src, index) => {
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';
    slide.style.backgroundImage = `url('${src}')`;
    if (index === 0) slide.classList.add('active'); // Set the first slide as active initially.
    heroBg.appendChild(slide);
  });

  let currentSlide = 0; // Initialize the current slide index.
  // Set up an interval to change slides automatically.
  setInterval(() => {
    const slides = document.querySelectorAll('.hero-bg .carousel-slide'); // Get all carousel slides.
    slides[currentSlide].classList.remove('active'); // Deactivate the current slide.
    currentSlide = (currentSlide + 1) % slides.length; // Move to the next slide, looping back to the start if at the end.
    slides[currentSlide].classList.add('active'); // Activate the new current slide.
  }, 5000); // Change slide every 5 seconds (5000 milliseconds).
});

/**
 * Handles the functionality of the quick search form on the homepage.
 * It validates user input for location and date and redirects to the main
 * vehicle rental page with the search parameters.
 */
document.addEventListener('DOMContentLoaded', function() {
  // Select all input fields that are part of the quick search form.
  const searchInputs = document.querySelectorAll('.search-input');
  // Get the search button element.
  const searchBtn = document.querySelector('.btn-search');

  // If the search button exists, attach a click event listener.
  if (searchBtn) {
    searchBtn.addEventListener('click', function(e) {
      e.preventDefault(); // Prevent the default form submission behavior.

      // Get the values from the location and date input fields.
      const location = searchInputs[0].value;
      const date = searchInputs[1].value;

      // Basic validation: if either field is empty, alert the user.
      if (!location || !date) {
        alert('Please fill in all search fields');
        return; // Stop the function if validation fails.
      }

      // Redirect the user to the 'rent-a-car.php' page with search parameters in the URL.
      // encodeURIComponent is used to properly format the values for a URL.
      window.location.href = `rent-a-car.php?location=${encodeURIComponent(location)}&date=${date}`;
    });
  }

  // Allow pressing the Enter key in any search input to trigger the search button's click event.
  searchInputs.forEach(input => {
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        searchBtn?.click(); // Use optional chaining in case searchBtn is null.
      }
    });
  });
});