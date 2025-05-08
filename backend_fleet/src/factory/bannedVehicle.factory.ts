import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import * as path from 'path';
import { parseCsvFile } from 'src/utils/utils';

@Injectable()
export class BannedVehicleFactoryService {
  private readonly cvsPath = path.resolve(process.cwd(), 'files/BANNED.csv');

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async createDefaultBanned(): Promise<void> {
    const bannedData = await parseCsvFile(this.cvsPath);
    const pipeline = this.redis.pipeline();
    for (const ban of bannedData) {
      const key = 'banned:vehicles';
      pipeline.sadd(key, ban.veId);
    }
    await pipeline.exec();
  }
}
