import { Test, TestingModule } from '@nestjs/testing';
import { EnvConfigController } from '../env-config.controller';
import { EnvConfigModule } from '../env-config.module';
import { EnvConfigService } from '../env-config.service';
import { ConfigService } from '@nestjs/config';

describe('EnvConfigController - [integration tests]', () => {
  let envConfigController: EnvConfigController;
  let envConfigService: EnvConfigService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [EnvConfigController],
      imports: [EnvConfigModule.forRoot()],
      providers: [
        EnvConfigService,
        {
          provide: 'ConfigService',
          useClass: ConfigService,
        },
      ],
    }).compile();

    envConfigService = moduleRef.get<EnvConfigService>(EnvConfigService);
    envConfigController =
      moduleRef.get<EnvConfigController>(EnvConfigController);
  });

  it('should be defined', () => {
    expect(envConfigController).toBeDefined();
  });

  it('should be able to get application running node environment', async () => {
    const result = 'test';
    jest.spyOn(envConfigService, 'nodeEnv').mockImplementation(() => result);

    expect(envConfigController.nodeEnv()).toBe(result);
  });

  it('should be able to get application running port', async () => {
    const result = Number(process.env.APP_PORT);
    jest.spyOn(envConfigService, 'port').mockImplementation(() => result);

    expect(envConfigController.port()).toBe(result);
  });

  it('should be able to get application running host', async () => {
    const result = 'http://localhost';
    jest.spyOn(envConfigService, 'host').mockImplementation(() => result);

    expect(envConfigController.host()).toBe(result);
  });

  it('should be able to get redis config variables', async () => {
    const [redisPort, redisHost] = [
      Number(process.env.REDIS_PORT),
      process.env.REDIS_HOST,
    ];

    jest
      .spyOn(envConfigService, 'redisPort')
      .mockImplementation(() => redisPort);

    jest
      .spyOn(envConfigService, 'redisHost')
      .mockImplementation(() => redisHost);

    expect(envConfigController.redisPort()).toBe(redisPort);
    expect(envConfigController.redisHost()).toBe(redisHost);
  });

  it('should be able to get redis queue keys', async () => {
    const result: string[] = [];

    for (const key in process.env) {
      if (key.includes('_CACHE_KEY')) {
        result.push(process.env[key]);
      }
    }

    jest
      .spyOn(envConfigService, 'redisCacheKeys')
      .mockImplementation(() => result);

    expect(envConfigController.redisCacheKeys()).toBe(result);
  });
});
