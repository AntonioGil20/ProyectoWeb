// scripts/usuarios.js
import { MeseroService } from "./services/meseroService.js";
import { Mesero } from "./models/mesero.js";

console.log("Usuarios.js cargado"); // Depuración

// Variable para rastrear si estamos editando un mesero y su ID
let editingMeseroId = null;

// Inicialización cuando se carga la vista
document.addEventListener("DOMContentLoaded", () => {
  console.log("Módulo de usuarios inicializado");
  
  // Renderizar meseros
  renderMeseros();
  
  // Asignar evento al botón de registrar/guardar
  const submitBtn = document.querySelector('.primary-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', registerMesero);
  }
  
  // Asignar eventos de teclado para búsqueda
  const searchInput = document.querySelector('.search-container input');
  if (searchInput) {
    searchInput.addEventListener('input', filterMeseros);
  }
    // Configurar eventos para los iconos de contraseña
  document.querySelectorAll('.toggle-password').forEach(icon => {
    icon.addEventListener('click', function() {
      const targetId = this.getAttribute('data-target');
      togglePasswordVisibility(targetId, this);
    });
  });
});

// Función mejorada para mostrar/ocultar contraseña
function togglePasswordVisibility(inputId, iconElement = null) {
    // Si no viene el iconElement, buscarlo por data-target
    const icon = iconElement || document.querySelector(`.toggle-password[data-target="${inputId}"]`);
    const input = document.getElementById(inputId);
    
    if (!input || !icon) return;

    if (input.type === "password") {
        input.type = "text";
        icon.src = "/images/esconder.png";
        icon.setAttribute('data-visible', 'true');
    } else {
        input.type = "password";
        icon.src = "/images/ver.png";
        icon.setAttribute('data-visible', 'false');
    }
}


// Asignar eventos a los iconos de visibilidad
document.querySelectorAll('.toggle-password').forEach(icon => {
  icon.addEventListener('click', () => {
    togglePasswordVisibility(icon.dataset.target);
  });
});


// Renderizado de meseros con mejor visualización de contraseñas
async function renderMeseros() {
  const meserosList = document.getElementById("meseros-list");
  meserosList.innerHTML = "<p>Cargando meseros...</p>";

  try {
    const meseros = await MeseroService.getMeseros();
    meserosList.innerHTML = "";

    meseros.forEach(mesero => {
      const card = document.createElement("div");
      card.className = `mesero-card ${editingMeseroId === mesero.id ? 'selected' : ''}`;
      card.dataset.id = mesero.id;
card.innerHTML = `
    <img src="images/user.png" alt="Usuario" class="user-avatar">
    <div class="mesero-info">
        <h3>${mesero.name}</h3>
        <div class="password-container">
            <input type="password" value="${mesero.password}" readonly id="pw-${mesero.id}">
            <img src="/images/ver.png" class="toggle-password" onclick="togglePassword('pw-${mesero.id}', this)" data-visible="false">
        </div>
        <div class="action-buttons">
            <button class="btn-action btn-edit" onclick="editMesero('${mesero.id}')">
                <i class="fas fa-edit"></i> Editar
            </button>
            <button class="btn-action btn-delete" onclick="deleteMesero('${mesero.id}')">
                <i class="fas fa-trash-alt"></i> Eliminar
            </button>
        </div>
    </div>
`;

      meserosList.appendChild(card);
    });
  } catch (error) {
    console.error("Error al renderizar meseros:", error);
    meserosList.innerHTML = `<p class="error">Error al cargar los meseros: ${error.message}</p>`;
  }
}


// Filtrar meseros por nombre
function filterMeseros() {
  const searchInput = document.querySelector(".search-bar input");
  if (!searchInput) {
    console.error("Input de búsqueda no encontrado.");
    return;
  }
  const searchTerm = searchInput.value.toLowerCase();
  const meserosList = document.getElementById("meseros-list");
  const cards = meserosList.getElementsByClassName("mesero-card");

  Array.from(cards).forEach((card) => {
    const name = card.querySelector("h3").textContent.toLowerCase();
    card.style.display = name.includes(searchTerm) ? "flex" : "none";
  });
}

