"use server";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import {
  paymentMethodSchema,
  shippingAddressSchema,
  signinSchema,
  signupSchema,
} from "../validators";
import { auth, signIn, signOut } from "@/auth";
import { hashSync } from "bcrypt-ts-edge";
import { prisma } from "@/db/prisma";
import { formatError } from "../utils";
import { ShippingAddress } from "@/types";
import { z } from "zod";

// Sign in user with email and password
export async function signInWithCredentials(
  prevState: unknown,
  formData: FormData
) {
  try {
    console.log("formData", formData);
    const user = signinSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    console.log("user", user);

    await signIn("credentials", user);

    return {
      success: true,
      message: "You have successfully signed in",
    };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return {
      success: false,
      message: "Invalid email or password",
    };
  }
}

// Sign out user
export async function signOutUser() {
  await signOut();
}

// Sign up user with email and password
export async function signUpWithCredentials(
  prevState: unknown,
  formData: FormData
) {
  try {
    const user = signupSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    const plainTextPassword = user.password;
    const hashedPassword = hashSync(plainTextPassword, 10);

    const existingUser = await prisma.user.findUnique({
      where: {
        email: user.email,
      },
    });

    if (existingUser) {
      return {
        success: false,
        message: "Email already exists",
      };
    }

    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
      },
    });

    await signIn("credentials", {
      email: user.email,
      password: plainTextPassword,
    });

    return {
      success: true,
      message: "You have successfully signed up",
    };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// get a user by id
export async function getUserById(id: string) {
  const user = await prisma.user.findFirst({
    where: {
      id: id,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

// update user address
export async function updateUserAddress(data: ShippingAddress) {
  try {
    const session = await auth();

    const user = await prisma.user.findFirst({
      where: {
        id: session?.user?.id,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const address = shippingAddressSchema.parse(data);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        address: address,
      },
    });

    return {
      success: true,
      message: "User Address updated successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// update user's payment method
export async function updateUserPaymentMethod(
  data: z.infer<typeof paymentMethodSchema>
) {
  try {
    const session = await auth();

    const user = await prisma.user.findFirst({
      where: {
        id: session?.user?.id,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const paymentMethod = paymentMethodSchema.parse(data);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        paymentMethod: paymentMethod.type,
      },
    });

    return {
      success: true,
      message: "User Payment Method updated successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function updateUserProfile(name: string) {
  try {
    const session = await auth();

    const user = await prisma.user.findFirst({
      where: {
        id: session?.user?.id,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        name: name,
      },
    });

    return {
      success: true,
      message: "User Profile updated successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}
