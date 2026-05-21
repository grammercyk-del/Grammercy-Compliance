import Joi from 'joi';

export const emailSchema = Joi.string()
  .email({ tlds: { allow: false } })
  .required()
  .messages({
    'string.email': 'Please enter a valid email address',
    'string.empty': 'Email address is required',
    'any.required': 'Email address is required',
  });

const validFrequencies = [
  'Monthly',
  'Quarterly',
  'Half-Yearly',
  'Annual',
  'Bi-Annual',
  'Every 3 years',
  'Every 5 years',
  'Custom',
];

export const complianceSchema = Joi.object({
  certificate_no: Joi.string().max(100).allow('', null).messages({
    'string.max': 'Certificate number cannot exceed 100 characters',
  }),
  certificate_name: Joi.string().max(500).required().messages({
    'string.max': 'Certificate name cannot exceed 500 characters',
    'string.empty': 'Certificate name is required',
    'any.required': 'Certificate name is required',
  }),
  category_id: Joi.string().uuid().allow(null, '').messages({
    'string.uuid': 'Invalid category selected',
  }),
  department_id: Joi.string().uuid().allow(null, '').messages({
    'string.uuid': 'Invalid department selected',
  }),
  owner_id: Joi.string().uuid().allow(null, '').messages({
    'string.uuid': 'Invalid owner selected',
  }),
  frequency: Joi.string()
    .valid(...validFrequencies)
    .allow(null, '')
    .messages({
      'any.only': 'Frequency must be one of: ' + validFrequencies.join(', '),
    }),
  frequency_months: Joi.number().integer().min(1).max(120).allow(null).messages({
    'number.base': 'Frequency months must be a number',
    'number.integer': 'Frequency months must be a whole number',
    'number.min': 'Frequency months must be at least 1',
    'number.max': 'Frequency months cannot exceed 120',
  }),
  remarks: Joi.string().max(2000).allow('', null).messages({
    'string.max': 'Remarks cannot exceed 2000 characters',
  }),
  last_renewed_date: Joi.date().iso().allow(null, '').messages({
    'date.format': 'Last renewed date must be a valid date (YYYY-MM-DD)',
  }),
  next_renewal_date: Joi.date().iso().allow(null, '').messages({
    'date.format': 'Next renewal date must be a valid date (YYYY-MM-DD)',
  }),
});

export const newComplianceSchema = Joi.object({
  certificate_no: Joi.string().max(100).allow('', null),
  certificate_name: Joi.string().max(500).required().messages({
    'string.max': 'Certificate name cannot exceed 500 characters',
    'string.empty': 'Certificate name is required',
    'any.required': 'Certificate name is required',
  }),
  category_id: Joi.string().uuid().allow(null, ''),
  department_id: Joi.string().uuid().allow(null, ''),
  owner_id: Joi.string().uuid().allow(null, ''),
  last_renewed_date: Joi.date().iso().allow(null, ''),
  next_renewal_date: Joi.date().iso().allow(null, ''),
});

export type ComplianceValidationResult = {
  isValid: boolean;
  errors: Record<string, string>;
};

export function validateCompliance(data: Record<string, unknown>): ComplianceValidationResult {
  const { error, value } = complianceSchema.validate(data, { abortEarly: false, stripUnknown: true });
  if (error) {
    const errors: Record<string, string> = {};
    error.details.forEach((detail) => {
      const key = detail.path[0] as string;
      if (!errors[key]) {
        errors[key] = detail.message;
      }
    });
    return { isValid: false, errors };
  }
  return { isValid: true, errors: {} };
}

export function validateNewCompliance(data: Record<string, unknown>): ComplianceValidationResult {
  const { error, value } = newComplianceSchema.validate(data, { abortEarly: false, stripUnknown: true });
  if (error) {
    const errors: Record<string, string> = {};
    error.details.forEach((detail) => {
      const key = detail.path[0] as string;
      if (!errors[key]) {
        errors[key] = detail.message;
      }
    });
    return { isValid: false, errors };
  }
  return { isValid: true, errors: {} };
}

export function validateEmail(email: string): string | null {
  const { error } = emailSchema.validate(email);
  return error ? error.details[0].message : null;
}