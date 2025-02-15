import { z } from "zod";
import { formatNumberDecimal } from "./utils";
import { PAYMENT_METHODS } from "./constants";

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
  password: z.string().min(3, "Password must be at least 6 characters"),
});

// schema for signup
export const signupSchema = z
  .object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(3, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(3, "Confirm Password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// schema for cart
export const cartItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  quantity: z.number().int().nonnegative("Quantity must be a positive number"),
  image: z.string().min(1, "Image is required"),
  price: currency,
});

export const insertCartSchema = z.object({
  items: z.array(cartItemSchema).min(1, "Cart is empty"),
  itemsPrice: currency,
  totalPrice: currency,
  taxPrice: currency,
  shippingPrice: currency,
  sessionCartId: z.string().min(1, "Session Cart Id is required"),
  userId: z.string().optional().nullable(),
});

// schema for shipping address
export const shippingAddressSchema = z.object({
  fullName: z.string().min(3, "Name must be at least 3 characters"),
  streetAddress: z.string().min(3, "Street Address is required"),
  city: z.string().min(3, "City is required"),
  postalCode: z.string().min(3, "Postal Code is required"),
  country: z.string().min(3, "Country is required"),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

// schema for payment method
export const paymentMethodSchema = z
  .object({
    type: z.string().min(1, "Payment Method is required"),
  })
  .refine((data) => PAYMENT_METHODS.includes(data.type), {
    path: ["type"],
    message: "Invalid Payment Method",
  });

// schema for order insert
export const insertOrderSchema = z.object({
  userId: z.string().min(1, "User is required"),
  itemsPrice: currency,
  totalPrice: currency,
  taxPrice: currency,
  shippingPrice: currency,
  paymentMethod: z.string().refine((val) => PAYMENT_METHODS.includes(val), {
    message: "Invalid Payment Method",
  }),
  shippingAddress: shippingAddressSchema,
});

// schema for inserting an order item schema
export const insertOrderItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  slug: z.string().min(1, "Slug is required"),
  name: z.string().min(1, "Name is required"),
  image: z.string().min(1, "Image is required"),
  price: currency,
  quantity: z.number().int().nonnegative("Quantity must be a positive number"),
});


