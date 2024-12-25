import { cn } from "@/lib/utils";

const ProductPrice = ({
  value,
  className,
}: {
  value: number;
  className?: string;
}) => {
  // ensure two decimal places
  const stringValue = value.toFixed(2);
  //get the integer part
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
