import express from "express"
const app = express();
import dotenv from "dotenv"
import { connectDatabase } from "./config/dbConnect.js";
import errorMiddleware from "./middlewares/errors.js"

// Handle Uncaught exceptions
process.on("uncaughtException", (err) => {
    console.log('ERROR:', err.name, err.message),
        console.log("Shutting down the server due to Uncaught Exception");
    process.exit(1)
})

dotenv.config({ path: "backend/config/config.env" });

// Connecting to Database
connectDatabase()

app.use(express.json())

// Import all routes
import productRoutes from "./routes/products.js"
import authRoutes from "./routes/auth.js"

app.use("/api/v1", productRoutes)
app.use("/api/v1", authRoutes)

// Middleware to handle errors
app.use(errorMiddleware)

const server = app.listen(process.env.PORT || 4000, () => {
    console.log(`Server started on PORT: ${process.env.PORT} in ${process.env.NODE_ENV}`);
})

// Handle Unhandled Promise Rejections
process.on("unhandledRejection", (err) => {
    console.log('ERROR: ', err.name, err.message);
    console.log('Shutting down the server due to Unhandled Promise Rejection');
    server.close(() => {
        process.exit(1);
    });
})