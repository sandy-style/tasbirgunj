const Button = ({
  children,
  type = "button",
  variant = "primary",
  disabled = false,
  loading = false,
  className = "",
  onClick,
}) => {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

  const variants = {
    primary: "bg-amber-700 text-white hover:bg-amber-800",
    secondary: "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${className}`}
    >
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}

      {loading ? "Please wait..." : children}
    </button>
  );
};

export default Button;
