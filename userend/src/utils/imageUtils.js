export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const validateImage = (file) => {
  if (!file) {
    return { valid: false, error: "Please select an image." };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Only JPEG, PNG, WebP, and GIF images are allowed.",
    };
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: "Image size must not exceed 5 MB.",
    };
  }

  return { valid: true, error: "" };
};

export const createImagePreview = (file) => {
  if (!(file instanceof Blob)) {
    return "";
  }

  return URL.createObjectURL(file);
};

export const revokeImagePreview = (previewUrl) => {
  if (typeof previewUrl === "string" && previewUrl.startsWith("blob:")) {
    URL.revokeObjectURL(previewUrl);
  }
};

export const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
