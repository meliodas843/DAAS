import {
  createContext,
  useContext,
  useMemo,
  useState
} from "react";

const AuthContext =
  createContext(null);

const TOKEN_KEY =
  "admin_token";

const USER_KEY =
  "admin_user";

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
  ] = useState(() => {
    try {
      const value =
        localStorage.getItem(
          USER_KEY
        );

      if (!value) {
        return null;
      }

      const parsed =
        JSON.parse(value);

      return {
        ...parsed,
        must_change_password:
          Boolean(
            parsed
              .must_change_password
          )
      };
    } catch {
      return null;
    }
  });

  function login(
    nextToken,
    nextUser
  ) {
    const normalizedUser = {
      ...nextUser,
      must_change_password:
        Boolean(
          nextUser
            ?.must_change_password
        )
    };

    localStorage.setItem(
      TOKEN_KEY,
      nextToken
    );

    localStorage.setItem(
      USER_KEY,
      JSON.stringify(
        normalizedUser
      )
    );

    setToken(
      nextToken
    );

    setUser(
      normalizedUser
    );
  }

  function logout() {
    localStorage.removeItem(
      TOKEN_KEY
    );

    localStorage.removeItem(
      USER_KEY
    );

    setToken(null);
    setUser(null);
  }

  const value =
    useMemo(
      () => ({
        token,
        user,
        authenticated:
          Boolean(
            token &&
              user
          ),
        login,
        logout
      }),
      [
        token,
        user
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