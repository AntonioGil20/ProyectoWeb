// scripts/alimentos.js
import { AlimentoService } from "./services/alimentoService.js";
import { Alimento } from "./models/alimento.js";
import { CategoriaAlimentoService } from "./services/categoriaAlimentoService.js";

console.log("Alimentos.js cargado"); // Depuración

// Variable para rastrear si estamos editando un alimento y su ID
let editingAlimentoId = null;
let originalAlimentoData = null;

let categoriasDisponibles = [];
let categoriaSeleccionadaParaEliminar = null;

// Función para cargar categorías
async function cargarCategorias() {
  try {
    categoriasDisponibles = await CategoriaAlimentoService.getCategorias();
    actualizarSelectCategorias();
  } catch (error) {
    mostrarMensajeAlimento(`Error al cargar categorías: ${error.message}`, 'error');
  }
}

// Actualizar selects de categorías
function actualizarSelectCategorias() {
  const selectTipoPlatillo = document.getElementById('tipoPlatillo');
  const selectFiltroCategoria = document.getElementById('filtroCategoria');
  
  // Limpiar opciones (excepto la primera)
  while (selectTipoPlatillo.options.length > 1) {
    selectTipoPlatillo.remove(1);
  }
  
  while (selectFiltroCategoria.options.length > 1) {
    selectFiltroCategoria.remove(1);
  }
  
  // Agregar categorías
  categoriasDisponibles.forEach(categoria => {
    const option = document.createElement('option');
    option.value = categoria.nombre;
    option.textContent = categoria.nombre;
    selectTipoPlatillo.appendChild(option.cloneNode(true));
    
    const optionFiltro = option.cloneNode(true);
    selectFiltroCategoria.appendChild(optionFiltro);
  });
}

// Función para agregar nueva categoría
function agregarNuevaCategoria() {
  mostrarModalNuevaCategoria();
}

// Función para eliminar categoría
function eliminarCategoria() {
  mostrarModalConfirmarEliminar();
}

// Función unificada para registro/guardado
async function handleRegistroAlimento() {
    if (editingAlimentoId) {
        await guardarEdicionAlimento();
    } else {
        await registerAlimento();
    }
}
// Renderizar lista de alimentos
async function renderAlimentos(retryCount = 0) {
  console.log("Iniciando renderAlimentos..."); // Depuración
  const alimentosList = document.getElementById("alimentos-list");
  if (!alimentosList) {
    console.error(
      "Elemento alimentos-list NO encontrado en el DOM. Verifica el HTML."
    );
    return;
  }
    // Asegurarse de que las categorías estén cargadas
  if (categoriasDisponibles.length === 0) {
    await cargarCategorias();
  }
  alimentosList.innerHTML = "<p>Cargando alimentos...</p>";
  console.log("Mostrando 'Cargando alimentos...' en el DOM"); // Depuración

  try {
    const alimentos = await AlimentoService.getAlimentos();
    console.log("Datos de alimentos obtenidos de Firebase:", alimentos); // Depuración
    alimentosList.innerHTML = "";

    if (alimentos.length === 0) {
      console.log("No hay alimentos registrados en Firebase."); // Depuración
      alimentosList.innerHTML = "<p>No hay alimentos registrados.</p>";
      return;
    }

alimentos.forEach((alimento) => {
    const card = document.createElement("div");
    card.className = `alimento-item ${editingAlimentoId === alimento.id ? 'editing' : ''}`;
    card.dataset.id = alimento.id;
    card.innerHTML = `
        <div class="alimento-header">
            <h4>${alimento.tipoPlatillo} ${alimento.ingrediente}</h4>
        </div>
        <div class="alimento-precios">
            <div class="alimento-precio">
                <span>Precio MXN:</span>
                <span>$${alimento.precioMx.toFixed(2)}</span>
            </div>
            <div class="alimento-precio">
                <span>Precio USD:</span>
                <span>$${alimento.precioUSD.toFixed(2)}</span>
            </div>
        </div>
        <div class="alimento-acciones">
            <button class="editar" onclick="editAlimento('${alimento.id}')">
                <i class="fas fa-edit"></i> Editar
            </button>
            <button class="eliminar" onclick="deleteAlimento('${alimento.id}')">
                <i class="fas fa-trash-alt"></i> Eliminar
            </button>
        </div>
    `;
    alimentosList.appendChild(card);
});
  } catch (error) {
    console.error("Error en renderAlimentos:", error);
    const statusLabel = document.getElementById("statusLabel");
    if (statusLabel) {
      statusLabel.textContent = `Error al cargar los alimentos: ${error.message}`;
      statusLabel.style.display = "block";
    }
    if (retryCount < 3) {
      console.warn("Reintentando conexión...", retryCount + 1);
      setTimeout(() => renderAlimentos(retryCount + 1), 1000); // Reintenta después de 1 segundo
    } else {
      alimentosList.innerHTML =
        "<p>Error al cargar los alimentos. Verifica tu conexión o Firebase.</p>";
    }
  }
}
// Asignar eventos a los botones
document.querySelector('.botones-categorias .btn-outline:first-child').addEventListener('click', agregarNuevaCategoria);
document.querySelector('.botones-categorias .btn-outline.danger').addEventListener('click', eliminarCategoria);

