// scripts/services/bebidaService.js
import { db } from "../firebase-init.js";
import { Bebida } from "../models/bebida.js";
import {
  ref,
  set,
  get,
  child,
  update,
  remove,
  onValue,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

const bebidasRef = ref(db, "Bebidas");

export class BebidaService {
  // Normalizar datos de Firebase
  static normalizeBebidaData(id, data) {
    console.log(`Normalizando datos de bebida con ID ${id}:`, data); // Depuración
    return {
      id,
      nombre: data.nombre || data.Nombre || "Sin nombre",
      nombreTicket:
        data.nombreTicket ||
        data.NombreTicket ||
        data.nombre ||
        data.Nombre ||
        "Sin nombre",
      tipoBebidas: data.tipoBebidas || data.TipoBebidas || "Sin alcohol",
      precioMx:
        typeof data.precioMx === "number"
          ? data.precioMx
          : typeof data.PrecioMx === "number"
          ? data.PrecioMx
          : 0.0,
      precioUSD:
        typeof data.precioUSD === "number"
          ? data.precioUSD
          : typeof data.PrecioUSD === "number"
          ? data.PrecioUSD
          : 0.0,
    };
  }

  // Obtener todas las bebidas
  static async getBebidas() {
    try {
      console.log("Obteniendo bebidas desde Firebase..."); // Depuración
      const snapshot = await get(bebidasRef);
      if (snapshot.exists()) {
        const bebidas = snapshot.val();
        console.log("Datos crudos de Firebase (Bebidas):", bebidas); // Depuración
        return Object.entries(bebidas).map(([id, data]) =>
          this.normalizeBebidaData(id, data)
        );
      }
      console.log("No hay datos en el nodo Bebidas."); // Depuración
      return [];
    } catch (error) {
      console.error("Error al cargar las bebidas:", error);
      throw new Error("Error al cargar las bebidas.");
    }
  }

  // Obtener una bebida por ID
  static async getBebidaById(id) {
    try {
      const snapshot = await get(child(bebidasRef, id));
      if (snapshot.exists()) {
        return this.normalizeBebidaData(id, snapshot.val());
      }
      throw new Error("Bebida no encontrada.");
    } catch (error) {
      console.error("Error al cargar la bebida:", error);
      throw new Error("Error al cargar la bebida.");
    }
  }

  // Registrar una nueva bebida
  static async registerBebida(bebida) {
    try {
      await set(child(bebidasRef, bebida.id), {
        nombre: bebida.nombre,
        nombreTicket: bebida.nombreTicket,
        tipoBebidas: bebida.tipoBebidas,
        precioMx: bebida.precioMx,
        precioUSD: bebida.precioUSD,
      });
      console.log(`Bebida ${bebida.nombre} registrada con ID ${bebida.id}`); // Depuración
    } catch (error) {
      console.error("Error al registrar la bebida:", error);
      throw new Error("Error al registrar la bebida.");
    }
  }

  // Actualizar una bebida
  static async updateBebida(id, bebida) {
    try {
      await update(child(bebidasRef, id), {
        nombre: bebida.nombre,
        nombreTicket: bebida.nombreTicket,
        tipoBebidas: bebida.tipoBebidas,
        precioMx: bebida.precioMx,
        precioUSD: bebida.precioUSD,
      });
    } catch (error) {
      console.error("Error al actualizar la bebida:", error);
      throw new Error("Error al actualizar la bebida.");
    }
  }

  // Eliminar una bebida
  static async deleteBebida(id) {
    try {
      await remove(child(bebidasRef, id));
    } catch (error) {
      console.error("Error al eliminar la bebida:", error);
      throw new Error("Error al eliminar la bebida.");
    }
  }

  // Suscribirse a cambios en tiempo real
  static subscribeToBebidas(callback) {
    return onValue(bebidasRef, (snapshot) => {
      if (snapshot.exists()) {
        const bebidas = snapshot.val();
        const normalizedBebidas = Object.entries(bebidas).map(([id, data]) =>
          this.normalizeBebidaData(id, data)
        );
        callback(normalizedBebidas);
      } else {
        callback([]);
      }
    });
  }
}
