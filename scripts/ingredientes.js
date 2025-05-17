// scripts/ingredientes.js
import { IngredienteService } from "./services/ingredienteService.js";
import { Ingrediente } from "./models/ingrediente.js";

console.log("Ingredientes.js cargado"); // Depuración

// Variable para rastrear si estamos editando un ingrediente y su ID
let editingIngredienteId = null;
// Variable para rastrear el estado de edición
let originalElemento = null;
// Función unificada para registro/guardado
async function handleRegistro() {
    if (editingIngredienteId) {
        await guardarEdicion();
    } else {
        await registerIngrediente();
    }
}
// Renderizar lista de ingredientes
async function renderIngredientes(retryCount = 0) {
  console.log("Iniciando renderIngredientes..."); // Depuración
  const ingredientesList = document.getElementById("ingredientes-list");
  if (!ingredientesList) {
    console.error(
      "Elemento ingredientes-list NO encontrado en el DOM. Verifica el HTML."
    );
    return;
  }

  ingredientesList.innerHTML = "<p>Cargando ingredientes...</p>";
  console.log("Mostrando 'Cargando ingredientes...' en el DOM"); // Depuración

  try {
    const ingredientes = await IngredienteService.getIngredientes();
    console.log("Datos de ingredientes obtenidos de Firebase:", ingredientes); // Depuración
    ingredientesList.innerHTML = "";

    if (ingredientes.length === 0) {
      console.log("No hay ingredientes registrados en Firebase."); // Depuración
      ingredientesList.innerHTML = "<p>No hay ingredientes registrados.</p>";
      return;
    }

ingredientes.forEach((ingrediente) => {
    const card = document.createElement("div");
    card.className = `ingrediente-item ${editingIngredienteId === ingrediente.id ? 'editing' : ''}`;
    card.dataset.id = ingrediente.id;
    card.innerHTML = `
        <div class="ingrediente-header">
            <i class="fas fa-pepper-hot"></i>
            <h4>${ingrediente.elemento}</h4>
        </div>
        <div class="ingrediente-acciones">
            <button class="editar" onclick="editIngrediente('${ingrediente.id}')">
                <i class="fas fa-edit"></i> Editar
            </button>
            <button class="eliminar" onclick="deleteIngrediente('${ingrediente.id}')">
                <i class="fas fa-trash-alt"></i> Eliminar
            </button>
        </div>
    `;
    ingredientesList.appendChild(card);
});
  } catch (error) {
    console.error("Error en renderIngredientes:", error);
    const statusLabel = document.getElementById("statusLabel");
    if (statusLabel) {
      statusLabel.textContent = `Error al cargar los ingredientes: ${error.message}`;
      statusLabel.style.display = "block";
    }
    if (retryCount < 3) {
      console.warn("Reintentando conexión...", retryCount + 1);
      setTimeout(() => renderIngredientes(retryCount + 1), 1000); // Reintenta después de 1 segundo
    } else {
      ingredientesList.innerHTML =
        "<p>Error al cargar los ingredientes. Verifica tu conexión o Firebase.</p>";
    }
  }
}

// Filtrar ingredientes por nombre
function filterIngredientes() {
  const filtroNombre = document
    .getElementById("filtroNombre")
    .value.toLowerCase();
  const buscarIngrediente = document
    .getElementById("buscarIngrediente")
    .value.toLowerCase();
  const ingredientesList = document.getElementById("ingredientes-list");
  const cards = ingredientesList.getElementsByClassName("ingrediente-item");

  Array.from(cards).forEach((card) => {
    const nombre = card.querySelector("h3").textContent.toLowerCase();
    const matchesFiltro = filtroNombre === "" || nombre === filtroNombre;
    const matchesBusqueda = nombre.includes(buscarIngrediente);
    card.style.display = matchesFiltro && matchesBusqueda ? "block" : "none";
  });
}

