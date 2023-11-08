import { Module } from '@nestjs/common';
import { LogsService } from './logs.service';
import { LogsController } from './logs.controller';
import { BullModule } from '@nestjs/bull';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

BullModule.registerQueue({
  prefix: 'logs@',
  name: 'logs',
  redis: {
    port: Number(process.env.REDIS_PORT),
    host: process.env.REDIS_HOST,
  },
});

@Module({
  controllers: [LogsController],
  providers: [
    LogsService,
    {
      provide: 'PrismaService',
      useClass: PrismaService,
    },
    {
      provide: 'EventService',
      useClass: EventEmitter2,
    },
  ],
})
export class LogsModule { }
