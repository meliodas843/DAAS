import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  Eye,
  EyeOff,
  X
} from "lucide-react";

import {
  useAuth
} from "../context/AuthContext";

import {
  useDashboard
} from "../context/DashboardContext";

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api";

const MAX_ADMINS = 2;

function isStrongPassword(password) {
  const value =
    String(password || "");

  return (
    value.length >= 10 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9\s]/.test(value)
  );
}

export default function Users() {
  const {
    token,
    user
  } = useAuth();

  const {
    language
  } = useDashboard();

  const lang =
    language === "en"
      ? "en"
      : "mn";

  const t =
    lang === "en"
      ? {
          pageTitle: "Users",
          pageSubtitle:
            "Add users and configure permissions",
          totalUsers:
            "Total users",
          newUser:
            "New user",
          newUserDescription:
            "Users will be given a temporary password. They will create a new password on first login.",
          unblockTitle:
            "Unblock user",
          unblockDescription:
            "Create a new password for the user and unblock the account.",
          email: "Email",
          temporaryPassword:
            "Temporary password",
          newPassword:
            "New password",
          passwordPlaceholder:
            "At least 10 characters",
          role: "Role",
          viewer: "Viewer",
          admin: "Admin",
          add: "Add",
          adding:
            "Adding...",
          adminCount:
            "Admin",
          usersList:
            "Users list",
          usersListDescription:
            "Users with Admin and Viewer roles",
          user: "USER",
          roleHeader:
            "ROLE",
          password:
            "PASSWORD",
          login:
            "LOGIN",
          created:
            "CREATED",
          action:
            "ACTION",
          you: "You",
          updated:
            "Updated",
          needsUpdate:
            "Needs to be updated",
          active:
            "Active",
          inactive:
            "Inactive",
          normal:
            "Normal",
          unblock:
            "Unblock",
          unblocking:
            "Unblocking...",
          cancel:
            "Cancel",
          unblockSubmit:
            "Create password and unblock",
          delete:
            "Delete",
          deleting:
            "Deleting...",
          loading:
            "Loading...",
          noUsers:
            "No users found",
          userAdded:
            "User added successfully",
          userUpdated:
            "User updated successfully",
          userDeleted:
            "User permanently deleted",
          userUnblocked:
            "User unblocked successfully",
          loadError:
            "Failed to load users",
          createError:
            "Failed to add user",
          userExists:
            "A user with this email already exists.",
          updateError:
            "Failed to update user",
          deleteError:
            "Failed to delete user",
          unblockError:
            "Failed to unblock user",
          passwordRequirement:
            "Password should be 10+ characters, uppercase, lowercase, number and special character",
          adminLimit:
            "A maximum of 2 Admin users is allowed",
          deleteQuestion:
            "Are you sure you want to permanently delete this user?"
        }
      : {
          pageTitle:
            "Хэрэглэгчид",
          pageSubtitle:
            "Хэрэглэгч нэмэх болон эрх тохируулах",
          totalUsers:
            "Нийт хэрэглэгч",
          newUser:
            "Шинэ хэрэглэгч",
          newUserDescription:
            "Хэрэглэгчид түр нууц үг өгнө. Эхний нэвтрэлтээр шинэ нууц үг үүсгэнэ.",
          unblockTitle:
            "Хэрэглэгчийн блок гаргах",
          unblockDescription:
            "Хэрэглэгчид шинэ нууц үг үүсгээд блок гаргана.",
          email:
            "И-мэйл",
          temporaryPassword:
            "Түр нууц үг",
          newPassword:
            "Шинэ нууц үг",
          passwordPlaceholder:
            "Хамгийн багадаа 10 тэмдэгт",
          role:
            "Эрх",
          viewer:
            "Viewer",
          admin:
            "Admin",
          add:
            "Нэмэх",
          adding:
            "Нэмж байна...",
          adminCount:
            "Админ",
          usersList:
            "Хэрэглэгчдийн жагсаалт",
          usersListDescription:
            "Admin болон Viewer эрхтэй хэрэглэгчид",
          user:
            "ХЭРЭГЛЭГЧ",
          roleHeader:
            "ЭРХ",
          password:
            "НУУЦ ҮГ",
          login:
            "LOGIN",
          created:
            "ҮҮСГЭСЭН",
          action:
            "ҮЙЛДЭЛ",
          you:
            "Та",
          updated:
            "Шинэчилсэн",
          needsUpdate:
            "Шинэчлэх шаардлагатай",
          active:
            "Идэвхтэй",
          inactive:
            "Идэвхгүй",
          normal:
            "Хэвийн",
          unblock:
            "Блок гаргах",
          unblocking:
            "Блок гаргаж байна...",
          cancel:
            "Цуцлах",
          unblockSubmit:
            "Нууц үг үүсгээд блок гаргах",
          delete:
            "Устгах",
          deleting:
            "Устгаж байна...",
          loading:
            "Уншиж байна...",
          noUsers:
            "Хэрэглэгч байхгүй байна",
          userAdded:
            "Хэрэглэгч амжилттай нэмэгдлээ",
          userUpdated:
            "Хэрэглэгчийн эрх шинэчлэгдлээ",
          userDeleted:
            "Хэрэглэгч бүрэн устгагдлаа",
          userUnblocked:
            "Хэрэглэгчийн блок амжилттай гарлаа",
          loadError:
            "Хэрэглэгчдийн мэдээлэл татахад алдаа гарлаа",
          createError:
            "Хэрэглэгч нэмэхэд алдаа гарлаа",
          userExists:
            "Энэ и-мэйл хаягтай хэрэглэгч бүртгэлтэй байна.",
          updateError:
            "Хэрэглэгч шинэчлэхэд алдаа гарлаа",
          deleteError:
            "Хэрэглэгч устгахад алдаа гарлаа",
          unblockError:
            "Блок гаргахад алдаа гарлаа",
          passwordRequirement:
            "Нууц үг 10+ тэмдэгт, том/жижиг үсэг, тоо, тусгай тэмдэг байх",
          adminLimit:
            "Админ хэрэглэгчийн тоо ихдээ 2 байна",
          deleteQuestion:
            "хэрэглэгчийг бүрэн устгах уу?"
        };

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
  ] = useState(
    "viewer"
  );

  const [
    showPassword,
    setShowPassword
  ] = useState(false);

  const [
    unblockTarget,
    setUnblockTarget
  ] = useState(null);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    submitting,
    setSubmitting
  ] = useState(false);

  const [
    updatingId,
    setUpdatingId
  ] = useState(null);

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

  const activeAdminCount =
    useMemo(
      () =>
        users.filter(
          (item) =>
            item.role ===
              "admin" &&
            item.is_active
        ).length,
      [users]
    );

  const adminLimitReached =
    activeAdminCount >=
    MAX_ADMINS;

  const loadUsers =
    useCallback(
      async () => {
        if (!token) {
          return;
        }

        try {
          setLoading(true);
          setError("");

          const response =
            await fetch(
              `${API}/users`,
              {
                headers: {
                  Accept:
                    "application/json",
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
                t.loadError
            );
          }

          const rows =
            Array.isArray(
              data?.users
            )
              ? data.users
              : [];

          setUsers(
            rows.map(
              (item) => ({
                ...item,

                id:
                  Number(
                    item.id
                  ),

                role:
                  String(
                    item.role ||
                      "viewer"
                  )
                    .trim()
                    .toLowerCase(),

                is_active:
                  Boolean(
                    item.is_active
                  ),

                is_blocked:
                  Boolean(
                    item.is_blocked
                  ),

                must_change_password:
                  Boolean(
                    item.must_change_password
                  ),

                failed_login_attempts:
                  Number(
                    item.failed_login_attempts ||
                      0
                  )
              })
            )
          );
        } catch (err) {
          setError(
            err?.message ||
              t.loadError
          );
        } finally {
          setLoading(false);
        }
      },
      [
        token,
        t.loadError
      ]
    );

  useEffect(() => {
  if (!success) {
    return;
  }

  const timer =
    setTimeout(() => {
      setSuccess("");
    }, 3200);

  return () => {
    clearTimeout(timer);
  };
}, [success]);

  useEffect(() => {
    if (
      user?.role === "admin"
    ) {
      loadUsers();
    }
  }, [
    user?.role,
    loadUsers
  ]);

  function resetForm() {
    setEmail("");
    setPassword("");
    setRole("viewer");
    setShowPassword(false);
    setUnblockTarget(null);
  }

  function openUnblock(item) {
    setUnblockTarget(item);
    setEmail(item.email);
    setPassword("");
    setRole(item.role);
    setShowPassword(false);
    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function cancelUnblock() {
    resetForm();
    setError("");
    setSuccess("");
  }

  async function createUser() {
    const cleanEmail =
      email
        .trim()
        .toLowerCase();

    if (
      !cleanEmail ||
      !password
    ) {
      throw new Error(
        t.createError
      );
    }

    const existingUser =
      users.find(
        (item) =>
          String(
            item.email || ""
          )
            .trim()
            .toLowerCase() ===
          cleanEmail
      );

    if (existingUser) {
      throw new Error(
        t.userExists
      );
    }

    if (
      !isStrongPassword(
        password
      )
    ) {
      throw new Error(
        t.passwordRequirement
      );
    }

    if (
      role === "admin" &&
      adminLimitReached
    ) {
      throw new Error(
        t.adminLimit
      );
    }

    const response =
      await fetch(
        `${API}/users`,
        {
          method: "POST",

          headers: {
            Accept:
              "application/json",

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

    let data = null;

    try {
      data =
        await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      if (
        response.status === 409 ||
        data?.message
          ?.toLowerCase()
          .includes("already") ||
        data?.message
          ?.toLowerCase()
          .includes("exist")
      ) {
        throw new Error(
          t.userExists
        );
      }

      throw new Error(
        data?.message ||
          t.createError
      );
    }

    resetForm();

    setSuccess(
      t.userAdded
    );

    await loadUsers();
  }

  async function unblockUser() {
    if (!unblockTarget) {
      return;
    }

    if (
      !isStrongPassword(
        password
      )
    ) {
      throw new Error(
        t.passwordRequirement
      );
    }

    const realUserId =
      Number(
        unblockTarget.id
      );

    const response =
      await fetch(
        `${API}/users/${realUserId}/unblock`,
        {
          method: "POST",

          headers: {
            Accept:
              "application/json",

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`
          },

          body:
            JSON.stringify({
              password
            })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data?.message ||
          t.unblockError
      );
    }

    resetForm();

    setSuccess(
      t.userUnblocked
    );

    await loadUsers();
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      if (unblockTarget) {
        await unblockUser();
      } else {
        await createUser();
      }
    } catch (err) {
      setError(
        err?.message ||
          t.createError
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function updateUser(
    item,
    changes
  ) {
    const realUserId =
      Number(item.id);

    try {
      setUpdatingId(
        realUserId
      );

      setError("");
      setSuccess("");

      const response =
        await fetch(
          `${API}/users/${realUserId}`,
          {
            method: "PATCH",

            headers: {
              Accept:
                "application/json",

              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`
            },

            body:
              JSON.stringify(
                changes
              )
          }
        );

      let data = null;

      try {
        data =
          await response.json();
      } catch {
        data = null;
      }

      console.log(
        "PATCH USER RESPONSE:",
        response.status,
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            t.updateError
        );
      }

      if (!data?.user) {
        throw new Error(
          t.updateError
        );
      }

      setUsers(
        (current) =>
          current.map(
            (row) =>
              Number(row.id) ===
              realUserId
                ? {
                    ...row,
                    ...data.user,
                    id:
                      realUserId,
                    display_id:
                      row.display_id
                  }
                : row
          )
      );

      setSuccess(
        t.userUpdated
      );
    } catch (err) {
      console.error(
        "UPDATE USER ERROR:",
        err
      );

      setError(
        err?.message ||
          t.updateError
      );

      await loadUsers();
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteUser(
    item
  ) {
    const confirmed =
      window.confirm(
        lang === "mn"
          ? `${item.email} ${t.deleteQuestion}`
          : `${t.deleteQuestion}\n${item.email}`
      );

    if (!confirmed) {
      return;
    }

    const realUserId =
      Number(item.id);

    try {
      setDeletingId(
        realUserId
      );

      setError("");
      setSuccess("");

      const response =
        await fetch(
          `${API}/users/${realUserId}`,
          {
            method: "DELETE",

            headers: {
              Accept:
                "application/json",

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
            t.deleteError
        );
      }

      if (
        data?.permanently_deleted !==
        true
      ) {
        throw new Error(
          t.deleteError
        );
      }

      setUsers(
        (current) =>
          current.filter(
            (row) =>
              Number(row.id) !==
              realUserId
          )
      );

      if (
        Number(
          unblockTarget?.id
        ) === realUserId
      ) {
        resetForm();
      }

      setSuccess(
        t.userDeleted
      );

      await loadUsers();
    } catch (err) {
      setError(
        err?.message ||
          t.deleteError
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (
    user?.role !== "admin"
  ) {
    return null;
  }

  return (
    <div className="users-page">

          {success && (
      <div className="users-toast-wrap">
        <div className="users-toast">
          <div className="users-toast-icon">
            ✓
          </div>

          <div className="users-toast-content">
            <strong>
              {lang === "en"
                ? "Success"
                : "Амжилттай"}
            </strong>

            <span>
              {success}
            </span>
          </div>

          <button
            type="button"
            className="users-toast-close"
            onClick={() =>
              setSuccess("")
            }
          >
            <X
              size={16}
              strokeWidth={2}
            />
          </button>

          <div className="users-toast-progress" />
        </div>
      </div>
    )}
      <div className="users-page-header">
        <div>
          <h2>
            {t.pageTitle}
          </h2>

          <p>
            {t.pageSubtitle}
          </p>
        </div>

        <div className="users-count">
          <span>
            {t.totalUsers}
          </span>

          <strong>
            {users.length}
          </strong>
        </div>
      </div>

      <div className="users-create-card">
        <div className="users-create-heading">
          <h3>
            {unblockTarget
              ? t.unblockTitle
              : t.newUser}
          </h3>

          <p>
            {unblockTarget
              ? t.unblockDescription
              : t.newUserDescription}
          </p>
        </div>

        <form
          className="users-create-form"
          onSubmit={handleSubmit}
          autoComplete="off"
        >
          <div className="users-form-field">
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
              placeholder="user@misheel.mn"
              name="new-user-email"
              autoComplete="off"
              disabled={
                Boolean(
                  unblockTarget
                )
              }
              required
            />
          </div>

          <div className="users-form-field">
            <label>
              {unblockTarget
                ? t.newPassword
                : t.temporaryPassword}
            </label>

            <div className="users-password-input-wrap">
              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder={
                  t.passwordPlaceholder
                }
                name="new-user-password"
                autoComplete="new-password"
                minLength={10}
                required
              />

              <button
                type="button"
                className="users-password-eye"
                onClick={() =>
                  setShowPassword(
                    (value) =>
                      !value
                  )
                }
              >
                {showPassword ? (
                  <EyeOff
                    size={17}
                  />
                ) : (
                  <Eye
                    size={17}
                  />
                )}
              </button>
            </div>
          </div>

          <div className="users-form-field">
            <label>
              {t.role}
            </label>

            <select
              value={role}
              onChange={(event) =>
                setRole(
                  event.target.value
                )
              }
              disabled={
                Boolean(
                  unblockTarget
                )
              }
            >
              <option value="viewer">
                {t.viewer}
              </option>

              <option
                value="admin"
                disabled={
                  !unblockTarget &&
                  adminLimitReached
                }
              >
                {t.admin}
              </option>
            </select>
          </div>

          {unblockTarget ? (
            <div className="users-form-actions">
              <button
                type="button"
                className="users-reset-cancel"
                onClick={
                  cancelUnblock
                }
                disabled={
                  submitting
                }
              >
                {t.cancel}
              </button>

              <button
                type="submit"
                className="users-add-button users-unblock-submit"
                disabled={
                  submitting
                }
              >
                {submitting
                  ? t.unblocking
                  : t.unblockSubmit}
              </button>
            </div>
          ) : (
            <button
              type="submit"
              className="users-add-button"
              disabled={
                submitting
              }
            >
              {submitting
                ? t.adding
                : t.add}
            </button>
          )}
        </form>

        <div className="users-admin-limit">
          {t.adminCount}:{" "}
          {activeAdminCount}/
          {MAX_ADMINS}
        </div>

        {unblockTarget && (
          <div className="users-password-help">
            {
              t.passwordRequirement
            }
          </div>
        )}

        {error && (
          <div className="users-message users-message-error">
            {error}
          </div>
        )}


      </div>

      <div className="users-list-card">
        <div className="users-list-header">
          <div>
            <h3>
              {t.usersList}
            </h3>

            <p>
              {
                t.usersListDescription
              }
            </p>
          </div>
        </div>

        {loading ? (
          <div className="users-loading">
            {t.loading}
          </div>
        ) : users.length === 0 ? (
          <div className="users-empty">
            {t.noUsers}
          </div>
        ) : (
          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>
                    {t.user}
                  </th>

                  <th>
                    {t.roleHeader}
                  </th>

                  <th>
                    {t.password}
                  </th>

                  <th>
                    {t.login}
                  </th>

                  <th>
                    {t.created}
                  </th>

                  <th>
                    {t.action}
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.map(
                  (
                    item,
                    index
                  ) => {
                    const realUserId =
                      Number(
                        item.id
                      );

                    const isCurrentUser =
                      realUserId ===
                      Number(
                        user?.id
                      );

                    const busy =
                      updatingId ===
                        realUserId ||
                      deletingId ===
                        realUserId;

                    const visibleId =
                      item.display_id ??
                      index + 1;

                    return (
                      <tr
                        key={
                          realUserId
                        }
                      >
                        <td>
                          <div className="users-person">
                            <div className="users-person-avatar">
                              {String(
                                item.email ||
                                  "U"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div className="users-person-info">
                              <strong>
                                {
                                  item.email
                                }
                              </strong>

                              <span>
                                ID #
                                {
                                  visibleId
                                }
                              </span>
                            </div>

                            {isCurrentUser && (
                              <span className="users-you-badge">
                                {t.you}
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
                              busy ||
                              !item.is_active
                            }
                            onChange={(
                              event
                            ) => {
                              const newRole =
                                event
                                  .target
                                  .value;

                              if (
                                newRole ===
                                item.role
                              ) {
                                return;
                              }

                              updateUser(
                                item,
                                {
                                  role:
                                    newRole
                                }
                              );
                            }}
                          >
                            <option value="viewer">
                              {t.viewer}
                            </option>

                            <option value="admin">
                              {t.admin}
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
                              ? t.needsUpdate
                              : t.updated}
                          </span>
                        </td>

                        <td>
                          {item.is_blocked ? (
                            <button
                              type="button"
                              className="users-unblock-button"
                              disabled={
                                busy
                              }
                              onClick={() =>
                                openUnblock(
                                  item
                                )
                              }
                            >
                              {t.unblock}
                            </button>
                          ) : (
                            <span className="users-login-ok">
                              {item.failed_login_attempts >
                              0
                                ? `${item.failed_login_attempts}/5`
                                : t.normal}
                            </span>
                          )}
                        </td>

                        <td>
                          <span className="users-date">
                            {item.created_at
                              ? new Date(
                                  item.created_at
                                ).toLocaleDateString(
                                  lang ===
                                    "en"
                                    ? "en-US"
                                    : "mn-MN"
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
                              busy
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
                                  realUserId
                                ? t.deleting
                                : t.delete}
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