// scripts/alimentos.js
import { AlimentoService } from "./services/alimentoService.js";
import { Alimento } from "./models/alimento.js";

console.log("Alimentos.js cargado"); // Depuración

// Variable para rastrear si estamos editando un alimento y su ID
let editingAlimentoId = null;

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
      console.log("Renderizando alimento:", alimento); // Depuración
      const card = document.createElement("div");
      card.className = "alimento-item";
      card.innerHTML = `
        <div class="alimento-item">
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
                <button class="editar" onclick="editarAlimento('${alimento.id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="eliminar" onclick="eliminarAlimento('${alimento.id}')">
                    <i class="fas fa-trash-alt"></i> Eliminar
                </button>
            </div>
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

// Filtrar alimentos por categoría y nombre
function filterAlimentos() {
  const filtroCategoria = document
    .getElementById("filtroCategoria")
    .value.toLowerCase();
  const buscarAlimento = document
    .getElementById("buscarAlimento")
    .value.toLowerCase();
  const alimentosList = document.getElementById("alimentos-list");
  const cards = alimentosList.getElementsByClassName("alimento-item");

  Array.from(cards).forEach((card) => {
    const categoria = card
      .querySelector("p:nth-child(2)")
      .textContent.toLowerCase()
      .replace("categoría: ", "");
    const nombre = card.querySelector("h3").textContent.toLowerCase();
    const matchesCategoria =
      filtroCategoria === "" || categoria === filtroCategoria;
    const matchesNombre = nombre.includes(buscarAlimento);
    card.style.display = matchesCategoria && matchesNombre ? "flex" : "none";
  });
}

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

// Eliminar un alimento por nombre
async function deleteAlimentoByName(name) {
  if (!name) {
    alert("Ingresa un nombre para eliminar.");
    return;
  }
  const alimentos = await AlimentoService.getAlimentos();
  const alimento = alimentos.find((a) => a.ingrediente === name);
  if (alimento) {
    const success = await AlimentoService.deleteAlimento(alimento.id);
    if (success) {
      await renderAlimentos();
      document.getElementById("ingrediente").value = ""; // Limpiar el input
      const statusLabel = document.getElementById("statusLabel");
      if (statusLabel) {
        statusLabel.textContent = "Alimento eliminado correctamente.";
        statusLabel.style.backgroundColor = "#28a745";
        statusLabel.style.display = "block";
      }
      // Limpiar modo edición si el alimento eliminado era el que se estaba editando
      if (editingAlimentoId === alimento.id) {
        editingAlimentoId = null;
      }
    } else {
      const statusLabel = document.getElementById("statusLabel");
      if (statusLabel) {
        statusLabel.textContent = "Error al eliminar el alimento.";
        statusLabel.style.display = "block";
      }
    }
  } else {
    const statusLabel = document.getElementById("statusLabel");
    if (statusLabel) {
      statusLabel.textContent = "Alimento no encontrado.";
      statusLabel.style.display = "block";
    }
  }
}

// Editar un alimento
async function editAlimento(id) {
  const alimento = await AlimentoService.getAlimentoById(id);
  if (alimento) {
    editingAlimentoId = id; // Establecer el ID del alimento que se está editando
    document.getElementById("ingrediente").value = alimento.ingrediente;
    document.getElementById("tipoPlatillo").value = alimento.tipoPlatillo;
    document.getElementById("precioMx").value = alimento.precioMx;
    document.getElementById("precioUSD").value = alimento.precioUSD;
    const statusLabel = document.getElementById("statusLabel");
    if (statusLabel) {
      statusLabel.textContent = `Editando alimento: ${alimento.ingrediente}. Usa Registrar para guardar cambios.`;
      statusLabel.style.display = "block";
    }
  }
}

// Eliminar un alimento (para las cards)
async function deleteAlimento(id) {
  if (confirm("¿Estás seguro de eliminar este alimento?")) {
    const success = await AlimentoService.deleteAlimento(id);
    if (success) {
      await renderAlimentos();
      // Limpiar modo edición si el alimento eliminado era el que se estaba editando
      if (editingAlimentoId === id) {
        editingAlimentoId = null;
        document.getElementById("ingrediente").value = "";
        document.getElementById("tipoPlatillo").value = "Carne";
        document.getElementById("precioMx").value = "";
        document.getElementById("precioUSD").value = "";
        const statusLabel = document.getElementById("statusLabel");
        if (statusLabel) {
          statusLabel.textContent = "Alimento eliminado.";
          statusLabel.style.backgroundColor = "#28a745";
          statusLabel.style.display = "block";
        }
      }
    } else {
      alert("Error al eliminar el alimento.");
    }
  }
}

// Volver atrás
function goBack() {
  editingAlimentoId = null; // Limpiar modo edición al salir
  window.cargarVista("home");
}

// Exponer funciones al ámbito global para eventos onclick
window.registerAlimento = registerAlimento;
window.deleteAlimentoByName = deleteAlimentoByName;
window.editAlimento = editAlimento;
window.filterAlimentos = filterAlimentos;
window.deleteAlimento = deleteAlimento;
window.renderAlimentos = renderAlimentos;
