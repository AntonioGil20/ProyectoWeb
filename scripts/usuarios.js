// scripts/usuarios.js
import { MeseroService } from "./services/meseroService.js";
import { Mesero } from "./models/mesero.js";

console.log("Usuarios.js cargado"); // Depuración

// Variable para rastrear si estamos editando un mesero y su ID
let editingMeseroId = null;

// Mostrar u ocultar contraseña
function togglePasswordVisibility(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  if (input && icon) {
    if (input.type === "password") {
      input.type = "text";
      icon.src = "images/ocultar.png"; // Asegúrate de tener esta imagen
    } else {
      input.type = "password";
      icon.src = "images/ver.png";
    }
  } else {
    console.error(
      `No se encontraron los elementos: inputId=${inputId}, iconId=${iconId}`
    );
  }
}

// Renderizar lista de meseros
async function renderMeseros(retryCount = 0) {
  const meserosList = document.getElementById("meseros-list");
  if (!meserosList) {
    console.error("Elemento meseros-list no encontrado en el DOM.");
    return;
  }

  meserosList.innerHTML = "<p>Cargando meseros...</p>";

  try {
    const meseros = await MeseroService.getMeseros();
    console.log("Meseros renderizados:", meseros); // Depuración
    meserosList.innerHTML = "";

    if (meseros.length === 0) {
      meserosList.innerHTML = "<p>No hay meseros registrados.</p>";
      return;
    }

    meseros.forEach((mesero) => {
      const card = document.createElement("div");
      card.className = "mesero-card";
      card.innerHTML = `
        <img src="images/user.png" alt="Usuario">
        <div class="mesero-info">
          <h3>${mesero.name}</h3>
          <input type="password" value="********" readonly>
          <button onclick="editMesero('${mesero.id}')">Editar</button>
          <button onclick="deleteMesero('${mesero.id}')">Eliminar</button>
        </div>
      `;
      meserosList.appendChild(card);
    });
  } catch (error) {
    console.error("Error en renderMeseros:", error);
    if (retryCount < 3) {
      console.warn("Reintentando conexión...", retryCount + 1);
      setTimeout(() => renderMeseros(retryCount + 1), 1000); // Reintenta después de 1 segundo
    } else {
      meserosList.innerHTML =
        "<p>Error al cargar los meseros. Verifica tu conexión.</p>";
    }
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
  const name = document.getElementById("meseroName")?.value;
  const password = document.getElementById("meseroPassword")?.value;
  const confirmPassword = document.getElementById("confirmPassword")?.value;
  const statusLabel = document.getElementById("statusLabel");

  if (!name || !password || !confirmPassword) {
    if (statusLabel) {
      statusLabel.textContent = "Todos los campos son requeridos.";
      statusLabel.style.display = "block";
    }
    return;
  }

  if (password !== confirmPassword) {
    if (statusLabel) {
      statusLabel.textContent = "Las contraseñas no coinciden.";
      statusLabel.style.display = "block";
    }
    return;
  }

  // Verificar si el nombre ya está registrado (excepto si estamos editando el mismo mesero)
  const meseros = await MeseroService.getMeseros();
  const isRegistered = meseros.some(
    (mesero) => mesero.name === name && mesero.id !== editingMeseroId
  );
  if (isRegistered) {
    if (statusLabel) {
      statusLabel.textContent = "El nombre ya está registrado.";
      statusLabel.style.display = "block";
    }
    return;
  }

  let success;
  if (editingMeseroId) {
    // Modo edición: actualizar mesero existente
    const mesero = new Mesero({ id: editingMeseroId, name, password });
    success = await MeseroService.updateMesero(mesero);
    if (success) {
      if (statusLabel) {
        statusLabel.textContent = "Mesero actualizado correctamente.";
        statusLabel.style.backgroundColor = "#28a745";
        statusLabel.style.display = "block";
      }
      // Limpiar el modo edición
      editingMeseroId = null;
    } else {
      if (statusLabel) {
        statusLabel.textContent = "Error al actualizar el mesero.";
        statusLabel.style.display = "block";
      }
      return;
    }
  } else {
    // Modo registro: crear nuevo mesero
    const mesero = new Mesero({ name, password });
    success = await MeseroService.saveMesero(mesero);
    if (success) {
      if (statusLabel) {
        statusLabel.textContent = "Mesero registrado correctamente.";
        statusLabel.style.backgroundColor = "#28a745";
        statusLabel.style.display = "block";
      }
    } else {
      if (statusLabel) {
        statusLabel.textContent = "Error al registrar el mesero.";
        statusLabel.style.display = "block";
      }
      return;
    }
  }

  // Limpiar el formulario y actualizar la lista
  document.getElementById("meseroName").value = "";
  document.getElementById("meseroPassword").value = "";
  document.getElementById("confirmPassword").value = "";
  await renderMeseros();
}

// Eliminar un mesero por nombre
async function deleteMeseroByName(name) {
  if (!name) {
    alert("Ingresa un nombre para eliminar.");
    return;
  }
  const meseros = await MeseroService.getMeseros();
  const mesero = meseros.find((m) => m.name === name);
  if (mesero) {
    const success = await MeseroService.deleteMesero(mesero.id);
    if (success) {
      await renderMeseros();
      document.getElementById("meseroName").value = ""; // Limpiar el input
      const statusLabel = document.getElementById("statusLabel");
      if (statusLabel) {
        statusLabel.textContent = "Mesero eliminado correctamente.";
        statusLabel.style.backgroundColor = "#28a745";
        statusLabel.style.display = "block";
      }
      // Limpiar modo edición si el mesero eliminado era el que se estaba editando
      if (editingMeseroId === mesero.id) {
        editingMeseroId = null;
      }
    } else {
      const statusLabel = document.getElementById("statusLabel");
      if (statusLabel) {
        statusLabel.textContent = "Error al eliminar el mesero.";
        statusLabel.style.display = "block";
      }
    }
  } else {
    const statusLabel = document.getElementById("statusLabel");
    if (statusLabel) {
      statusLabel.textContent = "Mesero no encontrado.";
      statusLabel.style.display = "block";
    }
  }
}

// Editar un mesero
async function editMesero(id) {
  const mesero = await MeseroService.getMeseroById(id);
  if (mesero) {
    editingMeseroId = id; // Establecer el ID del mesero que se está editando
    document.getElementById("meseroName").value = mesero.name;
    document.getElementById("meseroPassword").value = mesero.password;
    document.getElementById("confirmPassword").value = mesero.password;
    const statusLabel = document.getElementById("statusLabel");
    if (statusLabel) {
      statusLabel.textContent = `Editando mesero: ${mesero.name}. Usa Registrar para guardar cambios.`;
      statusLabel.style.display = "block";
    }
  }
}

// Eliminar un mesero (para las cards)
async function deleteMesero(id) {
  if (confirm("¿Estás seguro de eliminar este mesero?")) {
    const success = await MeseroService.deleteMesero(id);
    if (success) {
      await renderMeseros();
      // Limpiar modo edición si el mesero eliminado era el que se estaba editando
      if (editingMeseroId === id) {
        editingMeseroId = null;
        document.getElementById("meseroName").value = "";
        document.getElementById("meseroPassword").value = "";
        document.getElementById("confirmPassword").value = "";
        const statusLabel = document.getElementById("statusLabel");
        if (statusLabel) {
          statusLabel.textContent = "Mesero eliminado.";
          statusLabel.style.backgroundColor = "#28a745";
          statusLabel.style.display = "block";
        }
      }
    } else {
      alert("Error al eliminar el mesero.");
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
window.deleteMeseroByName = deleteMeseroByName;
window.editMesero = editMesero;
window.filterMeseros = filterMeseros;
window.deleteMesero = deleteMesero;
window.renderMeseros = renderMeseros;
