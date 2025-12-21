import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource({
  type: isProduction ? "postgres" : "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || (isProduction ? 5432 : 3306),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: false,
  entities: [__dirname + "/../models/*.{ts,js}"],
  migrations: [__dirname + "/../migrations/*.{ts,js}"],
  
  // Chỉ bật SSL khi dùng Postgres
  ...(isProduction ? {
      ssl: { rejectUnauthorized: false } 
  } : {}),
});

export const initDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log(`Connected to Database (${isProduction ? 'Postgres/Supabase' : 'MySQL/Local'})`);
    // Tự động chạy migration khi khởi động
    const migrations = await AppDataSource.runMigrations();
    if (migrations.length > 0) {
      console.log(`Executed ${migrations.length} migration(s)`);
    }
  } catch (error) {
    console.log("Failed to connect to DB");
    console.error(error);
  }
};