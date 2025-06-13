import * as RadixTooltip from '@radix-ui/react-tooltip';
import React from 'react';

export const TooltipProvider = RadixTooltip.Provider;
export const Tooltip = RadixTooltip.Root;
export const TooltipTrigger = RadixTooltip.Trigger;
export const TooltipContent = ({ children, ...props }: RadixTooltip.TooltipContentProps) => (
  <RadixTooltip.Content sideOffset={4} {...props} style={{
    background: 'rgba(0,0,0,0.85)',
    color: 'white',
    borderRadius: 4,
    padding: '6px 10px',
    fontSize: 13,
    zIndex: 9999,
    ...props.style,
  }}>
    {children}
    <RadixTooltip.Arrow style={{ fill: 'rgba(0,0,0,0.85)' }} />
  </RadixTooltip.Content>
); 