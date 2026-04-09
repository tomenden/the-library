interface TagChipProps {
  readonly label: string;
}

export default function TagChip({ label }: TagChipProps) {
  return (
    <span className="px-2 py-1 rounded-full bg-surface-container-high text-[0.625rem] font-bold tracking-widest uppercase text-on-surface-variant hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors cursor-pointer">
      {label}
    </span>
  );
}
