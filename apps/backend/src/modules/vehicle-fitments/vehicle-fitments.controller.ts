import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { CreateEngineDto } from './dto/create-engine.dto';
import { CreateVehicleFitmentDto } from './dto/create-vehicle-fitment.dto';
import { VehicleFitmentQueryDto } from './dto/vehicle-fitment-query.dto';
import { VehicleFitmentsService } from './vehicle-fitments.service';

@ApiTags('Vehicle Fitments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller()
export class VehicleFitmentsController {
  constructor(private readonly service: VehicleFitmentsService) {}

  @Get('vehicle-brands')
  @RequirePermissions(Permission.CATALOG_VIEW)
  findBrands() {
    return this.service.findBrands();
  }

  @Get('vehicles/tree')
  @RequirePermissions(Permission.CATALOG_VIEW)
  @ApiOperation({ summary: 'Дерево марка → модель → поколение → двигатель' })
  findTree() {
    return this.service.findTree();
  }

  @Get('engines')
  @RequirePermissions(Permission.CATALOG_VIEW)
  findEngines(@Query('generationId') generationId?: string) {
    return this.service.findEngines(generationId);
  }

  @Post('engines')
  @RequirePermissions(Permission.CATALOG_MANAGE)
  createEngine(@Body() dto: CreateEngineDto) {
    return this.service.createEngine(dto);
  }

  @Get('vehicle-fitments/search')
  @RequirePermissions(Permission.CATALOG_VIEW)
  @ApiOperation({
    summary: 'Поиск применяемости по марке, модели, поколению и двигателю',
  })
  search(@Query() query: VehicleFitmentQueryDto) {
    return this.service.search(query);
  }

  @Get('vehicle-fitments')
  @RequirePermissions(Permission.CATALOG_VIEW)
  findAll(@Query() query: VehicleFitmentQueryDto) {
    return this.service.findAll(query);
  }

  @Post('vehicle-fitments')
  @RequirePermissions(Permission.CATALOG_MANAGE)
  create(@Body() dto: CreateVehicleFitmentDto) {
    return this.service.create(dto);
  }

  @Delete('vehicle-fitments/:id')
  @RequirePermissions(Permission.CATALOG_MANAGE)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
