export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      {/* Pulsing gold ring */}
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-sand" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold animate-spin" />
      </div>
      <span className="text-[0.68rem] font-semibold tracking-[0.2em] uppercase text-warm-grey">
        Loading
      </span>
    </div>
  );
}
