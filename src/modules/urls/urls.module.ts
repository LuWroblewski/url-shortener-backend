import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from 'src/common/cache/cache.module';
import { Url } from './entities/url.entity';
import { UrlsController } from './urls.controller';
import { UrlsService } from './urls.service';

@Module({
  imports: [TypeOrmModule.forFeature([Url]), ConfigModule, CacheModule],
  controllers: [UrlsController],
  providers: [UrlsService],
  exports: [TypeOrmModule, UrlsService],
})
export class UrlsModule {}
