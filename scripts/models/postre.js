// scripts/models/postre.js
export class Postre {
  constructor({ id, nombre, precioMx, precioUSD, stock }) {
    this.id =
      id || `postre_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.nombre = nombre || "";
    this.precioMx = precioMx || 0.0;
    this.precioUSD = precioUSD || 0.0;
    this.stock = stock || 0;
  }
}
