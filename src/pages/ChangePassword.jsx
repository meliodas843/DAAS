import {
  useMemo,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  X
} from "lucide-react";

import {
  useAuth
} from "../context/AuthContext";

import {
  useDashboard
} from "../context/DashboardContext";

const API =
  import.meta.env
    .VITE_API_URL ||
  "http://localhost:8000/api";

const translations = {
  mn: {
    title:
      "Шинэ нууц үг",

    subtitle:
      "Нууц үгээ шинэчилнэ үү.",

    currentPassword:
      "Одоогийн нууц үг",

    currentPasswordPlaceholder:
      "Одоогийн нууц үгээ оруулна уу",

    newPassword:
      "Шинэ нууц үг",

    newPasswordPlaceholder:
      "Шинэ нууц үгээ оруулна уу",

    confirmPassword:
      "Шинэ нууц үг давтах",

    confirmPasswordPlaceholder:
      "Шинэ нууц үгээ давтана уу",

    requirementsTitle:
      "Нууц үг дараах шаардлагыг хангасан байна:",

    minimumLength:
      "Хамгийн багадаа 10 тэмдэгт",

    lowercase:
      "Жижиг үсэг агуулсан",

    uppercase:
      "Том үсэг агуулсан",

    number:
      "Тоо агуулсан",

    special:
      "Тусгай тэмдэг агуулсан",

    passwordsMatch:
      "Нууц үг таарч байна",

    passwordsDoNotMatch:
      "Нууц үг таарахгүй байна",

    updatePassword:
      "Нууц үг шинэчлэх",

    updating:
      "Шинэчилж байна...",

    secureMessage:
      "Таны мэдээлэл хамгаалагдах болно.",

    currentPasswordRequired:
      "Одоогийн нууц үгээ оруулна уу",

    requirementsError:
      "Шинэ нууц үг бүх шаардлагыг хангасан байх ёстой",

    mismatchError:
      "Нууц үг таарахгүй байна",

    updateError:
      "Нууц үг шинэчлэхэд алдаа гарлаа",

    generalError:
      "Алдаа гарлаа"
  },

  en: {
    title:
      "New password",

    subtitle:
      "Update your password.",

    currentPassword:
      "Current password",

    currentPasswordPlaceholder:
      "Enter your current password",

    newPassword:
      "New password",

    newPasswordPlaceholder:
      "Enter your new password",

    confirmPassword:
      "Confirm new password",

    confirmPasswordPlaceholder:
      "Re-enter your new password",

    requirementsTitle:
      "Your password must meet the following requirements:",

    minimumLength:
      "At least 10 characters",

    lowercase:
      "Contains a lowercase letter",

    uppercase:
      "Contains an uppercase letter",

    number:
      "Contains a number",

    special:
      "Contains a special character",

    passwordsMatch:
      "Passwords match",

    passwordsDoNotMatch:
      "Passwords do not match",

    updatePassword:
      "Update password",

    updating:
      "Updating...",

    secureMessage:
      "Your information will be kept secure.",

    currentPasswordRequired:
      "Please enter your current password",

    requirementsError:
      "The new password must meet all requirements",

    mismatchError:
      "Passwords do not match",

    updateError:
      "Failed to update password",

    generalError:
      "An error occurred"
  }
};

function getPasswordRequirements(
  password
) {
  const value =
    String(
      password ||
        ""
    );

  return {
    length:
      value.length >=
      10,

    uppercase:
      /\p{Lu}/u.test(
        value
      ),

    lowercase:
      /\p{Ll}/u.test(
        value
      ),

    number:
      /\d/.test(
        value
      ),

    special:
      /[^\p{L}\d\s]/u.test(
        value
      )
  };
}

function RequirementItem({
  valid,
  children
}) {
  return (
    <div
      className={`password-rule ${
        valid
          ? "valid"
          : "invalid"
      }`}
    >
      <span className="password-rule-icon">
        {valid ? (
          <Check
            size={13}
            strokeWidth={3}
          />
        ) : (
          <X
            size={13}
            strokeWidth={3}
          />
        )}
      </span>

      <span>
        {children}
      </span>
    </div>
  );
}

