import { PartialType } from '@nestjs/swagger';
import { CreateCircleDto } from './create-circle.dto';
import { CreateCircleWithMembersDto } from './create-circle-with-members.dto';

export class UpdateCircleDto extends PartialType(CreateCircleWithMembersDto) {}
