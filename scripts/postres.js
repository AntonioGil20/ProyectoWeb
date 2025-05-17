// scripts/postres.js
import { PostreService } from "./services/postreService.js";
import { Postre } from "./models/postre.js";

console.log("Postres.js cargado"); // Depuración

// Variable para rastrear si estamos editando un postre y su ID
let editingPostreId = null;
// Variables globales para control de edición
let originalPostreData = null;

// Función unificada para registro/guardado
async function handleRegistroPostre() {
    if (editingPostreId) {
        await guardarEdicionPostre();
    } else {
        await registerPostre();
    }
}

// Renderizar lista de postres
async function renderPostres(retryCount = 0) {
  console.log("Iniciando renderPostres..."); // Depuración
  const postresList = document.getElementById("postres-list");
  if (!postresList) {
    console.error(
      "Elemento postres-list NO encontrado en el DOM. Verifica el HTML."
    );
    return;
  }

  postresList.innerHTML = "<p>Cargando postres...</p>";
  console.log("Mostrando 'Cargando postres...' en el DOM"); // Depuración

  try {
    const postres = await PostreService.getPostres();
    console.log("Datos de postres obtenidos de Firebase:", postres); // Depuración
    postresList.innerHTML = "";

    if (postres.length === 0) {
      console.log("No hay postres registrados en Firebase."); // Depuración
      postresList.innerHTML = "<p>No hay postres registrados.</p>";
      return;
    }

postres.forEach((postre) => {
    const card = document.createElement("div");
    card.className = `postre-item ${editingPostreId === postre.id ? 'editing' : ''}`;
    card.dataset.id = postre.id;
    card.innerHTML = `
        <div class="postre-header">
            <h4>${postre.nombre}</h4>
        </div>
        <div class="postre-precios">
            <div class="postre-precio">
                <span>Precio MXN:</span>
                <span>$${postre.precioMx.toFixed(2)}</span>
            </div>
            <div class="postre-precio">
                <span>Precio USD:</span>
                <span>$${postre.precioUSD.toFixed(2)}</span>
            </div>
        </div>
        <span class="postre-stock">
            <i class="fas fa-box-open"></i> ${postre.stock || 0} en stock
        </span>
        <div class="postre-acciones">
            <button class="editar" onclick="editPostre('${postre.id}')">
                <i class="fas fa-edit"></i> Editar
            </button>
            <button class="eliminar" onclick="deletePostre('${postre.id}')">
                <i class="fas fa-trash-alt"></i> Eliminar
            </button>
        </div>
    `;
    postresList.appendChild(card);
});
  } catch (error) {
    console.error("Error en renderPostres:", error);
    const statusLabel = document.getElementById("statusLabel");
    if (statusLabel) {
      statusLabel.textContent = `Error al cargar los postres: ${error.message}`;
      statusLabel.style.display = "block";
    }
    if (retryCount < 3) {
      console.warn("Reintentando conexión...", retryCount + 1);
      setTimeout(() => renderPostres(retryCount + 1), 1000); // Reintenta después de 1 segundo
    } else {
      postresList.innerHTML =
        "<p>Error al cargar los postres. Verifica tu conexión o Firebase.</p>";
    }
  }
}

// Filtrar postres por nombre
// Función mejorada para filtrar postres
function filterPostres() {
    const textoBusqueda = document.getElementById('buscarPostre').value.toLowerCase();
    const postresList = document.getElementById('postres-list');
    const cards = postresList.getElementsByClassName('postre-item');

    Array.from(cards).forEach(card => {
        const nombre = card.querySelector('.postre-header h4').textContent.toLowerCase();
        const stockText = card.querySelector('.postre-stock').textContent.toLowerCase();
        const stockValue = parseInt(stockText.replace(/\D/g, '')) || 0;
        
        // Verificar coincidencias
        const coincideTexto = nombre.includes(textoBusqueda);
        
        card.style.display = coincideTexto ? 'block' : 'none';
    });
}

// Asignar eventos para filtrado instantáneo
document.getElementById('buscarPostre').addEventListener('input', filterPostres);

