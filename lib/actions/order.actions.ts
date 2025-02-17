"use server";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { convertToPlainObject, formatError } from "../utils";
import { auth } from "@/auth";
import { getMyCart } from "./cart.actions";
import { getUserById } from "./user.actions";
import { insertOrderSchema } from "../validators";
import { prisma } from "@/db/prisma";
import { CartItem, PaymentResult } from "@/types";
import { paypal } from "../paypal";
import { revalidatePath } from "next/cache";
import { PAGE_SIZE } from "../constants";

// create order and order items
export async function createOrder() {
  try {
    const session = await auth();

    if (!session) {
      throw new Error("User not authenticated");
    }

    const cart = await getMyCart();

    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("User not found");
    }

    const user = await getUserById(userId);

    if (!cart || cart.items.length === 0) {
      return {
        success: false,
        message: "Cart is empty",
        redirect: "/cart",
      };
    }
    if (!user.address) {
      return {
        success: false,
        message: "Address is required",
        redirect: "/shipping-address",
      };
    }
    if (!user.paymentMethod) {
      return {
        success: false,
        message: "Payment method is required",
        redirect: "/payment-method",
      };
    }

    // create order
    const order = insertOrderSchema.parse({
      userId: user.id,
      items: cart.items,
      itemsPrice: cart.itemsPrice,
      shippingPrice: cart.shippingPrice,
      taxPrice: cart.taxPrice,
      totalPrice: cart.totalPrice,
      address: user.address,
      paymentMethod: user.paymentMethod,
      shippingAddress: user.address,
    });

    // create a transaction
    const newOrderId = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: order,
      });

      // create order items
      for (const item of cart.items as CartItem[]) {
        await tx.orderItem.create({
          data: {
            ...item,
            price: item.price,
            orderId: newOrder.id,
          },
        });
      }

      // clear cart
      await tx.cart.update({
        where: {
          id: cart.id,
        },
        data: {
          items: [],
          totalPrice: 0,
          itemsPrice: 0,
          shippingPrice: 0,
          taxPrice: 0,
        },
      });

      return newOrder.id;
    });

    if (!newOrderId) {
      throw new Error("Failed to create order");
    }

    return {
      success: true,
      message: "Order created successfully",
      redirect: `/order/${newOrderId}`,
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

export async function getOrderById(orderId: string) {
  const data = await prisma.order.findFirst({
    where: {
      id: orderId,
    },
    include: {
      orderitems: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return convertToPlainObject(data);
}

// create a paypal order
export async function createPaypalOrder(orderId: string) {
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const paypalOrder = await paypal.createOrder(Number(order.totalPrice));

    // update order with paypal order id
    await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        paymentResult: {
          id: paypalOrder.id,
          email_address: "",
          status: "",
          price_paid: 0,
        },
      },
    });

    return {
      success: true,
      message: "Paypal order created successfully",
      data: paypalOrder.id,
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// approve paypal order
export async function approvePaypalOrder(orderId: string, paymentId: string) {
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const payment = await paypal.capturePayment(paymentId);

    if (
      !payment ||
      payment.id !== (order.paymentResult as PaymentResult)?.id ||
      payment.status !== "COMPLETED"
    ) {
      throw new Error("PayPal Payment failed");
    }

    // update order with payment result
    await updateOrderToPaid({
      orderId,
      paymentResult: {
        id: payment.id,
        email_address: payment.payer.email_address,
        status: payment.status,
        price_paid:
          payment.purchase_units[0]?.payments.captures[0]?.amount.value,
      },
    });

    revalidatePath(`/order/${orderId}`);

    return {
      success: true,
      message: "Payment approved successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

async function updateOrderToPaid({
  orderId,
  paymentResult,
}: {
  orderId: string;
  paymentResult?: PaymentResult;
}) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
    },
    include: {
      orderitems: true,
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.isPaid) {
    throw new Error("Order already paid");
  }

  // transaction to update order and product stock
  await prisma.$transaction(async (tx) => {
    for (const item of order.orderitems) {
      await tx.product.update({
        where: {
          id: item.productId,
        },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    // set the order as paid
    await tx.order.update({
      where: {
        id: orderId,
      },
      data: {
        isPaid: true,
        paidAt: new Date(),
        paymentResult,
      },
    });
  });

  // get updated order after transaction
  const updatedOrder = await prisma.order.findFirst({
    where: {
      id: orderId,
    },
    include: {
      orderitems: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!updatedOrder) {
    throw new Error("Order not found");
  }
}

// get my orders
export async function getMyOrders({
  limit = PAGE_SIZE,
  page = 1,
}: {
  limit?: number;
  page: number;
}) {
  const session = await auth();

  if (!session) {
    throw new Error("User not authenticated");
  }

  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("User not found");
  }

  const data = await prisma.order.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },

    take: limit,
    skip: (page - 1) * limit,
  });

  const count = await prisma.order.count({
    where: {
      userId,
    },
  });

  return convertToPlainObject({
    data,
    totalPages: Math.ceil(count / limit),
  });
}
