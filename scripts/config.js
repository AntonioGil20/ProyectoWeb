document.addEventListener("DOMContentLoaded", () => {
  const printerTicketsSelect = document.getElementById("printer-tickets");
  const printerComandasSelect = document.getElementById("printer-comandas");
  const enableTicketsCheckbox = document.getElementById("enable-tickets");
  const enableComandasCheckbox = document.getElementById("enable-comandas");

  // Lista simulada de impresoras (podrías llenarla desde un backend en producción)
  const impresorasDisponibles = [
    "Impresora 1 - Tickets",
    "Impresora 2 - Cocina",
    "Impresora 3 - Bar",
    "Impresora 4 - Caja"
  ];
  function cargarOpciones(select, valorGuardado) {
    select.innerHTML = "";
    impresorasDisponibles.forEach(nombre => {
      const option = document.createElement("option");
      option.value = nombre;
      option.textContent = nombre;
      if (nombre === valorGuardado) option.selected = true;
      select.appendChild(option);
    });
  }

  function guardarConfiguracion() {
    localStorage.setItem("impresoraTickets", printerTicketsSelect.value);
    localStorage.setItem("impresoraComandas", printerComandasSelect.value);
    localStorage.setItem("habilitarTickets", enableTicketsCheckbox.checked);
    localStorage.setItem("habilitarComandas", enableComandasCheckbox.checked);
  }

  function cargarConfiguracion() {
    const impresoraTickets = localStorage.getItem("impresoraTickets");
    const impresoraComandas = localStorage.getItem("impresoraComandas");
    const habilitarTickets = localStorage.getItem("habilitarTickets") === "true";
    const habilitarComandas = localStorage.getItem("habilitarComandas") === "true";

    cargarOpciones(printerTicketsSelect, impresoraTickets);
    cargarOpciones(printerComandasSelect, impresoraComandas);
    enableTicketsCheckbox.checked = habilitarTickets;
    enableComandasCheckbox.checked = habilitarComandas;
  }

  // Eventos
  printerTicketsSelect.addEventListener("change", guardarConfiguracion);
  printerComandasSelect.addEventListener("change", guardarConfiguracion);
  enableTicketsCheckbox.addEventListener("change", guardarConfiguracion);
  enableComandasCheckbox.addEventListener("change", guardarConfiguracion);

  cargarConfiguracion();
});
