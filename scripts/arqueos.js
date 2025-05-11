// scripts/arqueos.js
import { ArqueoService } from "./services/arqueoService.js";
import { Arqueo } from "./models/arqueo.js";

// Asegurarnos de que la biblioteca XLSX esté disponible
const XLSX = window.XLSX;

console.log("Arqueos.js cargado"); // Depuración

// Lista de arqueos para mantener el estado de selección
let arqueos = [];

// Renderizar lista de arqueos
async function renderArqueos(retryCount = 0) {
  console.log("Iniciando renderArqueos..."); // Depuración
  const arqueoList = document.getElementById("arqueo-list");
  if (!arqueoList) {
    console.error(
      "Elemento arqueo-list NO encontrado en el DOM. Verifica el HTML."
    );
    return;
  }

  arqueoList.innerHTML = "<p>Cargando arqueos...</p>";
  console.log("Mostrando 'Cargando arqueos...' en el DOM"); // Depuración

  try {
    arqueos = await ArqueoService.getArqueos();
    console.log("Datos de arqueos obtenidos de Firebase:", arqueos); // Depuración
    arqueoList.innerHTML = "";

    if (arqueos.length === 0) {
      console.log("No hay arqueos registrados en Firebase."); // Depuración
      arqueoList.innerHTML = "<p>No hay arqueos registrados.</p>";
      return;
    }

    // Filtrar según el estado seleccionado
    const filtroEstado = document.getElementById("filtroEstado").value;
    let arqueosFiltrados = arqueos;
    if (filtroEstado !== "todos") {
      arqueosFiltrados = arqueos.filter(
        (arqueo) => arqueo.estado.toLowerCase() === filtroEstado.toLowerCase()
      );
    }

    arqueosFiltrados.forEach((arqueo) => {
      console.log("Renderizando arqueo:", arqueo); // Depuración
      const card = document.createElement("div");
      card.className = "item";
      card.id = `arqueo-${arqueo.id}`; // Añadimos un ID único para facilitar la actualización
      if (arqueo.isChecked) {
        card.classList.add("selected");
      }
      const fechaInicio = new Date(arqueo.fechaHoraInicio);
      const fechaCierre = new Date(arqueo.fechaHoraCierre);
      card.innerHTML = `
                <div>${fechaInicio.toLocaleTimeString("es-MX", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}</div>
                <div>${fechaCierre.toLocaleTimeString("es-MX", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}</div>
                <div>$${arqueo.ingresosSistemaMXN.toFixed(2)}</div>
                <div>$${arqueo.ingresosUsuarioMXN.toFixed(2)}</div>
                <div>$${arqueo.diferenciaMXN.toFixed(2)}</div>
                <div>${arqueo.estado}</div>
                <div><input type="checkbox" ${
                  arqueo.isChecked ? "checked" : ""
                } onchange="toggleArqueoSelection('${
        arqueo.id
      }', this.checked)"></div>
            `;
      arqueoList.appendChild(card);
    });

    updateBulkActions();
  } catch (error) {
    console.error("Error en renderArqueos:", error);
    const statusLabel = document.getElementById("statusLabel");
    if (statusLabel) {
      statusLabel.textContent = `Error al cargar los arqueos: ${error.message}`;
      statusLabel.style.display = "block";
    }
    if (retryCount < 3) {
      console.warn("Reintentando conexión...", retryCount + 1);
      setTimeout(() => renderArqueos(retryCount + 1), 1000); // Reintenta después de 1 segundo
    } else {
      arqueoList.innerHTML =
        "<p>Error al cargar los arqueos. Verifica tu conexión o Firebase.</p>";
    }
  }
}

// Filtrar arqueos por estado
function filterArqueos() {
  renderArqueos();
}

// Mostrar formulario para nuevo arqueo
function showNewArqueoForm() {
  const form = document.getElementById("newArqueoForm");
  if (form) {
    form.style.display = "flex";
    // Establecer valores por defecto
    const today = new Date();
    document.getElementById("fechaInicio").value = today
      .toISOString()
      .split("T")[0];
    document.getElementById("horaInicio").value = today
      .toTimeString()
      .slice(0, 5);
    document.getElementById("montoInicial").value = "";
    const statusLabel = document.getElementById("statusLabel");
    if (statusLabel) {
      statusLabel.style.display = "none";
    }
  }
}

// Ocultar formulario para nuevo arqueo
function hideNewArqueoForm() {
  const form = document.getElementById("newArqueoForm");
  if (form) {
    form.style.display = "none";
  }
}

