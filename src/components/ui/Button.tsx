import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const styles: Record<Variant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-hover focus-visible:outline-primary',
  secondary:
    'bg-secondary text-text hover:brightness-95 focus-visible:outline-secondary',
  ghost:
    'bg-transparent text-text hover:bg-border/50 focus-visible:outline-primary',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', className = '', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={
        'inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium ' +
        'transition disabled:cursor-not-allowed disabled:opacity-60 ' +
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
        styles[variant] +
        (className ? ' ' + className : '')
      }
      {...rest}
    />
  );
});
