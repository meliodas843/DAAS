import {
  useState,
} from "react";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  useDashboard,
} from "../context/DashboardContext";

import {
  useAuth,
} from "../context/AuthContext";

const API =
  import.meta.env.VITE_API_URL ||
  "/api";

const translations = {
  mn: {
    login:
      "Нэвтрэх",

    subtitle:
      "Удирдлагын самбарт нэвтрэх",

    email:
      "И-мэйл",

    password:
      "Нууц үг",

    loading:
      "Нэвтэрч байна...",

    error:
      "Нэвтрэхэд алдаа гарлаа",
  },

  en: {
    login:
      "Login",

    subtitle:
      "Sign in to the dashboard",

    email:
      "Email",

    password:
      "Password",

    loading:
      "Signing in...",

    error:
      "Failed to sign in",
  },
};

function getRemainingAttemptsFromMessage(
  message
) {
  const value =
    String(
      message || ""
    ).trim();

  const match =
    value.match(
      /Үлдсэн оролдлого\s*:\s*(\d+)/i
    );

  if (!match) {
    return null;
  }

  const remaining =
    Number(
      match[1]
    );

  return Number.isFinite(
    remaining
  )
    ? remaining
    : null;
}

function getEnglishRemainingMessage(
  remaining
) {
  const count =
    Number(
      remaining
    );

  if (
    !Number.isFinite(
      count
    )
  ) {
    return null;
  }

  if (
    count === 1
  ) {
    return (
      "Incorrect email or password. " +
      "1 attempt remaining"
    );
  }

  return (
    "Incorrect email or password. " +
    `${count} attempts remaining`
  );
}

function translateLoginError(
  message,
  language,
  remainingAttempts = null
) {
  const value =
    String(
      message || ""
    ).trim();

  if (
    language !== "en"
  ) {
    return value;
  }

  if (
    remainingAttempts !== null &&
    remainingAttempts !== undefined
  ) {
    const remainingMessage =
      getEnglishRemainingMessage(
        remainingAttempts
      );

    if (
      remainingMessage
    ) {
      return remainingMessage;
    }
  }

  const remainingFromMessage =
    getRemainingAttemptsFromMessage(
      value
    );

  if (
    remainingFromMessage !== null
  ) {
    return getEnglishRemainingMessage(
      remainingFromMessage
    );
  }

  const messages = {
    "Хэрэглэгч блоклогдсон байна":
      "User is blocked",

    "И-мэйл эсвэл нууц үг буруу байна":
      "Incorrect email or password",

    "5 удаа нууц үг буруу оруулсан тул хэрэглэгч блоклогдлоо":
      "User has been blocked after 5 incorrect password attempts",

    "Хэт олон нэвтрэх оролдлого хийлээ. Түр хүлээгээд дахин оролдоно уу.":
      "Too many login attempts. Please wait a moment and try again.",

    "Хэрэглэгч идэвхгүй байна":
      "User is inactive",

    "Шинэ нууц үг хуучин нууц үгтэй ижил байж болохгүй":
      "New password cannot be the same as the old password",

    "Одоогийн нууц үг буруу байна":
      "Current password is incorrect",

    "Нууц үг таарахгүй байна":
      "Passwords do not match",

    "Одоогийн нууц үгээ оруулна уу":
      "Please enter your current password",

    "Шинэ нууц үгээ оруулна уу":
      "Please enter a new password",

    "Нууц үг хамгийн багадаа 10 тэмдэгт, том үсэг, жижиг үсэг, тоо болон тусгай тэмдэг агуулсан байна":
      "Password must be at least 10 characters and include uppercase, lowercase, a number, and a special character",

    "Нууц үг амжилттай шинэчлэгдлээ":
      "Password updated successfully",

    "Authentication required":
      "Authentication required",

    "Internal server error":
      "Internal server error",
  };

  return (
    messages[value] ||
    value ||
    "Failed to sign in"
  );
}

