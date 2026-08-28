import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useDashboard } from "../context/DashboardContext";
import { useAuth } from "../context/AuthContext";

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api";

const translations = {
  mn: {
    login: "Нэвтрэх",
    subtitle: "Удирдлагын самбарт нэвтрэх",
    email: "И-мэйл",
    password: "Нууц үг",
    loading: "Нэвтэрч байна...",
    error: "Нэвтрэхэд алдаа гарлаа"
  },

  en: {
    login: "Login",
    subtitle: "Sign in to the dashboard",
    email: "Email",
    password: "Password",
    loading: "Signing in...",
    error: "Failed to sign in"
  }
};

function getRemainingAttemptsFromMessage(
  message
) {
  const value =
    String(message || "").trim();

  const match =
    value.match(
      /Үлдсэн оролдлого\s*:\s*(\d+)/i
    );

  if (!match) {
    return null;
  }

  const remaining =
    Number(match[1]);

  return Number.isFinite(remaining)
    ? remaining
    : null;
}

function getEnglishRemainingMessage(
  remaining
) {
  const count =
    Number(remaining);

  if (!Number.isFinite(count)) {
    return null;
  }

  if (count === 1) {
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
    String(message || "").trim();

  if (language !== "en") {
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

    if (remainingMessage) {
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
      "User is inactive"
  };

  return (
    messages[value] ||
    value
  );
}

export default function Login() {
  const navigate =
    useNavigate();

  const {
    login,
    authenticated,
    user
  } = useAuth();

  const {
    language,
    setLanguage
  } = useDashboard();

  const [
    email,
    setEmail
  ] = useState("");

  const [
    password,
    setPassword
  ] = useState("");

  const [
    error,
    setError
  ] = useState("");

  const [
    loading,
    setLoading
  ] = useState(false);

  const t =
    translations[language] ||
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

  if (authenticated) {
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

    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          `${API}/auth/login`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                email:
                  email
                    .trim()
                    .toLowerCase(),

                password
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

      if (!response.ok) {
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

      const nextUser = {
        ...data.user,

        must_change_password:
          Boolean(
            data.user
              ?.must_change_password ??
            data.must_change_password
          )
      };

      login(
        data.token,
        nextUser
      );

      localStorage.setItem(
        "last_activity_at",
        String(Date.now())
      );

      localStorage.setItem(
        "language",
        language
      );

      if (
        nextUser.must_change_password
      ) {
        navigate(
          "/change-password",
          {
            replace: true
          }
        );

        return;
      }

      navigate(
        "/",
        {
          replace: true
        }
      );
    } catch (err) {
      setError(
        err?.message ||
        t.error
      );
    } finally {
      setLoading(false);
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
          onSubmit={handleSubmit}
        >
          <h1>
            {t.login}
          </h1>

          <p>
            {t.subtitle}
          </p>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <label>
            {t.email}
          </label>

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            autoComplete="email"
            required
          />

          <label>
            {t.password}
          </label>

          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            autoComplete="current-password"
            required
          />

          <button
            type="submit"
            disabled={loading}
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