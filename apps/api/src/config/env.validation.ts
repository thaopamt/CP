import * as Joi from 'joi';

/**
 * Validated at module init by ConfigModule.forRoot. A misconfigured env
 * fails fast at boot rather than at the first DB/JWT call.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),

  DATABASE_URL: Joi.string().required(),

  JWT_SECRET: Joi.string().min(8).required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),

  CACHE_ENABLED: Joi.boolean().truthy('true').falsy('false').default(true),
  CACHE_DEFAULT_TTL_MS: Joi.number().integer().min(1).default(30000),
  CACHE_KEY_PREFIX: Joi.string().default('cp-system'),
  CACHE_MEMORY_LRU_SIZE: Joi.number().integer().min(100).default(5000),
  REDIS_URL: Joi.string().uri({ scheme: ['redis', 'rediss'] }).allow('').optional(),
});
