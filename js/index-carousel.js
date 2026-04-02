
// =========================
//   CARRUSEL GENERAL
// =========================

document.addEventListener("DOMContentLoaded", () => {
  const carruseles = document.querySelectorAll(".carousel-container-general");

  carruseles.forEach((carousel) => {
    const slides = carousel.querySelector(".carousel-general-slides");
    const slideItems = carousel.querySelectorAll(".carousel-slide-general");
    const prevBtn = carousel.querySelector(".prev-general");
    const nextBtn = carousel.querySelector(".next-general");
    const indicatorsContainer = carousel.querySelector(".carousel-indicators-general");

    let index = 0;

    // Crear indicadores
    slideItems.forEach((_, i) => {
      const btn = document.createElement("button");
      btn.className = "indicator-general";
      if (i === 0) btn.classList.add("active");
      btn.addEventListener("click", () => moveToSlide(i));
      indicatorsContainer.appendChild(btn);
    });

    const indicators = indicatorsContainer.querySelectorAll(".indicator-general");

    function updateCarousel() {
      slides.style.transform = `translateX(-${index * 100}%)`;
      indicators.forEach((dot, i) => {
        dot.classList.toggle("active", i === index);
      });
    }

    function moveToSlide(i) {
      index = i;
      updateCarousel();
    }

    prevBtn.addEventListener("click", () => {
      index = (index - 1 + slideItems.length) % slideItems.length;
      updateCarousel();
    });

    nextBtn.addEventListener("click", () => {
      index = (index + 1) % slideItems.length;
      updateCarousel();
    });
  });
});
