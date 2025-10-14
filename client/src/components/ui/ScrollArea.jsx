// src/components/ui/ScrollArea.jsx
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

const ScrollArea = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('relative overflow-auto', className)}
      {...props}
    >
      {children}
    </div>
  );
});

ScrollArea.displayName = 'ScrollArea';

export { ScrollArea };