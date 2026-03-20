export interface Env {
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_DATABASE: string;
  NODE_ENV: 'development' | 'production' | 'test';
  JWT_SECRET: string;
}
