// scripts/services/arqueoService.js
import { db } from "../firebase-init.js";
import { Arqueo } from "../models/arqueo.js";
import {
  ref,
  set,
  get,
  child,
  update,
  remove,
  onValue,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

const arqueosRef = ref(db, "Arqueos");

export class ArqueoService {
  // Normalizar datos de Firebase
  static normalizeArqueoData(id, data) {
    console.log(`Normalizando datos de arqueo con ID ${id}:`, data); // Depuración
    return {
      id,
      fechaHoraInicio:
        data.fechaHoraInicio ||
        data.FechaHoraInicio ||
        new Date().toISOString(),
      fechaHoraCierre:
        data.fechaHoraCierre ||
        data.FechaHoraCierre ||
        new Date().toISOString(),
      montoInicial:
        typeof data.montoInicial === "number"
          ? data.montoInicial
          : typeof data.MontoInicial === "number"
          ? data.MontoInicial
          : 0.0,
      estado: data.estado || data.Estado || "En proceso",
      ingresosSistemaMXN:
        typeof data.ingresosSistemaMXN === "number"
          ? data.ingresosSistemaMXN
          : typeof data.IngresosSistemaMXN === "number"
          ? data.IngresosSistemaMXN
          : 0.0,
      ingresosSistemaUSD:
        typeof data.ingresosSistemaUSD === "number"
          ? data.ingresosSistemaUSD
          : typeof data.IngresosSistemaUSD === "number"
          ? data.IngresosSistemaUSD
          : 0.0,
      ingresosUsuarioMXN:
        typeof data.ingresosUsuarioMXN === "number"
          ? data.ingresosUsuarioMXN
          : typeof data.IngresosUsuarioMXN === "number"
          ? data.IngresosUsuarioMXN
          : 0.0,
      ingresosUsuarioUSD:
        typeof data.ingresosUsuarioUSD === "number"
          ? data.ingresosUsuarioUSD
          : typeof data.IngresosUsuarioUSD === "number"
          ? data.IngresosUsuarioUSD
          : 0.0,
      diferenciaMXN:
        typeof data.diferenciaMXN === "number"
          ? data.diferenciaMXN
          : typeof data.DiferenciaMXN === "number"
          ? data.DiferenciaMXN
          : 0.0,
      diferenciaUSD:
        typeof data.diferenciaUSD === "number"
          ? data.diferenciaUSD
          : typeof data.DiferenciaUSD === "number"
          ? data.DiferenciaUSD
          : 0.0,
      isChecked: data.isChecked || false,
    };
  }

  // Obtener todos los arqueos
  static async getArqueos() {
    try {
      console.log("Obteniendo arqueos desde Firebase..."); // Depuración
      const snapshot = await get(arqueosRef);
      if (snapshot.exists()) {
        const arqueos = snapshot.val();
        console.log("Datos crudos de Firebase (Arqueos):", arqueos); // Depuración
        return Object.entries(arqueos).map(([id, data]) =>
          this.normalizeArqueoData(id, data)
        );
      }
      console.log("No hay datos en el nodo Arqueos."); // Depuración
      return [];
    } catch (error) {
      console.error("Error al cargar los arqueos:", error);
      throw new Error("Error al cargar los arqueos.");
    }
  }

  // Obtener un arqueo por ID
  static async getArqueoById(id) {
    try {
      const snapshot = await get(child(arqueosRef, id));
      if (snapshot.exists()) {
        return this.normalizeArqueoData(id, snapshot.val());
      }
      throw new Error("Arqueo no encontrado.");
    } catch (error) {
      console.error("Error al cargar el arqueo:", error);
      throw new Error("Error al cargar el arqueo.");
    }
  }

  // Obtener arqueos por estado
  static async getArqueosPorEstado(estado) {
    const arqueos = await this.getArqueos();
    return arqueos.filter(
      (arqueo) => arqueo.estado.toLowerCase() === estado.toLowerCase()
    );
  }

  // Registrar un nuevo arqueo
  static async registerArqueo(arqueo) {
    try {
      await set(child(arqueosRef, arqueo.id), {
        fechaHoraInicio: arqueo.fechaHoraInicio.toISOString(),
        fechaHoraCierre: arqueo.fechaHoraCierre.toISOString(),
        montoInicial: arqueo.montoInicial,
        estado: arqueo.estado,
        ingresosSistemaMXN: arqueo.ingresosSistemaMXN,
        ingresosSistemaUSD: arqueo.ingresosSistemaUSD,
        ingresosUsuarioMXN: arqueo.ingresosUsuarioMXN,
        ingresosUsuarioUSD: arqueo.ingresosUsuarioUSD,
        diferenciaMXN: arqueo.diferenciaMXN,
        diferenciaUSD: arqueo.diferenciaUSD,
        isChecked: arqueo.isChecked,
      });
      console.log(`Arqueo registrado con ID ${arqueo.id}`); // Depuración
    } catch (error) {
      console.error("Error al registrar el arqueo:", error);
      throw new Error("Error al registrar el arqueo.");
    }
  }

  // Actualizar un arqueo
  static async updateArqueo(id, arqueo) {
    try {
      await update(child(arqueosRef, id), {
        fechaHoraInicio: arqueo.fechaHoraInicio.toISOString(),
        fechaHoraCierre: arqueo.fechaHoraCierre.toISOString(),
        montoInicial: arqueo.montoInicial,
        estado: arqueo.estado,
        ingresosSistemaMXN: arqueo.ingresosSistemaMXN,
        ingresosSistemaUSD: arqueo.ingresosSistemaUSD,
        ingresosUsuarioMXN: arqueo.ingresosUsuarioMXN,
        ingresosUsuarioUSD: arqueo.ingresosUsuarioUSD,
        diferenciaMXN: arqueo.diferenciaMXN,
        diferenciaUSD: arqueo.diferenciaUSD,
        isChecked: arqueo.isChecked,
      });
    } catch (error) {
      console.error("Error al actualizar el arqueo:", error);
      throw new Error("Error al actualizar el arqueo.");
    }
  }

  // Eliminar un arqueo
  static async deleteArqueo(id) {
    try {
      await remove(child(arqueosRef, id));
    } catch (error) {
      console.error("Error al eliminar el arqueo:", error);
      throw new Error("Error al eliminar el arqueo.");
    }
  }

  // Suscribirse a cambios en tiempo real
  static subscribeToArqueos(callback) {
    return onValue(arqueosRef, (snapshot) => {
      if (snapshot.exists()) {
        const arqueos = snapshot.val();
        const normalizedArqueos = Object.entries(arqueos).map(([id, data]) =>
          this.normalizeArqueoData(id, data)
        );
        callback(normalizedArqueos);
      } else {
        callback([]);
      }
    });
  }
}
