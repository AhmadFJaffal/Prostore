"use server";
import { CartItem } from "@/types";
import { cookies } from "next/headers";
import { convertToPlainObject, formatError, round2 } from "../utils";
import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { cartItemSchema, insertCartSchema } from "../validators";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

// calculate cart prices
const calculateCartPrices = (items: CartItem[]) => {
  console.log(items);
  const itemsPrice = round2(
      items.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0)
    ),
    shippingPrice = round2(itemsPrice > 100 ? 0 : 10),
    taxPrice = round2(itemsPrice * 0.15),
    totalPrice = round2(itemsPrice + shippingPrice + taxPrice);

  return {
    itemsPrice: itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice: taxPrice.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
  };
};

export const addToCart = async (data: CartItem) => {
  try {
    const sessionCartId = (await cookies()).get("sessionCartId")?.value;

    if (!sessionCartId) {
      return {
        success: false,
        message: "No cart found",
      };
    }

    // get session and user id
    const session = await auth();
    const userId = session?.user?.id ? (session.user.id as string) : undefined;

    // get cart
    const cart = await getMyCart();

    // parse and validate item
    const item = cartItemSchema.parse(data);

    // find product in cart in the database
    const product = await prisma.product.findFirst({
      where: { id: item.productId },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    if (!cart) {
      // create a new cart

      if (product.stock < 1) {
        throw new Error("Not enough stock");
      }

      const newCart = insertCartSchema.parse({
        items: [item],
        userId: userId,
        sessionCartId: sessionCartId,
        ...calculateCartPrices([item]),
      });

      await prisma.cart.create({ data: newCart });

      revalidatePath(`/product/${product.slug}`);

      return {
        success: true,
        message: `${product.name} added to cart`,
      };
    } else {
      // check if item already exists in cart
      const existingItem = (cart.items as CartItem[]).find(
        (i) => i.productId === item.productId
      );

      if (existingItem) {
        // check the stock
        if (product.stock < existingItem.quantity + 1) {
          throw new Error("Not enough stock");
        }

        // increment the quantity
        (cart.items as CartItem[]).find(
          (i) => i.productId === item.productId
        )!.quantity = existingItem.quantity + 1;
      } else {
        // check the stock
        if (product.stock < 1) {
          throw new Error("Not enough stock");
        }

        // add the item to the cart
        (cart.items as CartItem[]).push(item);
      }

      // save the cart
      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          items: cart.items as Prisma.CartUpdateitemsInput[],
          ...calculateCartPrices(cart.items as CartItem[]),
        },
      });

      revalidatePath(`/product/${product.slug}`);

      return {
        success: true,
        message: `${product.name} ${
          existingItem ? "updated in" : "added to"
        } cart`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
};

export const getMyCart = async () => {
  const sessionCartId = (await cookies()).get("sessionCartId")?.value;
  if (!sessionCartId) throw new Error("No cart found");

  // get session and user id
  const session = await auth();
  const userId = session?.user?.id ? (session.user.id as string) : undefined;

  // get user cart from db
  const cart = await prisma.cart.findFirst({
    where: userId ? { userId: userId } : { id: sessionCartId },
  });

  if (!cart) return undefined;

  // convert decimals and return
  return convertToPlainObject({
    ...cart,
    items: cart.items as CartItem[],
    itemsPrice: cart.itemsPrice.toString(),
    totalPrice: cart.totalPrice.toString(),
    shippingPrice: cart.shippingPrice.toString(),
    taxPrice: cart.taxPrice.toString(),
  });
};

export const removeFromCart = async (productId: string) => {
  try {
    const sessionCartId = (await cookies()).get("sessionCartId")?.value;

    if (!sessionCartId) {
      throw new Error("No cart found");
    }

    // get the product
    const product = await prisma.product.findFirst({
      where: { id: productId },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // get user cart from db
    const cart = await getMyCart();
    if (!cart) {
      throw new Error("No cart found");
    }

    // check if item exists in cart
    const existingItem = (cart.items as CartItem[]).find(
      (i) => i.productId === productId
    );

    if (!existingItem) {
      return {
        success: false,
        message: "Item not found in cart",
      };
    }

    // check the quantity in cart
    if (existingItem.quantity === 1) {
      // remove the item from the cart
      cart.items = (cart.items as CartItem[]).filter(
        (i) => i.productId !== productId
      );
    } else {
      // decrement the quantity
      (cart.items as CartItem[]).find(
        (i) => i.productId === productId
      )!.quantity = existingItem.quantity - 1;
    }

    // save the cart
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: cart.items as Prisma.CartUpdateitemsInput[],
        ...calculateCartPrices(cart.items as CartItem[]),
      },
    });

    revalidatePath(`/product/${product.slug}`);

    return {
      success: true,
      message: `${product.name} removed from cart`,
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
};
