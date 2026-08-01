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
import {
  VehicleCatalogItemsQueryDto,
  VehicleCatalogQueryDto,
} from './dto/vehicle-catalog-query.dto';
import { VehicleCatalogService } from './vehicle-catalog.service';

@ApiTags('Vehicle Catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.SHOP_ADMIN,
  UserRole.MANAGER,
  UserRole.SELLER,
  UserRole.VIEWER,
)
@Controller('vehicles')
export class VehicleCatalogController {
  constructor(private readonly service: VehicleCatalogService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Глобальный поиск автомобиля',
  })
  search(@Query() query: VehicleCatalogQueryDto) {
    return this.service.search(query);
  }

  @Get('manufacturers')
  @ApiOperation({
    summary:
      'Приоритетные производители электромобилей и поиск по всему справочнику',
  })
  manufacturers(@Query() query: VehicleCatalogQueryDto) {
    return this.service.manufacturers(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Статистика справочника автомобилей' })
  stats() {
    return this.service.stats();
  }

  @Get(':manufacturerId/models')
  models(
    @Param('manufacturerId', ParseUUIDPipe) manufacturerId: string,
    @Query() query: VehicleCatalogQueryDto,
  ) {
    return this.service.models(manufacturerId, query);
  }

  @Get('models/:id')
  model(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.model(id);
  }

  @Get('specifications/:id')
  specification(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.specification(id);
  }

  @Get('specifications/:id/categories')
  categories(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.categories(id);
  }

  @Get('specifications/:id/categories/:categoryId')
  category(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.service.category(id, categoryId);
  }

  @Get('specifications/:id/categories/:categoryId/items')
  items(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Query() query: VehicleCatalogItemsQueryDto,
  ) {
    return this.service.items(id, categoryId, query);
  }
}
