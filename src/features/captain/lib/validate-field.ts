import * as yup from 'yup';

export async function validateYupField(
  schema: yup.AnySchema,
  values: Record<string, any>,
  field: string,
): Promise<string> {
  try {
    await schema.validateAt(field, values);
    return '';
  } catch (error) {
    if (error instanceof yup.ValidationError) return error.message;
    return 'قيمة غير صحيحة';
  }
}

export function isYupSchemaValid(schema: yup.AnySchema, values: Record<string, any>): boolean {
  try {
    schema.validateSync(values, { abortEarly: false });
    return true;
  } catch {
    return false;
  }
}

// Validates every field at once and returns a full {field: message} map —
// used when the user tries to advance to the next step, so every unfilled or
// invalid field lights up immediately instead of only the ones already touched.
export function collectYupSchemaErrors(schema: yup.AnySchema, values: Record<string, any>): Record<string, string> {
  try {
    schema.validateSync(values, { abortEarly: false });
    return {};
  } catch (error) {
    if (!(error instanceof yup.ValidationError)) return {};
    const errors: Record<string, string> = {};
    for (const innerError of error.inner) {
      if (innerError.path && !errors[innerError.path]) errors[innerError.path] = innerError.message;
    }
    return errors;
  }
}