// Inicializar categorías al cargar
document.addEventListener('DOMContentLoaded', () => {
  cargarCategorias();
});

// Filtrar alimentos por categoría y nombre
// Función mejorada para filtrar alimentos
function filterAlimentos() {
    const filtroCategoria = document.getElementById('filtroCategoria').value.toLowerCase();
    const textoBusqueda = document.getElementById('buscarAlimento').value.toLowerCase();
    const alimentosList = document.getElementById('alimentos-list');
    const cards = alimentosList.getElementsByClassName('alimento-item');

    Array.from(cards).forEach(card => {
        const categoria = card.querySelector('.alimento-header h4').textContent.split(' ')[0].toLowerCase();
        const nombreCompleto = card.querySelector('.alimento-header h4').textContent.toLowerCase();
        
        // Verificar coincidencias
        const coincideCategoria = filtroCategoria === '' || categoria === filtroCategoria;
        const coincideTexto = nombreCompleto.includes(textoBusqueda);
        
        card.style.display = (coincideCategoria && coincideTexto) ? 'block' : 'none';
    });
}

// Asignar eventos para filtrado instantáneo
document.getElementById('buscarAlimento').addEventListener('input', filterAlimentos);
document.getElementById('filtroCategoria').addEventListener('change', filterAlimentos);

