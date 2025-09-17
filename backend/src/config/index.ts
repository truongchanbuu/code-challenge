import dotenv from "dotenv";
dotenv.config();

export const configs = {
    port: process.env.PORT || 3000,
    origins: process.env.CORS_ORIGIN?.split(",") || "http://localhost:3000",
};
