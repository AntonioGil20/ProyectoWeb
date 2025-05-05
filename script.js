function cargarVista(vista) {
    fetch(`views/${vista}.html`)
      .then(res => res.text())
      .then(html => {
        document.getElementById('view-container').innerHTML = html;
      })
      .catch(err => {
        document.getElementById('view-container').innerHTML = "<p>Error al cargar la vista.</p>";
        console.error(err);
      });
  }
  function cerrarSesion() {
    // Puedes agregar aquí lógica para limpiar sesión si la tienes
    window.location.href = "login.html"; // Redirige al login
  }
  // Actualizar fecha y hora
  function actualizarFechaHora() {
    const ahora = new Date();
    document.getElementById('fecha').textContent = ahora.toLocaleDateString();
    document.getElementById('hora').textContent = ahora.toLocaleTimeString();
  }
  
  setInterval(actualizarFechaHora, 1000);
  actualizarFechaHora();
  
  // ✅ Cargar la vista inicial cuando el DOM esté listo
  window.addEventListener('DOMContentLoaded', () => {
    cargarVista('home');
  });
  