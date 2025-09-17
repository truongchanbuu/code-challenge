import dotenv from "dotenv";
dotenv.config();

export const configs = {
    port: process.env.PORT || 3000,
};
