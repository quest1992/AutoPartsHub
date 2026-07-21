import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import { Permission } from '../../common/permissions/permission.enum';
import { PermissionsGuard } from '../../common/permissions/permissions.guard';
import { CreatePartCategoryDto } from './dto/create-part-category.dto';
import {
  PartCategoryQueryDto,
  PartCategoryTreeQueryDto,
} from './dto/part-category-query.dto';
import { UpdatePartCategoryDto } from './dto/update-part-category.dto';
import { PartCategoriesService } from './part-categories.service';

@ApiTags('Part Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.SHOP_ADMIN, UserRole.MANAGER, UserRole.SELLER, UserRole.VIEWER)
@Controller('part-categories')
export class PartCategoriesController {
  constructor(private readonly partCategoriesService: PartCategoriesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  @ApiOperation({ summary: 'Создать категорию деталей' })
  @ApiBadRequestResponse({
    description: 'Некорректный родитель или превышена глубина',
  })
  @ApiConflictResponse({
    description: 'Дубликат имени или slug на одном уровне',
  })
  @ApiUnauthorizedResponse({ description: 'Требуется JWT' })
  @ApiForbiddenResponse({ description: 'Требуется роль SUPER_ADMIN' })
  create(@Body() dto: CreatePartCategoryDto) {
    return this.partCategoriesService.create(dto);
  }

  @Get()
  @RequirePermissions(Permission.CATALOG_VIEW)
  @ApiOperation({ summary: 'Получить список категорий деталей' })
  findAll(@Query() query: PartCategoryQueryDto) {
    return this.partCategoriesService.findAll(query);
  }

  @Get('tree')
  @RequirePermissions(Permission.CATALOG_VIEW)
  @ApiOperation({ summary: 'Получить дерево категорий деталей' })
  @ApiOkResponse({ description: 'Дерево строится без N+1 запросов' })
  findTree(@Query() query: PartCategoryTreeQueryDto) {
    return this.partCategoriesService.findTree(query.isActive ?? true);
  }

  @Get(':id')
  @RequirePermissions(Permission.CATALOG_VIEW)
  @ApiOperation({ summary: 'Получить категорию деталей' })
  @ApiNotFoundResponse({ description: 'Категория не найдена' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.partCategoriesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  @ApiOperation({ summary: 'Изменить категорию или переместить поддерево' })
  @ApiBadRequestResponse({
    description: 'Недопустимая иерархия или родитель неактивен',
  })
  @ApiConflictResponse({
    description: 'Дубликат имени или slug на одном уровне',
  })
  @ApiNotFoundResponse({ description: 'Категория или родитель не найдены' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePartCategoryDto,
  ) {
    return this.partCategoriesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CATALOG_MANAGE)
  @ApiOperation({ summary: 'Мягко отключить категорию деталей' })
  @ApiBadRequestResponse({ description: 'Есть активные дочерние категории' })
  @ApiNotFoundResponse({ description: 'Категория не найдена' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.partCategoriesService.remove(id);
  }
}
