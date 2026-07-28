import { ConflictException } from '@nestjs/common';
import { PartCategoriesService } from './part-categories.service';

describe('PartCategoriesService hierarchy and deletion', () => {
  it('allows creating a category deeper than three levels', async () => {
    const findUnique = jest.fn(({ where }: { where: { id: string } }) => {
      const parents: Record<
        string,
        { id: string; parentId: string | null; isActive: boolean }
      > = {
        level4: { id: 'level4', parentId: 'level3', isActive: true },
        level3: { id: 'level3', parentId: 'level2', isActive: true },
        level2: { id: 'level2', parentId: 'level1', isActive: true },
        level1: { id: 'level1', parentId: null, isActive: true },
      };
      return Promise.resolve(parents[where.id] ?? null);
    });
    const create = jest.fn().mockResolvedValue({ id: 'level5' });
    const service = new PartCategoriesService({
      partCategory: {
        findUnique,
        findFirst: jest.fn().mockResolvedValue(null),
        create,
      },
    } as never);

    await expect(
      service.create({
        name: 'Level 5',
        slug: 'level-5',
        parentId: 'level4',
      }),
    ).resolves.toEqual({ id: 'level5' });
    expect(create).toHaveBeenCalled();
  });

  it('does not physically delete a category containing catalog items', async () => {
    const deleteCategory = jest.fn();
    const service = new PartCategoriesService({
      partCategory: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'category-id',
          children: [],
          _count: { children: 0 },
        }),
        count: jest.fn().mockResolvedValue(0),
        delete: deleteCategory,
      },
      partCatalogItem: {
        count: jest.fn().mockResolvedValue(1),
      },
      $transaction: jest
        .fn()
        .mockImplementation((queries: Array<Promise<unknown>>) =>
          Promise.all(queries),
        ),
    } as never);

    await expect(
      service.deletePermanently('category-id'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(deleteCategory).not.toHaveBeenCalled();
  });
});
