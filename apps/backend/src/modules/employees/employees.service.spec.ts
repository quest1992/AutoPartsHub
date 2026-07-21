import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { EmployeesService } from './employees.service';

jest.mock('bcryptjs', () => ({ hash: jest.fn() }));
const hash = bcrypt.hash as jest.Mock;
const shop = { id: 'shop-1', name: 'Test', isActive: true };
const actor = { id: 'admin-1', role: UserRole.SHOP_ADMIN, shopId: 'shop-1' };
const superActor = { id: 'super', role: UserRole.SUPER_ADMIN, shopId: null };
const employee = { id: 'employee-1', firstName: 'User', lastName: null, phone: '+992900000001', role: UserRole.MANAGER, isActive: true, shopId: 'shop-1', shop, createdAt: new Date(), updatedAt: new Date() };
const prisma: any = { user: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn() }, shop: { findUnique: jest.fn() }, $transaction: jest.fn() };
const tx: any = { user: { findFirst: jest.fn(), count: jest.fn(), update: jest.fn() } };
const sensitive = (value: unknown) => expect(JSON.stringify(value)).not.toMatch(/passwordHash|temporaryPassword/);

describe('EmployeesService', () => {
  const service = new EmployeesService(prisma);
  beforeEach(() => { jest.clearAllMocks(); hash.mockResolvedValue('hashed'); prisma.shop.findUnique.mockResolvedValue(shop); prisma.$transaction.mockImplementation(async (callback: any) => callback(tx)); });
  it('enforces shop context for SHOP_ADMIN and SUPER_ADMIN', async () => {
    await expect(service.list(actor, { shopId: 'other' })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.list({ ...actor, shopId: null }, {})).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.list(superActor, {})).rejects.toBeInstanceOf(BadRequestException);
  });
  it('excludes SUPER_ADMIN and paginates safely', async () => { prisma.user.findMany.mockResolvedValue([employee]); prisma.user.count.mockResolvedValue(21); const result = await service.list(actor, { page: 2, limit: 20, search: 'use' }); expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 20, take: 20, orderBy: { createdAt: 'desc' }, where: expect.objectContaining({ shopId: 'shop-1', role: { not: UserRole.SUPER_ADMIN } }) })); expect(result.totalPages).toBe(2); sensitive(result); });
  it('prevents SUPER_ADMIN employee creation and converts P2002', async () => { await expect(service.create(actor, { firstName:'A', phone:'+992900000009', role:UserRole.SUPER_ADMIN, temporaryPassword:'Password1' })).rejects.toBeInstanceOf(BadRequestException); prisma.user.findUnique.mockResolvedValue(null); prisma.user.create.mockRejectedValue({ code:'P2002' }); await expect(service.create(actor, { firstName:'A', phone:'+992900000009', role:UserRole.SELLER, temporaryPassword:'Password1' })).rejects.toBeInstanceOf(ConflictException); });
  it('creates an employee with bcrypt hash and no sensitive response', async () => { prisma.user.findUnique.mockResolvedValue(null); prisma.user.create.mockResolvedValue(employee); const result = await service.create(actor, { firstName:'A', phone:'+992900000009', role:UserRole.SELLER, temporaryPassword:'Password1' }); expect(hash).toHaveBeenCalledWith('Password1',12); expect(prisma.user.create.mock.calls[0][0].data).toEqual(expect.objectContaining({passwordHash:'hashed'})); sensitive(result); });
  it('hides foreign employees and blocks self actions', async () => { prisma.user.findFirst.mockResolvedValue(null); await expect(service.findOne(actor,'x')).rejects.toBeInstanceOf(NotFoundException); tx.user.findFirst.mockResolvedValue({ ...employee, id: actor.id, role: UserRole.SHOP_ADMIN }); await expect(service.update(actor,actor.id,{isActive:false})).rejects.toBeInstanceOf(ForbiddenException); });
  it('protects last SHOP_ADMIN with Serializable transaction', async () => { const target={...employee,role:UserRole.SHOP_ADMIN}; tx.user.findFirst.mockResolvedValue(target); tx.user.count.mockResolvedValue(0); await expect(service.update(superActor,target.id,{isActive:false},'shop-1')).rejects.toMatchObject({message:'Нельзя деактивировать или изменить роль последнего администратора магазина'}); expect(tx.user.count).toHaveBeenCalledWith({where:{shopId:'shop-1',id:{not:target.id},role:UserRole.SHOP_ADMIN,isActive:true}}); expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function),{isolationLevel:Prisma.TransactionIsolationLevel.Serializable}); });
  it('resets password without exposing hash', async () => { prisma.user.findFirst.mockResolvedValue(employee); prisma.user.update.mockResolvedValue({}); const result=await service.resetPassword(actor,employee.id,{temporaryPassword:'Password2'}); expect(hash).toHaveBeenCalledWith('Password2',12); expect(prisma.user.update).toHaveBeenCalledWith({where:{id:employee.id},data:{passwordHash:'hashed'}}); expect(result).toEqual({success:true,message:'Пароль сотрудника обновлён'}); sensitive(result); });
});
