ALTER TABLE "ShopInventoryItem"
  ADD CONSTRAINT "ShopInventoryItem_reservedQuantity_nonnegative"
  CHECK ("reservedQuantity" >= 0),
  ADD CONSTRAINT "ShopInventoryItem_reservedQuantity_not_above_quantity"
  CHECK ("reservedQuantity" <= "quantity");

ALTER TABLE "CustomerOrderItem"
  ADD CONSTRAINT "CustomerOrderItem_quantity_positive"
  CHECK ("quantity" > 0),
  ADD CONSTRAINT "CustomerOrderItem_prices_nonnegative"
  CHECK ("unitPrice" >= 0 AND "discount" >= 0 AND "total" >= 0);

ALTER TABLE "CustomerOrder"
  ADD CONSTRAINT "CustomerOrder_amounts_nonnegative"
  CHECK ("subtotal" >= 0 AND "discount" >= 0 AND "deliveryFee" >= 0 AND "total" >= 0);

CREATE UNIQUE INDEX "Customer_phoneNormalized_unique"
  ON "Customer" ("phoneNormalized")
  WHERE "phoneNormalized" IS NOT NULL;
