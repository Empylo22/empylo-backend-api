import { Module } from '@nestjs/common';
import { CirclesService } from './circles.service';
import { CirclesController } from './circles.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [CirclesController],
  providers: [CirclesService],
})
export class CirclesModule {}
