import { Test, TestingModule } from '@nestjs/testing';
import { EnvConfigService } from '../env-config.service';
import { EnvConfigModule } from '../env-config.module';
import { ConfigService } from '@nestjs/config';

describe('EnvConfigService - [unit tests]', () => {
  let sut: EnvConfigService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [EnvConfigModule.forRoot()],
      providers: [
        EnvConfigService,
        {
          provide: 'ConfigService',
          useClass: ConfigService,
        },
      ],
    }).compile();

    sut = moduleRef.get<EnvConfigService>(EnvConfigService);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should be able to get application running port', () => {
    const applicationPortCaller = jest.spyOn(sut, 'port');
    const applicationPort = sut.port();

    expect(applicationPortCaller).toHaveBeenCalled();
    expect(applicationPort).not.toBeUndefined();
  });

  it('should be able to get application running host', () => {
    const applicationHostCaller = jest.spyOn(sut, 'host');
    const applicationHost = sut.host();

    expect(applicationHostCaller).toHaveBeenCalled();
    expect(applicationHost).not.toBeUndefined();
  });

  it('should be able to get redis running port', () => {
    const redisPortCaller = jest.spyOn(sut, 'redisPort');
    const redisPort = sut.redisPort();

    expect(redisPortCaller).toHaveBeenCalled();
    expect(redisPort).not.toBeUndefined();
  });

  it('should be able to get redis running host', () => {
    const redisHostCaller = jest.spyOn(sut, 'redisHost');
    const redisHost = sut.redisHost();

    expect(redisHostCaller).toHaveBeenCalled();
    expect(redisHost).not.toBeUndefined();
  });

  it('should be able to get redis keys', () => {
    const redisKeysCaller = jest.spyOn(sut, 'redisCacheKeys');
    const redisKeys = sut.redisCacheKeys();

    expect(redisKeysCaller).toHaveBeenCalled();
    expect(redisKeys).not.toBeUndefined();
  });
});
