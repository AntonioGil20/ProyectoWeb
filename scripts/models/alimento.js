// scripts/models/alimento.js
export class Alimento {
  constructor({ id, tipoPlatillo, ingrediente, precioMx, precioUSD }) {
    this.id =
      id || `alimento_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.tipoPlatillo = tipoPlatillo || "Otro";
    this.ingrediente = ingrediente || "";
    this.precioMx = precioMx || 0.0;
    this.precioUSD = precioUSD || 0.0;
  }
}
