import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateTaxonomyDecisionDto,
  DecisionQueryDto,
  TaxonomyBatchDto,
  TaxonomyCategoryQueryDto,
  TaxonomyCsvImportDto,
  UpdateTaxonomyDecisionDto,
} from './dto/part-taxonomy.dto';
import { PartTaxonomyApplyService } from './part-taxonomy-apply.service';
import { PartTaxonomyService } from './part-taxonomy.service';

type RequestWithUser = { user: { id: string } };

@ApiTags('Admin Part Taxonomy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('admin/part-taxonomy')
export class PartTaxonomyController {
  constructor(
    private readonly service: PartTaxonomyService,
    private readonly applyService: PartTaxonomyApplyService,
  ) {}

  @Get('categories') categories(@Query() query: TaxonomyCategoryQueryDto) {
    return this.service.categories(query);
  }
  @Get('categories/:id') category(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.category(id);
  }
  @Get('categories/:id/recommendation') recommendation(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.recommendation(id);
  }
  @Get('duplicate-groups') duplicateGroups() {
    return this.service.duplicateGroups();
  }

  @Post('decisions')
  @ApiOperation({ summary: 'Создать DRAFT taxonomy decision' })
  create(@Req() req: RequestWithUser, @Body() dto: CreateTaxonomyDecisionDto) {
    return this.service.createDecision(req.user, dto);
  }
  @Patch('decisions/:id') update(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaxonomyDecisionDto,
  ) {
    return this.service.updateDecision(req.user, id, dto);
  }
  @Get('decisions') decisions(@Query() query: DecisionQueryDto) {
    return this.service.decisions(query);
  }
  @Get('decisions/export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  exportCsv(@Query() query: DecisionQueryDto) {
    return this.service.exportCsv(query);
  }
  @Get('decisions/:id') decision(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.decision(id);
  }
  @Post('decisions/:id/validate') validate(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.validateDecision(id);
  }
  @Post('decisions/:id/ready') ready(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.ready(req.user, id);
  }
  @Post('decisions/:id/approve') approve(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.approve(req.user, id);
  }
  @Post('decisions/:id/cancel') cancel(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.cancel(req.user, id);
  }
  @Post('decisions/:id/preview') preview(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.preview(req.user, id);
  }
  @Post('decisions/:id/apply') apply(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.applyService.apply(req.user, id);
  }

  @Post('batches/preview') batchPreview(
    @Req() req: RequestWithUser,
    @Body() dto: TaxonomyBatchDto,
  ) {
    return this.service.batchPreview(req.user, dto);
  }
  @Post('batches/ready') batchReady(
    @Req() req: RequestWithUser,
    @Body() dto: TaxonomyBatchDto,
  ) {
    return this.service.batchReady(req.user, dto);
  }
  @Post('batches/approve') batchApprove(
    @Req() req: RequestWithUser,
    @Body() dto: TaxonomyBatchDto,
  ) {
    return this.service.batchApprove(req.user, dto);
  }
  @Post('batches/apply') batchApply(
    @Req() req: RequestWithUser,
    @Body() dto: TaxonomyBatchDto,
  ) {
    return this.applyService.applyBatch(req.user, dto.decisionIds);
  }

  @Post('imports/csv/preview') importPreview(
    @Body() dto: TaxonomyCsvImportDto,
  ) {
    return this.service.importCsvPreview(dto.csv);
  }
  @Post('imports/csv') importCsv(
    @Req() req: RequestWithUser,
    @Body() dto: TaxonomyCsvImportDto,
  ) {
    return this.service.importCsv(req.user, dto.csv);
  }
}
