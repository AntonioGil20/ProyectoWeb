import { MesaService } from "./services/mesaService.js";
import { Mesa } from "./models/mesa.js";
import { db } from "./firebase-init.js";

let editingMesaId = null;
let unsubscribeMesas = null;

// Inicializar la pantalla
export async function initEditarMesas() {
  // Configurar eventos
  document.getElementById("agregarMesaBtn").addEventListener("click", registerMesa);
  document.querySelector(".search-box").addEventListener("input", filterMesas);
  
  // Cargar mesas iniciales
  await renderMesas();
  
  // Suscribirse a cambios en tiempo real
  unsubscribeMesas = MesaService.subscribeToMesas(renderMesas);
}

// Renderizar las mesas en la cuadrícula
async function renderMesas(mesas = null) {
  const mesasGrid = document.querySelector(".mesas-grid");
  
  if (!mesas) {
    mesas = await MesaService.getMesas();
  }
  
  // Ordenar mesas por fila y columna
  mesas.sort((a, b) => {
    if (a.fila !== b.fila) return a.fila - b.fila;
    return a.columna - b.columna;
  });
  
  mesasGrid.innerHTML = "";
  
  if (mesas.length === 0) {
    mesasGrid.innerHTML = "<p>No hay mesas registradas.</p>";
    return;
  }
  
  mesas.forEach(mesa => {
    const mesaCard = document.createElement("div");
    mesaCard.className = "mesa-card";
    mesaCard.innerHTML = `
      <h3>Mesa: ${mesa.nombreMesa}</h3>
      <p>Estado: ${mesa.estado}</p>
      <p>Fila: ${mesa.fila} - Columna: ${mesa.columna}</p>
      <div class="actions">
        <button class="edit-btn" data-id="${mesa.id}">Editar</button>
        <button class="delete-btn" data-id="${mesa.id}">Eliminar</button>
      </div>
    `;
    mesasGrid.appendChild(mesaCard);
  });
  
  // Configurar eventos de los botones
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", (e) => editMesa(e.target.dataset.id));
  });
  
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", (e) => deleteMesa(e.target.dataset.id));
  });
}

// Filtrar mesas por nombre
async function filterMesas() {
  const searchText = document.querySelector(".search-box").value.toLowerCase();
  const mesas = await MesaService.getMesas();
  
  if (!searchText) {
    renderMesas(mesas);
    return;
  }
  
  const filteredMesas = mesas.filter(mesa => 
    mesa.nombreMesa.toLowerCase().includes(searchText)
  );
  
  renderMesas(filteredMesas);
}

// Registrar una nueva mesa
async function registerMesa() {
  const nombreMesa = document.getElementById("nombreMesa").value.trim();
  const fila = parseInt(document.getElementById("filaMesa").value);
  const columna = parseInt(document.getElementById("columnaMesa").value);
  const estado = document.getElementById("estadoMesa").value;
  
  // Validación
  if (!nombreMesa || isNaN(fila) || isNaN(columna)) {
    showError("Todos los campos son obligatorios");
    return;
  }
  
  const mesa = new Mesa({
    nombreMesa,
    estado,
    fila,
    columna
  });
  
  try {
    if (editingMesaId) {
      mesa.id = editingMesaId;
      await MesaService.updateMesa(editingMesaId, mesa);
      showSuccess("Mesa actualizada correctamente");
    } else {
      await MesaService.registerMesa(mesa);
      showSuccess("Mesa registrada correctamente");
    }
    
    clearForm();
    editingMesaId = null;
    document.getElementById("agregarMesaBtn").textContent = "Agregar Mesa";
  } catch (error) {
    showError("Error al guardar la mesa");
  }
}

// Editar una mesa existente
async function editMesa(id) {
  try {
    const mesa = await MesaService.getMesaById(id);
    
    document.getElementById("nombreMesa").value = mesa.nombreMesa;
    document.getElementById("filaMesa").value = mesa.fila;
    document.getElementById("columnaMesa").value = mesa.columna;
    document.getElementById("estadoMesa").value = mesa.estado;
    
    editingMesaId = id;
    document.getElementById("agregarMesaBtn").textContent = "Guardar Cambios";
  } catch (error) {
    showError("Error al cargar la mesa para editar");
  }
}

// Eliminar una mesa
async function deleteMesa(id) {
  if (confirm("¿Estás seguro de que deseas eliminar esta mesa?")) {
    try {
      await MesaService.deleteMesa(id);
      showSuccess("Mesa eliminada correctamente");
      
      // Si estábamos editando esta mesa, limpiar el formulario
      if (editingMesaId === id) {
        clearForm();
        editingMesaId = null;
        document.getElementById("agregarMesaBtn").textContent = "Agregar Mesa";
      }
    } catch (error) {
      showError("Error al eliminar la mesa");
    }
  }
}

// Limpiar el formulario
function clearForm() {
  document.getElementById("nombreMesa").value = "";
  document.getElementById("filaMesa").value = "";
  document.getElementById("columnaMesa").value = "";
  document.getElementById("estadoMesa").value = "Libre";
}

// Mostrar mensaje de error
function showError(message) {
  alert(`Error: ${message}`);
}

// Mostrar mensaje de éxito
function showSuccess(message) {
  alert(`Éxito: ${message}`);
}

// Limpiar al salir de la página
export function cleanupEditarMesas() {
  if (unsubscribeMesas) {
    unsubscribeMesas();
  }
}

// Inicializar cuando se carga la página
window.addEventListener("DOMContentLoaded", initEditarMesas);
window.addEventListener("beforeunload", cleanupEditarMesas);

// Exponer funciones al ámbito global
window.initEditarMesas = initEditarMesas;
window.cleanupEditarMesas = cleanupEditarMesas;
