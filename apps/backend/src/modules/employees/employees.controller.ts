import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permission } from '../../common/permissions/permission.enum';
import { PermissionsGuard } from '../../common/permissions/permissions.guard';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateEmployeeDto } from './dto/create-employee.dto'; import { ListEmployeesQueryDto } from './dto/list-employees-query.dto'; import { ResetEmployeePasswordDto } from './dto/reset-employee-password.dto'; import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeActor, EmployeesService } from './employees.service';
@ApiTags('Employees') @ApiBearerAuth() @UseGuards(JwtAuthGuard,RolesGuard,PermissionsGuard) @Roles(UserRole.SUPER_ADMIN,UserRole.SHOP_ADMIN) @Controller('employees')
export class EmployeesController { constructor(private readonly service:EmployeesService) {}
 @Get() @RequirePermissions(Permission.EMPLOYEES_VIEW) @ApiOperation({summary:'Список сотрудников'}) list(@Req() r:{user:EmployeeActor},@Query() q:ListEmployeesQueryDto){return this.service.list(r.user,q)}
 @Post() @RequirePermissions(Permission.EMPLOYEES_CREATE) create(@Req() r:{user:EmployeeActor},@Body() d:CreateEmployeeDto){return this.service.create(r.user,d)}
 @Get(':id') @RequirePermissions(Permission.EMPLOYEES_VIEW) one(@Req() r:{user:EmployeeActor},@Param('id',ParseUUIDPipe) id:string,@Query('shopId') shopId?:string){return this.service.findOne(r.user,id,shopId)}
 @Patch(':id') @RequirePermissions(Permission.EMPLOYEES_UPDATE) update(@Req() r:{user:EmployeeActor},@Param('id',ParseUUIDPipe) id:string,@Body() d:UpdateEmployeeDto,@Query('shopId') shopId?:string){return this.service.update(r.user,id,d,shopId)}
 @Post(':id/reset-password') @RequirePermissions(Permission.EMPLOYEES_RESET_PASSWORD) reset(@Req() r:{user:EmployeeActor},@Param('id',ParseUUIDPipe) id:string,@Body() d:ResetEmployeePasswordDto,@Query('shopId') shopId?:string){return this.service.resetPassword(r.user,id,d,shopId)} }
