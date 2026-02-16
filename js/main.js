// main.js - Cabañas Río Mundo

document.addEventListener('DOMContentLoaded', async function() {
  console.log('Sitio web Cabañas Río Mundo cargado');

  initCarousel();
  initHamburger();
  await cargarReservas(); // bloquea fechas ocupadas

  // Inicializar Square (pago)
  if (window.Payments) {
    const payments = Payments("sq0idp-Ue7cMnZzU1fLD0l8u0lpcg", "LA6ZV4WAES4A0");
    const card = await payments.card();
    await card.attach("#square-card");

    document.getElementById("btnPagar").addEventListener("click", async () => {
      const nombre = document.getElementById("nombre").value;
      const telefono = document.getElementById("telefono").value;
      const cabana = document.getElementById("cabaña").value;

      const result = await card.tokenize();
      if (result.status === "OK") {
        await fetch(`${BACKEND}/create-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nonce: result.token, amount: 50, nombre, telefono, cabana })
        });
        alert("Reserva confirmada correctamente.");
        location.reload();
      } else {
        alert("Error en el pago");
      }
    });
  }
});

// ===== CONFIG =====
const BACKEND = "https://rafaellabandeira-github-io.onrender.com";

// ===== CARRUSEL =====
function initCarousel() {
  const carousels = document.querySelectorAll('.carousel');
  if (!carousels.length) return;

  carousels.forEach(carousel => {
    const slides = carousel.querySelectorAll('.carousel-slide');
    const prevBtn = carousel.parentElement.querySelector('.carousel-button.prev');
    const nextBtn = carousel.parentElement.querySelector('.carousel-button.next');
    const indicators = carousel.parentElement.querySelectorAll('.indicator');
    if (!slides.length) return;

    let currentSlide = 0, autoplayInterval, touchStartX = 0, touchEndX = 0;

    function showSlide(n){
      slides.forEach(s => s.classList.remove('active'));
      indicators.forEach(i => i.classList.remove('active'));
      currentSlide = (n + slides.length) % slides.length;
      slides[currentSlide].classList.add('active');
      if (indicators[currentSlide]) indicators[currentSlide].classList.add('active');
    }

    function startAutoplay(){ autoplayInterval = setInterval(()=>{showSlide(currentSlide+1)},5000); }
    function resetAutoplay(){ clearInterval(autoplayInterval); startAutoplay(); }

    if(prevBtn) prevBtn.addEventListener('click',()=>{showSlide(currentSlide-1); resetAutoplay();});
    if(nextBtn) nextBtn.addEventListener('click',()=>{showSlide(currentSlide+1); resetAutoplay();});
    indicators.forEach((ind,i)=>ind.addEventListener('click',()=>{showSlide(i); resetAutoplay();}));

    carousel.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; });
    carousel.addEventListener('touchend', e => {
      touchEndX = e.changedTouches[0].screenX;
      if(touchEndX < touchStartX - 50) showSlide(currentSlide+1);
      if(touchEndX > touchStartX + 50) showSlide(currentSlide-1);
      resetAutoplay();
    });

    showSlide(0);
    startAutoplay();
    carousel.parentElement.addEventListener('mouseenter',()=>clearInterval(autoplayInterval));
    carousel.parentElement.addEventListener('mouseleave',()=>startAutoplay());
  });
}

// ===== HAMBURGUESA =====
function initHamburger() {
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');
  if (!hamburger) return;

  hamburger.addEventListener('click',()=>{hamburger.classList.toggle('active'); navMenu.classList.toggle('active');});
  document.querySelectorAll('.nav-link').forEach(link=>{
    link.addEventListener('click',()=>{hamburger.classList.remove('active'); navMenu.classList.remove('active');});
  });
}

// ===== RESERVAS JSON =====
async function cargarReservas() {
  try {
    const res = await fetch("js/reservas.json");
    const reservas = await res.json();

    bloquearFechas("entrada","salida", reservas);

  } catch(err) {
    console.error("Error cargando reservas:", err);
  }
}

function bloquearFechas(idEntrada, idSalida, reservas){
  const inputEntrada = document.getElementById(idEntrada);
  const inputSalida = document.getElementById(idSalida);
  if(!inputEntrada||!inputSalida) return;

  [inputEntrada,inputSalida].forEach(input=>{
    input.addEventListener('change',()=>{
      const cabana = document.getElementById("cabaña").value;
      if(reservas[cabana] && reservas[cabana].includes(input.value)){
        alert("La fecha seleccionada está ocupada. Elige otra.");
        input.value="";
      }
    });
  });
}

// ===== MOTOR DE RESERVAS =====
function esTemporadaAlta(fecha){ const f=new Date(fecha); const mes=f.getMonth()+1; const dia=f.getDate(); return (mes==7||mes==8)||(mes==12&&dia>=22)||(mes==1&&dia<=7);}
function incluyeFinDeSemana(fechaEntrada,noches){for(let i=0;i<noches;i++){const d=new Date(fechaEntrada);d.setDate(d.getDate()+i); if(d.getDay()==5||d.getDay()==6) return true;}return false;}
function calcularReserva(){
  const cabaña=document.getElementById("cabaña").value;
  const entrada=document.getElementById("entrada").value;
  const salida=document.getElementById("salida").value;
  const nombre=document.getElementById("nombre").value.trim();
  const telefono=document.getElementById("telefono").value.trim();
  const email=document.getElementById("email").value.trim();
  if(!entrada||!salida){alert("Selecciona fechas");return;}
  if(!nombre||!telefono||!email){alert("Completa todos los datos personales");return;}
  document.getElementById("spinner").style.display="block";
  document.getElementById("resultado").style.display="none";

  setTimeout(()=>{
    const noches=(new Date(salida)-new Date(entrada))/(1000*60*60*24);
    let precioNoche=cabaña=="campanilla"?esTemporadaAlta(entrada)?150:115:esTemporadaAlta(entrada)?120:95;
    if(esTemporadaAlta(entrada)&&noches<4){alert("En temporada alta mínimo 4 noches");document.getElementById("spinner").style.display="none";return;}
    if(!esTemporadaAlta(entrada)&&noches<2){alert("Mínimo 2 noches");document.getElementById("spinner").style.display="none";return;}
    let total=noches*precioNoche;
    let descuento=0;
    if(!esTemporadaAlta(entrada)&&noches>=3&&!incluyeFinDeSemana(entrada,noches)){descuento=total*0.10;total*=0.90;}
    if(esTemporadaAlta(entrada)&&noches>=6){descuento=total*0.10;total*=0.90;}
    const resto=total-50;
    document.getElementById("cabañaSeleccionada").innerText=cabaña=="campanilla"?"Cabaña Campanilla":"Cabaña El Tejo";
    document.getElementById("total").innerText=total.toFixed(2);
    document.getElementById("resto").innerText=resto.toFixed(2);
    document.getElementById("descuento").innerText=descuento.toFixed(2);
    const resumen=document.getElementById("resultado");
    resumen.className="resumen-reserva "+(cabaña=="campanilla"?"campanilla":"tejo");
    document.getElementById("spinner").style.display="none";
    resumen.style.display="block";
  },600);
}

function reservar(){ alert("Aquí se conectará el pago de 50 € (Square o pasarela elegida)."); }
