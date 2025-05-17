// scripts/bebidas.js
import { BebidaService } from "./services/bebidaService.js";
import { Bebida } from "./models/bebida.js";

console.log("Bebidas.js cargado"); // Depuración

// Variable para rastrear si estamos editando una bebida y su ID
let editingBebidaId = null;
let originalBebidaData = null;

// Función unificada para registro/guardado
async function handleRegistroBebida() {
    if (editingBebidaId) {
        await guardarEdicionBebida();
    } else {
        await registerBebida();
    }
}
// Renderizar lista de bebidas
async function renderBebidas(retryCount = 0) {
  console.log("Iniciando renderBebidas..."); // Depuración
  const bebidasList = document.getElementById("bebidas-list");
  if (!bebidasList) {
    console.error(
      "Elemento bebidas-list NO encontrado en el DOM. Verifica el HTML."
    );
    return;
  }

  bebidasList.innerHTML = "<p>Cargando bebidas...</p>";
  console.log("Mostrando 'Cargando bebidas...' en el DOM"); // Depuración

  try {
    const bebidas = await BebidaService.getBebidas();
    console.log("Datos de bebidas obtenidos de Firebase:", bebidas); // Depuración
    bebidasList.innerHTML = "";

    if (bebidas.length === 0) {
      console.log("No hay bebidas registradas en Firebase."); // Depuración
      bebidasList.innerHTML = "<p>No hay bebidas registradas.</p>";
      return;
    }

bebidas.forEach((bebida) => {
    const card = document.createElement("div");
    card.className = `bebida-item ${editingBebidaId === bebida.id ? 'editing' : ''}`;
    card.dataset.id = bebida.id;
    card.innerHTML = `
        <div class="bebida-header">
            <h4>${bebida.nombre}</h4>
            <span class="bebida-tipo">${bebida.tipoBebidas}</span>
        </div>
        <div class="bebida-precios">
            <div class="bebida-precio">
                <span>Precio MXN:</span>
                <span>$${bebida.precioMx.toFixed(2)}</span>
            </div>
            <div class="bebida-precio">
                <span>Precio USD:</span>
                <span>$${bebida.precioUSD.toFixed(2)}</span>
            </div>
        </div>
        <div class="bebida-acciones">
            <button class="editar" onclick="editBebida('${bebida.id}')">
                <i class="fas fa-edit"></i> Editar
            </button>
            <button class="eliminar" onclick="deleteBebida('${bebida.id}')">
                <i class="fas fa-trash-alt"></i> Eliminar
            </button>
        </div>
    `;
    bebidasList.appendChild(card);
});
  } catch (error) {
    console.error("Error en renderBebidas:", error);
    const statusLabel = document.getElementById("statusLabel");
    if (statusLabel) {
      statusLabel.textContent = `Error al cargar las bebidas: ${error.message}`;
      statusLabel.style.display = "block";
    }
    if (retryCount < 3) {
      console.warn("Reintentando conexión...", retryCount + 1);
      setTimeout(() => renderBebidas(retryCount + 1), 1000); // Reintenta después de 1 segundo
    } else {
      bebidasList.innerHTML =
        "<p>Error al cargar las bebidas. Verifica tu conexión o Firebase.</p>";
    }
  }
}

// Filtrar bebidas por tipo y nombre
// Función mejorada para filtrar bebidas
function filterBebidas() {
    const filtroTipo = document.getElementById('filtroTipo').value.toLowerCase();
    const textoBusqueda = document.getElementById('buscarBebida').value.toLowerCase();
    const bebidasList = document.getElementById('bebidas-list');
    const cards = bebidasList.getElementsByClassName('bebida-item');

    Array.from(cards).forEach(card => {
        const tipo = card.querySelector('.bebida-tipo').textContent.toLowerCase();
        const nombre = card.querySelector('.bebida-header h4').textContent.toLowerCase();
        
        // Verificar coincidencias
        const coincideTipo = filtroTipo === '' || tipo === filtroTipo;
        const coincideTexto = nombre.includes(textoBusqueda);
        
        card.style.display = (coincideTipo && coincideTexto) ? 'block' : 'none';
    });
}

// Asignar eventos para filtrado instantáneo
document.getElementById('buscarBebida').addEventListener('input', filterBebidas);
document.getElementById('filtroTipo').addEventListener('change', filterBebidas);