// Registrar o actualizar un ingrediente
async function registerIngrediente() {
  const elemento = document.getElementById("elemento")?.value;
  const statusLabel = document.getElementById("statusLabel");

  if (!elemento) {
    if (statusLabel) {
      statusLabel.textContent = "El nombre del ingrediente es requerido.";
      statusLabel.style.display = "block";
    }
    return;
  }

  // Obtener todos los ingredientes para verificar duplicados
  const ingredientes = await IngredienteService.getIngredientes();

  // Si estamos editando, obtener el nombre original del ingrediente
  let originalElemento = null;
  if (editingIngredienteId) {
    const ingredienteActual = ingredientes.find(
      (ingrediente) => ingrediente.id === editingIngredienteId
    );
    if (ingredienteActual) {
      originalElemento = ingredienteActual.elemento;
    }
  }

  // Verificar si el ingrediente ya está registrado (excepto si es el mismo nombre del ingrediente que estamos editando)
  const isRegistered = ingredientes.some(
    (ingrediente) =>
      ingrediente.elemento === elemento &&
      ingrediente.id !== editingIngredienteId &&
      (!editingIngredienteId || elemento !== originalElemento)
  );

  if (isRegistered) {
    if (statusLabel) {
      statusLabel.textContent = "El ingrediente ya está registrado.";
      statusLabel.style.display = "block";
    }
    return;
  }

  let success;
  if (editingIngredienteId) {
    // Modo edición: actualizar ingrediente existente
    const ingrediente = new Ingrediente({
      id: editingIngredienteId,
      elemento,
    });
    try {
      await IngredienteService.updateIngrediente(
        editingIngredienteId,
        ingrediente
      );
      success = true;
    } catch (error) {
      success = false;
    }

    if (success) {
      if (statusLabel) {
        statusLabel.textContent = "Ingrediente actualizado correctamente.";
        statusLabel.style.backgroundColor = "#28a745";
        statusLabel.style.display = "block";
      }
      editingIngredienteId = null; // Limpiar modo edición
    } else {
      if (statusLabel) {
        statusLabel.textContent = "Error al actualizar el ingrediente.";
        statusLabel.style.display = "block";
      }
      return;
    }
  } else {
    // Modo registro: crear nuevo ingrediente
    const ingrediente = new Ingrediente({
      elemento,
    });
    try {
      await IngredienteService.registerIngrediente(ingrediente);
      success = true;
    } catch (error) {
      success = false;
    }

    if (success) {
      if (statusLabel) {
        statusLabel.textContent = "Ingrediente registrado correctamente.";
        statusLabel.style.backgroundColor = "#28a745";
        statusLabel.style.display = "block";
      }
    } else {
      if (statusLabel) {
        statusLabel.textContent = "Error al registrar el ingrediente.";
        statusLabel.style.display = "block";
      }
      return;
    }
  }

  // Limpiar el formulario y actualizar la lista
  document.getElementById("elemento").value = "";
  await renderIngredientes();
}

// Función para editar ingrediente
async function editIngrediente(id) {
    try {
        const ingrediente = await IngredienteService.getIngredienteById(id);
        if (!ingrediente) throw new Error("Ingrediente no encontrado");
        
        editingIngredienteId = id;
        originalElemento = ingrediente.elemento;
        
        // Actualizar UI
        document.getElementById("elemento").value = ingrediente.elemento;
        document.getElementById("btn-text").textContent = "Guardar";
        document.getElementById("btn-cancelar").style.display = "block";
        
        // Resaltar en lista
        resaltarIngredienteEnEdicion(id);
        mostrarMensaje(`Editando: ${ingrediente.elemento}`, "info");
    } catch (error) {
        mostrarMensaje(`Error al cargar: ${error.message}`, "error");
    }
}
// Función para guardar los cambios
async function guardarEdicion() {
    const elemento = document.getElementById('elemento').value;
    
    if (!elemento) {
        mostrarMensaje('El nombre del ingrediente es requerido', 'error');
        return;
    }

    try {
        const ingrediente = new Ingrediente({
            id: editingIngredienteId,
            elemento
        });
        
        await IngredienteService.updateIngrediente(editingIngredienteId, ingrediente);
        mostrarMensaje('Ingrediente actualizado correctamente', 'success');
        resetearModoEdicion();
        await renderIngredientes();
    } catch (error) {
        mostrarMensaje(`Error al actualizar: ${error.message}`, 'error');
    }
}
// Función para cancelar edición
function cancelarEdicion() {
    resetearModoEdicion();
    mostrarMensaje('Edición cancelada', 'info');
}

