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

// ===== CARRUSELES =====
function iniciarCarruseles() {
  const carousels = document.querySelectorAll(".carousel-container-general");
  carousels.forEach((c) => {
    let slides = c.querySelectorAll(".carousel-slide-general");
    let prev = c.querySelector(".prev-general");
    let next = c.querySelector(".next-general");
    let indicators = c.querySelectorAll(".indicator-general");
    let index = 0;

    function mostrarSlide(i){
      slides.forEach(s => s.classList.remove("active"));
      indicators.forEach(ind => ind.classList.remove("active"));
      slides[i].classList.add("active");
      if(indicators[i]) indicators[i].classList.add("active");
    }

    prev.addEventListener("click", () => {
      index = (index-1+slides.length)%slides.length;
      mostrarSlide(index);
    });

    next.addEventListener("click", () => {
      index = (index+1)%slides.length;
      mostrarSlide(index);
    });

    mostrarSlide(index);
  });
}

// ===== CARGAR RESERVAS DESDE SERVER =====
async function cargarReservas() {
  try {
    const res = await fetch("/reservas");
    if(!res.ok) throw new Error("Error cargando reservas");
    reservasGlobal = await res.json();
    if(!reservasGlobal.bloqueados) reservasGlobal.bloqueados = [];
  } catch(err){
    console.warn(err);
    reservasGlobal = { campanilla: [], tejo: [], bloqueados: [] };
  }
}

// ===== TEMPORADA ALTA =====
function esTemporadaAlta(fecha){
  const mes = fecha.getMonth()+1;
  const dia = fecha.getDate();
  return (mes===7 || mes===8 || (mes===12 && dia>=22) || (mes===1 && dia<=7));
}

// ===== CÁLCULO DE RESERVA =====
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

  // Mostrar resultados
  const opciones = { day:"numeric", month:"short" };
  document.getElementById("fechasSeleccionadas").innerHTML = 
    `📅 ${fechaEntrada.toLocaleDateString("es-ES",opciones)} - ${fechaSalida.toLocaleDateString("es-ES",opciones)}<br>🛏 ${noches} ${noches===1?"noche":"noches"}`;
  
  document.getElementById("cabañaSeleccionada").innerText = cabaña==="campanilla"?"Cabaña Campanilla":"Cabaña El Tejo";
  document.getElementById("total").innerText = total.toFixed(2);
  document.getElementById("descuento").innerText = descuento.toFixed(2);
  document.getElementById("resto").innerText = (total-50).toFixed(2);

  document.getElementById("resultado").style.display="block";
}

// ===== CALENDARIO =====
function iniciarCalendario(){
  const container = document.getElementById("fechas");
  container.innerHTML = "";

  const primerDia = new Date(mesBase.getFullYear(), mesBase.getMonth(), 1);
  const ultimoDia = new Date(mesBase.getFullYear(), mesBase.getMonth()+1, 0);
  const mesContainer = document.createElement("div");
  mesContainer.classList.add("mes-calendario");

  // Dias semana
  ["L","M","X","J","V","S","D"].forEach(dia=>{
    const dElem = document.createElement("div");
    dElem.classList.add("dia-semana");
    dElem.innerText = dia;
    mesContainer.appendChild(dElem);
  });

  // Espacios iniciales
  let primerDiaSemana = primerDia.getDay();
  primerDiaSemana = primerDiaSemana===0?6:primerDiaSemana-1;
  for(let i=0;i<primerDiaSemana;i++){
    const empty = document.createElement("div");
    empty.classList.add("fila-dia","empty-dia");
    mesContainer.appendChild(empty);
  }

  for(let d=1; d<=ultimoDia.getDate(); d++){
    const fecha = new Date(mesBase.getFullYear(), mesBase.getMonth(), d);
    const diaElem = document.createElement("div");
    diaElem.classList.add("fila-dia");
    diaElem.dataset.fecha = formatearLocal(fecha);
    diaElem.innerText = d;

    // Días reservados o bloqueados
    const cabaña = document.getElementById("cabaña").value;
    if(reservasGlobal[cabaña]?.includes(diaElem.dataset.fecha) || reservasGlobal.bloqueados.includes(diaElem.dataset.fecha)){
      diaElem.classList.add("reservado");
      diaElem.style.backgroundColor = "#ff6666";
      diaElem.style.color = "#fff";
    }

    // CLICK ADMIN O CLIENTE
    diaElem.addEventListener("click", async ()=>{
      if(modoAdmin){
        const fecha = diaElem.dataset.fecha;
        if(diaElem.classList.contains("reservado")){
          // DESBLOQUEAR
          try {
            const res = await fetch("/reservas", {
              method: "DELETE",
              headers: {"Content-Type":"application/json"},
              body: JSON.stringify({fecha})
            });
            const data = await res.json();
            if(data.ok){
              diaElem.classList.remove("reservado");
              diaElem.style.backgroundColor = "";
              diaElem.style.color = "";
              reservasGlobal.bloqueados = reservasGlobal.bloqueados.filter(f=>f!==fecha);
            }
          } catch(e){ console.warn(e); }
        } else {
          // BLOQUEAR
          try {
            const res = await fetch("/reservas", {
              method: "POST",
              headers: {"Content-Type":"application/json"},
              body: JSON.stringify({fecha})
            });
            const data = await res.json();
            if(data.ok){
              diaElem.classList.add("reservado");
              diaElem.style.backgroundColor = "#ff6666";
              diaElem.style.color = "#fff";
              reservasGlobal.bloqueados.push(fecha);
            }
          } catch(e){ console.warn(e); }
        }
        return;
      }

      // CLIENTE → selección normal
      if(diaElem.classList.contains("reservado")) return;
      if(!inicioSeleccion || (inicioSeleccion && finSeleccion)){
        inicioSeleccion = fecha;
        finSeleccion = null;
      } else if(!finSeleccion){
        if(fecha<inicioSeleccion){
          finSeleccion=inicioSeleccion;
          inicioSeleccion=fecha;
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
    });

    mesContainer.appendChild(diaElem);
  }

  container.appendChild(mesContainer);
}

// ===== BOTÓN ADMIN =====
function iniciarAdmin() {
  const btn = document.createElement("div");
  btn.id = "adminButton";
  btn.innerText = "🔒";
  document.body.appendChild(btn);

  btn.addEventListener("click", async ()=>{
    const pwd = prompt("Introduce la contraseña de administración");
    if(pwd==="8111"){
      modoAdmin = !modoAdmin;
      alert(`Modo admin ${modoAdmin?"activado":"desactivado"}`);
    } else alert("Contraseña incorrecta");
  });
}

// ===== BOTÓN PAGO SIMULADO =====
document.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("btnCalcular")?.addEventListener("click", calcularReserva);
  document.getElementById("btnPagar")?.addEventListener("click", ()=>{
    alert("Aquí se abriría el pago con Square (simulación)");
  });
});

// ===== INICIALIZACIÓN =====
document.addEventListener("DOMContentLoaded",async ()=>{
  await cargarReservas();
  iniciarCalendario();
  iniciarCarruseles();
  iniciarAdmin();

  document.getElementById("cabaña")?.addEventListener("change", ()=>iniciarCalendario());
});
