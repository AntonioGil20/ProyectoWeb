// scripts/models/arqueo.js
export class Arqueo {
  constructor({
    id,
    fechaHoraInicio,
    fechaHoraCierre,
    montoInicial,
    estado,
    ingresosSistemaMXN,
    ingresosSistemaUSD,
    ingresosUsuarioMXN,
    ingresosUsuarioUSD,
    diferenciaMXN,
    diferenciaUSD,
    isChecked = false,
  }) {
    this.id =
      id || `arqueo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.fechaHoraInicio = fechaHoraInicio
      ? new Date(fechaHoraInicio)
      : new Date();
    this.fechaHoraCierre = fechaHoraCierre
      ? new Date(fechaHoraCierre)
      : new Date();
    this.montoInicial = montoInicial || 0.0;
    this.estado = estado || "En proceso";
    this.ingresosSistemaMXN = ingresosSistemaMXN || 0.0;
    this.ingresosSistemaUSD = ingresosSistemaUSD || 0.0;
    this.ingresosUsuarioMXN = ingresosUsuarioMXN || 0.0;
    this.ingresosUsuarioUSD = ingresosUsuarioUSD || 0.0;
    this.diferenciaMXN = diferenciaMXN || 0.0;
    this.diferenciaUSD = diferenciaUSD || 0.0;
    this.isChecked = isChecked;
  }
}
