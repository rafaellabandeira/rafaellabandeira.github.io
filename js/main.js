/* =============================================
   STYLE.CSS COMPLETO - Versión Optimizada Móvil
   Cabañas Río Mundo
   ============================================= */

:root {
  --primary: #4caf50;
  --primary-dark: #2e7d32;
  --accent: #FFD700;
  --text: #333;
  --gray: #555;
  --danger: #d32f2f;
}

/* ====================== GENERAL ====================== */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', system-ui, sans-serif;
  line-height: 1.6;
  color: var(--text);
  background-color: #f8f5f0;
}

/* ====================== HERO ====================== */
.hero {
  background-image: url('../images/hero.jpg');
  background-size: cover;
  background-position: center;
  height: 85vh;
  min-height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 2;
}

.header-inner {
  text-align: center;
  color: white;
  position: relative;
  z-index: 3;
  padding: 0 20px;
}

.hero-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  text-shadow: 3px 3px 10px rgba(0,0,0,0.6);
}

.hero-title span {
  color: var(--accent);
}

/* ====================== TARJETAS CABAÑAS ====================== */
.cabanias-grid {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: center;
  padding: 40px 0;
}

.cabin-card {
  flex: 1 1 300px;
  max-width: 360px;
  background: white;
  border: 4px solid var(--primary);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
  transition: all 0.3s ease;
}

.cabin-card:hover {
  transform: translateY(-8px);
  border-color: var(--primary-dark);
}

.cabin-card img {
  width: 100%;
  height: 165px;
  object-fit: cover;
}

.cabin-card h3 {
  color: var(--primary-dark);
  margin: 12px 0 6px;
  font-size: 1.45rem;
  text-align: center;
}

.cabin-card p {
  padding: 0 16px 12px;
  color: var(--gray);
  font-size: 0.95rem;
  text-align: center;
}

.cabin-card .boton {
  display: block;
  width: 90%;
  margin: 8px auto 16px;
  padding: 11px 20px;
  background: var(--primary);
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-weight: bold;
  text-align: center;
}

.cabin-card .boton:hover {
  background: #3d8b40;
  transform: scale(1.03);
}

/* ====================== MOTOR DE RESERVAS ====================== */
.reserva-box {
  background: white;
  border: 4px solid var(--primary);
  border-radius: 16px;
  padding: 25px 15px;
  max-width: 560px;
  margin: 25px auto;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.reserva-box label {
  display: block;
  margin: 18px 0 8px 0;
  font-weight: 600;
  color: var(--text);
}

.reserva-box input,
.reserva-box select {
  width: 100%;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 10px;
  font-size: 16px;
  margin-bottom: 14px;
}

/* ====================== FLATPICKR - OPTIMIZADO PARA MÓVIL ====================== */
.flatpickr-calendar {
  width: 100% !important;
  max-width: 290px !important;
  margin: 10px auto 18px !important;
  border-radius: 10px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.12) !important;
  overflow: hidden;
}

.flatpickr-months {
  background: var(--primary-dark) !important;
  color: white !important;
  padding: 6px 0 !important;
}

.flatpickr-weekdays {
  padding: 4px 0 4px 0 !important;
  background: #f8f9fa;
}

.flatpickr-weekday {
  font-size: 10.8px !important;
  font-weight: 700;
  color: #2e7d32;
}

.flatpickr-days {
  display: grid !important;
  grid-template-columns: repeat(7, 1fr) !important;
  gap: 1.5px !important;
  padding: 4px !important;
}

.flatpickr-day {
  height: 28px !important;
  line-height: 28px !important;
  font-size: 11.8px !important;
  border-radius: 4px !important;
}

/* Ocultar días de otros meses */
.flatpickr-day.prevMonthDay,
.flatpickr-day.nextMonthDay {
  opacity: 0 !important;
  visibility: hidden !important;
  height: 0 !important;
}

/* Colores días */
.dia-pasado {
  background: #ffc1c1 !important;
  color: #b71c1c !important;
  text-decoration: line-through;
}

.dia-reservado {
  background: #ffcdd2 !important;
  color: #c62828 !important;
  cursor: not-allowed;
}

.dia-libre {
  background: #e8f5e9 !important;
  color: #1b5e20 !important;
}

.dia-libre:hover {
  background: #66bb6a !important;
  color: white !important;
}

/* ====================== RESULTADO Y SPINNER ====================== */
#resultado {
  display: none;
  margin-top: 20px;
  padding: 20px;
  background: #f0f8f0;
  border: 2px solid var(--primary);
  border-radius: 12px;
  text-align: center;
}

.spinner {
  display: none;
  width: 36px;
  height: 36px;
  border: 5px solid #e0e0e0;
  border-top: 5px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 20px auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ====================== RESPONSIVE ====================== */
@media (max-width: 480px) {
  .flatpickr-calendar {
    max-width: 100% !important;
  }

  .flatpickr-day {
    height: 27px !important;
    line-height: 27px !important;
    font-size: 11.5px !important;
  }

  .reserva-box {
    margin: 15px 10px;
    padding: 20px 12px;
  }
}

@media (max-width: 360px) {
  .flatpickr-day {
    height: 26px !important;
    line-height: 26px !important;
    font-size: 11.2px !important;
  }
}
