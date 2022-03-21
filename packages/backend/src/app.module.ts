import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExpressConfigModule } from '~/config/expressConfig.module';
import { LoggerModule } from '~/logger/module';

@Module({
  imports: [ExpressConfigModule, LoggerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
