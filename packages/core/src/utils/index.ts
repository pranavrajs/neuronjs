export const ensureError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  return new Error(
    typeof error === 'string' ? error : JSON.stringify(error, null, 2)
  );
};
