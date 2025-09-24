import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const AccessibleButton = React.forwardRef(({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  loadingText = "Loading...",
  children,
  disabled,
  ...props
}, ref) => {
  const Comp = asChild ? Slot : "button";
  
  // Enhanced accessibility props
  const accessibilityProps = {
    "aria-disabled": disabled || loading,
    "aria-busy": loading,
    "aria-describedby": loading ? `${props.id || 'button'}-loading` : props["aria-describedby"],
    ...props
  };

  return (
    <>
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...accessibilityProps}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
            <span className="sr-only">{loadingText}</span>
            {loadingText}
          </>
        ) : (
          children
        )}
      </Comp>
      
      {/* Screen reader loading announcement */}
      {loading && (
        <div
          id={`${props.id || 'button'}-loading`}
          className="sr-only"
          aria-live="polite"
        >
          {loadingText}
        </div>
      )}
    </>
  );
});

AccessibleButton.displayName = "AccessibleButton";

export { AccessibleButton, buttonVariants };