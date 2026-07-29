import { Module } from '@nestjs/common';
import { FinanceAuditController } from './finance-audit.controller';
import { FinanceAuditService } from './finance-audit.service';
@Module({
  controllers: [FinanceAuditController],
  providers: [FinanceAuditService],
})
export class FinanceAuditModule {}
