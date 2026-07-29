import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApprovePartCatalogSuggestionDto } from './dto/approve-part-catalog-suggestion.dto';
import { CreatePartCatalogSuggestionDto } from './dto/create-part-catalog-suggestion.dto';
import { MergePartCatalogSuggestionDto } from './dto/merge-part-catalog-suggestion.dto';
import { QueryPartCatalogSuggestionDto } from './dto/query-part-catalog-suggestion.dto';
import { RejectPartCatalogSuggestionDto } from './dto/reject-part-catalog-suggestion.dto';
import {
  PartCatalogSuggestionsService,
  SuggestionActor,
} from './part-catalog-suggestions.service';

type RequestWithUser = { user: SuggestionActor };

@ApiTags('Part Catalog Suggestions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.SHOP_ADMIN,
  UserRole.MANAGER,
  UserRole.SELLER,
)
@Controller('part-catalog-suggestions')
export class PartCatalogSuggestionsController {
  constructor(private readonly service: PartCatalogSuggestionsService) {}

  @Post()
  @ApiOperation({ summary: 'Предложить новую позицию центрального каталога' })
  @ApiConflictResponse({
    description: 'Такое предложение уже ожидает проверки',
  })
  create(
    @Req() req: RequestWithUser,
    @Body() dto: CreatePartCatalogSuggestionDto,
  ) {
    return this.service.create(req.user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить доступные пользователю предложения' })
  findAll(
    @Req() req: RequestWithUser,
    @Query() query: QueryPartCatalogSuggestionDto,
  ) {
    return this.service.findAll(req.user, query);
  }

  @Get(':id')
  findOne(@Req() req: RequestWithUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(req.user, id);
  }

  @Post(':id/approve')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiForbiddenResponse({ description: 'Доступно только SUPER_ADMIN' })
  approve(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApprovePartCatalogSuggestionDto,
  ) {
    return this.service.approve(req.user, id, dto);
  }

  @Post(':id/merge')
  @Roles(UserRole.SUPER_ADMIN)
  merge(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MergePartCatalogSuggestionDto,
  ) {
    return this.service.merge(req.user, id, dto.partCatalogItemId);
  }

  @Post(':id/reject')
  @Roles(UserRole.SUPER_ADMIN)
  reject(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectPartCatalogSuggestionDto,
  ) {
    return this.service.reject(req.user, id, dto.reason);
  }
}