// Registrar o actualizar una bebida
async function registerBebida() {
  const nombre = document.getElementById("nombre")?.value;
  const tipoBebidas = document.getElementById("tipoBebidas")?.value;
  const precioMx =
    parseFloat(document.getElementById("precioMx")?.value) || 0.0;
  const precioUSD =
    parseFloat(document.getElementById("precioUSD")?.value) || 0.0;
  const statusLabel = document.getElementById("statusLabel");

  if (!nombre) {
    if (statusLabel) {
      statusLabel.textContent = "El nombre de la bebida es requerido.";
      statusLabel.style.display = "block";
    }
    return;
  }

  // Obtener todas las bebidas para verificar duplicados
  const bebidas = await BebidaService.getBebidas();

  // Si estamos editando, obtener el nombre original de la bebida
  let originalNombre = null;
  if (editingBebidaId) {
    const bebidaActual = bebidas.find(
      (bebida) => bebida.id === editingBebidaId
    );
    if (bebidaActual) {
      originalNombre = bebidaActual.nombre;
    }
  }

  // Verificar si la bebida ya está registrada (excepto si es el mismo nombre de la bebida que estamos editando)
  const isRegistered = bebidas.some(
    (bebida) =>
      bebida.nombre === nombre &&
      bebida.id !== editingBebidaId &&
      (!editingBebidaId || nombre !== originalNombre)
  );

  if (isRegistered) {
    if (statusLabel) {
      statusLabel.textContent = "La bebida ya está registrada.";
      statusLabel.style.display = "block";
    }
    return;
  }

  let success;
  if (editingBebidaId) {
    // Modo edición: actualizar bebida existente
    const bebida = new Bebida({
      id: editingBebidaId,
      nombre,
      nombreTicket: nombre, // Usamos el mismo nombre por ahora
      tipoBebidas,
      precioMx,
      precioUSD,
    });
    try {
      await BebidaService.updateBebida(editingBebidaId, bebida);
      success = true;
    } catch (error) {
      success = false;
    }

    if (success) {
      if (statusLabel) {
        statusLabel.textContent = "Bebida actualizada correctamente.";
        statusLabel.style.backgroundColor = "#28a745";
        statusLabel.style.display = "block";
      }
      editingBebidaId = null; // Limpiar modo edición
    } else {
      if (statusLabel) {
        statusLabel.textContent = "Error al actualizar la bebida.";
        statusLabel.style.display = "block";
      }
      return;
    }
  } else {
    // Modo registro: crear nueva bebida
    const bebida = new Bebida({
      nombre,
      nombreTicket: nombre, // Usamos el mismo nombre por ahora
      tipoBebidas,
      precioMx,
      precioUSD,
    });
    try {
      await BebidaService.registerBebida(bebida);
      success = true;
    } catch (error) {
      success = false;
    }

    if (success) {
      if (statusLabel) {
        statusLabel.textContent = "Bebida registrada correctamente.";
        statusLabel.style.backgroundColor = "#28a745";
        statusLabel.style.display = "block";
      }
    } else {
      if (statusLabel) {
        statusLabel.textContent = "Error al registrar la bebida.";
        statusLabel.style.display = "block";
      }
      return;
    }
  }

  // Limpiar el formulario y actualizar la lista
  document.getElementById("nombre").value = "";
  document.getElementById("tipoBebidas").value = "";
  document.getElementById("precioMx").value = "";
  document.getElementById("precioUSD").value = "";
  await renderBebidas();
}

// Función para editar bebida
async function editBebida(id) {
    try {
        const bebida = await BebidaService.getBebidaById(id);
        if (!bebida) throw new Error("Bebida no encontrada");
        
        editingBebidaId = id;
        originalBebidaData = {
            nombre: bebida.nombre,
            tipoBebidas: bebida.tipoBebidas,
            precioMx: bebida.precioMx,
            precioUSD: bebida.precioUSD
        };
        
        // Actualizar UI para modo edición
        document.getElementById('nombre').value = bebida.nombre;
        document.getElementById('tipoBebidas').value = bebida.tipoBebidas;
        document.getElementById('precioMx').value = bebida.precioMx;
        document.getElementById('precioUSD').value = bebida.precioUSD;
        document.getElementById('btn-text-bebida').textContent = 'Guardar';
        document.getElementById('btn-cancelar-bebida').style.display = 'block';
        
        // Resaltar la bebida en la lista
        resaltarBebidaEnEdicion(id);
        
        // Mostrar mensaje
        mostrarMensajeBebida(`Editando: ${bebida.nombre}`, 'info');
    } catch (error) {
        mostrarMensajeBebida(`Error al cargar: ${error.message}`, 'error');
    }
}

