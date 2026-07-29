import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permission } from '../../common/permissions/permission.enum';
import { PermissionsGuard } from '../../common/permissions/permissions.guard';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DecodeVinDto } from './dto/decode-vin.dto';
import { VinCacheQueryDto } from './dto/vin-cache-query.dto';
import { VinService } from './vin.service';

@ApiTags('VIN Decoder')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.SHOP_ADMIN,
  UserRole.MANAGER,
  UserRole.SELLER,
  UserRole.VIEWER,
)
@Controller('vin')
export class VinController {
  constructor(private readonly service: VinService) {}

  @Post('decode')
  @RequirePermissions(Permission.CATALOG_VIEW)
  @ApiOperation({
    summary: 'Декодировать VIN и сопоставить с внутренним справочником',
  })
  decode(@Body() dto: DecodeVinDto) {
    return this.service.decode(dto.vin);
  }

  @Get('cache')
  @RequirePermissions(Permission.CATALOG_VIEW)
  @ApiOperation({ summary: 'Получить историю VIN cache' })
  findCache(@Query() query: VinCacheQueryDto) {
    return this.service.findCache(query);
  }

  @Get('cache/:id')
  @RequirePermissions(Permission.CATALOG_VIEW)
  findCacheOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findCacheOne(id);
  }

  @Delete('cache/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  removeCache(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.removeCache(id);
  }
}
