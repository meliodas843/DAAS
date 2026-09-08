import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

const LanguageContext =
  createContext(null);

export function LanguageProvider({
  children
}) {
  const [
    language,
    setLanguageState
  ] = useState(() => {
    const saved =
      localStorage.getItem(
        "language"
      );

    return saved === "en"
      ? "en"
      : "mn";
  });

  function setLanguage(
    nextLanguage
  ) {
    if (
      nextLanguage !== "mn" &&
      nextLanguage !== "en"
    ) {
      return;
    }

    setLanguageState(
      nextLanguage
    );

    localStorage.setItem(
      "language",
      nextLanguage
    );
  }

  useEffect(() => {
    function handleStorage(
      event
    ) {
      if (
        event.key ===
          "language" &&
        (
          event.newValue ===
            "mn" ||
          event.newValue ===
            "en"
        )
      ) {
        setLanguageState(
          event.newValue
        );
      }
    }

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context =
    useContext(
      LanguageContext
    );

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}