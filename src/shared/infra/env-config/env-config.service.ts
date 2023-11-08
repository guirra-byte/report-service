import { Inject, Injectable } from '@nestjs/common';
import { EnvConfig } from './dtos/env-config.contract';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvConfigService implements EnvConfig {
  constructor(@Inject('ConfigService') private configService: ConfigService) { }

  nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV');
  }

  port(): number {
    return Number(this.configService.get<number>('APP_PORT'));
  }

  host(): string {
    return this.configService.get<string>('APP_HOST');
  }

  redisPort(): number {
    return Number(this.configService.get<number>('REDIS_PORT'));
  }

  redisHost(): string {
    return this.configService.get('REDIS_HOST');
  }

  redisCacheKeys(): string[] {
    const redisCacheKeys = [];

    for (const key in process.env) {
      if (key.includes('_CACHE_KEY')) {
        const cacheKey = this.configService.get(process.env[key]);

        if (cacheKey) {
          redisCacheKeys.push(cacheKey);
        }
      }
    }

    return redisCacheKeys;
  }
}
