// ===== FORMATEO FECHA LOCAL =====
function formatearLocal(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2,"0");
  const d = String(fecha.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}

// ===== VARIABLES GLOBALES =====
let reservasGlobal = { campanilla: [], tejo: [], bloqueados: [] };
let mesBase = new Date();
let inicioSeleccion = null;
let finSeleccion = null;
let modoAdmin = false;

// ===== CARGAR RESERVAS DESDE LOCALSTORAGE =====
function cargarReservasLocal() {
  const data = localStorage.getItem("reservasGlobal");
  if(data){
    reservasGlobal = JSON.parse(data);
    if(!reservasGlobal.bloqueados) reservasGlobal.bloqueados = [];
  } else {
    reservasGlobal = { campanilla: [], tejo: [], bloqueados: [] };
  }
}

// ===== GUARDAR RESERVAS EN LOCALSTORAGE =====
function guardarReservasLocal() {
  localStorage.setItem("reservasGlobal", JSON.stringify(reservasGlobal));
}

// ===== TEMPORADA ALTA =====
function esTemporadaAlta(fecha){
  const mes = fecha.getMonth()+1;
  const dia = fecha.getDate();
  return (mes===7 || mes===8 || (mes===12 && dia>=22) || (mes===1 && dia<=7));
}

// ===== CALCULO DE RESERVA =====
function calcularReserva() {
  const cabaña = document.getElementById("cabaña").value;
  const diasSeleccionados = document.querySelectorAll(".fila-dia.seleccionado");

  if(!diasSeleccionados.length){ alert("Selecciona un rango de fechas"); return; }

  const nombre = document.getElementById("nombre").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const email = document.getElementById("email").value.trim();
  if(!nombre || !telefono || !email){ alert("Completa todos los datos"); return; }

  let total = 0;
  const fechas = Array.from(diasSeleccionados).map(d => new Date(d.dataset.fecha));
  fechas.sort((a,b) => a-b);
  const fechaEntrada = fechas[0];
  const fechaSalida = new Date(fechas[fechas.length-1]);
  fechaSalida.setDate(fechaSalida.getDate()+1);

  const noches = (fechaSalida - fechaEntrada)/(1000*60*60*24);

  for(let i=0;i<noches;i++){
    const dia = new Date(fechaEntrada);
    dia.setDate(dia.getDate()+i);
    const dow = dia.getDay();
    let precio;

    if(esTemporadaAlta(dia)){
      precio = 150;
    } else {
      precio = (dow===5 || dow===6) 
        ? (cabaña==="campanilla"?150:140) 
        : (cabaña==="campanilla"?115:110);
    }

    total += precio;
  }

  let descuento = 0;
  if(noches>=6 && esTemporadaAlta(fechaEntrada)) descuento = total*0.10;
  else if(noches>=3 && !esTemporadaAlta(fechaEntrada)) descuento = total*0.10;
  total -= descuento;

  const opciones = { day:"numeric", month:"short" };
  document.getElementById("fechasSeleccionadas").innerHTML = 
    `📅 ${fechaEntrada.toLocaleDateString("es-ES",opciones)} - ${fechaSalida.toLocaleDateString("es-ES",opciones)}<br>🛏 ${noches} ${noches===1?"noche":"noches"}`;
  
  document.getElementById("cabañaSeleccionada").innerText = cabaña==="campanilla"?"Cabaña Campanilla":"Cabaña El Tejo";
  document.getElementById("total").innerText = total.toFixed(2);
  document.getElementById("descuento").innerText = descuento.toFixed(2);
  document.getElementById("resto").innerText = (total-50).toFixed(2);

  document.getElementById("resultado").style.display="block";
}

// ===== SELECCIÓN RANGO =====
function seleccionarFecha(fecha) {
  if(modoAdmin) return;

  if(!inicioSeleccion || (inicioSeleccion && finSeleccion)){
    inicioSeleccion = fecha;
    finSeleccion = null;
  } else if(!finSeleccion){
    if(fecha < inicioSeleccion){
      finSeleccion = inicioSeleccion;
      inicioSeleccion = fecha;
    } else {
      finSeleccion = fecha;
    }
  }

  const todosDias = document.querySelectorAll(".fila-dia");
  todosDias.forEach(d=>d.classList.remove("seleccionado"));
  todosDias.forEach(d=>{
    const f = new Date(d.dataset.fecha);
    if(inicioSeleccion && finSeleccion && f>=inicioSeleccion && f<=finSeleccion){
      d.classList.add("seleccionado");
    }
  });
}

