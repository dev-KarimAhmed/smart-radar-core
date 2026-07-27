import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

const styles = {
  style12_1: "relative overflow-hidden",
  style15_2: "h-full w-full rounded-[inherit]",
  style32_3: "flex select-none touch-none transition-colors",
  style34_4: "h-full w-2.5 border-l border-l-transparent p-[1px]",
  style36_5: "h-2.5 flex-col border-t border-t-transparent p-[1px]",
  style41_6: "relative flex-1 rounded-full bg-border",
} as const;


const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn(styles.style12_1, className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className={styles.style15_2}>
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Scrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Scrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.Scrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      styles.style32_3,
      orientation === "vertical" &&
        styles.style34_4,
      orientation === "horizontal" &&
        styles.style36_5,
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className={styles.style41_6} />
  </ScrollAreaPrimitive.Scrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.Scrollbar.displayName

export { ScrollArea, ScrollBar }
