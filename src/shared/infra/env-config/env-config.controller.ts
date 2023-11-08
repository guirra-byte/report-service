import { Controller, Get } from '@nestjs/common';
import { EnvConfigService } from './env-config.service';

@Controller('env-config')
export class EnvConfigController {
  constructor(private readonly envConfigService: EnvConfigService) { }

  @Get('/node_env')
  nodeEnv(): string {
    return this.envConfigService.nodeEnv();
  }

  @Get('/port')
  port(): number {
    return this.envConfigService.port();
  }

  @Get('/host')
  host(): string {
    return this.envConfigService.host();
  }

  @Get('/redis/port')
  redisPort(): number {
    return this.envConfigService.redisPort();
  }

  @Get('/redis/host')
  redisHost(): string {
    return this.envConfigService.redisHost();
  }

  @Get('/redis/keys')
  redisCacheKeys(): string[] {
    return this.envConfigService.redisCacheKeys();
  }
}