// ===== GENERA UN MES INDIVIDUAL =====
function generarMes(baseDate){
  const primerDia = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const ultimoDia = new Date(baseDate.getFullYear(), baseDate.getMonth()+1, 0);
  const mesContainer = document.createElement("div");
  mesContainer.classList.add("mes-calendario");

  // Título del mes
  const titulo = document.createElement("div");
  titulo.classList.add("titulo-mes");
  titulo.innerText = baseDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" }).toUpperCase();
  mesContainer.appendChild(titulo);

  // Días semana
  ["L","M","X","J","V","S","D"].forEach(dia=>{
    const dElem = document.createElement("div");
    dElem.classList.add("dia-semana");
    dElem.innerText = dia;
    mesContainer.appendChild(dElem);
  });

  const hoy = new Date();
  hoy.setHours(0,0,0,0);

  let primerDiaSemana = primerDia.getDay();
  primerDiaSemana = primerDiaSemana===0?6:primerDiaSemana-1;

  for(let i=0;i<primerDiaSemana;i++){
    const empty = document.createElement("div");
    empty.classList.add("fila-dia","empty-dia");
    mesContainer.appendChild(empty);
  }

  for(let d=1; d<=ultimoDia.getDate(); d++){
    const fecha = new Date(baseDate.getFullYear(), baseDate.getMonth(), d);
    const diaElem = document.createElement("div");
    diaElem.classList.add("fila-dia");
    diaElem.dataset.fecha = formatearLocal(fecha);
    diaElem.innerText = d;

    // 🔴 Días pasados
    if (fecha < hoy) {
      diaElem.classList.add("reservado");
      diaElem.style.backgroundColor = "#ff6666";
      diaElem.style.color = "#fff";
    }

    const cabaña = document.getElementById("cabaña").value;

    // 🔴 Reservados o bloqueados
    if(reservasGlobal[cabaña]?.includes(diaElem.dataset.fecha) ||
       reservasGlobal.bloqueados.includes(diaElem.dataset.fecha)){
      diaElem.classList.add("reservado");
      diaElem.style.backgroundColor = "#ff6666";
      diaElem.style.color = "#fff";
    }

    diaElem.addEventListener("click", ()=>{
      if(modoAdmin){
        if(reservasGlobal.bloqueados.includes(diaElem.dataset.fecha)){
          reservasGlobal.bloqueados = reservasGlobal.bloqueados.filter(f => f!==diaElem.dataset.fecha);
        } else {
          reservasGlobal.bloqueados.push(diaElem.dataset.fecha);
        }
        guardarReservasLocal();
        iniciarCalendario();
      } else if(!diaElem.classList.contains("reservado")){
        seleccionarFecha(fecha);
      }
    });

    mesContainer.appendChild(diaElem);
  }

  return mesContainer;
}

// ===== CALENDARIO PRINCIPAL CON NAVEGACIÓN =====
function iniciarCalendario(){
  const container = document.getElementById("fechas");
  container.innerHTML = "";

  const nav = document.createElement("div");
  nav.style.display="flex";
  nav.style.justifyContent="space-between";
  nav.style.marginBottom="0.5rem";

  const prevBtn = document.createElement("button");
  prevBtn.innerText = "◀";
  const nextBtn = document.createElement("button");
  nextBtn.innerText = "▶";

  nav.appendChild(prevBtn);
  nav.appendChild(nextBtn);
  container.appendChild(nav);

  const mesesDiv = document.createElement("div");
  mesesDiv.id = "meses-container";
  mesesDiv.style.display="flex";
  mesesDiv.style.gap="1rem";
  container.appendChild(mesesDiv);

  function renderMeses(){
    mesesDiv.innerHTML = "";
    mesesDiv.appendChild(generarMes(mesBase));
    const siguiente = new Date(mesBase.getFullYear(), mesBase.getMonth()+1, 1);
    mesesDiv.appendChild(generarMes(siguiente));
  }

  prevBtn.addEventListener("click", ()=>{
    mesBase.setMonth(mesBase.getMonth()-1);
    renderMeses();
  });
  nextBtn.addEventListener("click", ()=>{
    mesBase.setMonth(mesBase.getMonth()+1);
    renderMeses();
  });

  renderMeses();
}

// ===== INICIAR CARRUSELES =====
function iniciarCarruseles() {
  const carousels = document.querySelectorAll(".carousel-container-general");
  carousels.forEach((c) => {
    const slides = c.querySelectorAll(".carousel-slide-general");
    const prev = c.querySelector(".prev-general");
    const next = c.querySelector(".next-general");

    let index = 0;

    function mostrarSlide(i){
      slides.forEach(s => s.classList.remove("active"));
      slides[i].classList.add("active");
    }

    prev.addEventListener("click", ()=>{
      index = (index-1+slides.length)%slides.length;
      mostrarSlide(index);
    });

    next.addEventListener("click", ()=>{
      index = (index+1)%slides.length;
      mostrarSlide(index);
    });

    mostrarSlide(index);
  });
}

// ===== BOTÓN ADMIN =====
function iniciarAdmin() {
  const btn = document.getElementById("adminButton");
  btn.addEventListener("click", ()=>{
    const pwd = prompt("Introduce la contraseña de administración");
    if(pwd==="8111"){
      modoAdmin = !modoAdmin;
      alert(`Modo administrador ${modoAdmin?"activado":"desactivado"}: ahora puedes bloquear/desbloquear días haciendo clic`);
    } else {
      alert("Contraseña incorrecta");
    }
  });
}

// ===== BOTÓN PAGO =====
document.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("btnCalcular")?.addEventListener("click", calcularReserva);
  document.getElementById("btnPagar")?.addEventListener("click", ()=>{
    alert("Aquí se abriría el pago con Square (simulación)");
  });
});

// ===== INICIALIZACIÓN =====
document.addEventListener("DOMContentLoaded",()=>{
  cargarReservasLocal();
  iniciarCalendario();
  iniciarCarruseles();
  iniciarAdmin();

  document.getElementById("cabaña")?.addEventListener("change", ()=>iniciarCalendario());
});
