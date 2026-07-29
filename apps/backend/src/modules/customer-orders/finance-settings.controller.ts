import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { money } from '../../common/utils/money';
import {
  UpdatePlatformOrderSettingDto,
  UpdateShopCommissionDto,
} from './dto/finance-setting.dto';
@ApiTags('Finance settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('admin/finance-settings')
export class FinanceSettingsController {
  constructor(private readonly prisma: PrismaService) {}
  @Get('platform') platform() {
    return this.prisma.platformOrderSetting.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }
  @Put('platform') async updatePlatform(
    @Body() d: UpdatePlatformOrderSettingDto,
  ) {
    const current = await this.prisma.platformOrderSetting.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    if (current)
      return this.prisma.platformOrderSetting.update({
        where: { id: current.id },
        data: {
          defaultCommissionType: d.defaultCommissionType,
          defaultCommissionValue: money(d.defaultCommissionValue),
          reservationMinutes: d.reservationMinutes,
          currencyCode: d.currencyCode?.trim().toUpperCase(),
        },
      });
    return this.prisma.platformOrderSetting.create({
      data: {
        defaultCommissionType: d.defaultCommissionType,
        defaultCommissionValue: money(d.defaultCommissionValue),
        reservationMinutes: d.reservationMinutes,
        currencyCode: d.currencyCode?.trim().toUpperCase(),
      },
    });
  }
  @Get('shops/:shopId') shop(@Param('shopId', ParseUUIDPipe) shopId: string) {
    return this.prisma.shopCommissionSetting.findUnique({ where: { shopId } });
  }
  @Put('shops/:shopId') shopUpdate(
    @Param('shopId', ParseUUIDPipe) shopId: string,
    @Body() d: UpdateShopCommissionDto,
  ) {
    return this.prisma.shopCommissionSetting.upsert({
      where: { shopId },
      create: {
        shopId,
        commissionType: d.commissionType,
        commissionValue: money(d.commissionValue),
      },
      update: {
        commissionType: d.commissionType,
        commissionValue: money(d.commissionValue),
        isActive: true,
      },
    });
  }
}
