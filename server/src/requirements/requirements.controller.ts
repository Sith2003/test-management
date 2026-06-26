import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { RequirementsService } from './requirements.service';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { UpdateRequirementDto } from './dto/update-requirement.dto';
import { ListRequirementsQuery } from './dto/list-requirements.query';
import { CurrentUser, JwtPayload } from '../shared/decorators/current-user.decorator';
import { IsUUID } from 'class-validator';

class LinkTestCaseDto {
  @IsUUID()
  testCaseId!: string;
}

@ApiTags('Requirements')
@ApiBearerAuth()
@Controller({ path: 'projects/:projectId/requirements', version: '1' })
export class RequirementsController {
  constructor(private readonly requirementsService: RequirementsService) {}

  @Get('coverage')
  @ApiOperation({ summary: 'Get requirements coverage statistics' })
  @ApiParam({ name: 'projectId' })
  getCoverage(@Param('projectId') projectId: string, @CurrentUser() user: JwtPayload) {
    return this.requirementsService.getCoverage(projectId, user);
  }

  @Get('traceability')
  @ApiOperation({ summary: 'Get traceability matrix — requirements with linked test cases, execution status and open defects' })
  @ApiParam({ name: 'projectId' })
  getTraceability(@Param('projectId') projectId: string, @CurrentUser() user: JwtPayload) {
    return this.requirementsService.getTraceability(projectId, user);
  }

  @Get()
  @ApiOperation({ summary: 'List requirements with linked test case count' })
  @ApiParam({ name: 'projectId' })
  findAll(
    @Param('projectId') projectId: string,
    @Query() query: ListRequirementsQuery,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.requirementsService.findAll(projectId, user, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create requirement' })
  @ApiParam({ name: 'projectId' })
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateRequirementDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.requirementsService.create(projectId, dto, user);
  }

  @Get(':requirementId')
  @ApiOperation({ summary: 'Get requirement detail with linked test cases' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'requirementId' })
  findOne(
    @Param('projectId') projectId: string,
    @Param('requirementId') requirementId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.requirementsService.findOne(projectId, requirementId, user);
  }

  @Patch(':requirementId')
  @ApiOperation({ summary: 'Update requirement' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'requirementId' })
  update(
    @Param('projectId') projectId: string,
    @Param('requirementId') requirementId: string,
    @Body() dto: UpdateRequirementDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.requirementsService.update(projectId, requirementId, dto, user);
  }

  @Delete(':requirementId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete requirement (MANAGER+)' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'requirementId' })
  remove(
    @Param('projectId') projectId: string,
    @Param('requirementId') requirementId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.requirementsService.remove(projectId, requirementId, user);
  }

  @Post(':requirementId/link')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Link a test case to a requirement (QA+)' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'requirementId' })
  linkTestCase(
    @Param('projectId') projectId: string,
    @Param('requirementId') requirementId: string,
    @Body() dto: LinkTestCaseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.requirementsService.linkTestCase(projectId, requirementId, dto.testCaseId, user);
  }

  @Delete(':requirementId/link/:testCaseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unlink a test case from a requirement (QA+)' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'requirementId' }) @ApiParam({ name: 'testCaseId' })
  unlinkTestCase(
    @Param('projectId') projectId: string,
    @Param('requirementId') requirementId: string,
    @Param('testCaseId') testCaseId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.requirementsService.unlinkTestCase(projectId, requirementId, testCaseId, user);
  }

  // ── Documents ──────────────────────────────────────────────────────────────

  @Get(':requirementId/documents')
  @ApiOperation({ summary: 'List documents for a requirement' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'requirementId' })
  getDocuments(
    @Param('projectId') projectId: string,
    @Param('requirementId') requirementId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.requirementsService.getDocuments(projectId, requirementId, user);
  }

  @Post(':requirementId/documents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload a document to a requirement (QA+)' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'requirementId' })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } }))
  uploadDocument(
    @Param('projectId') projectId: string,
    @Param('requirementId') requirementId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.requirementsService.uploadDocument(projectId, requirementId, file, user);
  }

  @Delete(':requirementId/documents/:documentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a document from a requirement (QA+)' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'requirementId' }) @ApiParam({ name: 'documentId' })
  deleteDocument(
    @Param('projectId') projectId: string,
    @Param('requirementId') requirementId: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.requirementsService.deleteDocument(projectId, requirementId, documentId, user);
  }
}
