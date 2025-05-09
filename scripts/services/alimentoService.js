// scripts/services/alimentoService.js
import { db } from "../firebase-init.js";
import { Alimento } from "../models/alimento.js";
import {
  ref,
  set,
  get,
  child,
  update,
  remove,
  onValue,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

const alimentosRef = ref(db, "Alimentos");

export class AlimentoService {
  // Normalizar datos de Firebase
  static normalizeAlimentoData(id, data) {
    console.log(`Normalizando datos de alimento con ID ${id}:`, data); // Depuración
    return {
      id,
      tipoPlatillo: data.tipoPlatillo || data.TipoPlatillo || "Otro",
      ingrediente: data.ingrediente || data.Ingrediente || "Sin nombre",
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

  // Obtener todos los alimentos
  static async getAlimentos() {
    try {
      console.log("Obteniendo alimentos desde Firebase..."); // Depuración
      const snapshot = await get(alimentosRef);
      if (snapshot.exists()) {
        const alimentos = snapshot.val();
        console.log("Datos crudos de Firebase (Alimentos):", alimentos); // Depuración
        return Object.entries(alimentos).map(([id, data]) =>
          this.normalizeAlimentoData(id, data)
        );
      }
      console.log("No hay datos en el nodo Alimentos."); // Depuración
      return [];
    } catch (error) {
      console.error("Error al cargar los alimentos:", error);
      throw new Error("Error al cargar los alimentos.");
    }
  }

  // Obtener un alimento por ID
  static async getAlimentoById(id) {
    try {
      const snapshot = await get(child(alimentosRef, id));
      if (snapshot.exists()) {
        return this.normalizeAlimentoData(id, snapshot.val());
      }
      throw new Error("Alimento no encontrado.");
    } catch (error) {
      console.error("Error al cargar el alimento:", error);
      throw new Error("Error al cargar el alimento.");
    }
  }

  // Registrar un nuevo alimento
  static async registerAlimento(alimento) {
    try {
      await set(child(alimentosRef, alimento.id), {
        tipoPlatillo: alimento.tipoPlatillo,
        ingrediente: alimento.ingrediente,
        precioMx: alimento.precioMx,
        precioUSD: alimento.precioUSD,
      });
      console.log(
        `Alimento ${alimento.ingrediente} registrado con ID ${alimento.id}`
      ); // Depuración
    } catch (error) {
      console.error("Error al registrar el alimento:", error);
      throw new Error("Error al registrar el alimento.");
    }
  }

  // Actualizar un alimento
  static async updateAlimento(id, alimento) {
    try {
      await update(child(alimentosRef, id), {
        tipoPlatillo: alimento.tipoPlatillo,
        ingrediente: alimento.ingrediente,
        precioMx: alimento.precioMx,
        precioUSD: alimento.precioUSD,
      });
    } catch (error) {
      console.error("Error al actualizar el alimento:", error);
      throw new Error("Error al actualizar el alimento.");
    }
  }

  // Eliminar un alimento
  static async deleteAlimento(id) {
    try {
      await remove(child(alimentosRef, id));
    } catch (error) {
      console.error("Error al eliminar el alimento:", error);
      throw new Error("Error al eliminar el alimento.");
    }
  }

  // Suscribirse a cambios en tiempo real
  static subscribeToAlimentos(callback) {
    return onValue(alimentosRef, (snapshot) => {
      if (snapshot.exists()) {
        const alimentos = snapshot.val();
        const normalizedAlimentos = Object.entries(alimentos).map(
          ([id, data]) => this.normalizeAlimentoData(id, data)
        );
        callback(normalizedAlimentos);
      } else {
        callback([]);
      }
    });
  }
}
