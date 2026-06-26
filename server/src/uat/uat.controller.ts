import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { UatService } from './uat.service';
import { CreateUatSessionDto } from './dto/create-uat-session.dto';
import { AddUatCasesDto } from './dto/add-uat-cases.dto';
import { UpdateUatResultDto } from './dto/update-uat-result.dto';
import { SignOffUatDto } from './dto/sign-off-uat.dto';
import { CurrentUser, JwtPayload } from '../shared/decorators/current-user.decorator';

@ApiTags('UAT')
@ApiBearerAuth()
@Controller({ path: 'projects/:projectId/uat', version: '1' })
export class UatController {
  constructor(private readonly uatService: UatService) {}

  @Get()
  @ApiOperation({ summary: 'List UAT sessions' })
  @ApiParam({ name: 'projectId' })
  findAll(@Param('projectId') projectId: string, @CurrentUser() user: JwtPayload) {
    return this.uatService.findAll(projectId, user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create UAT session' })
  @ApiParam({ name: 'projectId' })
  create(@Param('projectId') projectId: string, @Body() dto: CreateUatSessionDto, @CurrentUser() user: JwtPayload) {
    return this.uatService.create(projectId, dto, user);
  }

  @Get(':sessionId')
  @ApiOperation({ summary: 'Get UAT session with results' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'sessionId' })
  findOne(@Param('projectId') projectId: string, @Param('sessionId') sessionId: string, @CurrentUser() user: JwtPayload) {
    return this.uatService.findOne(projectId, sessionId, user);
  }

  @Patch(':sessionId')
  @ApiOperation({ summary: 'Update UAT session' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'sessionId' })
  update(@Param('projectId') projectId: string, @Param('sessionId') sessionId: string, @Body() dto: CreateUatSessionDto, @CurrentUser() user: JwtPayload) {
    return this.uatService.update(projectId, sessionId, dto, user);
  }

  @Post(':sessionId/cases')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add test cases to UAT session' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'sessionId' })
  addCases(@Param('projectId') projectId: string, @Param('sessionId') sessionId: string, @Body() dto: AddUatCasesDto, @CurrentUser() user: JwtPayload) {
    return this.uatService.addCases(projectId, sessionId, dto, user);
  }

  @Delete(':sessionId/cases/:testCaseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove test case from UAT session' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'sessionId' }) @ApiParam({ name: 'testCaseId' })
  removeCase(@Param('projectId') projectId: string, @Param('sessionId') sessionId: string, @Param('testCaseId') testCaseId: string, @CurrentUser() user: JwtPayload): Promise<void> {
    return this.uatService.removeCase(projectId, sessionId, testCaseId, user);
  }

  @Patch(':sessionId/results/:resultId')
  @ApiOperation({ summary: 'Execute UAT test result' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'sessionId' }) @ApiParam({ name: 'resultId' })
  updateResult(@Param('projectId') projectId: string, @Param('sessionId') sessionId: string, @Param('resultId') resultId: string, @Body() dto: UpdateUatResultDto, @CurrentUser() user: JwtPayload) {
    return this.uatService.updateResult(projectId, sessionId, resultId, dto, user);
  }

  @Post(':sessionId/sign-off')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign off UAT session' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'sessionId' })
  signOff(@Param('projectId') projectId: string, @Param('sessionId') sessionId: string, @Body() dto: SignOffUatDto, @CurrentUser() user: JwtPayload) {
    return this.uatService.signOff(projectId, sessionId, dto, user);
  }

  @Delete(':sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete UAT session' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'sessionId' })
  remove(@Param('projectId') projectId: string, @Param('sessionId') sessionId: string, @CurrentUser() user: JwtPayload): Promise<void> {
    return this.uatService.remove(projectId, sessionId, user);
  }
}
