CREATE OR REPLACE FUNCTION "prevent_part_catalog_redirect_cycle"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  cycle_found boolean;
BEGIN
  IF NEW."replacedById" IS NULL THEN
    RETURN NEW;
  END IF;

  WITH RECURSIVE replacement_chain AS (
    SELECT item."id", item."replacedById", ARRAY[item."id"]::text[] AS visited
    FROM "PartCatalogItem" item
    WHERE item."id" = NEW."replacedById"
    UNION ALL
    SELECT next_item."id", next_item."replacedById", chain.visited || next_item."id"
    FROM replacement_chain chain
    JOIN "PartCatalogItem" next_item ON next_item."id" = chain."replacedById"
    WHERE NOT next_item."id" = ANY(chain.visited)
  )
  SELECT EXISTS(
    SELECT 1 FROM replacement_chain WHERE "id" = NEW."id"
  ) INTO cycle_found;

  IF cycle_found THEN
    RAISE EXCEPTION 'PartCatalogItem replacement redirect cycle is not allowed'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "PartCatalogItem_prevent_replacement_cycle"
BEFORE INSERT OR UPDATE OF "replacedById" ON "PartCatalogItem"
FOR EACH ROW
EXECUTE FUNCTION "prevent_part_catalog_redirect_cycle"();
