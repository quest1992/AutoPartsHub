import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateManufacturerDto } from './dto/create-manufacturer.dto';
import { ManufacturersService } from './manufacturers.service';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import { Permission } from '../../common/permissions/permission.enum';
import { PermissionsGuard } from '../../common/permissions/permissions.guard';

@ApiTags('Производители автомобилей')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.SHOP_ADMIN,
  UserRole.MANAGER,
  UserRole.SELLER,
  UserRole.VIEWER,
)
@Controller('manufacturers')
export class ManufacturersController {
  constructor(private readonly manufacturersService: ManufacturersService) {}

  @Post()
  @ApiOperation({
    summary: 'Создать производителя автомобиля',
  })
  @ApiCreatedResponse({
    description: 'Производитель успешно создан',
  })
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  create(@Body() createManufacturerDto: CreateManufacturerDto) {
    return this.manufacturersService.create(createManufacturerDto);
  }

  @Get()
  @RequirePermissions(Permission.CATALOG_VIEW)
  @ApiOperation({
    summary: 'Получить список производителей',
  })
  @ApiOkResponse({
    description: 'Список производителей получен',
  })
  findAll() {
    return this.manufacturersService.findAll();
  }

  @Get(':id')
  @RequirePermissions(Permission.CATALOG_VIEW)
  @ApiOperation({
    summary: 'Получить производителя по ID',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.manufacturersService.findOne(id);
  }
}