// Guardar un nuevo arqueo
async function saveArqueo() {
  const fechaInicioInput = document.getElementById("fechaInicio")?.value;
  const horaInicioInput = document.getElementById("horaInicio")?.value;
  const montoInicial =
    parseFloat(document.getElementById("montoInicial")?.value) || 0.0;
  const statusLabel = document.getElementById("statusLabel");

  if (!fechaInicioInput || !horaInicioInput) {
    if (statusLabel) {
      statusLabel.textContent = "La fecha y hora de inicio son requeridas.";
      statusLabel.style.color = "darkred";
      statusLabel.style.display = "block";
    }
    return;
  }

  const fechaInicio = new Date(`${fechaInicioInput}T${horaInicioInput}:00`);
  if (isNaN(fechaInicio)) {
    if (statusLabel) {
      statusLabel.textContent = "Fecha u hora inválida.";
      statusLabel.style.color = "darkred";
      statusLabel.style.display = "block";
    }
    return;
  }

  const arqueo = new Arqueo({
    fechaHoraInicio: fechaInicio,
    fechaHoraCierre: fechaInicio, // Por ahora, la fecha de cierre será la misma (se puede actualizar después)
    montoInicial,
    estado: "En proceso",
  });

  try {
    await ArqueoService.registerArqueo(arqueo);
    if (statusLabel) {
      statusLabel.textContent = "Arqueo registrado correctamente.";
      statusLabel.style.color = "darkgreen";
      statusLabel.style.display = "block";
    }
    hideNewArqueoForm();
    await renderArqueos();
  } catch (error) {
    console.error("Error al registrar el arqueo:", error);
    if (statusLabel) {
      statusLabel.textContent = "Error al registrar el arqueo.";
      statusLabel.style.color = "darkred";
      statusLabel.style.display = "block";
    }
  }
}

// Refrescar la lista de arqueos
async function refreshArqueos() {
  await renderArqueos();
}

// Seleccionar/deseleccionar un arqueo
function toggleArqueoSelection(id, checked) {
  const arqueo = arqueos.find((a) => a.id === id);
  if (arqueo) {
    arqueo.isChecked = checked;
    // Actualizar solo el elemento afectado en el DOM
    const card = document.getElementById(`arqueo-${id}`);
    if (card) {
      if (checked) {
        card.classList.add("selected");
      } else {
        card.classList.remove("selected");
      }
    }
    updateBulkActions();
  }
}

// Seleccionar/deseleccionar todos los arqueos
function toggleSelectAll() {
  const selectAll = document.getElementById("selectAll").checked;
  arqueos.forEach((arqueo) => {
    arqueo.isChecked = selectAll;
    // Actualizar el elemento en el DOM
    const card = document.getElementById(`arqueo-${arqueo.id}`);
    if (card) {
      if (selectAll) {
        card.classList.add("selected");
      } else {
        card.classList.remove("selected");
      }
      const checkbox = card.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.checked = selectAll;
      }
    }
  });
  updateBulkActions();
}

// Actualizar acciones en lote
function updateBulkActions() {
  const selectedArqueos = arqueos.filter((arqueo) => arqueo.isChecked).length;
  const bulkActions = document.getElementById("bulkActions");
  const selectedCount = document.getElementById("selectedCount");
  if (selectedArqueos > 0) {
    bulkActions.style.display = "flex";
    selectedCount.textContent = `Arqueos seleccionados: ${selectedArqueos}`;
  } else {
    bulkActions.style.display = "none";
  }
}

// Eliminar arqueos seleccionados
async function deleteSelectedArqueos() {
  if (confirm("¿Estás seguro de eliminar los arqueos seleccionados?")) {
    const selectedArqueos = arqueos.filter((arqueo) => arqueo.isChecked);
    for (const arqueo of selectedArqueos) {
      await ArqueoService.deleteArqueo(arqueo.id);
    }
    await renderArqueos();
  }
}

// Generar Excel
function generateExcel() {
  const selectedArqueos = arqueos.filter((arqueo) => arqueo.isChecked);
  if (selectedArqueos.length === 0) {
    alert("Por favor, selecciona al menos un arqueo para generar el Excel.");
    return;
  }

  // Preparar los datos para el Excel
  const data = selectedArqueos.map((arqueo) => {
    const fechaInicio = new Date(arqueo.fechaHoraInicio);
    const fechaCierre = new Date(arqueo.fechaHoraCierre);
    return {
      "Hora de Apertura": fechaInicio.toLocaleString("es-MX"),
      "Hora de Cierre": fechaCierre.toLocaleString("es-MX"),
      "Sistema (MXN)": arqueo.ingresosSistemaMXN.toFixed(2),
      "Sistema (USD)": arqueo.ingresosSistemaUSD.toFixed(2),
      "Usuario (MXN)": arqueo.ingresosUsuarioMXN.toFixed(2),
      "Usuario (USD)": arqueo.ingresosUsuarioUSD.toFixed(2),
      "Diferencia (MXN)": arqueo.diferenciaMXN.toFixed(2),
      "Diferencia (USD)": arqueo.diferenciaUSD.toFixed(2),
      "Monto Inicial": arqueo.montoInicial.toFixed(2),
      Estado: arqueo.estado,
    };
  });

  // Crear una hoja de trabajo
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Arqueos");

  // Descargar el archivo Excel
  XLSX.writeFile(workbook, "Arqueos.xlsx");
}

// Exponer funciones al ámbito global para eventos onclick
window.renderArqueos = renderArqueos;
window.showNewArqueoForm = showNewArqueoForm;
window.hideNewArqueoForm = hideNewArqueoForm;
window.saveArqueo = saveArqueo;
window.refreshArqueos = refreshArqueos;
window.toggleArqueoSelection = toggleArqueoSelection;
window.toggleSelectAll = toggleSelectAll;
window.deleteSelectedArqueos = deleteSelectedArqueos;
window.generateExcel = generateExcel;
window.filterArqueos = filterArqueos;
