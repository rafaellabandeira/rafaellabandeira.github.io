// Script principal para Cabañas Río Mundo

document.addEventListener('DOMContentLoaded', function() {
  console.log('Sitio web Cabañas Río Mundo cargado');
  
  // Carrusel
  initCarousel();
  // Calendarios informativos
  initCalendars();
  
  // Agregar meta viewport para mobile
  if (!document.querySelector('meta[name="viewport"]')) {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0';
    document.head.appendChild(meta);
  }
});

function initCarousel() {
  const carousels = document.querySelectorAll('.carousel');
  if (!carousels || carousels.length === 0) return;

  carousels.forEach(carousel => {
    const slides = carousel.querySelectorAll('.carousel-slide');
    const prevBtn = carousel.parentElement.querySelector('.carousel-button.prev');
    const nextBtn = carousel.parentElement.querySelector('.carousel-button.next');
    const indicators = carousel.parentElement.querySelectorAll('.indicator');

    if (slides.length === 0) return;

    let currentSlide = 0;
    let autoplayInterval;
    let touchStartX = 0;
    let touchEndX = 0;

    function showSlide(n) {
      slides.forEach(slide => slide.classList.remove('active'));
      indicators.forEach(ind => ind.classList.remove('active'));

      currentSlide = (n + slides.length) % slides.length;
      slides[currentSlide].classList.add('active');
      if (indicators[currentSlide]) {
        indicators[currentSlide].classList.add('active');
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        showSlide(currentSlide - 1);
        resetAutoplay();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        showSlide(currentSlide + 1);
        resetAutoplay();
      });
    }

    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => {
        showSlide(index);
        resetAutoplay();
      });
    });

    function startAutoplay() {
      autoplayInterval = setInterval(() => {
        showSlide(currentSlide + 1);
      }, 5000);
    }

    function resetAutoplay() {
      clearInterval(autoplayInterval);
      startAutoplay();
    }

    carousel.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });

    carousel.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
      resetAutoplay();
    });

    function handleSwipe() {
      if (touchEndX < touchStartX - 50) {
        showSlide(currentSlide + 1);
      }
      if (touchEndX > touchStartX + 50) {
        showSlide(currentSlide - 1);
      }
    }

    // Iniciar
    showSlide(0);
    startAutoplay();

    carousel.parentElement.addEventListener('mouseenter', () => {
      clearInterval(autoplayInterval);
    });

    carousel.parentElement.addEventListener('mouseleave', () => {
      startAutoplay();
    });
  });
}

// Menú hamburguesa
function initHamburger() {
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!hamburger) return;

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
  });

  // Cerrar menú al hacer clic en un link
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navMenu.classList.remove('active');
    });
  });
}

// Inicializar en carga
document.addEventListener('DOMContentLoaded', function() {
  initHamburger();
});

// Calendarios informativos simples
function initCalendars() {
  const calEls = document.querySelectorAll('.simple-calendar');
  if (!calEls || calEls.length === 0) return;

  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  calEls.forEach(el => {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();

    function render() {
      el.innerHTML = '';

      const header = document.createElement('div');
      header.className = 'calendar-header';
      const title = document.createElement('div');
      title.className = 'calendar-month';
      title.textContent = monthNames[month] + ' ' + year;
      header.appendChild(title);
      el.appendChild(header);

      const weekdays = ['Do','Lu','Ma','Mi','Ju','Vi','Sa'];
      const gridHead = document.createElement('div');
      gridHead.className = 'calendar-grid';
      weekdays.forEach(d => {
        const w = document.createElement('div');
        w.className = 'calendar-weekday';
        w.textContent = d;
        gridHead.appendChild(w);
      });
      el.appendChild(gridHead);

      const grid = document.createElement('div');
      grid.className = 'calendar-grid';

      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // leading blanks
      for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        grid.appendChild(empty);
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day';
        cell.textContent = d;
        // por defecto disponible
        cell.dataset.status = 'available';
        grid.appendChild(cell);
      }

      el.appendChild(grid);

      const legend = document.createElement('p');
      legend.className = 'calendar-legend';
      legend.innerHTML = '<span class="dot available"></span> Disponible &nbsp;&nbsp; <span class="dot occupied"></span> Ocupado';
      el.appendChild(legend);
    }

    render();
  });
}

