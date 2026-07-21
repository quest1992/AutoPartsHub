import { Reflector } from '@nestjs/core';
import { Permission } from '../../common/permissions/permission.enum';
import { PERMISSIONS_KEY } from '../../common/permissions/require-permissions.decorator';
import { PartCatalogController } from './part-catalog.controller';
import { PartCatalogService } from './part-catalog.service';

describe('PartCatalogController numbers and aliases', () => {
  function createController() {
    const getPartNumbers = jest.fn().mockResolvedValue([]);
    const addPartNumber = jest.fn().mockResolvedValue({});
    const deletePartNumber = jest.fn().mockResolvedValue({});
    const getPartAliases = jest.fn().mockResolvedValue([]);
    const addPartAlias = jest.fn().mockResolvedValue({});
    const deletePartAlias = jest.fn().mockResolvedValue({});
    const service = {
      getPartNumbers,
      addPartNumber,
      deletePartNumber,
      getPartAliases,
      addPartAlias,
      deletePartAlias,
    } as unknown as PartCatalogService;

    return {
      controller: new PartCatalogController(service),
      mocks: {
        addPartAlias,
        addPartNumber,
        deletePartAlias,
        deletePartNumber,
        getPartAliases,
        getPartNumbers,
      },
    };
  }

  it('forwards number and alias requests to the service', async () => {
    const { controller, mocks } = createController();
    const numberDto = { rawNumber: '04465-0K240', type: 'OEM' } as never;
    const aliasDto = { alias: 'Колодки тормозные' };

    await controller.getPartNumbers('part-id');
    await controller.addPartNumber('part-id', numberDto);
    await controller.deletePartNumber('part-id', 'number-id');
    await controller.getPartAliases('part-id');
    await controller.addPartAlias('part-id', aliasDto);
    await controller.deletePartAlias('part-id', 'alias-id');

    expect(mocks.getPartNumbers).toHaveBeenCalledWith('part-id');
    expect(mocks.addPartNumber).toHaveBeenCalledWith('part-id', numberDto);
    expect(mocks.deletePartNumber).toHaveBeenCalledWith('part-id', 'number-id');
    expect(mocks.getPartAliases).toHaveBeenCalledWith('part-id');
    expect(mocks.addPartAlias).toHaveBeenCalledWith('part-id', aliasDto);
    expect(mocks.deletePartAlias).toHaveBeenCalledWith('part-id', 'alias-id');
  });

  it('uses catalog view permission for reads and catalog manage for mutations', () => {
    const reflector = new Reflector();
    const getHandler = (name: string): (() => unknown) => {
      const descriptor = Object.getOwnPropertyDescriptor(
        PartCatalogController.prototype,
        name,
      );
      if (!descriptor?.value) throw new Error(`Missing handler: ${name}`);
      return descriptor.value as () => unknown;
    };

    expect(
      reflector.get<Permission[]>(
        PERMISSIONS_KEY,
        getHandler('getPartNumbers'),
      ),
    ).toEqual([Permission.CATALOG_VIEW]);
    expect(
      reflector.get<Permission[]>(
        PERMISSIONS_KEY,
        getHandler('getPartAliases'),
      ),
    ).toEqual([Permission.CATALOG_VIEW]);

    for (const handler of [
      getHandler('addPartNumber'),
      getHandler('deletePartNumber'),
      getHandler('addPartAlias'),
      getHandler('deletePartAlias'),
    ]) {
      expect(reflector.get<Permission[]>(PERMISSIONS_KEY, handler)).toEqual([
        Permission.CATALOG_MANAGE,
      ]);
    }
  });
});
