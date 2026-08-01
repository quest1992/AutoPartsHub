import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VehicleFitmentQueryDto } from './dto/vehicle-fitment-query.dto';
import { VehicleFitmentService } from './vehicle-fitment.service';

@ApiTags('Vehicle Fitment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.SHOP_ADMIN,
  UserRole.MANAGER,
  UserRole.SELLER,
  UserRole.VIEWER,
)
@Controller('vehicle-fitment')
export class VehicleFitmentController {
  constructor(private readonly service: VehicleFitmentService) {}

  @Get('specifications/:id')
  @ApiOperation({ summary: 'Автомобиль и категории подтверждённых OEM' })
  specification(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.specification(id);
  }

  @Get('specifications/:id/categories/:categoryId')
  @ApiOperation({ summary: 'Совместимые OEM выбранной категории' })
  category(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Query() query: VehicleFitmentQueryDto,
  ) {
    return this.service.category(id, categoryId, query);
  }

  @Get('parts/:oemId')
  @ApiOperation({ summary: 'OEM, аналоги и разрешённые предложения магазинов' })
  part(
    @Param('oemId', ParseUUIDPipe) oemId: string,
    @Query() query: VehicleFitmentQueryDto,
  ) {
    return this.service.part(oemId, query);
  }
}
