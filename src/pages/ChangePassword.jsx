import {
  useState
} from "react";
import {
  useNavigate
} from "react-router-dom";
import {
  useAuth
} from "../context/AuthContext";

const API =
  import.meta.env
    .VITE_API_URL ||
  "http://localhost:8000/api";

export default function ChangePassword() {
  const navigate =
    useNavigate();

  const {
    token,
    user,
    login
  } = useAuth();

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
    error,
    setError
  ] = useState("");

  const [
    loading,
    setLoading
  ] = useState(false);

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    if (
      !currentPassword
    ) {
      setError(
        "Одоогийн нууц үгээ оруулна уу"
      );

      return;
    }

    if (
      password.length <
      10
    ) {
      setError(
        "Нууц үг хамгийн багадаа 10 тэмдэгт байна"
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Нууц үг таарахгүй байна"
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          `${API}/auth/change-password`,
          {
            method: "POST",
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

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data?.message ||
            "Нууц үг шинэчлэхэд алдаа гарлаа"
        );
      }

      login(
        data.token,
        data.user
      );

      navigate(
        "/",
        {
          replace: true
        }
      );
    } catch (err) {
      setError(
        err?.message ||
          "Алдаа гарлаа"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-panel">
        <form
          className="login-form"
          onSubmit={
            handleSubmit
          }
        >
          <h1>
            Шинэ нууц үг
          </h1>

          <p>
            Нууц үгээ шинэчилнэ үү.
          </p>

          <div className="change-password-email">
            {user?.email}
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <label>
            Одоогийн нууц үг
          </label>

          <input
            type="password"
            value={
              currentPassword
            }
            onChange={(
              event
            ) =>
              setCurrentPassword(
                event.target
                  .value
              )
            }
            autoComplete="current-password"
            required
          />

          <label>
            Шинэ нууц үг
          </label>

          <input
            type="password"
            value={password}
            onChange={(
              event
            ) =>
              setPassword(
                event.target
                  .value
              )
            }
            autoComplete="new-password"
            minLength={10}
            required
          />

          <label>
            Шинэ нууц үг давтах
          </label>

          <input
            type="password"
            value={
              confirmPassword
            }
            onChange={(
              event
            ) =>
              setConfirmPassword(
                event.target
                  .value
              )
            }
            autoComplete="new-password"
            minLength={10}
            required
          />

          <button
            type="submit"
            disabled={
              loading
            }
          >
            {loading
              ? "Хадгалж байна..."
              : "Нууц үг шинэчлэх"}
          </button>
        </form>
      </div>
    </div>
  );
}