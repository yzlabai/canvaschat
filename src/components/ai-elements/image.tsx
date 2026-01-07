import { cn } from '@/lib/utils';

// Removed Experimental_GeneratedImage in favor of local definition or updated type
type Experimental_GeneratedImage = {
  base64?: string;
  uint8Array?: Uint8Array;
  mediaType?: string;
}

export type ImageProps = Experimental_GeneratedImage & {
  className?: string;
  alt?: string;
};

export const Image = ({
  base64,
  uint8Array,
  mediaType,
  ...props
}: ImageProps) => (
  <img
    {...props}
    alt={props.alt}
    className={cn(
      'h-auto max-w-full overflow-hidden rounded-md',
      props.className
    )}
    src={`data:${mediaType};base64,${base64}`}
  />
);
