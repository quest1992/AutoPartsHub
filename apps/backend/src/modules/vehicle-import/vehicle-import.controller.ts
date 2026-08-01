import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VehicleImportService } from './vehicle-import.service';

@ApiTags('Admin Vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('admin/vehicles')
export class VehicleImportController {
  constructor(private readonly service: VehicleImportService) {}

  @Post('import')
  @ApiOperation({ summary: 'Dry-run или batch-импорт CSV/JSON автомобилей' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }),
  )
  import(
    @UploadedFile() file: { buffer: Buffer; originalname: string } | undefined,
    @Query('dryRun') dryRun?: string,
  ) {
    if (!file) throw new BadRequestException('CSV or JSON file is required');
    return this.service.import(file, dryRun !== 'false');
  }
}
