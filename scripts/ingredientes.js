// scripts/ingredientes.js
import { IngredienteService } from "./services/ingredienteService.js";
import { Ingrediente } from "./models/ingrediente.js";

console.log("Ingredientes.js cargado"); // Depuración

// Variable para rastrear si estamos editando un ingrediente y su ID
let editingIngredienteId = null;

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
      console.log("Renderizando ingrediente:", ingrediente); // Depuración
      const card = document.createElement("div");
      card.className = "ingrediente-item";
      card.innerHTML = `
                <div class="ingrediente-info">
                    <h3>${ingrediente.elemento}</h3>
                    <div class="acciones">
                        <button class="editar" onclick="editIngrediente('${ingrediente.id}')">Editar</button>
                        <button class="eliminar" onclick="deleteIngrediente('${ingrediente.id}')">Eliminar</button>
                    </div>
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

// Eliminar un ingrediente por nombre
async function deleteIngredienteByName(name) {
  if (!name) {
    alert("Ingresa un nombre para eliminar.");
    return;
  }
  const ingredientes = await IngredienteService.getIngredientes();
  const ingrediente = ingredientes.find((i) => i.elemento === name);
  if (ingrediente) {
    const success = await IngredienteService.deleteIngrediente(ingrediente.id);
    if (success) {
      await renderIngredientes();
      document.getElementById("elemento").value = ""; // Limpiar el input
      const statusLabel = document.getElementById("statusLabel");
      if (statusLabel) {
        statusLabel.textContent = "Ingrediente eliminado correctamente.";
        statusLabel.style.backgroundColor = "#28a745";
        statusLabel.style.display = "block";
      }
      // Limpiar modo edición si el ingrediente eliminado era el que se estaba editando
      if (editingIngredienteId === ingrediente.id) {
        editingIngredienteId = null;
      }
    } else {
      const statusLabel = document.getElementById("statusLabel");
      if (statusLabel) {
        statusLabel.textContent = "Error al eliminar el ingrediente.";
        statusLabel.style.display = "block";
      }
    }
  } else {
    const statusLabel = document.getElementById("statusLabel");
    if (statusLabel) {
      statusLabel.textContent = "Ingrediente no encontrado.";
      statusLabel.style.display = "block";
    }
  }
}

// Editar un ingrediente
async function editIngrediente(id) {
  const ingrediente = await IngredienteService.getIngredienteById(id);
  if (ingrediente) {
    editingIngredienteId = id; // Establecer el ID del ingrediente que se está editando
    document.getElementById("elemento").value = ingrediente.elemento;
    const statusLabel = document.getElementById("statusLabel");
    if (statusLabel) {
      statusLabel.textContent = `Editando ingrediente: ${ingrediente.elemento}. Usa Registrar para guardar cambios.`;
      statusLabel.style.display = "block";
    }
  }
}

// Eliminar un ingrediente (para las cards)
async function deleteIngrediente(id) {
  if (confirm("¿Estás seguro de eliminar este ingrediente?")) {
    const success = await IngredienteService.deleteIngrediente(id);
    if (success) {
      await renderIngredientes();
      // Limpiar modo edición si el ingrediente eliminado era el que se estaba editando
      if (editingIngredienteId === id) {
        editingIngredienteId = null;
        document.getElementById("elemento").value = "";
        const statusLabel = document.getElementById("statusLabel");
        if (statusLabel) {
          statusLabel.textContent = "Ingrediente eliminado.";
          statusLabel.style.backgroundColor = "#28a745";
          statusLabel.style.display = "block";
        }
      }
    } else {
      alert("Error al eliminar el ingrediente.");
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
window.deleteIngredienteByName = deleteIngredienteByName;
window.editIngrediente = editIngrediente;
window.filterIngredientes = filterIngredientes;
window.deleteIngrediente = deleteIngrediente;
window.renderIngredientes = renderIngredientes;
