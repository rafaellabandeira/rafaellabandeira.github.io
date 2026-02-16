// Script principal Cabañas Río Mundo

document.addEventListener('DOMContentLoaded', function() {
  console.log('Sitio web Cabañas Río Mundo cargado');
  
  initCarousel();
  initHamburger();
  cargarReservas();
});

// ====== Carrusel ======
function initCarousel() {
  const carousels = document.querySelectorAll('.carousel');
  if (!carousels || carousels.length === 0) return;

  carousels.forEach(carousel => {
    const slides = carousel.querySelectorAll('.carousel-slide');
    const prevBtn = carousel.parentElement.querySelector('.carousel-button.prev');
    const nextBtn = carousel.parentElement.querySelector('.carousel-button.next');
    const indicators = carousel.parentElement.querySelectorAll('.indicator');
    if (!slides.length) return;

    let currentSlide = 0;
    let autoplayInterval;

    function showSlide(n) {
      slides.forEach(s => s.classList.remove('active'));
      indicators.forEach(i => i.classList.remove('active'));
      currentSlide = (n + slides.length) % slides.length;
      slides[currentSlide].classList.add('active');
      if (indicators[currentSlide]) indicators[currentSlide].classList.add('active');
    }

    if (prevBtn) prevBtn.addEventListener('click', () => showSlide(currentSlide - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => showSlide(currentSlide + 1));
    indicators.forEach((ind, idx) => ind.addEventListener('click', () => showSlide(idx)));

    function startAutoplay() { autoplayInterval = setInterval(() => showSlide(currentSlide + 1), 5000); }
    function resetAutoplay() { clearInterval(autoplayInterval); startAutoplay(); }

    carousel.addEventListener('mouseenter', () => clearInterval(autoplayInterval));
    carousel.addEventListener('mouseleave', resetAutoplay);

    // Touch
    let touchStartX = 0;
    carousel.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX);
    carousel.addEventListener('touchend', e => {
      const touchEndX = e.changedTouches[0].screenX;
      if (touchEndX < touchStartX - 50) showSlide(currentSlide + 1);
      if (touchEndX > touchStartX + 50) showSlide(currentSlide - 1);
      resetAutoplay();
    });

    showSlide(0);
    startAutoplay();
  });
}

// ====== Menú hamburguesa ======
function initHamburger() {
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');
  if (!hamburger) return;

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
  });

  navLinks.forEach(link => link.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
  }));
}

// ====== Motor de reservas ======
function esTemporadaAlta(fecha){
  const f=new Date(fecha);
  const mes=f.getMonth()+1;
  const dia=f.getDate();
  return (mes==7||mes==8) || (mes==12&&dia>=22) || (mes==1&&dia<=7);
}

function incluyeFinDeSemana(fechaEntrada,noches){
  for(let i=0;i<noches;i++){
    const d=new Date(fechaEntrada);
    d.setDate(d.getDate()+i);
    if(d.getDay()==5||d.getDay()==6) return true;
  }
  return false;
}

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
    let precioNoche=0;
    if(cabaña=="campanilla"){precioNoche=esTemporadaAlta(entrada)?150:115;}
    else{precioNoche=esTemporadaAlta(entrada)?120:95;}

    if(esTemporadaAlta(entrada)&&noches<4){alert("En temporada alta mínimo 4 noches");document.getElementById("spinner").style.display="none";return;}
    if(!esTemporadaAlta(entrada)&&noches<2){alert("Mínimo 2 noches");document.getElementById("spinner").style.display="none";return;}

    let total=noches*precioNoche;
    let descuento=0;

    if(!esTemporadaAlta(entrada)&&noches>=3 && !incluyeFinDeSemana(entrada,noches)){
      descuento=total*0.10;
      total*=0.90;
    }
    if(esTemporadaAlta(entrada)&&noches>=6){
      descuento=total*0.10;
      total*=0.90;
    }

    const resto=total-50;

    document.getElementById("cabañaSeleccionada").innerText=cabaña=="campanilla"?"Cabaña Campanilla":"Cabaña El Tejo";
    document.getElementById("total").innerText=total.toFixed(2);
    document.getElementById("resto").innerText=resto.toFixed(2);
    document.getElementById("descuento").innerText=descuento.toFixed(2);

    const resumen=document.getElementById("resultado");
    resumen.className="resumen-reserva " + (cabaña=="campanilla"?"campanilla":"tejo");
    document.getElementById("spinner").style.display="none";
    resumen.style.display="block";
  },600);
}

function reservar(){
  alert("Simulación de pago: reserva confirmada.");
}

// ====== Calendarios bloqueados (solo frontend) ======
async function cargarReservas(){
  try{
    const res = await fetch("reservas.json");
    const reservas = await res.json();

    generarCalendario("calendario-campanilla", reservas.campanilla);
    generarCalendario("calendario-tejo", reservas.tejo);
  }catch(err){console.error("Error cargando reservas:", err);}
}

function generarCalendario(idElemento, fechasOcupadas){
  const contenedor = document.getElementById(idElemento);
  if(!contenedor) return;

  const hoy = new Date();
  const año = hoy.getFullYear();
  const mes = hoy.getMonth();

  const primerDia = new Date(año, mes, 1);
  const ultimoDia = new Date(año, mes+1, 0);
  const offset = primerDia.getDay() || 7;

  contenedor.innerHTML = "";

  for(let i=1;i<offset;i++){ contenedor.innerHTML+="<div></div>"; }

  for(let d=1; d<=ultimoDia.getDate(); d++){
    const fecha = `${año}-${String(mes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const ocupado = fechasOcupadas.includes(fecha);

    const div = document.createElement("div");
    div.className = "dia "+(ocupado?"ocupado":"libre");
    div.innerText = d;

    contenedor.appendChild(div);
  }
}
