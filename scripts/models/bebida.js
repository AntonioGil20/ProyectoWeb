// scripts/models/bebida.js
export class Bebida {
  constructor({ id, nombre, nombreTicket, tipoBebidas, precioMx, precioUSD }) {
    this.id =
      id || `bebida_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.nombre = nombre || "";
    this.nombreTicket = nombreTicket || nombre || "";
    this.tipoBebidas = tipoBebidas || "Sin alcohol";
    this.precioMx = precioMx || 0.0;
    this.precioUSD = precioUSD || 0.0;
  }
}
