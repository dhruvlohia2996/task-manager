import cookieParser from "cookie-parser"
import cors from "cors"
import dotenv from "dotenv"
import express from "express"
import morgan from "morgan"
import { errorHandler, routeNotFound } from "./middlewares/errorMiddleware.js"
import { dbConnection } from "./utils/index.js"
import routes from "./routes/index.js"

import path from "path"

import { fileURLToPath } from "url"

dotenv.config()

const PORT = process.env.PORT || 5000

const app = express()

app.use(
    cors({
        origin: (origin, callback) => {
            const allowedOrigins = [
                "https://task-manager-abhi.netlify.app",
                "http://localhost:3000",
                "http://localhost:3001",
            ]
            if (!origin || allowedOrigins.includes(origin) || origin.includes("railway.app")) {
                callback(null, true)
            } else {
                callback(new Error("Not allowed by CORS"))
            }
        },
        methods: ["GET", "POST", "DELETE", "PUT"],
        credentials: true,
    })
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(cookieParser())

app.use(morgan("dev"))
app.use("/api", routes)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../client/dist")))

    app.get("*", (req, res) =>
        res.sendFile(path.resolve(__dirname, "..", "client", "dist", "index.html"))
    )
} else {
    app.get("/", (req, res) => res.send("Server is running"))
}

app.use(routeNotFound)
app.use(errorHandler)

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`)
    dbConnection()
})
