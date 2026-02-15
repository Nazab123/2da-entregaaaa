// En el router no existe la variable socketServer.
// Por eso en server.js hacemos:
// app.set("io", socketServer)
// Así guardamos el socket dentro de la app.
// Después, en el router, lo recuperamos con:
// const io = req.app.get("io")
// Eso nos devuelve el mismo socketServer para poder usar io.emit().

// Router de productos (HTTP). Acá manejamos: crear/borrar productos.
// También configuramos Multer para guardar imágenes en /data/imagenes.

import { Router } from "express"
import multer from "multer"
import path from "path"
import fs from "fs/promises"

import { __dirname } from "../utils.js"
import { Productosarray, ProxId, GuardarProductos } from "../manager/ProductManager.js"

const router = Router()

// ✅ 1) Asegurar carpeta de imágenes
const CarpetaImagenes = path.join(__dirname, "data", "imagenes")
await fs.mkdir(CarpetaImagenes, { recursive: true })

// ✅ 2) Configurar Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, CarpetaImagenes)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname)
  },
})

const upload = multer({ storage })

// ✅ Crear producto (con imagen opcional)
router.post("/products", upload.single("thumbnail"), async (req, res) => {
  const io = req.app.get("io")

  const { name, description, price, stock, code } = req.body
  const thumbnail = req.file ? "/imagenes/" + req.file.filename : ""

  let products = await Productosarray()

  const product = {
    name,
    description,
    price: Number(price),
    stock: Number(stock),
    thumbnail,
    code,
    id: ProxId(products),
  }

  products.push(product)
  await GuardarProductos(products)

  io.emit("products", products)

  // Si tu vista se llama /RealTimeProducts y así lo tenés en views router:
  res.redirect("/RealTimeProducts")
})

// ✅ Borrar producto
router.delete("/products/:id", async (req, res) => {
  const io = req.app.get("io")

  const IdABorrar = Number(req.params.id)
  let products = await Productosarray()

  for (let i = 0; i < products.length; i++) {
    if (products[i].id === IdABorrar) {
      products.splice(i, 1)

      await GuardarProductos(products)
      io.emit("products", products)

      return res.json({ status: "Producto eliminado correctamente" })
    }
  }

  return res.status(404).json({ error: `No se encontró el producto de id= ${IdABorrar}` })
})

export default router
