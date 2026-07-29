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
import { ShopWarehousesModule } from './modules/shop-warehouses/shop-warehouses.module';
import { InventoryTransfersModule } from './modules/inventory-transfers/inventory-transfers.module';
import { InventoryAuditModule } from './modules/inventory-audit/inventory-audit.module';
import { StocktakesModule } from './modules/stocktakes/stocktakes.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PermissionsModule } from './common/permissions/permissions.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { PartNumbersModule } from './modules/part-numbers/part-numbers.module';
import { VehicleFitmentsModule } from './modules/vehicle-fitments/vehicle-fitments.module';
import { VinModule } from './modules/vin/vin.module';
import { MarketplaceSearchModule } from './modules/marketplace-search/marketplace-search.module';
import { PartCatalogSuggestionsModule } from './modules/part-catalog-suggestions/part-catalog-suggestions.module';
import { CatalogBootstrapModule } from './modules/catalog-bootstrap/catalog-bootstrap.module';
import { CustomersModule } from './modules/customers/customers.module';
import { CustomerOrdersModule } from './modules/customer-orders/customer-orders.module';
import { OrderPaymentsModule } from './modules/order-payments/order-payments.module';
import { ShopSettlementsModule } from './modules/shop-settlements/shop-settlements.module';
import { FinanceAuditModule } from './modules/finance-audit/finance-audit.module';
import { VehicleDatabaseModule } from './modules/vehicle-database/vehicle-database.module';
import { PartTaxonomyModule } from './modules/part-taxonomy/part-taxonomy.module';

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
    PartNumbersModule,
    VehicleFitmentsModule,
    VinModule,
    MarketplaceSearchModule,
    PartCatalogSuggestionsModule,
    CatalogBootstrapModule,
    CustomersModule,
    CustomerOrdersModule,
    OrderPaymentsModule,
    ShopSettlementsModule,
    FinanceAuditModule,
    VehicleDatabaseModule,
    PartTaxonomyModule,
    InventoryItemsModule,
    InventoryMovementsModule,
    SalesModule,
    PurchasesModule,
    InventorySearchModule,
    InventoryImportModule,
    ShopWarehousesModule,
    InventoryTransfersModule,
    InventoryAuditModule,
    StocktakesModule,
    DashboardModule,
    CloudinaryModule,
  ],
})
export class AppModule {}
