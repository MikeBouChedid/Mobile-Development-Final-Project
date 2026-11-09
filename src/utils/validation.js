// Form validation. Each function returns an object of error messages:
// an empty object means the form is valid.

export const UNIVERSITY_DOMAIN = '@ua.edu.lb';
export const MIN_PASSWORD = 6;

export function isUniversityEmail(email) {
  const value = email.trim().toLowerCase();
  return /^[a-z0-9._-]+@ua\.edu\.lb$/.test(value);
}

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Email is required';
  else if (!isUniversityEmail(email)) errors.email = `Use your university email (ending with ${UNIVERSITY_DOMAIN})`;

  if (!password) errors.password = 'Password is required';
  else if (password.length < MIN_PASSWORD) errors.password = `Password must be at least ${MIN_PASSWORD} characters`;
  return errors;
}

export function validateSignUp(form) {
  const errors = {};

  if (form.fullName.trim().length < 3) errors.fullName = 'Enter your full name';

  if (!form.email.trim()) errors.email = 'Email is required';
  else if (!isUniversityEmail(form.email)) errors.email = `Email must end with ${UNIVERSITY_DOMAIN}`;

  // Student / staff ID: exactly 8 digits (e.g. 20241234)
  if (!/^\d{8}$/.test(form.universityId)) errors.universityId = 'ID must be exactly 8 digits (e.g. 20241234)';

  if (!form.faculty) errors.faculty = 'Choose your faculty';

  // Lebanese mobile number: 8 digits starting with 03, 70, 71, 76, 78, 79 or 81
  if (!/^(03|70|71|76|78|79|81)\d{6}$/.test(form.phone)) errors.phone = 'Enter a valid Lebanese mobile number (e.g. 70123456)';

  if (form.password.length < MIN_PASSWORD) errors.password = `Password must be at least ${MIN_PASSWORD} characters`;
  if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match';

  return errors;
}

export function validatePrintJob({ documentName, pages, copies }, maxPages) {
  const errors = {};
  const p = Number(pages);
  const c = Number(copies);
  if (!documentName) errors.documentName = 'Choose a document to print';
  if (!Number.isInteger(p) || p <= 0) errors.pages = 'Pages must be greater than 0';
  else if (p > maxPages) errors.pages = `Maximum ${maxPages} pages per order`;
  if (!Number.isInteger(c) || c <= 0) errors.copies = 'Copies must be greater than 0';
  else if (p * c > maxPages * 5) errors.copies = 'Too many copies for one order';
  return errors;
}