export default function ChangePassword() {
  const navigate =
    useNavigate();

  const {
    token,
    user,
    login
  } = useAuth();

  const {
    language,
    setLanguage
  } = useDashboard();

  const currentLanguage =
    language === "en"
      ? "en"
      : "mn";

  const t =
    translations[
      currentLanguage
    ];

  const [
    currentPassword,
    setCurrentPassword
  ] = useState("");

  const [
    password,
    setPassword
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword
  ] = useState("");

  const [
    showCurrentPassword,
    setShowCurrentPassword
  ] = useState(false);

  const [
    showPassword,
    setShowPassword
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword
  ] = useState(false);

  const [
    error,
    setError
  ] = useState("");

  const [
    loading,
    setLoading
  ] = useState(false);

  const requirements =
    useMemo(
      () =>
        getPasswordRequirements(
          password
        ),
      [password]
    );

  const allRequirementsMet =
    Object.values(
      requirements
    ).every(Boolean);

  const passwordsMatch =
    confirmPassword.length >
      0 &&
    password ===
      confirmPassword;

  const confirmInvalid =
    confirmPassword.length >
      0 &&
    password !==
      confirmPassword;

  function changeLanguage(
    nextLanguage
  ) {
    setLanguage(
      nextLanguage
    );

    setError("");
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setError("");

    if (
      !currentPassword
    ) {
      setError(
        t.currentPasswordRequired
      );

      return;
    }

    if (
      !allRequirementsMet
    ) {
      setError(
        t.requirementsError
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        t.mismatchError
      );

      return;
    }

    try {
      setLoading(
        true
      );

      const response =
        await fetch(
          `${API}/auth/change-password`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`
            },

            body:
              JSON.stringify({
                current_password:
                  currentPassword,

                new_password:
                  password,

                confirm_password:
                  confirmPassword
              })
          }
        );

      let data = null;

      try {
        data =
          await response.json();
      } catch {
        data = null;
      }

      if (
        !response.ok
      ) {
        throw new Error(
          data?.message ||
            t.updateError
        );
      }

      login(
        data.token,
        data.user
      );

      localStorage.setItem(
        "last_activity_at",
        String(
          Date.now()
        )
      );

      navigate(
        "/",
        {
          replace:
            true
        }
      );
    } catch (err) {
      setError(
        err?.message ||
          t.generalError
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  return (
    <div className="change-password-page">
      <div className="change-password-card">
        <div className="change-password-language-switcher">
          <button
            type="button"
            aria-label="English"
            className={`change-password-language-button ${
              currentLanguage ===
              "en"
                ? "active"
                : ""
            }`}
            onClick={() =>
              changeLanguage(
                "en"
              )
            }
          >
            <span>
              🇬🇧
            </span>

            <span>
              EN
            </span>
          </button>

          <button
            type="button"
            aria-label="Монгол"
            className={`change-password-language-button ${
              currentLanguage ===
              "mn"
                ? "active"
                : ""
            }`}
            onClick={() =>
              changeLanguage(
                "mn"
              )
            }
          >
            <span>
              🇲🇳
            </span>

            <span>
              MN
            </span>
          </button>
        </div>

        <div className="change-password-header">
          <h1>
            {t.title}
          </h1>

          <p>
            {t.subtitle}
          </p>
        </div>

        <div className="change-password-user">
          <Mail
            size={18}
            strokeWidth={2}
          />

          <span>
            {user?.email}
          </span>
        </div>

        {error && (
          <div className="change-password-error">
            {error}
          </div>
        )}

        <form
          className="change-password-form"
          onSubmit={
            handleSubmit
          }
        >
          <div className="change-password-field">
            <label>
              {
                t.currentPassword
              }
            </label>

            <div className="password-input-wrap">
              <LockKeyhole
                className="password-input-icon"
                size={18}
                strokeWidth={2}
              />

              <input
                type={
                  showCurrentPassword
                    ? "text"
                    : "password"
                }
                value={
                  currentPassword
                }
                onChange={(
                  event
                ) =>
                  setCurrentPassword(
                    event
                      .target
                      .value
                  )
                }
                placeholder={
                  t.currentPasswordPlaceholder
                }
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="password-eye-button"
                aria-label={
                  showCurrentPassword
                    ? "Hide password"
                    : "Show password"
                }
                onClick={() =>
                  setShowCurrentPassword(
                    (
                      current
                    ) =>
                      !current
                  )
                }
              >
                {showCurrentPassword ? (
                  <EyeOff
                    size={18}
                  />
                ) : (
                  <Eye
                    size={18}
                  />
                )}
              </button>
            </div>
          </div>

          <div className="change-password-field">
            <label>
              {
                t.newPassword
              }
            </label>

            <div className="password-input-wrap">
              <LockKeyhole
                className="password-input-icon"
                size={18}
                strokeWidth={2}
              />

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={
                  password
                }
                onChange={(
                  event
                ) =>
                  setPassword(
                    event
                      .target
                      .value
                  )
                }
                placeholder={
                  t.newPasswordPlaceholder
                }
                autoComplete="new-password"
                minLength={10}
                required
              />

              <button
                type="button"
                className="password-eye-button"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                onClick={() =>
                  setShowPassword(
                    (
                      current
                    ) =>
                      !current
                  )
                }
              >
                {showPassword ? (
                  <EyeOff
                    size={18}
                  />
                ) : (
                  <Eye
                    size={18}
                  />
                )}
              </button>
            </div>
          </div>

          <div
            className={`password-requirements ${
              allRequirementsMet
                ? "complete"
                : ""
            }`}
          >
            <div className="password-requirements-heading">
              <ShieldCheck
                size={18}
                strokeWidth={2.3}
              />

              <strong>
                {
                  t.requirementsTitle
                }
              </strong>
            </div>

            <div className="password-rules-grid">
              <RequirementItem
                valid={
                  requirements.length
                }
              >
                {
                  t.minimumLength
                }
              </RequirementItem>

              <RequirementItem
                valid={
                  requirements.lowercase
                }
              >
                {
                  t.lowercase
                }
              </RequirementItem>

              <RequirementItem
                valid={
                  requirements.uppercase
                }
              >
                {
                  t.uppercase
                }
              </RequirementItem>

              <RequirementItem
                valid={
                  requirements.number
                }
              >
                {
                  t.number
                }
              </RequirementItem>

              <RequirementItem
                valid={
                  requirements.special
                }
              >
                {
                  t.special
                }
              </RequirementItem>
            </div>
          </div>

          <div className="change-password-field">
            <label>
              {
                t.confirmPassword
              }
            </label>

            <div
              className={`password-input-wrap ${
                passwordsMatch
                  ? "match"
                  : ""
              } ${
                confirmInvalid
                  ? "mismatch"
                  : ""
              }`}
            >
              <LockKeyhole
                className="password-input-icon"
                size={18}
                strokeWidth={2}
              />

              <input
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={
                  confirmPassword
                }
                onChange={(
                  event
                ) =>
                  setConfirmPassword(
                    event
                      .target
                      .value
                  )
                }
                placeholder={
                  t.confirmPasswordPlaceholder
                }
                autoComplete="new-password"
                minLength={10}
                required
              />

              <button
                type="button"
                className="password-eye-button"
                aria-label={
                  showConfirmPassword
                    ? "Hide password"
                    : "Show password"
                }
                onClick={() =>
                  setShowConfirmPassword(
                    (
                      current
                    ) =>
                      !current
                  )
                }
              >
                {showConfirmPassword ? (
                  <EyeOff
                    size={18}
                  />
                ) : (
                  <Eye
                    size={18}
                  />
                )}
              </button>
            </div>

            {confirmPassword && (
              <div
                className={`password-match-message ${
                  passwordsMatch
                    ? "valid"
                    : "invalid"
                }`}
              >
                {passwordsMatch ? (
                  <>
                    <Check
                      size={14}
                      strokeWidth={3}
                    />

                    {
                      t.passwordsMatch
                    }
                  </>
                ) : (
                  <>
                    <X
                      size={14}
                      strokeWidth={3}
                    />

                    {
                      t.passwordsDoNotMatch
                    }
                  </>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="change-password-submit"
            disabled={
              loading ||
              !allRequirementsMet ||
              !passwordsMatch ||
              !currentPassword
            }
          >
            <LockKeyhole
              size={18}
              strokeWidth={2.4}
            />

            <span>
              {loading
                ? t.updating
                : t.updatePassword}
            </span>
          </button>
        </form>

        <div className="change-password-footer">
          <ShieldCheck
            size={17}
            strokeWidth={2}
          />

          <span>
            {
              t.secureMessage
            }
          </span>
        </div>
      </div>
    </div>
  );
}