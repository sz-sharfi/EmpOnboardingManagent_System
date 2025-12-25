export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 8;
};

export const validateName = (name: string): boolean => {
  return name.trim().length >= 2;
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

export const validateForm = (formData: Record<string, unknown>): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (formData.email && !validateEmail(formData.email as string)) {
    errors.email = 'Invalid email address';
  }

  if (formData.password && !validatePassword(formData.password as string)) {
    errors.password = 'Password must be at least 8 characters';
  }

  if (formData.firstName && !validateName(formData.firstName as string)) {
    errors.firstName = 'First name must be at least 2 characters';
  }

  if (formData.lastName && !validateName(formData.lastName as string)) {
    errors.lastName = 'Last name must be at least 2 characters';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};
