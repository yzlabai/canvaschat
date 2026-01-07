'use client';

import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { ToolInvocation } from 'ai';
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  WrenchIcon,
  XCircleIcon,
} from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { CodeBlock } from './code-block';

export type ToolProps = ComponentProps<typeof Collapsible>;

export const Tool = ({ className, ...props }: ToolProps) => (
  <Collapsible
    className={cn('not-prose mb-4 w-full rounded-md border', className)}
    {...props}
  />
);

export type ToolHeaderProps = {
  toolName: string;
  state: ToolInvocation['state'];
  className?: string;
};

const getStatusBadge = (state: ToolInvocation['state']) => {
  const labels: Record<string, string> = {
    'partial-call': 'Running',
    'call': 'Running',
    'result': 'Completed',
  };

  const icons: Record<string, ReactNode> = {
    'partial-call': <ClockIcon className="size-4 animate-pulse" />,
    'call': <ClockIcon className="size-4 animate-pulse" />,
    'result': <CheckCircleIcon className="size-4 text-green-600" />,
  };

  return (
    <Badge className="rounded-full text-xs" variant="secondary">
      {icons[state]}
      {labels[state] || state}
    </Badge>
  );
};

export const ToolHeader = ({
  className,
  toolName,
  state,
  ...props
}: ToolHeaderProps) => (
  <CollapsibleTrigger
    className={cn(
      'flex w-full items-center justify-between gap-4 p-3',
      className
    )}
    {...props}
  >
    <div className="flex items-center gap-2">
      <WrenchIcon className="size-4 text-muted-foreground" />
      <span className="font-medium text-sm">{toolName}</span>
      {getStatusBadge(state)}
    </div>
    <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
  </CollapsibleTrigger>
);

export type ToolContentProps = ComponentProps<typeof CollapsibleContent>;

export const ToolContent = ({ className, ...props }: ToolContentProps) => (
  <CollapsibleContent
    className={cn(
      'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in',
      className
    )}
    {...props}
  />
);

export type ToolInputProps = ComponentProps<'div'> & {
  args: ToolInvocation['args'];
};

export const ToolInput = ({ className, args, ...props }: ToolInputProps) => (
  <div className={cn('space-y-2 overflow-hidden p-4', className)} {...props} >
    <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
      Parameters
    </h4>
    <div className="rounded-md bg-muted/50">
      <CodeBlock code={JSON.stringify(args, null, 2)} language="json" />
    </div>
  </div>
);

export type ToolOutputProps = ComponentProps<'div'> & {
  result: any;
};

export const ToolOutput = ({
  className,
  result,
  ...props
}: ToolOutputProps) => {
  if (!result) {
    return null;
  }

  return (
    <div className={cn('space-y-2 p-4', className)} {...props}>
      <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        Result
      </h4>
      <div
        className={cn(
          'overflow-x-auto rounded-md text-xs [&_table]:w-full',
           'bg-muted/50 text-foreground'
        )}
      >
        <div>{typeof result === 'string' ? result : JSON.stringify(result, null, 2)}</div>
      </div>
    </div>
  );
};
