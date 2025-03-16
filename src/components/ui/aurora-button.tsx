import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AuroraButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  glowClassName?: string;
  children: React.ReactNode;
}

export const AuroraButton = React.forwardRef<HTMLButtonElement, AuroraButtonProps>(
  ({ className, glowClassName, children, ...props }, ref) => {
    return (
      <Button
        className={cn(
          "relative bg-purple-200 text-purple-950 hover:bg-purple-300 border-0",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

AuroraButton.displayName = "AuroraButton"; 