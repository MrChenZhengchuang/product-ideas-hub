import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || '127.0.0.1',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'product_ideas',
    waitForConnections: true,
    connectionLimit: 10
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'replace-with-a-secure-secret',
    expiresIn: Number(process.env.JWT_EXPIRES_IN || 43200)
  }
};
