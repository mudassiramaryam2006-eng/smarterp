import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'flex h-9 w-full rounded-sm border border-console-border bg-console-panel px-3 py-1 text-sm text-console-text placeholder:text-console-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber disabled:opacity-50',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export { Input };
