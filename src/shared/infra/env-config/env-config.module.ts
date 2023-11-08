import { DynamicModule, Module } from '@nestjs/common';
import { EnvConfigService } from './env-config.service';
import {
  ConfigModule,
  ConfigModuleOptions,
  ConfigService,
} from '@nestjs/config';
import { EnvConfigController } from './env-config.controller';
import { join } from 'path';

@Module({
  providers: [
    EnvConfigService,
    {
      provide: 'ConfigService',
      useClass: ConfigService,
    },
  ],
  controllers: [EnvConfigController],
})
export class EnvConfigModule extends ConfigModule {
  static forRoot(options: ConfigModuleOptions = {}): DynamicModule {
    return super.forRoot({
      ...options,
      envFilePath: [join(__dirname, '../../../../.env')],
    });
  }
}
