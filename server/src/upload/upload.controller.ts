import {
  Controller,
  Post,
  Get,
  Body,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';
import { ImportDto } from './dto/import.dto';
import { RATE_LIMITS } from '../shared/constants/pagination.constants';
import { CurrentUser, JwtPayload } from '../shared/decorators/current-user.decorator';
import { Public } from '../shared/decorators/public.decorator';

const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'application/csv',
  'application/octet-stream',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

@ApiTags('Upload')
@ApiBearerAuth()
@Throttle({ default: { ttl: RATE_LIMITS.UPLOAD_TTL, limit: RATE_LIMITS.UPLOAD_LIMIT } })
@Controller({ path: 'upload', version: '1' })
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_, file, cb) => {
        const isAllowed =
          ALLOWED_MIME_TYPES.includes(file.mimetype) ||
          file.originalname.endsWith('.xlsx') ||
          file.originalname.endsWith('.xls') ||
          file.originalname.endsWith('.csv');
        if (isAllowed) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only Excel (.xlsx, .xls) and CSV files are allowed'), false);
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Preview file columns and first 5 rows with smart column detection' })
  @ApiResponse({ status: 200, description: 'Preview of detected columns and sample data' })
  preview(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.uploadService.preview(file.buffer, file.originalname);
  }

  @Post('import')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_, file, cb) => {
        const isAllowed =
          ALLOWED_MIME_TYPES.includes(file.mimetype) ||
          file.originalname.endsWith('.xlsx') ||
          file.originalname.endsWith('.xls') ||
          file.originalname.endsWith('.csv');
        if (isAllowed) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only Excel (.xlsx, .xls) and CSV files are allowed'), false);
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        projectId: { type: 'string', format: 'uuid' },
        suiteId: { type: 'string', format: 'uuid' },
      },
      required: ['file', 'projectId'],
    },
  })
  @ApiOperation({ summary: 'Import test cases from Excel/CSV file' })
  @ApiResponse({ status: 200, description: 'Import completed with summary' })
  async importFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ImportDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.uploadService.importTestCases(
      file.buffer,
      file.originalname,
      dto.projectId,
      user,
      dto.suiteId,
    );
  }

  @Public()
  @Get('template')
  @ApiOperation({ summary: 'Download sample Excel template for test case import' })
  @ApiResponse({
    status: 200,
    description: 'Excel template file',
    headers: {
      'Content-Disposition': { schema: { type: 'string' } },
      'Content-Type': { schema: { type: 'string' } },
    },
  })
  async downloadTemplate(@Res() res: Response): Promise<void> {
    const buffer = await this.uploadService.generateTemplate();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="test-cases-template.xlsx"',
    );
    res.send(buffer);
  }
}
