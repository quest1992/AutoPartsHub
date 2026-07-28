import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePartCategoryDto } from './dto/create-part-category.dto';
import { PartCategoryQueryDto } from './dto/part-category-query.dto';
import { UpdatePartCategoryDto } from './dto/update-part-category.dto';

const parentSelect = {
  id: true,
  name: true,
  slug: true,
  isActive: true,
} satisfies Prisma.PartCategorySelect;

@Injectable()
export class PartCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePartCategoryDto) {
    const data = this.normalize(dto);
    const parentId = data.parentId ?? null;

    await this.ensureValidParent(parentId);
    await this.ensureNoDuplicate(parentId, data.name, data.slug);

    try {
      return await this.prisma.partCategory.create({
        data: { ...data, parentId },
        include: { parent: { select: parentSelect } },
      });
    } catch (error) {
      this.throwUniqueConflict(error);
    }
  }

  async findAll(query: PartCategoryQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      parentId,
      rootOnly,
      leafOnly,
      isActive,
    } = query;
    const normalizedSearch = search?.trim();

    const where: Prisma.PartCategoryWhereInput = {
      ...(isActive !== undefined && { isActive }),
      ...(rootOnly ? { parentId: null } : parentId ? { parentId } : {}),
      ...(leafOnly === true && { children: { none: {} } }),

      ...(normalizedSearch && {
        OR: [
          { name: { contains: normalizedSearch, mode: 'insensitive' } },
          { slug: { contains: normalizedSearch, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.partCategory.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: {
          parent: { select: parentSelect },
          _count: { select: { children: true } },
        },
      }),
      this.prisma.partCategory.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findTree(isActive = true) {
    const categories = await this.prisma.partCategory.findMany({
      where: { isActive },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        parentId: true,
        sortOrder: true,
        isActive: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    type TreeNode = (typeof categories)[number] & { children: TreeNode[] };
    const nodes = new Map<string, TreeNode>(
      categories.map((category) => [
        category.id,
        { ...category, children: [] },
      ]),
    );
    const roots: TreeNode[] = [];

    for (const node of nodes.values()) {
      const parent = node.parentId ? nodes.get(node.parentId) : undefined;
      if (parent) parent.children.push(node);
      else roots.push(node);
    }

    return roots;
  }

  async findOne(id: string) {
    const category = await this.prisma.partCategory.findUnique({
      where: { id },
      include: {
        parent: { select: parentSelect },
        children: { orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
        _count: { select: { children: true } },
      },
    });
    if (!category) throw new NotFoundException('Категория деталей не найдена');
    return category;
  }

  async update(id: string, dto: UpdatePartCategoryDto) {
    const existing = await this.findOne(id);
    const data = this.normalize(dto);
    const finalParentId =
      dto.parentId === undefined ? existing.parentId : dto.parentId;
    const finalName = data.name ?? existing.name;
    const finalSlug = data.slug ?? existing.slug;

    if (dto.parentId !== undefined || dto.isActive === true) {
      await this.ensureValidParent(finalParentId, id);
    }
    await this.ensureNoDuplicate(finalParentId, finalName, finalSlug, id);

    try {
      return await this.prisma.partCategory.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.slug !== undefined && { slug: data.slug }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(dto.parentId !== undefined && { parentId: dto.parentId }),
          ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
        include: { parent: { select: parentSelect } },
      });
    } catch (error) {
      this.throwUniqueConflict(error);
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    const [activeChildren, activeCatalogItems] = await this.prisma.$transaction(
      [
        this.prisma.partCategory.count({
          where: { parentId: id, isActive: true },
        }),
        this.prisma.partCatalogItem.count({
          where: { categoryId: id, isActive: true },
        }),
      ],
    );
    if (activeChildren > 0) {
      throw new BadRequestException(
        'Нельзя отключить категорию с активными дочерними категориями',
      );
    }
    if (activeCatalogItems > 0) {
      throw new BadRequestException(
        'Нельзя отключить категорию с активными деталями каталога',
      );
    }
    return this.prisma.partCategory.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async deletePermanently(id: string) {
    await this.findOne(id);
    const [children, catalogItems] = await this.prisma.$transaction([
      this.prisma.partCategory.count({ where: { parentId: id } }),
      this.prisma.partCatalogItem.count({ where: { categoryId: id } }),
    ]);

    if (children > 0 || catalogItems > 0) {
      throw new ConflictException(
        'Нельзя удалить категорию, пока в ней есть дочерние категории или детали каталога',
      );
    }

    return this.prisma.partCategory.delete({ where: { id } });
  }

  private normalize<
    T extends {
      name?: string;
      slug?: string;
      description?: string;
      parentId?: string | null;
      sortOrder?: number;
      isActive?: boolean;
    },
  >(dto: T): T {
    return {
      ...dto,
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.slug !== undefined && { slug: dto.slug.trim().toLowerCase() }),
      ...(dto.description !== undefined && {
        description: dto.description.trim(),
      }),
    };
  }

  private async ensureNoDuplicate(
    parentId: string | null,
    name: string,
    slug: string,
    excludeId?: string,
  ) {
    const duplicate = await this.prisma.partCategory.findFirst({
      where: {
        parentId,
        ...(excludeId && { id: { not: excludeId } }),
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          { slug: { equals: slug, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    });
    if (duplicate)
      throw new ConflictException(
        'Категория с таким именем или slug уже существует на этом уровне',
      );
  }

  private async ensureValidParent(
    parentId: string | null,
    categoryId?: string,
  ) {
    if (!parentId) return;
    if (parentId === categoryId)
      throw new BadRequestException(
        'Категория не может быть родителем самой себе',
      );

    const parent = await this.prisma.partCategory.findUnique({
      where: { id: parentId },
      select: { id: true, parentId: true, isActive: true },
    });
    if (!parent)
      throw new NotFoundException('Родительская категория не найдена');
    if (!parent.isActive)
      throw new BadRequestException(
        'Нельзя использовать неактивную родительскую категорию',
      );

    let currentParentId = parent.parentId;
    const visited = new Set<string>([parent.id]);
    while (currentParentId) {
      if (currentParentId === categoryId)
        throw new BadRequestException(
          'Нельзя переместить категорию в собственное поддерево',
        );
      if (visited.has(currentParentId))
        throw new BadRequestException('Обнаружен цикл в иерархии категорий');
      visited.add(currentParentId);
      const ancestor = await this.prisma.partCategory.findUnique({
        where: { id: currentParentId },
        select: { parentId: true },
      });
      if (!ancestor) break;
      currentParentId = ancestor.parentId;
    }
  }

  private throwUniqueConflict(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'Категория с таким slug уже существует на этом уровне',
      );
    }
    throw error;
  }
}
