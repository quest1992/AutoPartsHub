export function getJwtSecret(): string {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error(
      'JWT_SECRET is required. Set it in the application environment before starting the server.',
    );
  }

  return jwtSecret;
}