// Registrar o actualizar un alimento
async function registerAlimento() {
  const ingrediente = document.getElementById("ingrediente")?.value;
  const tipoPlatillo = document.getElementById("tipoPlatillo")?.value;
  const precioMx =
    parseFloat(document.getElementById("precioMx")?.value) || 0.0;
  const precioUSD =
    parseFloat(document.getElementById("precioUSD")?.value) || 0.0;
  const statusLabel = document.getElementById("statusLabel");

  if (!ingrediente) {
    if (statusLabel) {
      statusLabel.textContent = "El nombre del ingrediente es requerido.";
      statusLabel.style.display = "block";
    }
    return;
  }

  // Obtener todos los alimentos para verificar duplicados
  const alimentos = await AlimentoService.getAlimentos();

  // Si estamos editando, obtener el alimento actual para comparar el nombre original
  let originalIngrediente = null;
  if (editingAlimentoId) {
    const alimentoActual = alimentos.find(
      (alimento) => alimento.id === editingAlimentoId
    );
    if (alimentoActual) {
      originalIngrediente = alimentoActual.ingrediente;
    }
  }

  // Verificar si el ingrediente ya está registrado (excepto si es el mismo nombre del alimento que estamos editando)
  const isRegistered = alimentos.some(
    (alimento) =>
      alimento.ingrediente === ingrediente &&
      alimento.id !== editingAlimentoId &&
      (!editingAlimentoId || ingrediente !== originalIngrediente)
  );

  if (isRegistered) {
    if (statusLabel) {
      statusLabel.textContent = "El ingrediente ya está registrado.";
      statusLabel.style.display = "block";
    }
    return;
  }

  let success;
  if (editingAlimentoId) {
    // Modo edición: actualizar alimento existente
    const alimento = new Alimento({
      id: editingAlimentoId,
      tipoPlatillo,
      ingrediente,
      precioMx,
      precioUSD,
    });
    try {
      await AlimentoService.updateAlimento(editingAlimentoId, alimento);
      success = true;
    } catch (error) {
      success = false;
    }

    if (success) {
      if (statusLabel) {
        statusLabel.textContent = "Alimento actualizado correctamente.";
        statusLabel.style.backgroundColor = "#28a745";
        statusLabel.style.display = "block";
      }
      editingAlimentoId = null; // Limpiar modo edición
    } else {
      if (statusLabel) {
        statusLabel.textContent = "Error al actualizar el alimento.";
        statusLabel.style.display = "block";
      }
      return;
    }
  } else {
    // Modo registro: crear nuevo alimento
    const alimento = new Alimento({
      tipoPlatillo,
      ingrediente,
      precioMx,
      precioUSD,
    });
    try {
      await AlimentoService.registerAlimento(alimento);
      success = true;
    } catch (error) {
      success = false;
    }

    if (success) {
      if (statusLabel) {
        statusLabel.textContent = "Alimento registrado correctamente.";
        statusLabel.style.backgroundColor = "#28a745";
        statusLabel.style.display = "block";
      }
    } else {
      if (statusLabel) {
        statusLabel.textContent = "Error al registrar el alimento.";
        statusLabel.style.display = "block";
      }
      return;
    }
  }

  // Limpiar el formulario y actualizar la lista
  document.getElementById("ingrediente").value = "";
  document.getElementById("tipoPlatillo").value = "Carne";
  document.getElementById("precioMx").value = "";
  document.getElementById("precioUSD").value = "";
  await renderAlimentos();
}

// Función para editar alimento
async function editAlimento(id) {
    try {
        const alimento = await AlimentoService.getAlimentoById(id);
        if (!alimento) throw new Error("Alimento no encontrado");
        
        editingAlimentoId = id;
        originalAlimentoData = {
            ingrediente: alimento.ingrediente,
            tipoPlatillo: alimento.tipoPlatillo,
            precioMx: alimento.precioMx,
            precioUSD: alimento.precioUSD
        };
        
        // Actualizar UI para modo edición
        document.getElementById('ingrediente').value = alimento.ingrediente;
        document.getElementById('tipoPlatillo').value = alimento.tipoPlatillo;
        document.getElementById('precioMx').value = alimento.precioMx;
        document.getElementById('precioUSD').value = alimento.precioUSD;
        document.getElementById('btn-text-alimento').textContent = 'Guardar';
        document.getElementById('btn-cancelar-alimento').style.display = 'block';
        
        // Resaltar el alimento en la lista
        resaltarAlimentoEnEdicion(id);
        
        // Mostrar mensaje
        mostrarMensajeAlimento(`Editando: ${alimento.tipoPlatillo} ${alimento.ingrediente}`, 'info');
    } catch (error) {
        mostrarMensajeAlimento(`Error al cargar: ${error.message}`, 'error');
    }
}

// Función para guardar los cambios
async function guardarEdicionAlimento() {
    const ingrediente = document.getElementById('ingrediente').value;
    const tipoPlatillo = document.getElementById('tipoPlatillo').value;
    const precioMx = parseFloat(document.getElementById('precioMx').value) || 0;
    const precioUSD = parseFloat(document.getElementById('precioUSD').value) || 0;
    
    if (!ingrediente) {
        mostrarMensajeAlimento('El ingrediente principal es requerido', 'error');
        return;
    }

    try {
        const alimento = new Alimento({
            id: editingAlimentoId,
            ingrediente,
            tipoPlatillo,
            precioMx,
            precioUSD
        });
        
        await AlimentoService.updateAlimento(editingAlimentoId, alimento);
        mostrarMensajeAlimento('Alimento actualizado correctamente', 'success');
        resetearModoEdicionAlimento();
        await renderAlimentos();
    } catch (error) {
        mostrarMensajeAlimento(`Error al actualizar: ${error.message}`, 'error');
    }
}

