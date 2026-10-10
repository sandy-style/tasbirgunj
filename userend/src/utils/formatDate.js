export const formatDate = (date) => {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsedDate);
};

export const formatRelativeTime = (date) => {
  if (!date) return "";

  const parsedDate = new Date(date);
  const timestamp = parsedDate.getTime();

  if (Number.isNaN(timestamp)) {
    return "";
  }

  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 0) return formatDate(parsedDate);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return formatDate(parsedDate);
};
