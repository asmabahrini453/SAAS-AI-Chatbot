//define prsima cliente instance to work with it gloabally in all development mode
//without the need to create a new instance every time the code re-renders
import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export const client = globalThis.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalThis.prisma = client