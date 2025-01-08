"use server";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { signinSchema } from "../validators";
import { signIn, signOut } from "@/auth";

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