// Función para guardar los cambios
async function guardarEdicionBebida() {
    const nombre = document.getElementById('nombre').value;
    const tipoBebidas = document.getElementById('tipoBebidas').value;
    const precioMx = parseFloat(document.getElementById('precioMx').value) || 0;
    const precioUSD = parseFloat(document.getElementById('precioUSD').value) || 0;
    
    if (!nombre) {
        mostrarMensajeBebida('El nombre de la bebida es requerido', 'error');
        return;
    }

    try {
        const bebida = new Bebida({
            id: editingBebidaId,
            nombre,
            tipoBebidas,
            precioMx,
            precioUSD
        });
        
        await BebidaService.updateBebida(editingBebidaId, bebida);
        mostrarMensajeBebida('Bebida actualizada correctamente', 'success');
        resetearModoEdicionBebida();
        await renderBebidas();
    } catch (error) {
        mostrarMensajeBebida(`Error al actualizar: ${error.message}`, 'error');
    }
}

// Función para cancelar edición
function cancelarEdicionBebida() {
    resetearModoEdicionBebida();
    mostrarMensajeBebida('Edición cancelada', 'info');
}

// Función para resetear el modo edición
function resetearModoEdicionBebida() {
    // Limpiar completamente el formulario
    document.getElementById('nombre').value = '';
    document.getElementById('tipoBebidas').value = '';
    document.getElementById('precioMx').value = '';
    document.getElementById('precioUSD').value = '';
    
    // Restablecer variables de estado
    editingBebidaId = null;
    originalBebidaData = null;
    
    // Restablecer UI
    document.getElementById('btn-text-bebida').textContent = 'Registrar';
    document.getElementById('btn-cancelar-bebida').style.display = 'none';
    quitarResaltadoEdicionBebida();
    
    // Opcional: enfocar el campo nombre para nuevo registro
    document.getElementById('nombre').focus();
}

// Función para mostrar mensajes
function mostrarMensajeBebida(texto, tipo = 'info') {
    const statusLabel = document.getElementById('statusLabel');
    if (statusLabel) {
        statusLabel.textContent = texto;
        statusLabel.className = `status-message ${tipo}`;
        statusLabel.style.display = 'block';
    }
}

// Función para resaltar la bebida en edición
function resaltarBebidaEnEdicion(id) {
    quitarResaltadoEdicionBebida();
    const card = document.querySelector(`.bebida-item[data-id="${id}"]`);
    if (card) {
        card.classList.add('editing');
    }
}

// Función para quitar el resaltado
function quitarResaltadoEdicionBebida() {
    const cards = document.querySelectorAll('.bebida-item.editing');
    cards.forEach(card => card.classList.remove('editing'));
}

// Eliminar una bebida (para las cards)
async function deleteBebida(id) {
    if (confirm("¿Estás seguro de eliminar esta bebida?")) {
        try {
            // Mostrar estado de carga
            mostrarMensajeBebida("Eliminando bebida...", "info");
            
            // Eliminar sin esperar respuesta (Firebase es confiable)
            await BebidaService.deleteBebida(id);
            
            // Actualizar UI inmediatamente
            await renderBebidas();
            
            // Mostrar mensaje de éxito
            mostrarMensajeBebida("Bebida eliminada correctamente", "success");
            
            // Limpiar edición si corresponde
            if (editingBebidaId === id) {
                resetearModoEdicionBebida();
            }
            
        } catch (error) {
            console.error("Error en deleteBebida:", error);
            mostrarMensajeBebida("Error al eliminar la bebida. Recarga la página para verificar.", "error");
        }
    }
}

// Volver atrás
function goBack() {
  editingBebidaId = null; // Limpiar modo edición al salir
  window.cargarVista("home");
}

// Exponer funciones al ámbito global para eventos onclick
window.registerBebida = registerBebida;
window.editBebida = editBebida;
window.filterBebidas = filterBebidas;
window.deleteBebida = deleteBebida;
window.renderBebidas = renderBebidas;
window.handleRegistroBebida = handleRegistroBebida;
window.cancelarEdicionBebida = cancelarEdicionBebida;
window.editBebida = editBebida;
window.deleteBebida = deleteBebida;