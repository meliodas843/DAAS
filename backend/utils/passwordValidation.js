export const PASSWORD_MESSAGE =
  "Нууц үг хамгийн багадаа 10 тэмдэгт, том үсэг, жижиг үсэг, тоо болон тусгай тэмдэг агуулсан байна";

export function isStrongPassword(
  password
) {
  const value =
    String(
      password || ""
    );

  if (
    value.length < 10
  ) {
    return false;
  }

  const hasUppercase =
    /\p{Lu}/u.test(
      value
    );

  const hasLowercase =
    /\p{Ll}/u.test(
      value
    );

  const hasNumber =
    /\d/.test(
      value
    );

  const hasSpecial =
    /[^\p{L}\d\s]/u.test(
      value
    );

  return (
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecial
  );
}