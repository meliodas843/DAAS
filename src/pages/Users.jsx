import {
  useCallback,
  useEffect,
  useState
} from "react";
import {
  useAuth
} from "../context/AuthContext";

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api";

export default function Users() {
  const {
    token,
    user
  } = useAuth();

  const [
    users,
    setUsers
  ] = useState([]);

  const [
    email,
    setEmail
  ] = useState("");

  const [
    password,
    setPassword
  ] = useState("");

  const [
    role,
    setRole
  ] = useState("viewer");

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    submitting,
    setSubmitting
  ] = useState(false);

  const [
    deletingId,
    setDeletingId
  ] = useState(null);

  const [
    error,
    setError
  ] = useState("");

  const [
    success,
    setSuccess
  ] = useState("");

  const loadUsers =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await fetch(
              `${API}/users`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`
                }
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data?.message ||
                "Хэрэглэгчдийн мэдээлэл татахад алдаа гарлаа"
            );
          }

          setUsers(
            Array.isArray(
              data.users
            )
              ? data.users
              : []
          );
        } catch (err) {
          setError(
            err?.message ||
              "Алдаа гарлаа"
          );
        } finally {
          setLoading(false);
        }
      },
      [token]
    );

  useEffect(() => {
    if (
      user?.role === "admin"
    ) {
      loadUsers();
    }
  }, [
    user,
    loadUsers
  ]);

  async function createUser(
    event
  ) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const cleanEmail =
        email
          .trim()
          .toLowerCase();

      if (
        !cleanEmail ||
        !password
      ) {
        throw new Error(
          "И-мэйл болон түр нууц үгийг оруулна уу"
        );
      }

      if (
        password.length < 8
      ) {
        throw new Error(
          "Түр нууц үг хамгийн багадаа 8 тэмдэгт байна"
        );
      }

      const response =
        await fetch(
          `${API}/users`,
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
                email:
                  cleanEmail,
                password,
                role
              })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Хэрэглэгч нэмэхэд алдаа гарлаа"
        );
      }

      setEmail("");
      setPassword("");
      setRole("viewer");

      setSuccess(
        "Хэрэглэгч амжилттай нэмэгдлээ"
      );

      await loadUsers();
    } catch (err) {
      setError(
        err?.message ||
          "Алдаа гарлаа"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function updateUser(
    id,
    changes
  ) {
    try {
      setError("");
      setSuccess("");

      const target =
        users.find(
          (item) =>
            Number(
              item.id
            ) ===
            Number(id)
        );

      if (!target) {
        return;
      }

      const response =
        await fetch(
          `${API}/users/${id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`
            },
            body:
              JSON.stringify({
                role:
                  changes.role ??
                  target.role,
                is_active:
                  changes.is_active ??
                  target.is_active
              })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Хэрэглэгч шинэчлэхэд алдаа гарлаа"
        );
      }

      setUsers(
        (current) =>
          current.map(
            (item) =>
              Number(
                item.id
              ) ===
              Number(id)
                ? {
                    ...item,
                    ...data.user
                  }
                : item
          )
      );

      setSuccess(
        "Хэрэглэгчийн мэдээлэл шинэчлэгдлээ"
      );
    } catch (err) {
      setError(
        err?.message ||
          "Алдаа гарлаа"
      );
    }
  }

  async function deleteUser(
    item
  ) {
    const confirmed =
      window.confirm(
        `${item.email} хэрэглэгчийг устгах уу?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(
        item.id
      );

      setError("");
      setSuccess("");

      const response =
        await fetch(
          `${API}/users/${item.id}`,
          {
            method:
              "DELETE",
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Хэрэглэгч устгахад алдаа гарлаа"
        );
      }

      setUsers(
        (current) =>
          current.filter(
            (currentUser) =>
              Number(
                currentUser.id
              ) !==
              Number(
                item.id
              )
          )
      );

      setSuccess(
        "Хэрэглэгч амжилттай устгагдлаа"
      );
    } catch (err) {
      setError(
        err?.message ||
          "Алдаа гарлаа"
      );
    } finally {
      setDeletingId(
        null
      );
    }
  }

  if (
    user?.role !== "admin"
  ) {
    return null;
  }

  return (
    <div className="users-page">
      <div className="users-page-header">
        <div>
          <h2>
            Хэрэглэгчид
          </h2>

          <p>
            Хэрэглэгч нэмэх болон эрх тохируулах
          </p>
        </div>

        <div className="users-count">
          <span>
            Нийт хэрэглэгч
          </span>

          <strong>
            {users.length}
          </strong>
        </div>
      </div>

      <div className="users-create-card">
        <div className="users-create-heading">
          <h3>
            Шинэ хэрэглэгч
          </h3>

          <p>
            Хэрэглэгчид түр нууц үг өгнө. Эхний нэвтрэлтээр шинэ нууц үг үүсгэнэ.
          </p>
        </div>

        <form
          className="users-create-form"
          onSubmit={
            createUser
          }
        >
          <div className="users-form-field">
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
              required
            />
          </div>

          <div className="users-form-field">
            <label>
              Түр нууц үг
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
              placeholder="Хамгийн багадаа 8 тэмдэгт"
              minLength={8}
              required
            />
          </div>

          <div className="users-form-field">
            <label>
              Эрх
            </label>

            <select
              value={role}
              onChange={(
                event
              ) =>
                setRole(
                  event.target
                    .value
                )
              }
            >
              <option value="viewer">
                Viewer
              </option>

              <option value="admin">
                Admin
              </option>
            </select>
          </div>

          <button
            type="submit"
            className="users-add-button"
            disabled={
              submitting
            }
          >
            {submitting
              ? "Нэмж байна..."
              : "Нэмэх"}
          </button>
        </form>

        {error && (
          <div className="users-message users-message-error">
            {error}
          </div>
        )}

        {success && (
          <div className="users-message users-message-success">
            {success}
          </div>
        )}
      </div>

      <div className="users-list-card">
        <div className="users-list-header">
          <div>
            <h3>
              Хэрэглэгчдийн жагсаалт
            </h3>

            <p>
              Admin болон Viewer эрхтэй хэрэглэгчид
            </p>
          </div>
        </div>

        {loading ? (
          <div className="users-loading">
            Уншиж байна...
          </div>
        ) : users.length ===
          0 ? (
          <div className="users-empty">
            Хэрэглэгч байхгүй байна
          </div>
        ) : (
          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>
                    Хэрэглэгч
                  </th>

                  <th>
                    Эрх
                  </th>

                  <th>
                    Нууц үг
                  </th>

                  <th>
                    Төлөв
                  </th>

                  <th>
                    Үүсгэсэн
                  </th>

                  <th>
                    Үйлдэл
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.map(
                  (item) => {
                    const isCurrentUser =
                      Number(
                        item.id
                      ) ===
                      Number(
                        user?.id
                      );

                    return (
                      <tr
                        key={
                          item.id
                        }
                      >
                        <td>
                          <div className="users-person">
                            <div className="users-person-avatar">
                              {String(
                                item.email ||
                                  "U"
                              )
                                .charAt(
                                  0
                                )
                                .toUpperCase()}
                            </div>

                            <div className="users-person-info">
                              <strong>
                                {item.email}
                              </strong>

                              <span>
                                ID #{item.id}
                              </span>
                            </div>

                            {isCurrentUser && (
                              <span className="users-you-badge">
                                Та
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <select
                            className={`users-role-select ${
                              item.role ===
                              "admin"
                                ? "admin"
                                : "viewer"
                            }`}
                            value={
                              item.role
                            }
                            disabled={
                              isCurrentUser
                            }
                            onChange={(
                              event
                            ) =>
                              updateUser(
                                item.id,
                                {
                                  role:
                                    event
                                      .target
                                      .value
                                }
                              )
                            }
                          >
                            <option value="viewer">
                              Viewer
                            </option>

                            <option value="admin">
                              Admin
                            </option>
                          </select>
                        </td>

                        <td>
                          <span
                            className={`users-password-status ${
                              item.must_change_password
                                ? "waiting"
                                : "done"
                            }`}
                          >
                            {item.must_change_password
                              ? "Шинэчлэх шаардлагатай"
                              : "Шинэчилсэн"}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className={`users-status-button ${
                              item.is_active
                                ? "active"
                                : "inactive"
                            }`}
                            disabled={
                              isCurrentUser
                            }
                            onClick={() =>
                              updateUser(
                                item.id,
                                {
                                  is_active:
                                    !item.is_active
                                }
                              )
                            }
                          >
                            <span />

                            {item.is_active
                              ? "Идэвхтэй"
                              : "Идэвхгүй"}
                          </button>
                        </td>

                        <td>
                          <span className="users-date">
                            {item.created_at
                              ? new Date(
                                  item.created_at
                                ).toLocaleDateString(
                                  "mn-MN"
                                )
                              : "-"}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="users-delete-button"
                            disabled={
                              isCurrentUser ||
                              deletingId ===
                                item.id
                            }
                            onClick={() =>
                              deleteUser(
                                item
                              )
                            }
                          >
                            {isCurrentUser
                              ? "—"
                              : deletingId ===
                                  item.id
                                ? "Устгаж байна..."
                                : "Устгах"}
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}