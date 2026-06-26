import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AdhocService } from './adhoc.service';
import { CreateAdhocDto } from './dto/create-adhoc.dto';
import { UpdateAdhocDto } from './dto/update-adhoc.dto';
import { CurrentUser, JwtPayload } from '../shared/decorators/current-user.decorator';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

@ApiTags('Ad-Hoc Cases')
@ApiBearerAuth()
@Controller({ path: 'projects/:projectId/adhoc', version: '1' })
export class AdhocController {
  constructor(private readonly adhocService: AdhocService) {}

  @Get()
  @ApiOperation({ summary: 'List ad-hoc cases' })
  @ApiParam({ name: 'projectId' })
  @ApiQuery({ name: 'page', required: false }) @ApiQuery({ name: 'limit', required: false })
  findAll(
    @Param('projectId') projectId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adhocService.findAll(projectId, user, parseInt(page), parseInt(limit));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit ad-hoc case' })
  @ApiParam({ name: 'projectId' })
  create(@Param('projectId') projectId: string, @Body() dto: CreateAdhocDto, @CurrentUser() user: JwtPayload) {
    return this.adhocService.create(projectId, dto, user);
  }

  @Get(':adhocId')
  @ApiOperation({ summary: 'Get ad-hoc case detail' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'adhocId' })
  findOne(@Param('projectId') projectId: string, @Param('adhocId') adhocId: string, @CurrentUser() user: JwtPayload) {
    return this.adhocService.findOne(projectId, adhocId, user);
  }

  @Patch(':adhocId')
  @ApiOperation({ summary: 'Update ad-hoc case' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'adhocId' })
  update(@Param('projectId') projectId: string, @Param('adhocId') adhocId: string, @Body() dto: UpdateAdhocDto, @CurrentUser() user: JwtPayload) {
    return this.adhocService.update(projectId, adhocId, dto, user);
  }

  @Post(':adhocId/convert')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Convert ad-hoc case to formal test case' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'adhocId' })
  convertToTc(@Param('projectId') projectId: string, @Param('adhocId') adhocId: string, @CurrentUser() user: JwtPayload) {
    return this.adhocService.convertToTc(projectId, adhocId, user);
  }

  @Post(':adhocId/convert-to-defect')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Convert ad-hoc case to a defect' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'adhocId' })
  convertToDefect(@Param('projectId') projectId: string, @Param('adhocId') adhocId: string, @CurrentUser() user: JwtPayload) {
    return this.adhocService.convertToDefect(projectId, adhocId, user);
  }

  @Delete(':adhocId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete ad-hoc case' })
  @ApiParam({ name: 'projectId' }) @ApiParam({ name: 'adhocId' })
  remove(@Param('projectId') projectId: string, @Param('adhocId') adhocId: string, @CurrentUser() user: JwtPayload): Promise<void> {
    return this.adhocService.remove(projectId, adhocId, user);
  }
}
