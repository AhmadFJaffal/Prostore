import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// convert prisma object to plain object
export function convertToPlainObject<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// format number with decimal places
export function formatNumberDecimal(num: number): string {
  const [int, decimal] = num.toString().split(".");
  return decimal ? `${int}.${decimal.padEnd(2, "0")}` : `${int}.00`;
}

// format errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function formatError(error: any) {
  if (error.name === "ZodError") {
    // handle zod error
    const fieldErrors = Object.keys(error.errors).map(
      (field) => error.errors[field].message
    );

    return fieldErrors.join(", ");
  } else if (
    error.name === "PrismaClientKnownRequestError" &&
    error.code === "P2002"
  ) {
    // handle prisma error
    const field = error.meta?.target ? error.meta.target : "Field";
    return `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  } else {
    // handle other errors
    return typeof error.message === "string"
      ? error.message
      : JSON.stringify(error.message);
  }
}
