import cookieParser from "cookie-parser"
import cors from "cors"
import dotenv from "dotenv"
import express from "express"
import morgan from "morgan"
import { errorHandler, routeNotFound } from "./middlewares/errorMiddleware.js"
import { dbConnection } from "./utils/index.js"
import routes from "./routes/index.js"

import path from "path"

dotenv.config()

await dbConnection()

const PORT = process.env.PORT || 5000

const app = express()

app.use(
    cors({
        origin: ["https://task-manager-abhi.netlify.app", "http://localhost:3000", "http://localhost:3001"],
        methods: ["GET", "POST", "DELETE", "PUT"],
        credentials: true,
    })
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(cookieParser())

app.use(morgan("dev"))
app.use("/api", routes)

const __dirname = path.resolve()

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "/client/dist")))

    app.get("*", (req, res) =>
        res.sendFile(path.resolve(__dirname, "client", "dist", "index.html"))
    )
} else {
    app.get("/", (req, res) => res.send("Server is running"))
}

app.use(routeNotFound)
app.use(errorHandler)

app.listen(PORT, () => console.log(`Server listening on ${PORT}`))
