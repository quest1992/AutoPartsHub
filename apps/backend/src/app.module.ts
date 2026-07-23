import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ShopsModule } from './modules/shops/shops.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ManufacturersModule } from './modules/manufacturers/manufacturers.module';
import { VehicleModelsModule } from './modules/vehicle-models/vehicle-models.module';
import { VehicleGenerationsModule } from './modules/vehicle-generations/vehicle-generations.module';
import { PartCategoriesModule } from './modules/part-categories/part-categories.module';
import { PartCatalogModule } from './modules/part-catalog/part-catalog.module';
import { InventoryItemsModule } from './modules/inventory-items/inventory-items.module';
import { InventoryMovementsModule } from './modules/inventory-movements/inventory-movements.module';
import { SalesModule } from './modules/sales/sales.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { InventorySearchModule } from './modules/inventory-search/inventory-search.module';
import { InventoryImportModule } from './modules/inventory-import/inventory-import.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PermissionsModule } from './common/permissions/permissions.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';


@Module({
  imports: [
    PrismaModule,
    PermissionsModule,
    EmployeesModule,
    ShopsModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    ManufacturersModule,
    VehicleModelsModule,
    VehicleGenerationsModule,
    PartCategoriesModule,
    PartCatalogModule,
    InventoryItemsModule,
    InventoryMovementsModule,
    SalesModule,
    PurchasesModule,
    InventorySearchModule,
    InventoryImportModule,
    DashboardModule,
    CloudinaryModule,
  ],
})
export class AppModule {}
