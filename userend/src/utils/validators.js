// src/utils/validators.js

// ---------- Email ----------

export const validateEmail = (email) => {
  if (typeof email !== "string") return false;

  const value = email.trim();

  if (!value || value.length > 254) return false;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

// ---------- Password ----------

// Use for registration and password reset.
// At login, avoid rejecting existing passwords only because of length.
export const validatePassword = (password) => {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    password.length <= 128
  );
};

// ---------- Password Strength ----------

export const getPasswordStrength = (password) => {
  const emptyResult = {
    score: 0,
    label: "Enter a password",
    checks: {
      length: false,
      lowercase: false,
      uppercase: false,
      number: false,
      special: false,
    },
  };

  if (typeof password !== "string" || !password) {
    return emptyResult;
  }

  const checks = {
    length: password.length >= 8 && password.length <= 128,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  let label = "Very weak";

  if (score === 5) label = "Strong";
  else if (score === 4) label = "Good";
  else if (score === 3) label = "Fair";
  else if (score >= 1) label = "Weak";

  return { score, label, checks };
};

// ---------- Username ----------

export const validateUsername = (username) => {
  if (typeof username !== "string") return false;

  return /^[a-zA-Z0-9_]{3,20}$/.test(username.trim());
};

// ---------- Name ----------

export const validateName = (name) => {
  if (typeof name !== "string") return false;

  const value = name.trim();

  return value.length >= 2 && value.length <= 50;
};

// ---------- Bio ----------

export const validateBio = (bio) => {
  return typeof bio === "string" && bio.length <= 300;
};

// ---------- Caption ----------

export const validateCaption = (caption) => {
  if (typeof caption !== "string") return false;

  const value = caption.trim();

  return value.length >= 1 && value.length <= 1000;
};

// ---------- Comment ----------

export const validateComment = (comment) => {
  if (typeof comment !== "string") return false;

  const value = comment.trim();

  return value.length >= 1 && value.length <= 500;
};

// ---------- Email Verification Code ----------

export const validateVerificationCode = (code) => {
  return /^\d{6}$/.test(String(code ?? "").trim());
};
