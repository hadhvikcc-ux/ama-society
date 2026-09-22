import { UserRole, TenancyType } from './roles';

export interface ApiResponse<T> { success: boolean; data: T; message?: string; }
export interface PaginatedResponse<T> extends ApiResponse<T[]> { total: number; page: number; limit: number; totalPages: number; }
export interface User { id: string; email: string; phone: string; name: string; role: UserRole; societyId: string; flatId?: string; createdAt: Date; }
export interface Society { id: string; name: string; address: string; city: string; state: string; totalFlats: number; }
export interface Flat { id: string; societyId: string; tower: string; flatNumber: string; floor: number; tenancyType: TenancyType; ownerId?: string; tenantId?: string; }
