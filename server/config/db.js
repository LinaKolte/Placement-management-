const mongoose = require("mongoose");

const connectDB = async () => {
    const isVercel = Boolean(process.env.VERCEL);
    if (!process.env.MONGO_URI) {
        console.warn("MONGO_URI is not set. Starting server without MongoDB.");
        return false;
    }

    const connectionOptions = {
        serverSelectionTimeoutMS: isVercel ? 5000 : 30000,
        connectTimeoutMS: isVercel ? 5000 : 10000,
        socketTimeoutMS: 45000,
        retryWrites: true,
        family: 4,
    };

    let lastError;
    const maxAttempts = isVercel ? 1 : 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            await mongoose.connect(process.env.MONGO_URI, connectionOptions);
            console.log("MongoDB Atlas Connected");
            return true;
        } catch (error) {
            lastError = error;
            const message = error?.message || String(error);
            const stack = error?.stack || "";

            console.error(`MongoDB Connection Attempt ${attempt} Failed:`, message);
            if (stack) console.error(stack);

            if (message.includes("SSL") || message.includes("CERT") || message.includes("TLS")) {
                console.warn(
                    "SSL/TLS connection to MongoDB failed. Verify the Atlas URI, outbound network access, and system certificate trust store."
                );
            }

            if (attempt < maxAttempts) {
                await mongoose.disconnect().catch(() => {});
                await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
            }
        }
    }

    console.error(
        `MongoDB connection failed after ${maxAttempts} attempt(s). Continuing startup without MongoDB. Last error: ${lastError?.message || "unknown error"}`
    );
    return false;
};

module.exports = connectDB;