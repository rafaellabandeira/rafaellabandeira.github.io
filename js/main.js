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

      const left = document.createElement('div');
      left.className = 'left';
      const btnPrevYear = document.createElement('button');
      btnPrevYear.className = 'cal-btn prev-year';
      btnPrevYear.innerHTML = '«';
      const btnPrev = document.createElement('button');
      btnPrev.className = 'cal-btn prev-month';
      btnPrev.innerHTML = '‹';
      left.appendChild(btnPrevYear);
      left.appendChild(btnPrev);

      const title = document.createElement('div');
      title.className = 'calendar-month';
      title.textContent = monthNames[month] + ' ' + year;

      const right = document.createElement('div');
      right.className = 'right';
      const btnNext = document.createElement('button');
      btnNext.className = 'cal-btn next-month';
      btnNext.innerHTML = '›';
      const btnNextYear = document.createElement('button');
      btnNextYear.className = 'cal-btn next-year';
      btnNextYear.innerHTML = '»';
      right.appendChild(btnNext);
      right.appendChild(btnNextYear);

      header.appendChild(left);
      header.appendChild(title);
      header.appendChild(right);
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

      // listeners for navigation
      btnPrev.addEventListener('click', () => {
        month -= 1;
        if (month < 0) { month = 11; year -= 1; }
        render();
      });
      btnNext.addEventListener('click', () => {
        month += 1;
        if (month > 11) { month = 0; year += 1; }
        render();
      });
      btnPrevYear.addEventListener('click', () => { year -= 1; render(); });
      btnNextYear.addEventListener('click', () => { year += 1; render(); });
    }

    render();
  });
}
import { Payments } from "https://web.squarecdn.com/v1/square.js";

const BACKEND = "https://rafaellabandeira-github-io.onrender.com";
const payments = Payments("sq0idp-Ue7cMnZzU1fLD0l8u0lpcg", "LA6ZV4WAES4A0");
const card = await payments.card();
await card.attach("#square-card");

const loader = document.getElementById("loader");
const resumen = document.getElementById("resumenReserva");

document.getElementById("formReserva").addEventListener("submit", async (e) => {
  e.preventDefault();
  loader.style.display = "block";
  resumen.style.display = "none";
  document.getElementById("resultadoReserva").innerText = "";

  const cabana = document.getElementById("cabana").value;
  const fechaInicio = document.getElementById("fechaInicio").value;
  const fechaFin = document.getElementById("fechaFin").value;

  try {
    const res = await fetch(`${BACKEND}/calculate-price`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cabana, fechaInicio, fechaFin })
    });

    if (!res.ok) throw new Error("Error calculando precio");

    const data = await res.json();
    const total = data.precio;
    const señal = 50;
    const resto = total - señal;

    document.getElementById("resultadoReserva").innerText = "Precio calculado para tu estancia:";
    document.getElementById("precioTotal").innerText = total;
    document.getElementById("restoPagar").innerText = resto;
    resumen.style.display = "block";

  } catch(err) {
    console.error(err);
    document.getElementById("resultadoReserva").innerText = "Error calculando el precio. Intenta de nuevo.";
    resumen.style.display = "none";
  } finally {
    loader.style.display = "none";
  }
});

document.getElementById("btnPagar").addEventListener("click", async () => {
  const nombre = document.getElementById("nombre").value;
  const telefono = document.getElementById("telefono").value;
  const cabana = document.getElementById("cabana").value;

  const result = await card.tokenize();
  if (result.status === "OK") {
    await fetch(`${BACKEND}/create-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nonce: result.token, amount: 50, nombre, telefono, cabana })
    });
    alert("Reserva confirmada correctamente.");
    location.reload();
  } else { alert("Error en el pago"); }
});


