import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

export type EmployeeRole = 'STYLIST' | 'BEAUTICIAN' | 'RECEPTIONIST';

export interface EmployeeCreateData {
  nameAr: string;
  nameEn: string;
  phone?: string;
  role: EmployeeRole;
  commissionRate?: number;
  hireDate: Date;
  isActive?: boolean;
  shiftName?: string;
  shiftStart?: string;
  shiftEnd?: string;
  workDays?: string;
  morningStart?: string;
  morningEnd?: string;
  eveningStart?: string;
  eveningEnd?: string;
}

async function list() {
  return prisma.employee.findMany({
    orderBy: [{ isActive: 'desc' }, { nameEn: 'asc' }],
    include: {
      _count: { select: { appointments: true } },
    },
  });
}

async function getById(id: number) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      appointments: {
        orderBy: { date: 'desc' },
        include: { client: true, service: true },
      },
      _count: { select: { appointments: true, invoices: true } },
    },
  });

  if (!employee) {
    throw new ApiError(404, 'Employee not found.');
  }

  return employee;
}

async function create(data: EmployeeCreateData) {
  return prisma.employee.create({ data });
}

async function update(id: number, data: Partial<EmployeeCreateData>) {
  const exists = await prisma.employee.findUnique({ where: { id } });
  if (!exists) {
    throw new ApiError(404, 'Employee not found.');
  }

  return prisma.employee.update({ where: { id }, data });
}

async function remove(id: number) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { _count: { select: { appointments: true, invoices: true } } },
  });

  if (!employee) {
    throw new ApiError(404, 'Employee not found.');
  }

  if (employee._count.appointments > 0 || employee._count.invoices > 0) {
    throw new ApiError(
      400,
      'Cannot delete an employee with appointments or invoices. Deactivate the employee instead.',
    );
  }

  await prisma.employee.delete({ where: { id } });
  return { id };
}

export const employeesService = { list, getById, create, update, remove };