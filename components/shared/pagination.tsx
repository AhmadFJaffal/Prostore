"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../ui/button";
import { formUrlQuery } from "@/lib/utils";

interface PaginationProps {
  page: number | string;
  totalPages: number;
  urlParamName?: string;
}

const Pagination = ({ page, totalPages, urlParamName }: PaginationProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleClick = (type: "prev" | "next") => () => {
    const newPage = type === "prev" ? Number(page) - 1 : Number(page) + 1;
    const url = formUrlQuery({
      params: searchParams.toString(),
      key: urlParamName || "page",
      value: newPage.toString(),
    });

    router.push(url);
  };

  return (
    <div className="flex gap-2">
      <Button
        size="lg"
        variant="outline"
        className="w-28"
        disabled={page === 1}
        onClick={handleClick("prev")}
      >
        Previous
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="w-28"
        disabled={page === totalPages}
        onClick={handleClick("next")}
      >
        Next
      </Button>
    </div>
  );
};

export default Pagination;
