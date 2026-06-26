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
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { ListProjectsQuery } from './dto/list-projects.query';
import { CurrentUser, JwtPayload } from '../shared/decorators/current-user.decorator';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller({ path: 'projects', version: '1' })
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List all projects (paginated)' })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully' })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: ListProjectsQuery) {
    return this.projectsService.findAll(user, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 409, description: 'Project key already exists' })
  create(@Body() dto: CreateProjectDto, @CurrentUser() user: JwtPayload) {
    return this.projectsService.create(dto, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by ID' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.projectsService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a project' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiResponse({ status: 204, description: 'Project deleted successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<void> {
    return this.projectsService.remove(id, user);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List project members' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Members retrieved successfully' })
  getMembers(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.projectsService.getMembers(id, user);
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a member to the project' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiResponse({ status: 201, description: 'Member added successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'User is already a member' })
  addMember(
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.addMember(id, dto, user);
  }

  @Patch(':id/members/:userId')
  @ApiOperation({ summary: 'Update a member role' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Member role updated' })
  updateMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.updateMember(id, userId, dto, user);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from the project' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiParam({ name: 'userId', description: 'User UUID to remove' })
  @ApiResponse({ status: 204, description: 'Member removed successfully' })
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.projectsService.removeMember(id, userId, user);
  }
}
