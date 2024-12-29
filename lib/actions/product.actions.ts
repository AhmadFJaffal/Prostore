"use server";
import { PrismaClient } from "@prisma/client";
import { convertToPlainObject } from "../utils";
import { LATEST_PRODUCTS_LIMIT } from "../constants";

// Get latest products
export async function getLatestProducts() {
  const prisma = new PrismaClient();
  const products = await prisma.product.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: LATEST_PRODUCTS_LIMIT,
  });
  prisma.$disconnect();
  return convertToPlainObject(products);
}
