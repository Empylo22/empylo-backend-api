import { ApiProperty } from '@nestjs/swagger';
import { AssessmentType } from '@prisma/client';

export class CreateAssessmentDto {
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
        name: { type: 'string', description: 'Name of the topic' },
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string', description: 'Text of the question' },
            },
          },
        },
      },
    },
    description: 'Array of topics with their questions',
  })
  topics: {
    name: string;
    questions: {
      text: string;
    }[];
  }[];
}
