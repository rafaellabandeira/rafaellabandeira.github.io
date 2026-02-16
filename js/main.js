// main.js — Script principal para Cabañas Río Mundo

document.addEventListener('DOMContentLoaded', async function() {
  console.log('Sitio web Cabañas Río Mundo cargado');

  initHamburger();
  initCarousel();
  await cargarReservas(); // carga las reservas desde backend
  initMotorReservas();
});

// ================== CARRUSEL ==================
function initCarousel() {
  const carousels = document.querySelectorAll('.carousel');
  if (!carousels.length) return;

  carousels.forEach(carousel => {
    const slides = carousel.querySelectorAll('.carousel-slide');
    const prevBtn = carousel.parentElement.querySelector('.carousel-button.prev');
    const nextBtn = carousel.parentElement.querySelector('.carousel-button.next');
    const indicators = carousel.parentElement.querySelectorAll('.indicator');
    if (!slides.length) return;

    let currentSlide = 0;
    let autoplay;

    function showSlide(n) {
      slides.forEach(s => s.classList.remove('active'));
      indicators.forEach(i => i.classList.remove('active'));
      currentSlide = (n + slides.length) % slides.length;
      slides[currentSlide].classList.add('active');
      if (indicators[currentSlide]) indicators[currentSlide].classList.add('active');
    }

    prevBtn?.addEventListener('click', () => { showSlide(currentSlide-1); resetAutoplay(); });
    nextBtn?.addEventListener('click', () => { showSlide(currentSlide+1); resetAutoplay(); });
    indicators.forEach((ind,i) => ind.addEventListener('click', () => { showSlide(i); resetAutoplay(); }));

    function startAutoplay(){ autoplay = setInterval(()=>showSlide(currentSlide+1), 5000); }
    function resetAutoplay(){ clearInterval(autoplay); startAutoplay(); }

    carousel.addEventListener('mouseenter', ()=>clearInterval(autoplay));
    carousel.addEventListener('mouseleave', ()=>startAutoplay());

    // touch
    let startX=0,endX=0;
    carousel.addEventListener('touchstart', e=>startX=e.changedTouches[0].screenX);
    carousel.addEventListener('touchend', e=>{ endX=e.changedTouches[0].screenX; if(endX<startX-50) showSlide(currentSlide+1); if(endX>startX+50) showSlide(currentSlide-1); resetAutoplay(); });

    showSlide(0);
    startAutoplay();
  });
}

// ================== MENÚ HAMBURGUESA ==================
function initHamburger(){
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');
  if(!hamburger) return;

  hamburger.addEventListener('click', ()=>{
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
  });

  navLinks.forEach(link => {
    link.addEventListener('click', ()=>{
      hamburger.classList.remove('active');
      navMenu.classList.remove('active');
    });
  });
}

// ================== MOTOR DE RESERVAS ==================
let reservas = { campanilla: [], tejo: [] };

async function cargarReservas(){
  try{
    const res = await fetch("/reservas"); // backend
    reservas = await res.json();
    console.log("Reservas cargadas:", reservas);
  }catch(err){ console.error("Error cargando reservas:", err); }
}

function initMotorReservas(){
  const form = document.getElementById("reserva-online");
  if(!form) return;

  const btnCalcular = form.querySelector("button");
  btnCalcular.addEventListener('click', ()=>calcularReserva());
}

function esTemporadaAlta(fecha){
  const f = new Date(fecha);
  const mes = f.getMonth()+1;
  const dia = f.getDate();
  return (mes==7||mes==8) || (mes==12&&dia>=22) || (mes==1&&dia<=7);
}

function incluirFinDeSemana(fechaEntrada,noches){
  for(let i=0;i<noches;i++){
    const d=new Date(fechaEntrada);
    d.setDate(d.getDate()+i);
    if(d.getDay()===5||d.getDay()===6) return true;
  }
  return false;
}

function calcularReserva(){
  const cabaña = document.getElementById("cabaña").value;
  const entrada = document.getElementById("entrada").value;
  const salida = document.getElementById("salida").value;
  const nombre = document.getElementById("nombre").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const email = document.getElementById("email").value.trim();

  if(!entrada || !salida){ alert("Selecciona fechas"); return; }
  if(!nombre || !telefono || !email){ alert("Completa todos los datos personales"); return; }

  // Validar disponibilidad
  const fechas = reservas[cabaña];
  let d = new Date(entrada);
  const fSalida = new Date(salida);
  while(d<fSalida){
    const str = d.toISOString().slice(0,10);
    if(fechas.includes(str)){
      alert(`Fecha ${str} no disponible para ${cabaña}.`);
      return;
    }
    d.setDate(d.getDate()+1);
  }

  // Cálculo precio
  const noches = (new Date(salida)-new Date(entrada))/(1000*60*60*24);
  let precioNoche = cabaña==="campanilla"? (esTemporadaAlta(entrada)?150:115) : (esTemporadaAlta(entrada)?120:95);

  if(esTemporadaAlta(entrada) && noches<4){ alert("En temporada alta mínimo 4 noches"); return; }
  if(!esTemporadaAlta(entrada) && noches<2){ alert("Mínimo 2 noches"); return; }

  let total = noches * precioNoche;
  let descuento = 0;
  if(!esTemporadaAlta(entrada) && noches>=3 && !incluirFinDeSemana(entrada,noches)){ descuento=total*0.10; total*=0.90; }
  if(esTemporadaAlta(entrada) && noches>=6){ descuento=total*0.10; total*=0.90; }

  const resto = total-50;

  // Mostrar resultados
  const resumen = document.getElementById("resultado");
  resumen.className = "resumen-reserva "+(cabaña==="campanilla"?"campanilla":"tejo");
  document.getElementById("cabañaSeleccionada").innerText = cabaña==="campanilla"?"Cabaña Campanilla":"Cabaña El Tejo";
  document.getElementById("total").innerText = total.toFixed(2);
  document.getElementById("descuento").innerText = descuento.toFixed(2);
  document.getElementById("resto").innerText = resto.toFixed(2);
  resumen.style.display = "block";
}

// ================== PAGO SQUARE ==================
import { Payments } from "https://web.squarecdn.com/v1/square.js";
const BACKEND = "https://rafaellabandeira-github-io.onrender.com";

(async ()=>{
  const payments = Payments("sq0idp-Ue7cMnZzU1fLD0l8u0lpcg", "LA6ZV4WAES4A0");
  const card = await payments.card();
  await card.attach("#square-card");

  document.getElementById("btnPagar").addEventListener("click", async ()=>{
    const nombre = document.getElementById("nombre").value;
    const telefono = document.getElementById("telefono").value;
    const cabana = document.getElementById("cabaña").value;

    const result = await card.tokenize();
    if(result.status==="OK"){
      await fetch(`${BACKEND}/create-payment`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ nonce: result.token, amount:50, nombre, telefono, cabana })
      });
      alert("Reserva confirmada correctamente.");
      location.reload();
    } else alert("Error en el pago");
  });
})();
