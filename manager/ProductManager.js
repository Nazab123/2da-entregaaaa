import path from "path"
import fs from "fs/promises"
import { __dirname } from "../utils.js"

// Ruta del archivo JSON
const ProductosGuardados = path.join(__dirname, "data", "products.json")

// Leer productos
export async function Productosarray() {
  try {
    const data = await fs.readFile(ProductosGuardados, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

// Generar ID autoincremental
export function ProxId(products) {
  let idnew = 0

  for (let i = 0; i < products.length; i++) {
    if (products[i].id > idnew) {
      idnew = products[i].id
    }
  }

  return idnew + 1
}

// Guardar productos
export async function GuardarProductos(products) {
  await fs.writeFile(
    ProductosGuardados,
    JSON.stringify(products, null, 2)
  )
}
