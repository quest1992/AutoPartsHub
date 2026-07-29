import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { CreatePartNumberDto } from './dto/create-part-number.dto';
import { PartNumberQueryDto } from './dto/part-number-query.dto';
import { UpdatePartNumberDto } from './dto/update-part-number.dto';
import { PartNumbersService } from './part-numbers.service';

@ApiTags('Part Numbers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('part-numbers')
export class PartNumbersController {
  constructor(private readonly service: PartNumbersService) {}

  @Get('search')
  @RequirePermissions(Permission.CATALOG_VIEW)
  @ApiOperation({ summary: 'Поиск OEM, Cross, Aftermarket и Internal номеров' })
  search(@Query() query: PartNumberQueryDto) {
    return this.service.search(query);
  }

  @Get()
  @RequirePermissions(Permission.CATALOG_VIEW)
  findAll(@Query() query: PartNumberQueryDto) {
    return this.service.findAll(query);
  }

  @Post()
  @RequirePermissions(Permission.CATALOG_MANAGE)
  create(@Body() dto: CreatePartNumberDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(Permission.CATALOG_MANAGE)
  update(@Param('id') id: string, @Body() dto: UpdatePartNumberDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.CATALOG_MANAGE)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
