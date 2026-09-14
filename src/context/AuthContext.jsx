import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const AuthContext =
  createContext(null);

const API =
  import.meta.env.VITE_API_URL ||
  "/api";

const SESSION_MARKER =
  "auth_session";

const LAST_ACTIVITY_KEY =
  "last_activity_at";

function normalizeUser(
  user
) {
  if (!user) {
    return null;
  }

  return {
    ...user,

    id:
      Number(
        user.id
      ),

    role:
      String(
        user.role ||
        "viewer"
      )
        .trim()
        .toLowerCase(),

    must_change_password:
      Boolean(
        user.must_change_password
      ),

    is_active:
      Boolean(
        user.is_active
      ),

    is_blocked:
      Boolean(
        user.is_blocked
      ),

    failed_login_attempts:
      Number(
        user.failed_login_attempts ||
        0
      ),
  };
}

export function AuthProvider({
  children,
}) {
  const [
    user,
    setUser,
  ] =
    useState(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const clearAuth =
    useCallback(() => {
      setUser(
        null
      );

      localStorage.removeItem(
        SESSION_MARKER
      );

      localStorage.removeItem(
        LAST_ACTIVITY_KEY
      );
    }, []);

  const login =
    useCallback(
      (
        nextUser
      ) => {
        const normalized =
          normalizeUser(
            nextUser
          );

        if (!normalized) {
          clearAuth();

          return;
        }

        setUser(
          normalized
        );

        localStorage.setItem(
          SESSION_MARKER,
          "1"
        );

        localStorage.setItem(
          LAST_ACTIVITY_KEY,
          String(
            Date.now()
          )
        );
      },
      [
        clearAuth,
      ]
    );

  const refreshUser =
    useCallback(
      async () => {
        try {
          const response =
            await fetch(
              `${API}/auth/me`,
              {
                method:
                  "GET",

                credentials:
                  "include",

                headers: {
                  Accept:
                    "application/json",
                },
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
            !response.ok ||
            !data?.user
          ) {
            clearAuth();

            return null;
          }

          const nextUser =
            normalizeUser(
              data.user
            );

          setUser(
            nextUser
          );

          localStorage.setItem(
            SESSION_MARKER,
            "1"
          );

          return nextUser;
        } catch {
          clearAuth();

          return null;
        }
      },
      [
        clearAuth,
      ]
    );

  const logout =
    useCallback(
      async () => {
        try {
          await fetch(
            `${API}/auth/logout`,
            {
              method:
                "POST",

              credentials:
                "include",

              headers: {
                Accept:
                  "application/json",
              },
            }
          );
        } catch {
        } finally {
          clearAuth();
        }
      },
      [
        clearAuth,
      ]
    );

  useEffect(() => {
    let cancelled =
      false;

    async function initialize() {
      const marker =
        localStorage.getItem(
          SESSION_MARKER
        );

      if (
        marker !== "1"
      ) {
        if (
          !cancelled
        ) {
          setLoading(
            false
          );
        }

        return;
      }

      await refreshUser();

      if (
        !cancelled
      ) {
        setLoading(
          false
        );
      }
    }

    initialize();

    return () => {
      cancelled =
        true;
    };
  }, [
    refreshUser,
  ]);

  const value =
    useMemo(
      () => ({
        user,

        loading,

        authenticated:
          Boolean(
            user
          ),

        login,

        logout,

        refreshUser,

        clearAuth,
      }),
      [
        user,
        loading,
        login,
        logout,
        refreshUser,
        clearAuth,
      ]
    );

  return (
    <AuthContext.Provider
      value={
        value
      }
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(
      AuthContext
    );

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}