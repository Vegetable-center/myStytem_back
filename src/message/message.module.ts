import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { Message } from './entities/message.entity';
import { UserFollow } from '../user/entities/user-follow.entity'
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Message,
      UserFollow,
      User,
    ]),
  ],
  controllers: [MessageController],
  providers: [MessageService],
})
export class MessageModule {}