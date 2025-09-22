import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from 'dotenv'
dotenv.config();
export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  migrations: ["src/migrations/*.ts"],
  logging: false,
  entities: [__dirname + "/../models/*.{ts,js}"],
});

export const initDatabase = async () => {
  try {
    await AppDataSource.initialize()
    console.log("Connected to Database");
  } catch (error) {
    console.log("Failed to connect to DB")
    console.error(error);
  }
}