// Registrar o actualizar un postre
async function registerPostre() {
  const nombre = document.getElementById("nombre")?.value;
  const precioMx =
    parseFloat(document.getElementById("precioMx")?.value) || 0.0;
  const precioUSD =
    parseFloat(document.getElementById("precioUSD")?.value) || 0.0;
  const stock = parseInt(document.getElementById("stock")?.value) || 0;
  const statusLabel = document.getElementById("statusLabel");

  if (!nombre) {
    if (statusLabel) {
      statusLabel.textContent = "El nombre del postre es requerido.";
      statusLabel.style.display = "block";
    }
    return;
  }

  // Obtener todos los postres para verificar duplicados
  const postres = await PostreService.getPostres();

  // Si estamos editando, obtener el nombre original del postre
  let originalNombre = null;
  if (editingPostreId) {
    const postreActual = postres.find(
      (postre) => postre.id === editingPostreId
    );
    if (postreActual) {
      originalNombre = postreActual.nombre;
    }
  }

  // Verificar si el postre ya está registrado (excepto si es el mismo nombre del postre que estamos editando)
  const isRegistered = postres.some(
    (postre) =>
      postre.nombre === nombre &&
      postre.id !== editingPostreId &&
      (!editingPostreId || nombre !== originalNombre)
  );

  if (isRegistered) {
    if (statusLabel) {
      statusLabel.textContent = "El postre ya está registrado.";
      statusLabel.style.display = "block";
    }
    return;
  }

  let success;
  if (editingPostreId) {
    // Modo edición: actualizar postre existente
    const postre = new Postre({
      id: editingPostreId,
      nombre,
      precioMx,
      precioUSD,
      stock,
    });
    try {
      await PostreService.updatePostre(editingPostreId, postre);
      success = true;
    } catch (error) {
      success = false;
    }

    if (success) {
      if (statusLabel) {
        statusLabel.textContent = "Postre actualizado correctamente.";
        statusLabel.style.backgroundColor = "#28a745";
        statusLabel.style.display = "block";
      }
      editingPostreId = null; // Limpiar modo edición
    } else {
      if (statusLabel) {
        statusLabel.textContent = "Error al actualizar el postre.";
        statusLabel.style.display = "block";
      }
      return;
    }
  } else {
    // Modo registro: crear nuevo postre
    const postre = new Postre({
      nombre,
      precioMx,
      precioUSD,
      stock,
    });
    try {
      await PostreService.registerPostre(postre);
      success = true;
    } catch (error) {
      success = false;
    }

    if (success) {
      if (statusLabel) {
        statusLabel.textContent = "Postre registrado correctamente.";
        statusLabel.style.backgroundColor = "#28a745";
        statusLabel.style.display = "block";
      }
    } else {
      if (statusLabel) {
        statusLabel.textContent = "Error al registrar el postre.";
        statusLabel.style.display = "block";
      }
      return;
    }
  }

  // Limpiar el formulario y actualizar la lista
  document.getElementById("nombre").value = "";
  document.getElementById("precioMx").value = "";
  document.getElementById("precioUSD").value = "";
  document.getElementById("stock").value = "";
  await renderPostres();
}


// Función para editar postre
async function editPostre(id) {
    try {
        const postre = await PostreService.getPostreById(id);
        if (!postre) throw new Error("Postre no encontrado");
        
        editingPostreId = id;
        originalPostreData = {
            nombre: postre.nombre,
            precioMx: postre.precioMx,
            precioUSD: postre.precioUSD,
            stock: postre.stock
        };
        
        // Actualizar UI para modo edición
        document.getElementById('nombre').value = postre.nombre;
        document.getElementById('precioMx').value = postre.precioMx;
        document.getElementById('precioUSD').value = postre.precioUSD;
        document.getElementById('stock').value = postre.stock;
        document.getElementById('btn-text-postre').textContent = 'Guardar';
        document.getElementById('btn-cancelar-postre').style.display = 'block';
        
        // Resaltar el postre en la lista
        resaltarPostreEnEdicion(id);
        
        // Mostrar mensaje
        mostrarMensajePostre(`Editando: ${postre.nombre}`, 'info');
    } catch (error) {
        mostrarMensajePostre(`Error al cargar: ${error.message}`, 'error');
    }
}
// Función para guardar los cambios
async function guardarEdicionPostre() {
    const nombre = document.getElementById('nombre').value;
    const precioMx = parseFloat(document.getElementById('precioMx').value) || 0;
    const precioUSD = parseFloat(document.getElementById('precioUSD').value) || 0;
    const stock = parseInt(document.getElementById('stock').value) || 0;
    
    if (!nombre) {
        mostrarMensajePostre('El nombre del postre es requerido', 'error');
        return;
    }

    try {
        const postre = new Postre({
            id: editingPostreId,
            nombre,
            precioMx,
            precioUSD,
            stock
        });
        
        await PostreService.updatePostre(editingPostreId, postre);
        mostrarMensajePostre('Postre actualizado correctamente', 'success');
        resetearModoEdicionPostre();
        await renderPostres();
    } catch (error) {
        mostrarMensajePostre(`Error al actualizar: ${error.message}`, 'error');
    }
}

