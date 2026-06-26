import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { TestSuitesService } from './test-suites.service';
import { CreateSuiteDto } from './dto/create-suite.dto';
import { UpdateSuiteDto } from './dto/update-suite.dto';
import { ReorderSuitesDto } from './dto/reorder-suites.dto';
import { CurrentUser, JwtPayload } from '../shared/decorators/current-user.decorator';

@ApiTags('Test Suites')
@ApiBearerAuth()
@Controller({ path: 'projects/:projectId/suites', version: '1' })
export class TestSuitesController {
  constructor(private readonly testSuitesService: TestSuitesService) {}

  @Get()
  @ApiOperation({ summary: 'Get test suites tree for a project' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Test suites tree retrieved successfully' })
  findAll(@Param('projectId') projectId: string, @CurrentUser() user: JwtPayload) {
    return this.testSuitesService.findAll(projectId, user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new test suite' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 201, description: 'Test suite created successfully' })
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateSuiteDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.testSuitesService.create(projectId, dto, user);
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Reorder test suites' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Test suites reordered successfully' })
  reorder(
    @Param('projectId') projectId: string,
    @Body() dto: ReorderSuitesDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.testSuitesService.reorder(projectId, dto, user);
  }

  @Patch(':suiteId')
  @ApiOperation({ summary: 'Update a test suite' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiParam({ name: 'suiteId', description: 'Suite UUID' })
  @ApiResponse({ status: 200, description: 'Test suite updated successfully' })
  update(
    @Param('projectId') projectId: string,
    @Param('suiteId') suiteId: string,
    @Body() dto: UpdateSuiteDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.testSuitesService.update(projectId, suiteId, dto, user);
  }

  @Delete(':suiteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a test suite' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiParam({ name: 'suiteId', description: 'Suite UUID' })
  @ApiResponse({ status: 204, description: 'Test suite deleted successfully' })
  remove(
    @Param('projectId') projectId: string,
    @Param('suiteId') suiteId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.testSuitesService.remove(projectId, suiteId, user);
  }
}
