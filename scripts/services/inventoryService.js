// scripts/services/inventoryService.js
import { db } from "../firebase-init.js";
import { Compra } from "../models/compra.js";
import {
  ref,
  set,
  get,
  child,
  update,
  remove,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

const comprasRef = ref(db, "Compras");

export class InventoryService {
  // Normalizar datos de Firebase
  static normalizePurchaseData(id, data) {
    return {
      id,
      nombreProducto:
        data.nombreProducto || data.NombreProducto || "Sin nombre",
      categoria: data.categoria || data.Categoria || "Sin categoría",
      cantidad:
        typeof data.cantidad === "number"
          ? data.cantidad
          : typeof data.Cantidad === "number"
          ? data.Cantidad
          : 0,
      unidad: data.unidad || data.Unidad || "Sin unidad",
      total:
        typeof data.total === "number"
          ? data.total
          : typeof data.Total === "number"
          ? data.Total
          : 0,
      fechaCompra: data.fechaCompra || data.FechaCompra || "Sin fecha",
    };
  }

  // Obtener todas las compras
  static async getPurchases() {
    try {
      const snapshot = await get(comprasRef);
      if (snapshot.exists()) {
        const purchases = snapshot.val();
        return Object.entries(purchases).map(([id, data]) =>
          this.normalizePurchaseData(id, data)
        );
      }
      return [];
    } catch (error) {
      console.error("Error al cargar el inventario:", error);
      throw new Error("Error al cargar el inventario.");
    }
  }

  // Obtener una compra por ID
  static async getPurchaseById(id) {
    try {
      const snapshot = await get(child(comprasRef, id));
      if (snapshot.exists()) {
        return this.normalizePurchaseData(id, snapshot.val());
      }
      throw new Error("Compra no encontrada.");
    } catch (error) {
      console.error("Error al cargar la compra:", error);
      throw new Error("Error al cargar la compra.");
    }
  }

  // Registrar una nueva compra
  static async registerPurchase(compra) {
    try {
      await set(child(comprasRef, compra.id), {
        id: compra.id,
        nombreProducto: compra.nombreProducto,
        categoria: compra.categoria,
        cantidad: compra.cantidad,
        unidad: compra.unidad,
        total: compra.total,
        fechaCompra: compra.fechaCompra.toISOString(),
      });
    } catch (error) {
      console.error("Error al registrar la compra:", error);
      throw new Error("Error al registrar la compra.");
    }
  }

  // Actualizar una compra
  static async updatePurchase(id, compra) {
    try {
      await update(child(comprasRef, id), {
        nombreProducto: compra.nombreProducto,
        categoria: compra.categoria,
        cantidad: compra.cantidad,
        unidad: compra.unidad,
        total: compra.total,
        fechaCompra: compra.fechaCompra.toISOString(),
      });
    } catch (error) {
      console.error("Error al guardar los cambios:", error);
      throw new Error("Error al guardar los cambios.");
    }
  }

  // Eliminar una compra
  static async deletePurchase(id) {
    try {
      await remove(child(comprasRef, id));
    } catch (error) {
      console.error("Error al eliminar la compra:", error);
      throw new Error("Error al eliminar la compra.");
    }
  }
}
