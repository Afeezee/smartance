import { forwardRef, type InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, id, className = '', ...rest },
  ref,
) {
  return (
    <label className="block text-sm">
      {label && <span className="mb-1 block font-medium text-text">{label}</span>}
      <input
        ref={ref}
        id={id}
        className={
          'block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm ' +
          'placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary ' +
          (error ? 'border-primary ' : '') +
          className
        }
        {...rest}
      />
      {error && <span className="mt-1 block text-xs text-primary">{error}</span>}
    </label>
  );
});
