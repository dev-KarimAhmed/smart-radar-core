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
