import Image from 'next/image';

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/oui-logo.png"
        alt="Oduduwa University Ipetumodu"
        width={size}
        height={size}
        priority
      />
      <span className="text-lg font-semibold tracking-tight">Smartance</span>
    </div>
  );
}
