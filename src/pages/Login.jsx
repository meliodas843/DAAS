import {
  useState
} from "react";
import {
  Navigate,
  useNavigate
} from "react-router-dom";
import {
  useAuth
} from "../context/AuthContext";

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api";

export default function Login() {
  const navigate =
    useNavigate();

  const {
    login,
    authenticated,
    user
  } = useAuth();

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

  if (authenticated) {
    if (
      user?.must_change_password === true
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

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Нэвтрэхэд алдаа гарлаа"
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

      navigate("/", {
        replace: true
      });
    } catch (err) {
      setError(
        err?.message ||
          "Нэвтрэхэд алдаа гарлаа"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-brand">
          <div className="login-brand-icon">
            M
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
            Нэвтрэх
          </h1>

          <p>
            Удирдлагын самбарт нэвтрэх
          </p>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <label>
            И-мэйл
          </label>

          <input
            type="email"
            value={email}
            onChange={(
              event
            ) =>
              setEmail(
                event.target
                  .value
              )
            }
            placeholder="user@misheel.mn"
            autoComplete="email"
            required
          />

          <label>
            Нууц үг
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
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Нэвтэрч байна..."
              : "Нэвтрэх"}
          </button>
        </form>
      </div>
    </div>
  );
}