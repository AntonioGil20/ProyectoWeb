// scripts/editarMesas.js
import { MesaService } from "./services/mesaService.js";
import { Mesa } from "./models/mesa.js";

console.log("EditarMesas.js cargado desde script.js"); // Depuración

// Variable para rastrear si estamos editando una mesa y su ID
let editingMesaId = null;

// Renderizar lista de mesas
async function renderMesas(retryCount = 0) {
  console.log("Iniciando renderMesas..."); // Depuración
  const mesasList = document.getElementById("mesas-list");
  if (!mesasList) {
    console.error(
      "Elemento mesas-list NO encontrado en el DOM. Verifica el HTML."
    );
    return;
  }

  mesasList.innerHTML = "<p>Cargando mesas...</p>";
  console.log("Mostrando 'Cargando mesas...' en el DOM"); // Depuración

  try {
    const mesas = await MesaService.getMesas();
    console.log("Datos de mesas obtenidos de Firebase:", mesas); // Depuración
    mesasList.innerHTML = "";

    if (mesas.length === 0) {
      console.log("No hay mesas registradas en Firebase."); // Depuración
      mesasList.innerHTML = "<p>No hay mesas registradas.</p>";
      return;
    }

mesas.forEach((mesa) => {
  console.log("Renderizando mesa:", mesa); // Depuración
  const card = document.createElement("div");
  card.className = "mesa-card";
  card.innerHTML = `
    <div class="mesa-info">
      <h3>${mesa.nombreMesa}</h3>
      <p>Estado: ${mesa.estado}</p>
      <p>Posición: Fila ${mesa.fila}, Columna ${mesa.columna}</p>
      <div class="mesa-actions">
        <button class="btn-edit" onclick="editMesa('${mesa.id}')">
          <i class="fas fa-edit"></i> Editar
        </button>
        <button class="btn-delete" onclick="deleteMesa('${mesa.id}')">
          <i class="fas fa-trash-alt"></i> Eliminar
        </button>
      </div>
    </div>
  `;
  mesasList.appendChild(card);
});
  } catch (error) {
    console.error("Error en renderMesas:", error);
    const statusLabel = document.getElementById("statusLabel");
    if (statusLabel) {
      statusLabel.textContent = `Error al cargar las mesas: ${error.message}`;
      statusLabel.style.display = "block";
    }
    if (retryCount < 3) {
      console.warn("Reintentando conexión...", retryCount + 1);
      setTimeout(() => renderMesas(retryCount + 1), 1000); // Reintenta después de 1 segundo
    } else {
      mesasList.innerHTML =
        "<p>Error al cargar las mesas. Verifica tu conexión o Firebase.</p>";
    }
  }
}

// Filtrar mesas por nombre
function filterMesas() {
  const searchInput = document.querySelector(".search-bar input");
  if (!searchInput) {
    console.error("Input de búsqueda no encontrado.");
    return;
  }
  const searchTerm = searchInput.value.toLowerCase();
  const mesasList = document.getElementById("mesas-list");
  const cards = mesasList.getElementsByClassName("mesa-card");

  Array.from(cards).forEach((card) => {
    const name = card.querySelector("h3").textContent.toLowerCase();
    card.style.display = name.includes(searchTerm) ? "flex" : "none";
  });
}

// Registrar o actualizar una mesa
async function registerMesa() {
  const nombreMesa = document.getElementById("nombreMesa")?.value;
  const filaMesa = parseInt(document.getElementById("filaMesa")?.value) || 0;
  const columnaMesa =
    parseInt(document.getElementById("columnaMesa")?.value) || 0;
  const estadoMesa = document.getElementById("estadoMesa")?.value;
  const statusLabel = document.getElementById("statusLabel");

  if (!nombreMesa) {
    if (statusLabel) {
      statusLabel.textContent = "El nombre de la mesa es requerido.";
      statusLabel.style.display = "block";
    }
    return;
  }

  const mesas = await MesaService.getMesas();
  const isRegistered = mesas.some(
    (mesa) => mesa.nombreMesa === nombreMesa && mesa.id !== editingMesaId
  );
  if (isRegistered) {
    if (statusLabel) {
      statusLabel.textContent = "El nombre de la mesa ya está registrado.";
      statusLabel.style.display = "block";
    }
    return;
  }

  let success;
  if (editingMesaId) {
    const mesa = new Mesa({
      id: editingMesaId,
      nombreMesa,
      estado: estadoMesa,
      fila: filaMesa,
      columna: columnaMesa,
    });
    try {
      await MesaService.updateMesa(editingMesaId, mesa);
      success = true;
    } catch (error) {
      success = false;
    }

    if (success) {
      if (statusLabel) {
        statusLabel.textContent = "Mesa actualizada correctamente.";
        statusLabel.style.backgroundColor = "#28a745";
        statusLabel.style.display = "block";
      }
      editingMesaId = null;
    } else {
      if (statusLabel) {
        statusLabel.textContent = "Error al actualizar la mesa.";
        statusLabel.style.display = "block";
      }
      return;
    }
  } else {
    const mesa = new Mesa({
      nombreMesa,
      estado: estadoMesa,
      fila: filaMesa,
      columna: columnaMesa,
    });
    try {
      await MesaService.registerMesa(mesa);
      success = true;
    } catch (error) {
      success = false;
    }

    if (success) {
      if (statusLabel) {
        statusLabel.textContent = "Mesa registrada correctamente.";
        statusLabel.style.backgroundColor = "#28a745";
        statusLabel.style.display = "block";
      }
    } else {
      if (statusLabel) {
        statusLabel.textContent = "Error al registrar la mesa.";
        statusLabel.style.display = "block";
      }
      return;
    }
  }

  document.getElementById("nombreMesa").value = "";
  document.getElementById("filaMesa").value = "";
  document.getElementById("columnaMesa").value = "";
  document.getElementById("estadoMesa").value = "Libre";
  await renderMesas();
}

