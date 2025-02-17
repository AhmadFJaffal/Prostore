"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/user/orders", label: "Orders" },
  { href: "/user/profile", label: "Profile" },
];

const UserNav = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const pathName = usePathname();
  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "text-sm font-medium transition-colors duration-200 hover:text-primary",
            pathName.includes(href) ? "" : "text-muted-foreground"
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
};

export default UserNav;
