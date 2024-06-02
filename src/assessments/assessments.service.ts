// assessment.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { AssessmentType } from '@prisma/client';

@Injectable()
export class AssessmentsService {
  constructor(private prisma: PrismaService) {}

  async create(createAssessmentDto: CreateAssessmentDto) {
    const { type, topics } = createAssessmentDto;

    const assessment = await this.prisma.assessment.create({
      data: {
        type,
        topics: {
          create: topics.map((topic) => ({
            name: topic.name,
            questions: {
              create: topic.questions.map((question) => ({
                text: question.text,
              })),
            },
          })),
        },
      },
      include: {
        topics: {
          include: {
            questions: true,
          },
        },
      },
    });

    return assessment;
  }

  async findAll() {
    return this.prisma.assessment.findMany({
      include: {
        topics: {
          include: {
            questions: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.assessment.findUnique({
      where: { id },
      include: {
        topics: {
          include: {
            questions: true,
          },
        },
      },
    });
  }

  async update(id: number, updateAssessmentDto: UpdateAssessmentDto) {
    const { type, topics } = updateAssessmentDto;

    return this.prisma.assessment.update({
      where: { id },
      data: {
        type,
        topics: {
          updateMany: topics.map((topic) => ({
            where: { id: topic.id }, // Add the 'where' clause to filter topics by their ID
            data: {
              name: topic.name,
              questions: {
                updateMany: topic.questions.map((question) => ({
                  where: { id: question.id }, // Add the 'where' clause to filter questions by their ID
                  data: {
                    text: question.text,
                  },
                })),
              },
            },
          })),
        },
      },
      include: {
        topics: {
          include: {
            questions: true,
          },
        },
      },
    });
  }

  async remove(id: number) {
    return this.prisma.assessment.delete({ where: { id } });
  }

  async saveAnswer(userId: number, questionId: number, answerText: string) {
    return this.prisma.answer.create({
      data: {
        text: answerText,
        userId,
        questionId,
      },
    });
  }

  async getAnswersForAssessment(assessmentId: number) {
    return this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        topics: {
          include: {
            questions: {
              include: {
                answers: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getAnswersForUserAndAssessment(userId: number, assessmentId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        answers: {
          where: {
            question: {
              topic: {
                assessmentId,
              },
            },
          },
          include: {
            question: {
              include: {
                topic: true,
              },
            },
          },
        },
      },
    });
  }

  async getUserAnswersForAssessment(
    userId: number,
    assessmentType: AssessmentType,
    date: Date | null = null,
    weekNumber: number | null = null,
  ) {
    const whereClause = {
      type: assessmentType,
      createdAt: {},
    };

    if (date) {
      whereClause.createdAt = {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lt: new Date(date.setHours(23, 59, 59, 999)),
      };
    } else if (weekNumber) {
      const year = new Date().getFullYear();
      const startOfWeek = new Date(year, 0, 1 + (weekNumber - 1) * 7);
      const endOfWeek = new Date(year, 0, 1 + weekNumber * 7);

      whereClause.createdAt = {
        gte: startOfWeek,
        lt: endOfWeek,
      };
    }

    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        answers: {
          where: {
            question: {
              topic: {
                assessment: whereClause,
              },
            },
          },
          include: {
            question: {
              include: {
                topic: {
                  include: {
                    assessment: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getAllUsersAnswersForAssessment(
    assessmentType: AssessmentType,
    date: Date | null = null,
    weekNumber: number | null = null,
  ) {
    const whereClause = {
      type: assessmentType,
      createdAt: {},
    };

    if (date) {
      whereClause.createdAt = {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lt: new Date(date.setHours(23, 59, 59, 999)),
      };
    } else if (weekNumber) {
      const year = new Date().getFullYear();
      const startOfWeek = new Date(year, 0, 1 + (weekNumber - 1) * 7);
      const endOfWeek = new Date(year, 0, 1 + weekNumber * 7);

      whereClause.createdAt = {
        gte: startOfWeek,
        lt: endOfWeek,
      };
    }

    return this.prisma.answer.findMany({
      where: {
        question: {
          topic: {
            assessment: whereClause,
          },
        },
      },
      include: {
        user: true,
        question: {
          include: {
            topic: {
              include: {
                assessment: true,
              },
            },
          },
        },
      },
    });
  }

  async getAssessmentsByTypeAndDateOrWeek(
    assessmentType: AssessmentType,
    date: Date | null = null,
    weekNumber: number | null = null,
  ) {
    const whereClause = {
      type: assessmentType,
      createdAt: {},
    };

    if (date) {
      whereClause.createdAt = {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lt: new Date(date.setHours(23, 59, 59, 999)),
      };
    } else if (weekNumber) {
      const year = new Date().getFullYear();
      const startOfWeek = new Date(year, 0, 1 + (weekNumber - 1) * 7);
      const endOfWeek = new Date(year, 0, 1 + weekNumber * 7);

      whereClause.createdAt = {
        gte: startOfWeek,
        lt: endOfWeek,
      };
    }

    return this.prisma.assessment.findMany({
      where: whereClause,
      include: {
        topics: {
          include: {
            questions: true,
          },
        },
      },
    });
  }

  async getAssessmentsByType(assessmentType: AssessmentType) {
    return this.prisma.assessment.findMany({
      where: {
        type: assessmentType,
      },
      include: {
        topics: {
          include: {
            questions: true,
          },
        },
      },
    });
  }
}