// Función para resetear el modo edición
function resetearModoEdicion() {
    editingIngredienteId = null;
    originalElemento = null;
    document.getElementById('elemento').value = '';
    document.getElementById('btn-text').textContent = 'Registrar';
    document.getElementById('btn-cancelar').style.display = 'none';
    quitarResaltadoEdicion();
}
// Función para mostrar mensajes
function mostrarMensaje(texto, tipo = 'info') {
    const statusLabel = document.getElementById('statusLabel');
    if (statusLabel) {
        statusLabel.textContent = texto;
        statusLabel.className = `status-message ${tipo}`;
        statusLabel.style.display = 'block';
    }
}

// Función para resaltar el ingrediente en edición
function resaltarIngredienteEnEdicion(id) {
    quitarResaltadoEdicion();
    const card = document.querySelector(`.ingrediente-item[data-id="${id}"]`);
    if (card) {
        card.classList.add('editing');
    }
}

// Función para quitar el resaltado
function quitarResaltadoEdicion() {
    const cards = document.querySelectorAll('.ingrediente-item.editing');
    cards.forEach(card => card.classList.remove('editing'));
}

// Función mejorada para eliminar ingrediente
async function deleteIngrediente(id) {
    if (confirm("¿Estás seguro de eliminar este ingrediente?")) {
        try {
            // Mostrar estado de carga
            const statusLabel = document.getElementById("statusLabel");
            if (statusLabel) {
                statusLabel.textContent = "Eliminando ingrediente...";
                statusLabel.className = "status-message";
                statusLabel.style.display = "block";
            }
            
            // Eliminar sin esperar respuesta (Firebase es confiable)
            await IngredienteService.deleteIngrediente(id);
            
            // Actualizar UI inmediatamente
            await renderIngredientes();
            
            // Mostrar mensaje de éxito
            if (statusLabel) {
                statusLabel.textContent = "Ingrediente eliminado correctamente.";
                statusLabel.className = "status-message success";
                statusLabel.style.display = "block";
            }
            
            // Limpiar edición si corresponde
            if (editingIngredienteId === id) {
                editingIngredienteId = null;
                document.getElementById("elemento").value = "";
            }
            
        } catch (error) {
            console.error("Error en deleteIngrediente:", error);
            // El mensaje de error solo se mostrará si realmente falla
            const statusLabel = document.getElementById("statusLabel");
            if (statusLabel) {
                statusLabel.textContent = "Error al eliminar el ingrediente. Recarga la página para verificar.";
                statusLabel.className = "status-message error";
                statusLabel.style.display = "block";
            }
        }
    }
}


// Volver atrás
function goBack() {
  editingIngredienteId = null; // Limpiar modo edición al salir
  window.cargarVista("home");
}

// Exponer funciones al ámbito global para eventos onclick
window.registerIngrediente = registerIngrediente;
window.editIngrediente = editIngrediente;
window.filterIngredientes = filterIngredientes;
window.deleteIngrediente = deleteIngrediente;
window.renderIngredientes = renderIngredientes;
window.handleRegistro = handleRegistro;
window.cancelarEdicion = cancelarEdicion;
window.guardarEdicion = guardarEdicion;
