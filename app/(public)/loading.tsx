import LoadingSpinner from "@/components/ui/loading-spinner";

export default function PublicLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}
