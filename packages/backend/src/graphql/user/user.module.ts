import { Module } from '@nestjs/common';
import { FlockDatabaseModule } from '~/database/flock/flock.module';
import { UserDatabaseModule } from '~/database/user/user.module';
import { UtilModule } from '~/util/util.module';
import { UserResolver } from './user.resolver';

@Module({
  imports: [FlockDatabaseModule, UserDatabaseModule, UtilModule],
  providers: [UserResolver],
})
export class UserGraphQLModule {}
