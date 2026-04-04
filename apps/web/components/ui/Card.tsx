import { HTMLAttributes } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  imageSrc?: string;
  imageAlt?: string;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
}

export function Card({
  imageSrc,
  imageAlt,
  title,
  subtitle,
  footer,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'group bg-surface border border-border',
        'transition-all duration-300',
        'hover:-translate-y-1 hover:shadow-lg hover:shadow-fg/5',
        className,
      )}
      {...props}
    >
      {imageSrc && (
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={imageSrc}
            alt={imageAlt ?? title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-6">
        <h3 className="font-display text-xl font-light text-fg">{title}</h3>
        {subtitle && (
          <p className="mt-1 font-body text-sm text-muted">{subtitle}</p>
        )}
        {children && <div className="mt-4">{children}</div>}
      </div>
      {footer && (
        <div className="border-t border-border px-6 py-4">{footer}</div>
      )}
    </div>
  );
}