// Registrar o actualizar un mesero
async function registerMesero() {
  const name = document.getElementById("meseroName").value.trim();
  const password = document.getElementById("meseroPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // Validaciones
  if (!name || !password || !confirmPassword) {
    return showStatusMessage("Todos los campos son requeridos", "error");
  }

  if (password.length < 8) {
    return showStatusMessage("La contraseña debe tener al menos 8 caracteres", "error");
  }

  if (password !== confirmPassword) {
    return showStatusMessage("Las contraseñas no coinciden", "error");
  }

  try {
    let success;
    if (editingMeseroId) {
      // Modo edición
      const mesero = new Mesero({ id: editingMeseroId, name, password });
      success = await MeseroService.updateMesero(mesero);
    } else {
      // Modo registro
      const mesero = new Mesero({ name, password });
      success = await MeseroService.saveMesero(mesero);
    }

    if (success) {
      resetForm();
      await renderMeseros();
      showStatusMessage(
        editingMeseroId 
          ? `Mesero "${name}" actualizado correctamente` 
          : `Mesero "${name}" registrado correctamente`,
        "success"
      );
    } else {
      showStatusMessage("Error al guardar el mesero", "error");
    }
  } catch (error) {
    console.error("Error en registerMesero:", error);
    showStatusMessage(error.message || "Error al procesar la solicitud", "error");
  }
}

// Función editMesero mejorada con resaltado visual
// Función para activar el modo edición
async function editMesero(id) {
    // Quitar selección de cualquier otra tarjeta
    document.querySelectorAll('.mesero-card').forEach(card => {
        card.classList.remove('selected');
    });

    const mesero = await MeseroService.getMeseroById(id);
    if (mesero) {
        editingMeseroId = id;
        
        // Resaltar la tarjeta seleccionada
        const selectedCard = document.querySelector(`.mesero-card[data-id="${id}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }

        // Actualizar formulario
        document.getElementById("meseroName").value = mesero.name;
        document.getElementById("meseroPassword").value = mesero.password;
        document.getElementById("confirmPassword").value = mesero.password;
        
        // Cambiar a modo edición
        const submitBtn = document.getElementById("submitBtn");
        const cancelBtn = document.getElementById("cancelBtn");
        const formPanel = document.querySelector('.form-panel');
        
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar';
        }
        if (cancelBtn) {
            cancelBtn.style.display = 'block';
        }
        if (formPanel) {
            formPanel.classList.add('editing-mode');
        }

        // Mostrar mensaje de estado
        showStatusMessage(`Editando mesero: ${mesero.name}`, 'info');
    }
}

// Función para cancelar la edición
function cancelEdit() {
    resetForm();
    showStatusMessage("Edición cancelada", 'info');
}

// Función resetForm actualizada
function resetForm() {
    document.getElementById("meseroName").value = "";
    document.getElementById("meseroPassword").value = "";
    document.getElementById("confirmPassword").value = "";
    editingMeseroId = null;
    
    // Restaurar botones a estado normal
    const submitBtn = document.getElementById("submitBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const formPanel = document.querySelector('.form-panel');
    
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Registrar Mesero';
    }
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
    }
    if (formPanel) {
        formPanel.classList.remove('editing-mode');
    }
    
    // Quitar selección de tarjetas
    document.querySelectorAll('.mesero-card').forEach(card => {
        card.classList.remove('selected');
    });
}


// Función deleteMesero mejorada con confirmación personalizada
async function deleteMesero(id) {
  const mesero = await MeseroService.getMeseroById(id);
  if (!mesero) return;

  // Crear modal de confirmación personalizado
  const confirmDelete = confirm(`¿Estás seguro de eliminar al mesero "${mesero.name}"? Esta acción no se puede deshacer.`);
  
  if (confirmDelete) {
    const success = await MeseroService.deleteMesero(id);
    if (success) {
      await renderMeseros();
      
      // Si el mesero eliminado era el que se estaba editando
      if (editingMeseroId === id) {
        resetForm();
      }
      
      // Mostrar notificación de éxito
      showStatusMessage(`Mesero "${mesero.name}" eliminado correctamente`, 'success');
    } else {
      showStatusMessage('Error al eliminar el mesero', 'error');
    }
  }
}
// Mostrar mensajes de estado
function showStatusMessage(message, type = 'info') {
  const statusLabel = document.getElementById("statusLabel");
  if (statusLabel) {
    statusLabel.textContent = message;
    statusLabel.className = `status-message ${type}`;
    statusLabel.style.display = 'block';
    
    // Ocultar después de 5 segundos (excepto para errores)
    if (type !== 'error') {
      setTimeout(() => {
        statusLabel.style.display = 'none';
      }, 5000);
    }
  }
}

// Volver atrás
function goBack() {
  editingMeseroId = null; // Limpiar modo edición al salir
  window.cargarVista("home");
}

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  console.log("Inicializando usuarios.js"); // Depuración
  editingMeseroId = null; // Asegurar que empezamos sin modo edición
  renderMeseros();

  // Mostrar/ocultar contraseña
  const passwordIcons = document.querySelectorAll(".password-container img");
  if (passwordIcons.length > 0) {
    passwordIcons.forEach((img, index) => {
      img.addEventListener("click", () => {
        togglePasswordVisibility(
          index === 0 ? "meseroPassword" : "confirmPassword",
          index === 0 ? "passwordIcon1" : "passwordIcon2"
        );
      });
    });
  } else {
    console.warn("No se encontraron íconos de visibilidad de contraseña.");
  }
});

// Exponer funciones al ámbito global para eventos onclick
window.registerMesero = registerMesero;
window.editMesero = editMesero;
window.filterMeseros = filterMeseros;
window.deleteMesero = deleteMesero;
window.renderMeseros = renderMeseros;
// Exponer funciones globales
window.togglePassword = togglePasswordVisibility;
window.cancelEdit = cancelEdit;