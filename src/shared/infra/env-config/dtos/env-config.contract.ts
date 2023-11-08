export interface EnvConfig {
  nodeEnv(): string;

  port(): number;
  host(): string;

  redisPort(): number;
  redisHost(): string;
  redisCacheKeys(): string[];
}