// Función para cancelar edición
function cancelarEdicionAlimento() {
    resetearModoEdicionAlimento();
    mostrarMensajeAlimento('Edición cancelada', 'info');
}

// Función para resetear el modo edición
function resetearModoEdicionAlimento() {
    // Limpiar completamente el formulario
    document.getElementById('ingrediente').value = '';
    document.getElementById('tipoPlatillo').value = 'Carne';
    document.getElementById('precioMx').value = '';
    document.getElementById('precioUSD').value = '';
    
    // Restablecer variables de estado
    editingAlimentoId = null;
    originalAlimentoData = null;
    
    // Restablecer UI
    document.getElementById('btn-text-alimento').textContent = 'Registrar';
    document.getElementById('btn-cancelar-alimento').style.display = 'none';
    quitarResaltadoEdicionAlimento();
    
    // Opcional: enfocar el campo ingrediente para nuevo registro
    document.getElementById('ingrediente').focus();
}

// Función para mostrar mensajes
function mostrarMensajeAlimento(texto, tipo = 'info') {
    const statusLabel = document.getElementById('statusLabel');
    if (statusLabel) {
        statusLabel.textContent = texto;
        statusLabel.className = `status-message ${tipo}`;
        statusLabel.style.display = 'block';
    }
}

// Función para resaltar el alimento en edición
function resaltarAlimentoEnEdicion(id) {
    quitarResaltadoEdicionAlimento();
    const card = document.querySelector(`.alimento-item[data-id="${id}"]`);
    if (card) {
        card.classList.add('editing');
    }
}

// Función para quitar el resaltado
function quitarResaltadoEdicionAlimento() {
    const cards = document.querySelectorAll('.alimento-item.editing');
    cards.forEach(card => card.classList.remove('editing'));
}


// Eliminar un alimento (para las cards)
async function deleteAlimento(id) {
    if (confirm("¿Estás seguro de eliminar este alimento?")) {
        try {
            // Mostrar estado de carga
            mostrarMensajeAlimento("Eliminando alimento...", "info");
            
            // Eliminar sin esperar respuesta (Firebase es confiable)
            await AlimentoService.deleteAlimento(id);
            
            // Actualizar UI inmediatamente
            await renderAlimentos();
            
            // Mostrar mensaje de éxito
            mostrarMensajeAlimento("Alimento eliminado correctamente", "success");
            
            // Limpiar edición si corresponde
            if (editingAlimentoId === id) {
                resetearModoEdicionAlimento();
            }
            
        } catch (error) {
            console.error("Error en deleteAlimento:", error);
            mostrarMensajeAlimento("Error al eliminar el alimento. Recarga la página para verificar.", "error");
        }
    }
}
// Volver atrás
function goBack() {
  editingAlimentoId = null; // Limpiar modo edición al salir
  window.cargarVista("home");
}

// Función para mostrar el modal de nueva categoría
function mostrarModalNuevaCategoria() {
  const modal = document.getElementById('modalCategoria');
  document.getElementById('nombreCategoria').value = '';
  document.getElementById('modalCategoriaMensaje').style.display = 'none';
  document.getElementById('modalCategoriaLoading').classList.remove('active');
  modal.classList.add('active');
  document.getElementById('nombreCategoria').focus();
}

// Función para cerrar el modal de nueva categoría
function cerrarModalCategoria() {
  document.getElementById('modalCategoria').classList.remove('active');
}

// Función para confirmar la acción en el modal de nueva categoría
async function confirmarModalCategoria() {
  const nombre = document.getElementById('nombreCategoria').value.trim();
  const mensajeElement = document.getElementById('modalCategoriaMensaje');
  const loadingElement = document.getElementById('modalCategoriaLoading');
  
  if (!nombre) {
    mostrarMensajeEnModal(mensajeElement, 'El nombre de la categoría no puede estar vacío', 'error');
    return;
  }

  try {
    loadingElement.classList.add('active');
    mensajeElement.style.display = 'none';
    
    await CategoriaAlimentoService.addCategoria(nombre);
    
    mostrarMensajeEnModal(mensajeElement, `Categoría "${nombre}" creada correctamente`, 'success');
    await cargarCategorias();
    
    // Cerrar automáticamente después de 1.5 segundos
    setTimeout(() => {
      cerrarModalCategoria();
    }, 1500);
  } catch (error) {
    mostrarMensajeEnModal(mensajeElement, error.message, 'error');
  } finally {
    loadingElement.classList.remove('active');
  }
}

