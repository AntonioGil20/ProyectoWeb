import { db } from "../firebase-init.js";
import { CategoriaAlimento } from "../models/categoriaAlimento.js";
import { ref, set, get, child, update, remove, onValue } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

const categoriasRef = ref(db, "CategoriasAlimentos");

export class CategoriaAlimentoService {
  static normalizeCategoriaData(id, data) {
    return {
      id,
      nombre: data.nombre || data.Nombre || "Sin nombre",
      protegida: data.protegida || false
    };
  }

  // Obtener todas las categorías
  static async getCategorias() {
    try {
      const snapshot = await get(categoriasRef);
      if (snapshot.exists()) {
        const categorias = snapshot.val();
        return Object.entries(categorias).map(([id, data]) =>
          this.normalizeCategoriaData(id, data)
        );
      }
      // Si no hay categorías, crear las básicas
      await this.crearCategoriasBasicas();
      return this.getCategorias(); // Recursivo para devolver las categorías recién creadas
    } catch (error) {
      console.error("Error al cargar las categorías:", error);
      throw new Error("Error al cargar las categorías.");
    }
  }

  // Crear categorías básicas iniciales
  static async crearCategoriasBasicas() {
    const categoriasBasicas = [
      new CategoriaAlimento({ nombre: "Taco", protegida: true }),
      new CategoriaAlimento({ nombre: "Quesadilla", protegida: true }),
      new CategoriaAlimento({ nombre: "Tostada", protegida: true }),
      new CategoriaAlimento({ nombre: "Papa", protegida: true })
    ];
    
    try {
      for (const categoria of categoriasBasicas) {
        await set(child(categoriasRef, categoria.id), {
          nombre: categoria.nombre,
          protegida: categoria.protegida
        });
      }
    } catch (error) {
      console.error("Error al crear categorías básicas:", error);
      throw new Error("Error al crear categorías básicas.");
    }
  }

  // Agregar nueva categoría
  static async addCategoria(nombre) {
    if (!nombre || nombre.trim() === "") {
      throw new Error("El nombre de la categoría no puede estar vacío");
    }

    const categorias = await this.getCategorias();
    const existe = categorias.some(c => c.nombre.toLowerCase() === nombre.toLowerCase());
    
    if (existe) {
      throw new Error("Ya existe una categoría con ese nombre");
    }

    const nuevaCategoria = new CategoriaAlimento({ nombre });
    
    try {
      await set(child(categoriasRef, nuevaCategoria.id), {
        nombre: nuevaCategoria.nombre,
        protegida: false
      });
      return nuevaCategoria;
    } catch (error) {
      console.error("Error al agregar categoría:", error);
      throw new Error("Error al agregar categoría.");
    }
  }

  // Eliminar categoría
  static async deleteCategoria(id) {
    try {
      // Verificar si la categoría está protegida
      const snapshot = await get(child(categoriasRef, id));
      if (snapshot.exists()) {
        const categoria = this.normalizeCategoriaData(id, snapshot.val());
        if (categoria.protegida) {
          throw new Error("No se puede eliminar una categoría protegida");
        }
      }
      
      await remove(child(categoriasRef, id));
    } catch (error) {
      console.error("Error al eliminar categoría:", error);
      throw error; // Re-lanzamos el error para manejo específico
    }
  }

  // Suscribirse a cambios en tiempo real
  static subscribeToCategorias(callback) {
    return onValue(categoriasRef, (snapshot) => {
      if (snapshot.exists()) {
        const categorias = snapshot.val();
        const normalizedCategorias = Object.entries(categorias).map(
          ([id, data]) => this.normalizeCategoriaData(id, data)
        );
        callback(normalizedCategorias);
      } else {
        callback([]);
      }
    });
  }
}
