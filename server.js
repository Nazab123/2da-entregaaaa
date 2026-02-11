process.on("unhandledRejection", (reason) => {
  console.error("❌ unhandledRejection:", reason)
})

import express from "express"
import handlebars, { engine } from "express-handlebars"
import {__dirname} from "./utils.js"
import { Server } from "socket.io"
import multer from "multer"
import path from "path"
import fs from "fs/promises"

const app = express()

const rutarchivo = __dirname

app.use (express.json())
app.use(express.urlencoded({ extended: true }))

app.use(express.static(path.join(rutarchivo, "public")))

app.engine("handlebars", handlebars.engine());
app.set("view engine", "handlebars");
app.set("views", path.join(rutarchivo, "views"));

const CarpetaImagenes = path.join(rutarchivo, "data", "imagenes")
try {
    await fs.mkdir(CarpetaImagenes, {recursive:true})
} catch (error){ 
    console.error (`error al ingresar a la carpeta "imagenes"`, error)
}

const ProductosGuardados = path.join(rutarchivo, "data", "products.json")
console.log("GUARDANDO EN:", ProductosGuardados)


async function Productosarray() {
    try {
    const data = await fs.readFile(ProductosGuardados, "utf-8")
    return JSON.parse(data)
  } catch (error){
  return []
    }
}
let products = []
products = await Productosarray()

//id autoincremental para products:

function ProxId(products){
    let idnew = 0

    for (let i=0; i<products.length; i++){
        if (products[i].id > idnew){
            idnew = products[i].id
        } 
    }
    return idnew + 1
}

console.log("Productos cargados:", products)

console.log("DIR BASE:", __dirname)
console.log("CARPETA IMAGENES:", CarpetaImagenes)

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, CarpetaImagenes)},

    filename: function(req, file, cb){
        const NombreImagen = Date.now() + "-" + file.originalname
        cb(null, NombreImagen)
    }
})

//muestro productos
const upload = multer({storage: storage})

app.get(`/RealTimeProducts`, async(req, res)=>{
    products = await Productosarray()
    res.render("RealTimeProducts", { products })
})


const httpServer = app.listen (8081, ()=> {
    console.log("Escuchando al puerto 8081")
})

const socketServer = new Server(httpServer)

socketServer.on(`connection`,(socket)=>{
    console.log(`se conecto el cliente`, socket.id)
    socket.emit("products", products)


    socket.on(`disconnect`, ()=>{
        console.log(`cliente desconectado`, socket.id)
    })

    socket.emit(`Saludo`, `Bienvenido`)
})

app.post("/products", upload.single("thumbnail"),async (req, res) => {
    console.log(req.body)
    console.log(req.file)
    const{name, description, price, stock, code} = req.body
    const thumbnail = req.file ? "/imagenes/" + req.file.filename : ""

    
products = await Productosarray()

 let product = { 
        name,
        description, 
        price: Number(price), 
        stock: Number(stock),
        thumbnail,
        code,
        id: ProxId(products)
    }
    products.push(product)

    await fs.writeFile(ProductosGuardados, JSON.stringify(products, null, 2))

    socketServer.emit("products", products)

    res.redirect("/RealTimeProducts")

    })

app.delete("/products/:id", async(req, res) => {
    let IdABorrar = Number (req.params.id)

    products = await Productosarray()

    for (let i=0; i < products.length; i++){
        if (products[i].id===IdABorrar){
            products.splice(i,1)

            await fs.writeFile(ProductosGuardados,
            JSON.stringify(products, null, 2))

            socketServer.emit ("products",products)

            return res.json({
                status: "Producto eliminado correctamente"
            })
        }
    }

    throw new Error (`no se encontro ${IdABorrar}`)

})