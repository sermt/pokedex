export const EnvConfiguration = () => ({
  environment: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  mongodb: process.env.MONGODB || 'mongodb://localhost:27017/pokedex',
  defaultLimit: Number(process.env.DEFAULT_LIMIT) || 10,
});
