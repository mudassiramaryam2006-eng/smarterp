import * as React from 'react';
import { cn } from '@/lib/utils';

export const Label = React.forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn('text-xs font-medium text-console-muted uppercase tracking-wide', className)}
    {...props}
  />
));
Label.displayName = 'Label';

export const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('rounded-md border border-console-border bg-console-panel', className)} {...props} />
));
Card.displayName = 'Card';

export const Select = React.forwardRef(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'flex h-9 w-full rounded-sm border border-console-border bg-console-panel px-3 py-1 text-sm text-console-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber',
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = 'Select';