// Función para cancelar edición
function cancelarEdicionPostre() {
    resetearModoEdicionPostre();
    mostrarMensajePostre('Edición cancelada', 'info');
}

// Función para resetear el modo edición
function resetearModoEdicionPostre() {
    // Limpiar completamente el formulario
    document.getElementById('nombre').value = '';
    document.getElementById('precioMx').value = '';
    document.getElementById('precioUSD').value = '';
    document.getElementById('stock').value = '';
    
    // Restablecer variables de estado
    editingPostreId = null;
    originalPostreData = null;
    
    // Restablecer UI
    document.getElementById('btn-text-postre').textContent = 'Registrar';
    document.getElementById('btn-cancelar-postre').style.display = 'none';
    quitarResaltadoEdicionPostre();
    
    // Opcional: enfocar el campo nombre para nuevo registro
    document.getElementById('nombre').focus();
}


// Función para mostrar mensajes
function mostrarMensajePostre(texto, tipo = 'info') {
    const statusLabel = document.getElementById('statusLabel');
    if (statusLabel) {
        statusLabel.textContent = texto;
        statusLabel.className = `status-message ${tipo}`;
        statusLabel.style.display = 'block';
    }
}

// Función para resaltar el postre en edición
function resaltarPostreEnEdicion(id) {
    quitarResaltadoEdicionPostre();
    const card = document.querySelector(`.postre-item[data-id="${id}"]`);
    if (card) {
        card.classList.add('editing');
    }
}

// Función para quitar el resaltado
function quitarResaltadoEdicionPostre() {
    const cards = document.querySelectorAll('.postre-item.editing');
    cards.forEach(card => card.classList.remove('editing'));
}

// Eliminar un postre (para las cards)
async function deletePostre(id) {
    if (confirm("¿Estás seguro de eliminar este postre?")) {
        try {
            // Mostrar estado de carga
            const statusLabel = document.getElementById("statusLabel");
            if (statusLabel) {
                statusLabel.textContent = "Eliminando postre...";
                statusLabel.className = "status-message";
                statusLabel.style.display = "block";
            }
            
            // Eliminar sin esperar respuesta (Firebase es confiable)
            await PostreService.deletePostre(id);
            
            // Actualizar UI inmediatamente
            await renderPostres();
            
            // Mostrar mensaje de éxito
            if (statusLabel) {
                statusLabel.textContent = "Postre eliminado correctamente.";
                statusLabel.className = "status-message success";
                statusLabel.style.display = "block";
            }
            
            // Limpiar edición si corresponde
            if (editingPostreId === id) {
                resetearModoEdicionPostre();
            }
            
        } catch (error) {
            console.error("Error en deletePostre:", error);
            // El mensaje de error solo se mostrará si realmente falla
            const statusLabel = document.getElementById("statusLabel");
            if (statusLabel) {
                statusLabel.textContent = "Error al eliminar el postre. Recarga la página para verificar.";
                statusLabel.className = "status-message error";
                statusLabel.style.display = "block";
            }
        }
    }
}

// Volver atrás
function goBack() {
  editingPostreId = null; // Limpiar modo edición al salir
  window.cargarVista("home");
}

// Exponer funciones al ámbito global para eventos onclick
window.registerPostre = registerPostre;
window.editPostre = editPostre;
window.filterPostres = filterPostres;
window.deletePostre = deletePostre;
window.renderPostres = renderPostres;
window.handleRegistroPostre = handleRegistroPostre;
window.cancelarEdicionPostre = cancelarEdicionPostre;
window.editPostre = editPostre;