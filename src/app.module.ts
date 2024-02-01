/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Module } from '@nestjs/common';
import { ReportsModule } from './modules/reports/reports.module';
import { PrismaModule } from './prisma/prisma.module';
import type { RedisClientOptions } from 'redis';
import { redisStore } from 'cache-manager-redis-store';
import { CacheModule } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import { EnvConfigModule } from './shared/infra/env-config/env-config.module';

@Module({
  imports: [
    ConfigModule,
    ReportsModule,
    PrismaModule,
    EventEmitterModule.forRoot(),
    CacheModule.register<RedisClientOptions>({
      //@ts-ignore
      store: async () =>
        await redisStore({
          socket: {
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT),
          },
        }),
      isGlobal: true,
    }),
    EnvConfigModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
