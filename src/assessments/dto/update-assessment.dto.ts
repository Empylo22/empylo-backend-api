import { ApiProperty } from '@nestjs/swagger';
import { AssessmentType } from '@prisma/client';

export class UpdateAssessmentDto {
  @ApiProperty({
    enum: AssessmentType,
    description: 'Type of the assessment (daily or weekly)',
  })
  type: AssessmentType;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'ID of the topic' },
        name: { type: 'string', description: 'Name of the topic' },
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'ID of the question' },
              text: { type: 'string', description: 'Text of the question' },
            },
          },
        },
      },
    },
    description: 'Array of topics with their questions',
  })
  topics: {
    id: number;
    name: string;
    questions: {
      id: number;
      text: string;
    }[];
  }[];
}

// import { PartialType } from '@nestjs/swagger';
// import { CreateAssessmentDto } from './create-assessment.dto';

// export class UpdateAssessmentDto extends PartialType(CreateAssessmentDto) {}
