import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

const AuthContext =
  createContext(null);

const TOKEN_KEY =
  "admin_token";

const API =
  import.meta.env
    .VITE_API_URL ||
  "http://localhost:8000/api";

export function AuthProvider({
  children
}) {
  const [
    token,
    setToken
  ] = useState(() =>
    localStorage.getItem(
      TOKEN_KEY
    )
  );

  const [
    user,
    setUser
  ] = useState(null);

  const [
    loading,
    setLoading
  ] = useState(
    Boolean(token)
  );

  const clearAuth =
    useCallback(() => {
      localStorage.removeItem(
        TOKEN_KEY
      );

      setToken(null);
      setUser(null);
    }, []);

  const refreshUser =
    useCallback(
      async (
        activeToken =
          token
      ) => {
        if (!activeToken) {
          setUser(null);
          setLoading(false);
          return null;
        }

        try {
          const response =
            await fetch(
              `${API}/auth/me`,
              {
                headers: {
                  Authorization:
                    `Bearer ${activeToken}`
                }
              }
            );

          const data =
            await response.json();

          if (
            !response.ok
          ) {
            clearAuth();
            return null;
          }

          setUser(
            data.user
          );

          return data.user;
        } catch {
          clearAuth();
          return null;
        } finally {
          setLoading(false);
        }
      },
      [
        token,
        clearAuth
      ]
    );

  useEffect(() => {
    refreshUser();
  }, [
    refreshUser
  ]);

  function login(
    nextToken,
    nextUser
  ) {
    localStorage.setItem(
      TOKEN_KEY,
      nextToken
    );

    setToken(
      nextToken
    );

    setUser(
      nextUser ||
        null
    );

    setLoading(false);
  }

  async function logout() {
    const currentToken =
      token;

    clearAuth();

    if (
      !currentToken
    ) {
      return;
    }

    try {
      await fetch(
        `${API}/auth/logout`,
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${currentToken}`
          }
        }
      );
    } catch {
    }
  }

  const value =
    useMemo(
      () => ({
        token,
        user,
        loading,
        authenticated:
          Boolean(
            token &&
              user
          ),
        login,
        logout,
        refreshUser
      }),
      [
        token,
        user,
        loading,
        refreshUser
      ]
    );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(
    AuthContext
  );
}