export class Mesa {
    constructor({ id, nombreMesa, estado, fila, columna }) {
      this.id = id || `mesa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.nombreMesa = nombreMesa || "";
      this.estado = estado || "Libre";
      this.fila = fila || 0;
      this.columna = columna || 0;
    }
  }
  