export default function Login() {
  const navigate =
    useNavigate();

  const {
    login,
    authenticated,
    user,
  } =
    useAuth();

  const {
    language,
    setLanguage,
  } =
    useDashboard();

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const t =
    translations[
      language
    ] ||
    translations.mn;

  function handleLanguageChange(
    nextLanguage
  ) {
    setLanguage(
      nextLanguage
    );

    localStorage.setItem(
      "language",
      nextLanguage
    );

    setError("");
  }

  if (
    authenticated
  ) {
    if (
      user?.must_change_password ===
      true
    ) {
      return (
        <Navigate
          to="/change-password"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const cleanEmail =
      email
        .trim()
        .toLowerCase();

    if (
      !cleanEmail ||
      !password
    ) {
      setError(
        t.error
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          `${API}/auth/login`,
          {
            method:
              "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body:
              JSON.stringify({
                email:
                  cleanEmail,

                password,
              }),
          }
        );

      let data =
        null;

      try {
        data =
          await response.json();
      } catch {
        data =
          null;
      }

      if (
        !response.ok
      ) {
        const backendMessage =
          data?.message ||
          t.error;

        const remainingAttempts =
          data?.remaining_attempts ??
          data?.remainingAttempts ??
          data?.attempts_remaining ??
          data?.attemptsRemaining ??
          null;

        throw new Error(
          translateLoginError(
            backendMessage,
            language,
            remainingAttempts
          )
        );
      }

      if (
        !data?.user
      ) {
        throw new Error(
          t.error
        );
      }

      const nextUser = {
        ...data.user,

        id:
          Number(
            data.user.id
          ),

        role:
          String(
            data.user.role ||
            "viewer"
          )
            .trim()
            .toLowerCase(),

        must_change_password:
          Boolean(
            data.user
              ?.must_change_password
          ),

        is_active:
          Boolean(
            data.user
              ?.is_active
          ),

        is_blocked:
          Boolean(
            data.user
              ?.is_blocked
          ),

        failed_login_attempts:
          Number(
            data.user
              ?.failed_login_attempts ||
            0
          ),
      };

      login(
        nextUser
      );

      localStorage.setItem(
        "last_activity_at",
        String(
          Date.now()
        )
      );

      localStorage.setItem(
        "language",
        language
      );

      if (
        nextUser
          .must_change_password
      ) {
        navigate(
          "/change-password",
          {
            replace:
              true,
          }
        );

        return;
      }

      navigate(
        "/",
        {
          replace:
            true,
        }
      );
    } catch (
      err
    ) {
      setError(
        err?.message ||
        t.error
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  return (
    <div className="login-page">
      <div className="login-panel">

        <div className="login-language-switcher">

          <button
            type="button"
            className={`login-language-button ${
              language === "en"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleLanguageChange(
                "en"
              )
            }
            aria-label="English"
            disabled={loading}
          >
            <span className="login-language-flag">
              🇬🇧
            </span>

            <span>
              EN
            </span>
          </button>

          <button
            type="button"
            className={`login-language-button ${
              language === "mn"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleLanguageChange(
                "mn"
              )
            }
            aria-label="Монгол"
            disabled={loading}
          >
            <span className="login-language-flag">
              🇲🇳
            </span>

            <span>
              MN
            </span>
          </button>

        </div>

        <div className="login-brand">

          <div className="login-brand-icon">
            <img
              src="/misheel.jpeg"
              alt="Misheel"
              className="login-brand-image"
            />
          </div>

          <div>
            <strong>
              MISHEEL
            </strong>

            <span>
              GROUP
            </span>
          </div>

        </div>

        <form
          className="login-form"
          onSubmit={
            handleSubmit
          }
        >
          <h1>
            {t.login}
          </h1>

          <p>
            {t.subtitle}
          </p>

          {error && (
            <div
              className="login-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <label
            htmlFor="login-email"
          >
            {t.email}
          </label>

          <input
            id="login-email"
            type="email"
            value={
              email
            }
            onChange={(
              event
            ) =>
              setEmail(
                event.target.value
              )
            }
            autoComplete="username"
            inputMode="email"
            disabled={
              loading
            }
            required
          />

          <label
            htmlFor="login-password"
          >
            {t.password}
          </label>

          <input
            id="login-password"
            type="password"
            value={
              password
            }
            onChange={(
              event
            ) =>
              setPassword(
                event.target.value
              )
            }
            autoComplete="current-password"
            disabled={
              loading
            }
            required
          />

          <button
            type="submit"
            disabled={
              loading
            }
          >
            {loading
              ? t.loading
              : t.login}
          </button>

        </form>

      </div>
    </div>
  );
}