import { z } from "zod";
import { formatNumberDecimal } from "./utils";

const currency = z
  .string()
  .refine(
    (val) => /^\d+(\.\d{2})?$/.test(formatNumberDecimal(Number(val))),
    "price must be a number with 2 decimal places"
  );

// schema for insert products
export const insertProductSchema = z.object({
  name: z.string().min(3, "Name is too short"),
  slug: z.string().min(3, "Slug is too short"),
  category: z.string().min(3, "Category is too short"),
  brand: z.string().min(3, "Brand is too short"),
  description: z.string().min(3, "Description is too short"),
  stock: z.coerce.number(),
  images: z.array(z.string()).min(1, "Provide at least one image"),
  isFeatured: z.boolean(),
  banner: z.string().nullable(),
  price: currency,
});

// schema for signin
export const signinSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
