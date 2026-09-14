import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Timing follows the usual convention for tooltips on controls. The first one
 * waits long enough that moving the pointer across a toolbar does not flash a
 * row of labels; once one is open, its neighbours open at once, because the
 * reader is now scanning for the right button.
 */
// Set by TooltipProvider so a Tooltip can tell whether one is above it.
const ProviderPresent = React.createContext(false)

function TooltipProvider({
  delayDuration = 500,
  skipDelayDuration = 300,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <ProviderPresent.Provider value={true}>
      <TooltipPrimitive.Provider
        data-slot="tooltip-provider"
        delayDuration={delayDuration}
        skipDelayDuration={skipDelayDuration}
        {...props}
      />
    </ProviderPresent.Provider>
  )
}

/**
 * Radix throws when a tooltip has no provider above it, which would take down
 * any page or test that renders a Button with a tooltip outside the app
 * layouts. Inside the app the shared provider is used, so neighbouring
 * tooltips open without a second delay; anywhere else a local one is supplied.
 */
function Tooltip(props: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  const hasProvider = React.useContext(ProviderPresent)
  const root = <TooltipPrimitive.Root data-slot="tooltip" {...props} />
  return hasProvider ? root : <TooltipProvider>{root}</TooltipProvider>
}

function TooltipTrigger(
  props: React.ComponentProps<typeof TooltipPrimitive.Trigger>,
) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 6,
  // Keeps a tooltip on a control near the window edge from touching it.
  collisionPadding = 8,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          // No enter animation: no animation plugin is installed, so the
          // animate-in classes other popovers carry are inert. The open delay
          // already prevents flashing.
          "z-50 max-w-72 rounded-md bg-foreground px-3 py-1.5 text-xs leading-relaxed text-pretty text-background shadow-md",
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