// Función para mostrar el modal de confirmación de eliminación
async function mostrarModalConfirmarEliminar() {
  const select = document.getElementById('tipoPlatillo');
  const categoriaSeleccionada = select.value;
  
  if (!categoriaSeleccionada) {
    mostrarMensajeAlimento("Seleccione una categoría para eliminar", 'error');
    return;
  }
  
  // Buscar la categoría completa por nombre
  const categoria = categoriasDisponibles.find(c => c.nombre === categoriaSeleccionada);
  
  if (!categoria) {
    mostrarMensajeAlimento("Categoría no encontrada", 'error');
    return;
  }
  
  if (categoria.protegida) {
    mostrarMensajeAlimento("No se pueden eliminar categorías protegidas", 'error');
    return;
  }
  
  categoriaSeleccionadaParaEliminar = categoria;
  
  const modal = document.getElementById('modalConfirmarEliminar');
  document.getElementById('mensajeConfirmacionEliminar').textContent = 
    `¿Estás seguro de eliminar la categoría "${categoria.nombre}"?`;
  document.getElementById('modalEliminarMensaje').style.display = 'none';
  document.getElementById('modalEliminarLoading').classList.remove('active');
  modal.classList.add('active');
}

// Función para cerrar el modal de confirmación de eliminación
function cerrarModalConfirmarEliminar() {
  document.getElementById('modalConfirmarEliminar').classList.remove('active');
  categoriaSeleccionadaParaEliminar = null;
}

// Función para confirmar la eliminación de categoría
async function confirmarEliminarCategoria() {
  if (!categoriaSeleccionadaParaEliminar) return;
  
  const mensajeElement = document.getElementById('modalEliminarMensaje');
  const loadingElement = document.getElementById('modalEliminarLoading');
  
  try {
    loadingElement.classList.add('active');
    mensajeElement.style.display = 'none';
    
    await CategoriaAlimentoService.deleteCategoria(categoriaSeleccionadaParaEliminar.id);
    
    mostrarMensajeEnModal(mensajeElement, `Categoría "${categoriaSeleccionadaParaEliminar.nombre}" eliminada correctamente`, 'success');
    await cargarCategorias();
    
    // Cerrar automáticamente después de 1.5 segundos
    setTimeout(() => {
      cerrarModalConfirmarEliminar();
    }, 1500);
  } catch (error) {
    mostrarMensajeEnModal(mensajeElement, error.message, 'error');
  } finally {
    loadingElement.classList.remove('active');
  }
}

// Función auxiliar para mostrar mensajes en los modales
function mostrarMensajeEnModal(elemento, mensaje, tipo) {
  elemento.textContent = mensaje;
  elemento.className = `modal-categoria-message ${tipo}`;
  elemento.style.display = 'block';
}


// Exponer funciones al ámbito global para eventos onclick
window.registerAlimento = registerAlimento;
window.filterAlimentos = filterAlimentos;
window.handleRegistroAlimento = handleRegistroAlimento;
window.cancelarEdicionAlimento = cancelarEdicionAlimento;
window.editAlimento = editAlimento;
window.deleteAlimento = deleteAlimento;
window.renderAlimentos = renderAlimentos;
window.agregarNuevaCategoria = agregarNuevaCategoria;
window.eliminarCategoria = eliminarCategoria;
window.cerrarModalCategoria = cerrarModalCategoria;
window.confirmarModalCategoria = confirmarModalCategoria;
window.cerrarModalConfirmarEliminar = cerrarModalConfirmarEliminar;
window.confirmarEliminarCategoria = confirmarEliminarCategoria;