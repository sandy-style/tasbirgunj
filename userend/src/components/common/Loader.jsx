const Loader = ({ message = "Loading..." }) => {
  return (
    <div
      className="flex min-h-[200px] items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-red-600" />

        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </div>
  );
};

export default Loader;
