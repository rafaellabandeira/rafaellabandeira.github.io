// ===== FORMATEO FECHA LOCAL =====
function formatearLocal(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2,"0");
  const d = String(fecha.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}

// ===== CARGAR RESERVAS DESDE BACKEND =====
const BACKEND_URL = "/backend/reservas.json"; // Simulación de backend

async function cargarReservas() {
  try {
    const res = await fetch(BACKEND_URL);
    if(!res.ok) throw new Error("Error cargando reservas backend");
    return await res.json();
  } catch(err) {
    console.error(err);
    return { campanilla: [], tejo: [] };
  }
}

// ===== VARIABLES GLOBALES =====
let reservasGlobal = {};
let mesBase = new Date();
let inicioSeleccion = null;
let finSeleccion = null;

// ===== CALCULO RESERVA =====
function calcularReserva() {
  const cabaña = document.getElementById("cabaña").value;
  const diasSeleccionados = document.querySelectorAll(".fila-dia.seleccionado");

  if(!diasSeleccionados.length) {
    alert("Selecciona un rango de fechas");
    return;
  }

  const nombre = document.getElementById("nombre").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const email = document.getElementById("email").value.trim();
  
  if(!nombre || !telefono || !email) {
    alert("Completa todos los datos correctamente");
    return;
  }

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
}

// ===== TEMPORADA ALTA =====
function esTemporadaAlta(fecha){
  const mes = fecha.getMonth()+1;
  const dia = fecha.getDate();
  return (mes===7 || mes===8 || (mes===12 && dia>=22) || (mes===1 && dia<=7));
}

// ===== CALENDARIO =====
async function iniciarCalendario(){
  reservasGlobal = await cargarReservas();
  const container = document.getElementById("fechas");
  container.innerHTML = "";

  function crearMes(ano, mes){
    const primerDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes+1,0);

    const mesContainer = document.createElement("div");
    mesContainer.classList.add("mes-calendario");

    const tituloMes = document.createElement("div");
    tituloMes.classList.add("titulo-mes");
    tituloMes.innerText = primerDia.toLocaleString("es-ES",{month:"long",year:"numeric"});
    mesContainer.appendChild(tituloMes);

    const diasSemana = ["L","M","X","J","V","S","D"];
    diasSemana.forEach(dia=>{
      const dElem = document.createElement("div");
      dElem.classList.add("dia-semana");
      dElem.innerText = dia;
      mesContainer.appendChild(dElem);
    });

    let primerDiaSemana = primerDia.getDay();
    primerDiaSemana = primerDiaSemana===0?6:primerDiaSemana-1;
    for(let i=0;i<primerDiaSemana;i++){
      const empty = document.createElement("div");
      empty.classList.add("fila-dia","empty-dia");
      mesContainer.appendChild(empty);
    }

    for(let d=1;d<=ultimoDia.getDate();d++){
      const fecha = new Date(ano,mes,d);
      const diaElem = document.createElement("div");
      diaElem.classList.add("fila-dia");
      diaElem.innerText = d;
      diaElem.dataset.fecha = formatearLocal(fecha);

      const cabaña = document.getElementById("cabaña")?.value.toLowerCase();
      if(cabaña && reservasGlobal[cabaña]?.includes(formatearLocal(fecha))) {
        diaElem.classList.add("reservado");
      }

      diaElem.addEventListener("click",()=>{
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

  crearMes(mesBase.getFullYear(), mesBase.getMonth());
  const siguiente = new Date(mesBase);
  siguiente.setMonth(siguiente.getMonth()+1);
  crearMes(siguiente.getFullYear(), siguiente.getMonth());
}

// ===== INICIALIZACIÓN =====
document.addEventListener("DOMContentLoaded",()=>{
  iniciarCalendario();
  document.getElementById("cabaña")?.addEventListener("change",()=>iniciarCalendario());
  document.getElementById("calcular")?.addEventListener("click", calcularReserva);
});
