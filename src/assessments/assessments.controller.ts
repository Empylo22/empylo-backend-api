import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { AssessmentType } from '@prisma/client';

@ApiTags('assessments')
@Controller('assessment')
export class AssessmentsController {
  constructor(private readonly assessmentService: AssessmentsService) {}

  @ApiOperation({ summary: 'Create a new assessment' })
  @Post('create-assessment')
  create(@Body() createAssessmentDto: CreateAssessmentDto) {
    return this.assessmentService.create(createAssessmentDto);
  }

  @ApiOperation({ summary: 'Get assessments by type and date or week' })
  @ApiQuery({ name: 'type', enum: AssessmentType, required: true })
  @ApiQuery({ name: 'date', type: 'string', required: false })
  @ApiQuery({ name: 'weekNumber', type: 'string', required: false })
  @Get('get-assessments-by-type')
  getAssessmentsByTypeAndDateOrWeek(
    @Query('type') type: AssessmentType,
    @Query('date') date: string | null = null,
    @Query('weekNumber') weekNumber: string | null = null,
  ) {
    const parsedDate = date ? new Date(date) : null;
    const parsedWeekNumber = weekNumber ? parseInt(weekNumber, 10) : null;

    return this.assessmentService.getAssessmentsByTypeAndDateOrWeek(
      type,
      parsedDate,
      parsedWeekNumber,
    );
  }

  @ApiOperation({ summary: 'Get all assessments' })
  @Get('get-all-assessments')
  findAll() {
    return this.assessmentService.findAll();
  }

  @ApiOperation({ summary: 'Get assessments by type' })
  @ApiQuery({ name: 'type', enum: AssessmentType, required: true })
  @Get('get-all-assessments-by-type')
  getAssessmentsByType(@Query('type') type: AssessmentType) {
    return this.assessmentService.getAssessmentsByType(type);
  }

  @ApiOperation({ summary: 'Get an assessment by ID' })
  @ApiParam({ name: 'id', type: 'string', required: true })
  @Get('get-assessment:id')
  findOne(@Param('id') id: string) {
    return this.assessmentService.findOne(+id);
  }

  @ApiOperation({ summary: 'Update an assessment by ID' })
  @ApiParam({ name: 'id', type: 'string', required: true })
  @Patch('update-assessment:id')
  update(
    @Param('id') id: string,
    @Body() updateAssessmentDto: UpdateAssessmentDto,
  ) {
    return this.assessmentService.update(+id, updateAssessmentDto);
  }

  @ApiOperation({ summary: 'Delete an assessment by ID' })
  @ApiParam({ name: 'id', type: 'string', required: true })
  @Delete('delete-assessment:id')
  remove(@Param('id') id: string) {
    return this.assessmentService.remove(+id);
  }

  @ApiOperation({ summary: 'Save an answer for a question' })
  @Post('save-user-answer')
  saveAnswer(
    @Body('userId') userId: number,
    @Body('questionId') questionId: number,
    @Body('answerText') answerText: string,
  ) {
    return this.assessmentService.saveAnswer(userId, questionId, answerText);
  }

  @ApiOperation({ summary: 'Get answers for an assessment' })
  @ApiParam({ name: 'assessmentId', type: 'string', required: true })
  @Get(':assessmentId/answers')
  getAnswersForAssessment(@Param('assessmentId') assessmentId: string) {
    return this.assessmentService.getAnswersForAssessment(+assessmentId);
  }

  @ApiOperation({ summary: 'Get answers for a user and assessment' })
  @ApiParam({ name: 'userId', type: 'string', required: true })
  @ApiParam({ name: 'assessmentId', type: 'string', required: true })
  @Get(':userId/answers/:assessmentId')
  getAnswersForUserAndAssessment(
    @Param('userId') userId: string,
    @Param('assessmentId') assessmentId: string,
  ) {
    return this.assessmentService.getAnswersForUserAndAssessment(
      +userId,
      +assessmentId,
    );
  }

  @ApiOperation({ summary: "Get a user's answers for an assessment" })
  @ApiParam({ name: 'userId', type: 'string', required: true })
  @ApiQuery({ name: 'type', enum: AssessmentType, required: true })
  @ApiQuery({ name: 'date', type: 'string', required: false })
  @ApiQuery({ name: 'weekNumber', type: 'string', required: false })
  @Get(':userId/answers')
  getUserAnswersForAssessment(
    @Param('userId') userId: string,
    @Query('type') type: AssessmentType,
    @Query('date') date: string | null = null,
    @Query('weekNumber') weekNumber: string | null = null,
  ) {
    const parsedDate = date ? new Date(date) : null;
    const parsedWeekNumber = weekNumber ? parseInt(weekNumber, 10) : null;

    return this.assessmentService.getUserAnswersForAssessment(
      +userId,
      type,
      parsedDate,
      parsedWeekNumber,
    );
  }

  @ApiOperation({ summary: "Get all users' answers for an assessment" })
  @ApiQuery({ name: 'type', enum: AssessmentType, required: true })
  @ApiQuery({ name: 'date', type: 'string', required: false })
  @ApiQuery({ name: 'weekNumber', type: 'string', required: false })
  @Get('/answers')
  getAllUsersAnswersForAssessment(
    @Query('type') type: AssessmentType,
    @Query('date') date: string | null = null,
    @Query('weekNumber') weekNumber: string | null = null,
  ) {
    const parsedDate = date ? new Date(date) : null;
    const parsedWeekNumber = weekNumber ? parseInt(weekNumber, 10) : null;

    return this.assessmentService.getAllUsersAnswersForAssessment(
      type,
      parsedDate,
      parsedWeekNumber,
    );
  }
}
