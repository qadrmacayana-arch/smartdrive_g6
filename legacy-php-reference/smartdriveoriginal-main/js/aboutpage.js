//About Page Script

    /**
     * Initializes the hero section carousel for the About page.
     * It dynamically creates slides from an array of images and cycles through them
     * to create an engaging visual background.
     */
    document.addEventListener('DOMContentLoaded', function() {
      const heroBg = document.querySelector('.hero-bg');
      const carouselImages = [
        "https://25174313.fs1.hubspotusercontent-eu1.net/hub/25174313/hubfs/Nissan-web-banner-3000x1300-v3.jpg?width=1920&height=832&name=Nissan-web-banner-3000x1300-v3.jpg",
        "https://images.hgmsites.net/med/2025-jeep-wrangler-sport-s-2-door-4x4-angular-front-exterior-view_100967699_m.webp",
        "https://www.topgear.com/sites/default/files/2024/12/hyundai-tucson-ultimate-17.jpg"
      ];

      carouselImages.forEach((src, index) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        slide.style.backgroundImage = `url('${src}')`;
        if (index === 0) slide.classList.add('active');
        heroBg.appendChild(slide);
      });

      let currentSlide = 0;
      setInterval(() => {
        const slides = document.querySelectorAll('.hero-bg .carousel-slide');
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
      }, 5000);
    });

    /**
     * Adds a smooth-scrolling behavior to all "Contact Us" links.
     * When a link with the 'contact-link' class is clicked, the page will smoothly scroll to the "Contact Us" section.
     */
    document.querySelectorAll('.contact-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const contactSection = document.querySelector('.section-title');
            // Find the "Contact Us" section and scroll to it
            document.querySelectorAll('.section-title').forEach(title => {
                if (title.textContent.trim() === 'Contact Us') {
                    title.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    });