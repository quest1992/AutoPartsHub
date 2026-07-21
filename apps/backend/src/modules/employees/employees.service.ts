import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { ListEmployeesQueryDto } from './dto/list-employees-query.dto';
import { ResetEmployeePasswordDto } from './dto/reset-employee-password.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

export type EmployeeActor = { id: string; role: UserRole; shopId: string | null };
const employeeRoles: UserRole[] = [UserRole.SHOP_ADMIN, UserRole.MANAGER, UserRole.SELLER, UserRole.VIEWER];
const select = { id:true, firstName:true, lastName:true, phone:true, role:true, isActive:true, shopId:true, createdAt:true, updatedAt:true, shop:{select:{id:true,name:true,isActive:true}} } satisfies Prisma.UserSelect;

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}
  private async shop(actor: EmployeeActor, requested?: string, active = false) {
    if (actor.role === UserRole.SHOP_ADMIN) { if (!actor.shopId || (requested && requested !== actor.shopId)) throw new ForbiddenException('Нет доступа к магазину'); requested = actor.shopId; }
    else if (actor.role !== UserRole.SUPER_ADMIN) throw new ForbiddenException('Нет доступа к сотрудникам');
    if (!requested) throw new BadRequestException('Для SUPER_ADMIN требуется shopId');
    const shop = await this.prisma.shop.findUnique({ where:{id:requested} });
    if (!shop) throw new NotFoundException('Магазин не найден');
    if (active && !shop.isActive) throw new BadRequestException('Магазин отключён');
    return requested;
  }
  private allowed(actor: EmployeeActor, role: UserRole) {
    if (!employeeRoles.includes(role) || role === UserRole.SUPER_ADMIN) throw new BadRequestException('Недопустимая роль сотрудника');
    if (actor.role === UserRole.SHOP_ADMIN && role === UserRole.SHOP_ADMIN) throw new ForbiddenException('SHOP_ADMIN не может назначать администратора');
  }
  async list(actor: EmployeeActor, q: ListEmployeesQueryDto) { const shopId=await this.shop(actor,q.shopId); const page=q.page??1, limit=q.limit??20, search=q.search?.trim(); const where:Prisma.UserWhereInput={shopId,role:{not:UserRole.SUPER_ADMIN},...(q.role?{role:q.role}:{}),...(q.isActive!==undefined?{isActive:q.isActive}:{}),...(search?{OR:[{firstName:{contains:search,mode:'insensitive'}},{lastName:{contains:search,mode:'insensitive'}},{phone:{contains:search,mode:'insensitive'}}]}:{})}; const [items,total]=await Promise.all([this.prisma.user.findMany({where,select,orderBy:{createdAt:'desc'},skip:(page-1)*limit,take:limit}),this.prisma.user.count({where})]); return {items,page,limit,total,totalPages:Math.ceil(total/limit)}; }
  async create(actor: EmployeeActor, dto: CreateEmployeeDto) { const shopId=await this.shop(actor,dto.shopId,true); this.allowed(actor,dto.role); const phone=dto.phone.trim(); if(await this.prisma.user.findUnique({where:{phone}})) throw new ConflictException('Пользователь с таким телефоном уже существует'); try{return await this.prisma.user.create({data:{firstName:dto.firstName.trim(),lastName:dto.lastName?.trim(),phone,role:dto.role,shopId,passwordHash:await bcrypt.hash(dto.temporaryPassword,12)},select});}catch(e){if((e as {code?:string}).code==='P2002')throw new ConflictException('Пользователь с таким телефоном уже существует');throw e;} }
  async findOne(actor: EmployeeActor,id:string,shopId?:string){const sid=await this.shop(actor,shopId);const user=await this.prisma.user.findFirst({where:{id,shopId:sid,role:{not:UserRole.SUPER_ADMIN}},select});if(!user)throw new NotFoundException('Сотрудник не найден');return user;}
  async update(actor:EmployeeActor,id:string,dto:UpdateEmployeeDto,shopId?:string){const sid=await this.shop(actor,shopId);return this.prisma.$transaction(async tx=>{const target=await tx.user.findFirst({where:{id,shopId:sid,role:{not:UserRole.SUPER_ADMIN}}});if(!target)throw new NotFoundException('Сотрудник не найден');if(target.id===actor.id&&(dto.isActive===false||dto.role&&dto.role!==target.role))throw new ForbiddenException('Нельзя менять свою роль или отключать себя');if(actor.role===UserRole.SHOP_ADMIN&&(target.role===UserRole.SHOP_ADMIN||dto.role===UserRole.SHOP_ADMIN))throw new ForbiddenException('SHOP_ADMIN не может управлять администраторами');if(dto.role)this.allowed(actor,dto.role);if(target.role===UserRole.SHOP_ADMIN&&target.isActive&&(dto.isActive===false||(dto.role&&dto.role!==UserRole.SHOP_ADMIN))){const others=await tx.user.count({where:{shopId:sid,id:{not:id},role:UserRole.SHOP_ADMIN,isActive:true}});if(!others)throw new ConflictException('Нельзя деактивировать или изменить роль последнего администратора магазина');}const phone=dto.phone?.trim();if(phone){const exists=await tx.user.findFirst({where:{phone,id:{not:id}}});if(exists)throw new ConflictException('Пользователь с таким телефоном уже существует');}return tx.user.update({where:{id},data:{...dto,...(phone?{phone}:{})},select});},{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});}
  async resetPassword(actor:EmployeeActor,id:string,dto:ResetEmployeePasswordDto,shopId?:string){const user=await this.findOne(actor,id,shopId);if(actor.role===UserRole.SHOP_ADMIN&&user.role===UserRole.SHOP_ADMIN)throw new ForbiddenException('Нельзя сбрасывать пароль администратора');await this.prisma.user.update({where:{id},data:{passwordHash:await bcrypt.hash(dto.temporaryPassword,12)}});return {success:true,message:'Пароль сотрудника обновлён'};}
}
