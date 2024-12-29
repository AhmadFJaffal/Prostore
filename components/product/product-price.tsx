import { cn } from "@/lib/utils";

const ProductPrice = ({
  value,
  className,
}: {
  value: number | string;
  className?: string;
}) => {
  // Convert value to a number if it's a string
  const numericValue = typeof value === "string" ? parseFloat(value) : value;

  // Ensure two decimal places
  const stringValue = numericValue.toFixed(2);

  // Get the integer part
  const [integer, decimal] = stringValue.split(".");

  return (
    <p className={cn("text-2xl", className)}>
      <span className="text-xs align-super">$</span>
      {integer}
      <span className="text-xs align-super">.{decimal}</span>
    </p>
  );
};

export default ProductPrice;
