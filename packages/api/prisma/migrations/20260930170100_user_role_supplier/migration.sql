-- schema.prisma has had SUPPLIER since the start, but the init migration never created it.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPPLIER';
