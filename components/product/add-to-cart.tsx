"use client";
import { Cart, CartItem } from "@/types";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { Plus, Minus, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "../ui/toast";
import { addToCart, removeFromCart } from "@/lib/actions/cart.actions";
import { useTransition } from "react";

const AddToCart = ({ cart, item }: { cart?: Cart; item: CartItem }) => {
  const router = useRouter();
  const { toast } = useToast();

  const [isPending, startTransition] = useTransition();

  const handleAddToCart = async () => {
    startTransition(async () => {
      const response = await addToCart(item);
      if (response.success) {
        toast({
          description: response.message,
          action: (
            <ToastAction
              className="bg-primary text-white hover:bg-gray-800"
              altText="View Cart"
              onClick={() => router.push("/cart")}
            >
              View Cart
            </ToastAction>
          ),
        });
      } else {
        toast({
          variant: "destructive",
          description: response.message,
        });
        return;
      }
    });
  };

  const handleRemoveFromCart = async () => {
    startTransition(async () => {
      const response = await removeFromCart(item.productId);
      toast({
        variant: response.success ? "default" : "destructive",
        description: response.message,
      });
      return;
    });
  };

  // check if item is already in cart
  const isInCart = cart?.items.find(
    (cartItem) => cartItem.productId === item.productId
  );

  return isInCart ? (
    <div>
      <Button variant="outline" type="button" onClick={handleRemoveFromCart}>
        {isPending ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : (
          <Minus className="h-4 w-4" />
        )}
      </Button>
      <span className="px-2">{isInCart.quantity}</span>
      <Button variant="outline" type="button" onClick={handleAddToCart}>
        {isPending ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </Button>
    </div>
  ) : (
    <Button className="w-full" type="button" onClick={handleAddToCart}>
      {isPending ? (
        <Loader className="h-4 w-4 animate-spin" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
      Add to cart
    </Button>
  );
};

export default AddToCart;
