/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReportsModule } from './modules/reports/reports.module';
import { PrismaModule } from './prisma/prisma.module';
import type { RedisClientOptions } from 'redis';
import { redisStore } from 'cache-manager-redis-store';
import { CacheModule } from '@nestjs/cache-manager';
import { LogsModule } from './modules/logs/logs.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    ReportsModule,
    PrismaModule,
    LogsModule,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
