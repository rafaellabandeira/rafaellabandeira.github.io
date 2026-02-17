// js/main.js

import { cargarReservas } from './ical-sync.js';
import { Payments } from "https://web.squarecdn.com/v1/square.js";

document.addEventListener('DOMContentLoaded', function() {
  console.log('Sitio web Cabañas Río Mundo cargado');
  
  initCarousel();
  initHamburger();
  cargarReservas(); // Carga reservas de Booking/Backend y bloquea fechas
  initReserva();
});

// ====== CARRUSEL ======
function initCarousel() {
  const carousels = document.querySelectorAll('.carousel');
  if (!carousels) return;

  carousels.forEach(carousel => {
    const slides = carousel.querySelectorAll('.carousel-slide');
    const prevBtn = carousel.parentElement.querySelector('.carousel-button.prev');
    const nextBtn = carousel.parentElement.querySelector('.carousel-button.next');
    const indicators = carousel.parentElement.querySelectorAll('.indicator');

    if (!slides) return;

    let currentSlide = 0;
    let autoplayInterval;
    let touchStartX = 0;
    let touchEndX = 0;

    function showSlide(n) {
      slides.forEach(sl => sl.classList.remove('active'));
      indicators.forEach(ind => ind.classList.remove('active'));

      currentSlide = (n + slides.length) % slides.length;
      slides[currentSlide].classList.add('active');
      if (indicators[currentSlide]) indicators[currentSlide].classList.add('active');
    }

    if (prevBtn) prevBtn.addEventListener('click', () => { showSlide(currentSlide-1); resetAutoplay(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { showSlide(currentSlide+1); resetAutoplay(); });

    indicators.forEach((ind, idx) => {
      ind.addEventListener('click', () => { showSlide(idx); resetAutoplay(); });
    });

    function startAutoplay() {
      autoplayInterval = setInterval(() => { showSlide(currentSlide+1); }, 5000);
    }
    function resetAutoplay() {
      clearInterval(autoplayInterval);
      startAutoplay();
    }

    carousel.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; });
    carousel.addEventListener('touchend', (e) => { touchEndX = e.changedTouches[0].screenX; handleSwipe(); resetAutoplay(); });
    function handleSwipe() {
      if (touchEndX < touchStartX - 50) showSlide(currentSlide+1);
      if (touchEndX > touchStartX + 50) showSlide(currentSlide-1);
    }

    showSlide(0);
    startAutoplay();
    carousel.parentElement.addEventListener('mouseenter', () => clearInterval(autoplayInterval));
    carousel.parentElement.addEventListener('mouseleave', () => startAutoplay());
  });
}

// ====== MENÚ HAMBURGUESA ======
function initHamburger() {
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');
  if (!hamburger) return;

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navMenu.classList.remove('active');
    });
  });
}

// ====== MOTOR DE RESERVAS ======
function initReserva() {
  const BACKEND = "https://tu-backend.onrender.com"; // Cambiar por tu URL backend

  const entrada = document.getElementById("entrada");
  const salida = document.getElementById("salida");
  const cabanaSelect = document.getElementById("cabaña");
  const nombreInput = document.getElementById("nombre");
  const telefonoInput = document.getElementById("telefono");
  const emailInput = document.getElementById("email");

  const spinner = document.getElementById("spinner");
  const resultadoDiv = document.getElementById("resultado");

  document.querySelector(".reserva-box button").addEventListener("click", async () => {
    const cabana = cabanaSelect.value;
    const entradaVal = entrada.value;
    const salidaVal = salida.value;
    const nombre = nombreInput.value.trim();
    const telefono = telefonoInput.value.trim();
    const email = emailInput.value.trim();

    if (!entradaVal || !salidaVal) return alert("Selecciona fechas");
    if (!nombre || !telefono || !email) return alert("Completa todos los datos personales");

    spinner.style.display = "block";
    resultadoDiv.style.display = "none";

    try {
      const res = await fetch(`${BACKEND}/calculate-price`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ cabana, fechaInicio:entradaVal, fechaFin:salidaVal })
      });
      if (!res.ok) throw new Error("Error calculando precio");

      const data = await res.json();
      const total = data.precio;
      const señal = 50;
      const resto = total - señal;

      document.getElementById("cabañaSeleccionada").innerText = cabana==="campanilla"?"Cabaña Campanilla":"Cabaña El Tejo";
      document.getElementById("total").innerText = total.toFixed(2);
      document.getElementById("resto").innerText = resto.toFixed(2);
      document.getElementById("descuento").innerText = data.descuento?.toFixed(2) || "0";

      resultadoDiv.className = "resumen-reserva " + (cabana==="campanilla"?"campanilla":"tejo");
      resultadoDiv.style.display = "block";

    } catch(err) {
      console.error(err);
      alert("Error calculando el precio, intenta de nuevo.");
    } finally {
      spinner.style.display = "none";
    }
  });

  // ==== PAGO SQUARE ====
  (async () => {
    const payments = Payments("sq0idp-Ue7cMnZzU1fLD0l8u0lpcg","LA6ZV4WAES4A0");
    const card = await payments.card();
    await card.attach("#square-card");

    document.getElementById("btnPagar").addEventListener("click", async () => {
      const nombre = nombreInput.value;
      const telefono = telefonoInput.value;
      const cabana = cabanaSelect.value;
      const result = await card.tokenize();

      if (result.status === "OK") {
        await fetch(`${BACKEND}/create-payment`, {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ nonce:result.token, amount:50, nombre, telefono, cabana })
        });
        alert("Reserva confirmada correctamente.");
        location.reload();
      } else {
        alert("Error en el pago");
      }
    });
  })();
}