// Eliminar una mesa por nombre
async function deleteMesaByName(name) {
  if (!name) {
    alert("Ingresa un nombre para eliminar.");
    return;
  }
  const mesas = await MesaService.getMesas();
  const mesa = mesas.find((m) => m.nombreMesa === name);
  if (mesa) {
    const success = await MesaService.deleteMesa(mesa.id);
    if (success) {
      await renderMesas();
      document.getElementById("nombreMesa").value = "";
      const statusLabel = document.getElementById("statusLabel");
      if (statusLabel) {
        statusLabel.textContent = "Mesa eliminada correctamente.";
        statusLabel.style.backgroundColor = "#28a745";
        statusLabel.style.display = "block";
      }
      if (editingMesaId === mesa.id) {
        editingMesaId = null;
      }
    } else {
      const statusLabel = document.getElementById("statusLabel");
      if (statusLabel) {
        statusLabel.textContent = "Error al eliminar la mesa.";
        statusLabel.style.display = "block";
      }
    }
  } else {
    const statusLabel = document.getElementById("statusLabel");
    if (statusLabel) {
      statusLabel.textContent = "Mesa no encontrada.";
      statusLabel.style.display = "block";
    }
  }
}

// Editar una mesa
async function editMesa(id) {
  const mesa = await MesaService.getMesaById(id);
  if (mesa) {
    editingMesaId = id;
    document.getElementById("nombreMesa").value = mesa.nombreMesa;
    document.getElementById("filaMesa").value = mesa.fila;
    document.getElementById("columnaMesa").value = mesa.columna;
    document.getElementById("estadoMesa").value = mesa.estado;
    const statusLabel = document.getElementById("statusLabel");
    if (statusLabel) {
      statusLabel.textContent = `Editando mesa: ${mesa.nombreMesa}. Usa Agregar Mesa para guardar cambios.`;
      statusLabel.style.display = "block";
    }
  }
}

// Eliminar una mesa (para las cards)
async function deleteMesa(id) {
  if (confirm("¿Estás seguro de eliminar esta mesa?")) {
    const success = await MesaService.deleteMesa(id);
    if (success) {
      await renderMesas();
      if (editingMesaId === id) {
        editingMesaId = null;
        document.getElementById("nombreMesa").value = "";
        document.getElementById("filaMesa").value = "";
        document.getElementById("columnaMesa").value = "";
        document.getElementById("estadoMesa").value = "Libre";
        const statusLabel = document.getElementById("statusLabel");
        if (statusLabel) {
          statusLabel.textContent = "Mesa eliminada.";
          statusLabel.style.backgroundColor = "#28a745";
          statusLabel.style.display = "block";
        }
      }
    } else {
      alert("Error al eliminar la mesa.");
    }
  }
}

// Volver atrás
function goBack() {
  editingMesaId = null;
  window.cargarVista("home");
}

// Exponer funciones al ámbito global para eventos onclick
window.registerMesa = registerMesa;
window.deleteMesaByName = deleteMesaByName;
window.editMesa = editMesa;
window.filterMesas = filterMesas;
window.deleteMesa = deleteMesa;
window.renderMesas = renderMesas;

// Asegurar que renderMesas se ejecute al cargar la vista
setTimeout(() => {
  console.log("Ejecutando renderMesas desde setTimeout...");
  renderMesas();
}, 100); // Pequeño retraso para asegurar que el DOM esté listo
