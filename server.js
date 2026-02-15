process.on("unhandledRejection", (reason) => {
  console.error("❌ unhandledRejection:", reason)
})

import express from "express"
import handlebars from "express-handlebars"
import {__dirname} from "./utils.js"
import { Server } from "socket.io"
import path from "path"
import fs from "fs/promises"

import { Productosarray } from "./manager/ProductManager.js"


const app = express()

const rutarchivo = __dirname

app.use (express.json())
app.use(express.urlencoded({ extended: true }))

app.use(express.static(path.join(rutarchivo, "public")))

app.engine("handlebars", handlebars.engine());
app.set("view engine", "handlebars");
app.set("views", path.join(rutarchivo, "views"));

//sino existe creo la carpeta
const CarpetaImagenes = path.join(rutarchivo, "data", "imagenes")
try {
    await fs.mkdir(CarpetaImagenes, {recursive:true})
} catch (error){ 
    console.error (`error al ingresar a la carpeta "imagenes"`, error)
}

console.log("DIR BASE:", __dirname)
console.log("CARPETA IMAGENES:", CarpetaImagenes)

app.get("/imagenes/:nombre", async (req, res) => {
  const NombreImagenGuardado = req.params.nombre
  const rutaCompleta = path.join(CarpetaImagenes, NombreImagenGuardado)

  try {
    await fs.access(rutaCompleta)
    res.sendFile(rutaCompleta)
  } catch (error) {
    res.status(404).send("Imagen no encontrada")
  }
})

//muestro productos
app.get(`/RealTimeProducts`, async(req, res)=>{
    let products = await Productosarray()
    res.render("RealTimeProducts", { products })
})


const httpServer = app.listen (8081, ()=> {
    console.log("Escuchando al puerto 8081")
})

const socketServer = new Server(httpServer)

app.set("io", socketServer)

import productsRouter from "./routes/products.router.js"
app.use("/", productsRouter)

//cada vez que alguien ingresa se vuelve a leer el archivo Json y se le muestra todo actualizadoo
socketServer.on(`connection`,async(socket)=>{
    console.log(`se conecto el cliente`, socket.id)

    const productsactual = await Productosarray()

    socket.emit("products", productsactual)

    socket.on(`disconnect`, ()=>{
        console.log(`cliente desconectado`, socket.id)
    })

    socket.emit(`Saludo`, `Bienvenido`)
})