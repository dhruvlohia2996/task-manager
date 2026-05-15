import jwt from "jsonwebtoken"
import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"
import User from "../models/user.js"
import Task from "../models/task.js"

export const dbConnection = async () => {
    try {
        // Try to connect to existing URI
        try {
            await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 2000,
            })
            console.log("DB connection established to remote cluster")
        } catch (remoteError) {
            console.warn("Remote DB connection failed, starting In-Memory MongoDB...")
            const mongod = await MongoMemoryServer.create()
            const uri = mongod.getUri()
            await mongoose.connect(uri)
            console.log("In-Memory DB connection established")
        }

        // Final check to ensure connection is ready before any queries
        if (mongoose.connection.readyState !== 1) {
            throw new Error("Database connection not ready")
        }

        // Seed a default admin user for convenience if DB is empty
        const adminExists = await User.findOne({ isAdmin: true })
        if (!adminExists) {
            const admin = await User.create({
                name: "Admin User",
                email: "admin@example.com",
                password: "password123",
                isAdmin: true,
                role: "Admin",
                title: "System Administrator"
            })
            console.log("Default Admin Seeded: admin@example.com / password123")

            // Seed some sample tasks for the admin
            const taskCount = await Task.countDocuments()
            if (taskCount === 0) {
                await Task.create([
                    {
                        title: "Setup Project Environment",
                        team: [admin._id],
                        stage: "todo",
                        priority: "high",
                        date: new Date(),
                        activities: [{ type: "assigned", activity: "Project setup started", by: admin._id }]
                    },
                    {
                        title: "Fix Backend Proxy Issues",
                        team: [admin._id],
                        stage: "in progress",
                        priority: "medium",
                        date: new Date(),
                        activities: [{ type: "assigned", activity: "Fixing port mismatch", by: admin._id }]
                    },
                    {
                        title: "Resolve Linting Warnings",
                        team: [admin._id],
                        stage: "completed",
                        priority: "low",
                        date: new Date(),
                        activities: [{ type: "assigned", activity: "Cleaned up ESLint errors", by: admin._id }]
                    }
                ])
                console.log("Sample Tasks Seeded")
            }
        }
        
        // Disable buffering after connection is established and seeded
        mongoose.set("bufferCommands", false)
    } catch (error) {
        console.error("Critical DB Error: ", error.message)
    }
}

export const createJWT = (res, userId) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "1d",
    })

    // Change sameSite from strict to none when you deploy your app
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: process.env.NODE_ENV === "development" ? "strict" : "none",
        maxAge: 1 * 24 * 60 * 60 * 1000, //1 day
    })
}
