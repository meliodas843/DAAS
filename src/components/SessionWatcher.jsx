import {
  useEffect,
  useRef
} from "react";

const API =
  import.meta.env.VITE_API_URL ||
  "/api";

const SESSION_MARKER =
  "auth_session";

const LAST_ACTIVITY_KEY =
  "last_activity_at";

const IDLE_TIMEOUT =
  20 * 60 * 1000;

const SESSION_CHECK_INTERVAL =
  30 * 1000;

const ACTIVITY_WRITE_INTERVAL =
  15 * 1000;

function hasSession() {
  return (
    localStorage.getItem(
      SESSION_MARKER
    ) === "1"
  );
}

function clearSession() {
  localStorage.removeItem(
    SESSION_MARKER
  );

  localStorage.removeItem(
    LAST_ACTIVITY_KEY
  );

  localStorage.removeItem(
    "admin_user"
  );

  localStorage.removeItem(
    "must_change_password"
  );
}

function redirectLogin() {
  if (
    window.location.pathname !==
    "/login"
  ) {
    window.location.replace(
      "/login"
    );
  }
}

async function forceLogout(
  notifyServer = true
) {
  if (
    notifyServer &&
    hasSession()
  ) {
    try {
      await fetch(
        `${API}/auth/logout`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            Accept:
              "application/json"
          }
        }
      );
    } catch {}
  }

  clearSession();
  redirectLogin();
}

export default function SessionWatcher() {
  const lastWriteRef =
    useRef(0);

  useEffect(() => {
    let active = true;
    let checking = false;

    function markActivity() {
      if (!hasSession()) {
        return;
      }

      const now =
        Date.now();

      if (
        now -
          lastWriteRef.current <
        ACTIVITY_WRITE_INTERVAL
      ) {
        return;
      }

      lastWriteRef.current =
        now;

      localStorage.setItem(
        LAST_ACTIVITY_KEY,
        String(now)
      );
    }

    function ensureActivityTimestamp() {
      if (!hasSession()) {
        return;
      }

      const stored =
        Number(
          localStorage.getItem(
            LAST_ACTIVITY_KEY
          )
        );

      if (
        !Number.isFinite(
          stored
        ) ||
        stored <= 0
      ) {
        const now =
          Date.now();

        lastWriteRef.current =
          now;

        localStorage.setItem(
          LAST_ACTIVITY_KEY,
          String(now)
        );
      }
    }

    async function checkIdle() {
      if (!hasSession()) {
        return;
      }

      const lastActivity =
        Number(
          localStorage.getItem(
            LAST_ACTIVITY_KEY
          )
        );

      if (
        Number.isFinite(
          lastActivity
        ) &&
        Date.now() -
          lastActivity >=
          IDLE_TIMEOUT
      ) {
        await forceLogout(
          true
        );
      }
    }

    async function checkSession() {
      if (
        !hasSession() ||
        checking
      ) {
        return;
      }

      checking = true;

      try {
        const response =
          await fetch(
            `${API}/auth/me`,
            {
              method: "GET",
              credentials: "include",
              headers: {
                Accept:
                  "application/json"
              }
            }
          );

        if (
          response.status === 401 ||
          response.status === 403 ||
          response.status === 423
        ) {
          if (active) {
            await forceLogout(
              false
            );
          }

          return;
        }

        if (!response.ok) {
          console.error(
            "Session check failed:",
            response.status
          );
        }
      } catch (error) {
        console.error(
          "Session check error:",
          error
        );
      } finally {
        checking = false;
      }
    }

    ensureActivityTimestamp();
    checkSession();
    checkIdle();

    const sessionTimer =
      window.setInterval(
        checkSession,
        SESSION_CHECK_INTERVAL
      );

    const idleTimer =
      window.setInterval(
        checkIdle,
        15 * 1000
      );

    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "pointerdown"
    ];

    activityEvents.forEach(
      (eventName) => {
        window.addEventListener(
          eventName,
          markActivity,
          {
            passive: true
          }
        );
      }
    );

    function handleFocus() {
      markActivity();
      checkSession();
      checkIdle();
    }

    function handleVisibility() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        checkSession();
        checkIdle();
      }
    }

    function handleStorage(event) {
      if (
        event.key ===
          SESSION_MARKER &&
        !event.newValue
      ) {
        redirectLogin();
      }
    }

    window.addEventListener(
      "focus",
      handleFocus
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      active = false;

      window.clearInterval(
        sessionTimer
      );

      window.clearInterval(
        idleTimer
      );

      activityEvents.forEach(
        (eventName) => {
          window.removeEventListener(
            eventName,
            markActivity
          );
        }
      );

      window.removeEventListener(
        "focus",
        handleFocus
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, []);

  return null;
}
