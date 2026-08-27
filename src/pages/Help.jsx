import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  Plus,
  X,
  Inbox,
  CalendarDays,
  Upload,
  Paperclip,
  Eye
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

const REQUEST_TYPES = [
  {
    value: "BUG",
    mn: "Алдаа",
    en: "Bug"
  },
  {
    value: "QUESTION",
    mn: "Асуулт",
    en: "Question"
  },
  {
    value: "FEEDBACK",
    mn: "Санал хүсэлт",
    en: "Feedback"
  },
  {
    value: "CHANGE_REQUEST",
    mn: "Өөрчлөлтийн хүсэлт",
    en: "Change request"
  }
];

const translations = {
  mn: {
    requests: "Тусламж",
    subtitle:
      "Бүх тусламжийн хүсэлтүүд",

    newRequest:
      "Шинэ хүсэлт",

    addRequest:
      "Шинэ хүсэлт",

    requestTitle:
      "Гарчиг",

    titlePlaceholder:
      "Гарчиг оруулна уу",

    type:
      "Төрөл",

    selectType:
      "Төрөл сонгоно уу",

    description:
      "Дэлгэрэнгүй",

    descriptionPlaceholder:
      "Хүсэлтээ дэлгэрэнгүй бичнэ үү",

    file:
      "Файл оруулах",

    chooseFile:
      "Файл сонгох",

    send:
      "Илгээх",

    sending:
      "Илгээж байна...",

    cancel:
      "Цуцлах",

    close:
      "Хаах",

    number:
      "Дугаар",

    date:
      "Огноо",

    role:
      "Role",

    details:
      "Дэлгэрэнгүй",

    loading:
      "Уншиж байна...",

    empty:
      "Одоогоор хүсэлт байхгүй байна",

    emptyDescription:
      "Шинэ хүсэлт үүсгэхийн тулд Шинэ хүсэлт товчийг дарна уу.",

    success:
      "Хүсэлт амжилттай илгээгдлээ",

    loadError:
      "Хүсэлтүүдийг уншихад алдаа гарлаа",

    saveError:
      "Хүсэлт илгээхэд алдаа гарлаа",

    required:
      "Заавал бөглөх талбаруудыг бөглөнө үү",

    noFile:
      "Файл байхгүй"
  },

  en: {
    requests:
      "Help",

    subtitle:
      "All support requests",

    newRequest:
      "New Request",

    addRequest:
      "New Request",

    requestTitle:
      "Title",

    titlePlaceholder:
      "Enter title",

    type:
      "Type",

    selectType:
      "Select type",

    description:
      "Description",

    descriptionPlaceholder:
      "Describe your request in detail",

    file:
      "File Upload",

    chooseFile:
      "Choose file",

    send:
      "Send",

    sending:
      "Sending...",

    cancel:
      "Cancel",

    close:
      "Close",

    number:
      "No.",

    date:
      "Date",

    role:
      "Role",

    details:
      "See details",

    loading:
      "Loading...",

    empty:
      "No requests yet",

    emptyDescription:
      "Click New Request to create a support request.",

    success:
      "Request sent successfully",

    loadError:
      "Failed to load requests",

    saveError:
      "Failed to send request",

    required:
      "Please complete all required fields",

    noFile:
      "No file"
  }
};

export default function Help() {
  const {
    token
  } = useAuth();

  const {
    language
  } = useDashboard();

  const currentLanguage =
    language === "en"
      ? "en"
      : "mn";

  const t =
    translations[
      currentLanguage
    ];

  const [
    requests,
    setRequests
  ] = useState([]);

  const [
    showForm,
    setShowForm
  ] = useState(false);

  const [
    selectedRequest,
    setSelectedRequest
  ] = useState(null);

  const [
    title,
    setTitle
  ] = useState("");

  const [
    type,
    setType
  ] = useState("");

  const [
    description,
    setDescription
  ] = useState("");

  const [
    file,
    setFile
  ] = useState(null);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    saving,
    setSaving
  ] = useState(false);

  const [
    error,
    setError
  ] = useState("");

  const [
    success,
    setSuccess
  ] = useState("");

  const sortedRequests =
    useMemo(() => {
      return [
        ...requests
      ].sort(
        (
          a,
          b
        ) => {
          const bDate =
            new Date(
              b.created_at ||
                b.date ||
                0
            ).getTime();

          const aDate =
            new Date(
              a.created_at ||
                a.date ||
                0
            ).getTime();

          return (
            bDate -
            aDate
          );
        }
      );
    }, [
      requests
    ]);

  const loadRequests =
    useCallback(
      async () => {
        if (!token) {
          return;
        }

        try {
          setLoading(
            true
          );

          setError("");

          const response =
            await fetch(
              `${API}/support`,
              {
                headers: {
                  Accept:
                    "application/json",

                  Authorization:
                    `Bearer ${token}`
                }
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
            !response.ok
          ) {
            throw new Error(
              data?.message ||
                t.loadError
            );
          }

          const list =
            Array.isArray(
              data?.requests
            )
              ? data.requests
              : Array.isArray(
                    data
                  )
                ? data
                : [];

          setRequests(
            list
          );
        } catch (
          err
        ) {
          console.error(
            "LOAD SUPPORT ERROR:",
            err
          );

          setError(
            err?.message ||
              t.loadError
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        token,
        t.loadError
      ]
    );

  useEffect(() => {
    loadRequests();
  }, [
    loadRequests
  ]);

  useEffect(() => {
  if (!success) {
    return;
  }

  const timer =
    setTimeout(() => {
      setSuccess("");
    }, 3200);

  return () =>
    clearTimeout(timer);
}, [success]);

  useEffect(() => {
    function handleKeyDown(
      event
    ) {
      if (
        event.key !==
        "Escape"
      ) {
        return;
      }

      if (
        selectedRequest
      ) {
        setSelectedRequest(
          null
        );

        return;
      }

      if (
        showForm
      ) {
        closeForm();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    selectedRequest,
    showForm
  ]);

  function resetForm() {
    setTitle("");
    setType("");
    setDescription("");
    setFile(null);
  }

  function openForm() {
    resetForm();

    setSelectedRequest(
      null
    );

    setError("");
    setSuccess("");

    setShowForm(
      true
    );
  }

  function closeForm() {
    setShowForm(
      false
    );

    resetForm();
  }

  function getTypeLabel(
    value
  ) {
    const item =
      REQUEST_TYPES.find(
        (
          requestType
        ) =>
          requestType.value ===
          value
      );

    if (!item) {
      return (
        value ||
        "-"
      );
    }

    return item[
      currentLanguage
    ];
  }

  function formatDate(
    value
  ) {
    if (!value) {
      return "-";
    }

    const date =
      new Date(
        value
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() +
          1
      ).padStart(
        2,
        "0"
      );

    const day =
      String(
        date.getDate()
      ).padStart(
        2,
        "0"
      );

    const hours =
      String(
        date.getHours()
      ).padStart(
        2,
        "0"
      );

    const minutes =
      String(
        date.getMinutes()
      ).padStart(
        2,
        "0"
      );

    return `${year}/${month}/${day} ${hours}:${minutes}`;
  }

  function getFileUrl(
    request
  ) {
    if (
      !request?.file_path
    ) {
      return "";
    }

    if (
      request.file_path.startsWith(
        "http://"
      ) ||
      request.file_path.startsWith(
        "https://"
      )
    ) {
      return request.file_path;
    }

    const backendUrl =
      API.replace(
        /\/api\/?$/,
        ""
      );

    return `${backendUrl}${
      request.file_path.startsWith(
        "/"
      )
        ? ""
        : "/"
    }${request.file_path}`;
  }

  function isImageFile(
    request
  ) {
    const fileName =
      request?.file_name ||
      request?.file_path ||
      "";

    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(
      fileName
    );
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    const cleanTitle =
      title.trim();

    const cleanDescription =
      description.trim();

    if (
      !cleanTitle ||
      !type ||
      !cleanDescription
    ) {
      setError(
        t.required
      );

      return;
    }

    try {
      setSaving(
        true
      );

      setError("");
      setSuccess("");

      const formData =
        new FormData();

      formData.append(
        "title",
        cleanTitle
      );

      formData.append(
        "type",
        type
      );

      formData.append(
        "description",
        cleanDescription
      );

      if (file) {
        formData.append(
          "file",
          file
        );
      }

      const response =
        await fetch(
          `${API}/support`,
          {
            method:
              "POST",

            headers: {
              Accept:
                "application/json",

              Authorization:
                `Bearer ${token}`
            },

            body:
              formData
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
        !response.ok
      ) {
        throw new Error(
          data?.message ||
            t.saveError
        );
      }

      if (
        data?.request
      ) {
        setRequests(
          (
            current
          ) => [
            data.request,
            ...current
          ]
        );
      } else {
        await loadRequests();
      }

      closeForm();

      setSuccess(
        t.success
      );
    } catch (
      err
    ) {
      console.error(
        "SAVE SUPPORT ERROR:",
        err
      );

      setError(
        err?.message ||
          t.saveError
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  return (
    <div className="help-page">
      <div className="help-page-header">
        <div>
          <h2>
            {t.requests}
          </h2>

          <p>
            {t.subtitle}
          </p>
        </div>

        <button
          type="button"
          className="help-add-button"
          onClick={
            openForm
          }
        >
          <Plus
            size={17}
            strokeWidth={2.2}
          />

          <span>
            {t.addRequest}
          </span>
        </button>
      </div>

      {error && (
        <div className="help-alert help-alert-error">
          {error}
        </div>
      )}

      {success && (
  <div className="help-toast-wrap">
    <div className="help-toast help-toast-success">
      <div className="help-toast-icon">
        ✓
      </div>

      <div className="help-toast-content">
        <strong>
          {currentLanguage === "en"
            ? "Request sent"
            : "Хүсэлт илгээгдлээ"}
        </strong>

        <span>
          {success}
        </span>
      </div>

      <button
        type="button"
        className="help-toast-close"
        onClick={() =>
          setSuccess("")
        }
      >
        <X
          size={16}
          strokeWidth={2}
        />
      </button>

      <div className="help-toast-progress" />
    </div>
  </div>
)}

      {showForm && (
        <div className="help-form-card">
          <div className="help-form-header">
            <div>
              <h3>
                {t.newRequest}
              </h3>
            </div>

            <button
              type="button"
              className="help-close-button"
              onClick={
                closeForm
              }
            >
              <X
                size={19}
                strokeWidth={2}
              />
            </button>
          </div>

          <form
            onSubmit={
              handleSubmit
            }
          >
            <div className="help-field">
              <label>
                {t.requestTitle}

                <span className="help-required">
                  *
                </span>
              </label>

              <input
                type="text"
                value={title}
                onChange={(
                  event
                ) =>
                  setTitle(
                    event.target.value
                  )
                }
                placeholder={
                  t.titlePlaceholder
                }
                maxLength={200}
                required
                autoFocus
              />
            </div>

            <div className="help-field">
              <label>
                {t.type}

                <span className="help-required">
                  *
                </span>
              </label>

              <select
                value={type}
                onChange={(
                  event
                ) =>
                  setType(
                    event.target.value
                  )
                }
                required
              >
                <option value="">
                  {t.selectType}
                </option>

                {REQUEST_TYPES.map(
                  (
                    item
                  ) => (
                    <option
                      key={
                        item.value
                      }
                      value={
                        item.value
                      }
                    >
                      {
                        item[
                          currentLanguage
                        ]
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="help-field">
              <label>
                {t.description}

                <span className="help-required">
                  *
                </span>
              </label>

              <textarea
                value={
                  description
                }
                onChange={(
                  event
                ) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder={
                  t.descriptionPlaceholder
                }
                rows={6}
                required
              />
            </div>

            <div className="help-field">
              <label>
                {t.file}
              </label>

              <label className="help-file-upload">
                <Upload
                  size={18}
                  strokeWidth={2}
                />

                <span>
                  {file
                    ? file.name
                    : t.chooseFile}
                </span>

                <input
                  type="file"
                  onChange={(
                    event
                  ) =>
                    setFile(
                      event
                        .target
                        .files?.[0] ||
                        null
                    )
                  }
                />
              </label>
            </div>

            <div className="help-form-actions">
              <button
                type="button"
                className="help-cancel-button"
                onClick={
                  closeForm
                }
                disabled={
                  saving
                }
              >
                {t.cancel}
              </button>

              <button
                type="submit"
                className="help-save-button"
                disabled={
                  saving ||
                  !title.trim() ||
                  !type ||
                  !description.trim()
                }
              >
                {saving
                  ? t.sending
                  : t.send}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="help-list-card">
        {loading ? (
          <div className="help-state">
            <div className="help-loading-circle" />

            <span>
              {t.loading}
            </span>
          </div>
        ) : sortedRequests.length ===
          0 ? (
          <div className="help-state">
            <div className="help-empty-icon">
              <Inbox
                size={28}
                strokeWidth={1.8}
              />
            </div>

            <strong>
              {t.empty}
            </strong>

            <p>
              {t.emptyDescription}
            </p>
          </div>
        ) : (
          <div className="help-table-wrap">
            <table className="help-table">
              <thead>
                <tr>
                  <th className="help-n-column">
                    {t.number}
                  </th>

                  <th>
                    {t.requestTitle}
                  </th>

                  <th>
                    {t.type}
                  </th>

                  <th>
                    {t.date}
                  </th>

                  <th>
                    {t.details}
                  </th>
                </tr>
              </thead>

              <tbody>
                {sortedRequests.map(
                  (
                    request,
                    index
                  ) => (
                    <tr
                      key={
                        request.id
                      }
                    >
                      <td className="help-n-cell">
                        {request.id ||
                          index + 1}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="help-title-link"
                          onClick={() =>
                            setSelectedRequest(
                              request
                            )
                          }
                        >
                          {
                            request.title
                          }
                        </button>
                      </td>

                      <td>
                        <span
                          className={`help-type-badge help-type-${String(
                            request.type ||
                              ""
                          ).toLowerCase()}`}
                        >
                          {getTypeLabel(
                            request.type
                          )}
                        </span>
                      </td>

                      <td>
                        <div className="help-date-cell">
                          <CalendarDays
                            size={14}
                            strokeWidth={2}
                          />

                          <span>
                            {formatDate(
                              request.created_at
                            )}
                          </span>
                        </div>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="help-details-button"
                          onClick={() =>
                            setSelectedRequest(
                              request
                            )
                          }
                        >
                          <Eye
                            size={14}
                            strokeWidth={2}
                          />

                          <span>
                            {t.details}
                          </span>
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedRequest && (
        <div
          className="help-modal-overlay"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedRequest(
                null
              );
            }
          }}
        >
          <div className="help-details-modal">
            <div className="help-details-header">
              <h3>
                {t.newRequest}
              </h3>

              <button
                type="button"
                className="help-details-close"
                onClick={() =>
                  setSelectedRequest(
                    null
                  )
                }
                aria-label={
                  t.close
                }
              >
                <X
                  size={21}
                  strokeWidth={1.8}
                />
              </button>
            </div>

            <div className="help-details-body">
              <div className="help-details-field">
                <label>
                  {t.requestTitle}
                </label>

                <div className="help-details-value">
                  {selectedRequest.title ||
                    "-"}
                </div>
              </div>

              <div className="help-details-field">
                <label>
                  {t.type}
                </label>

                <div className="help-details-value">
                  {getTypeLabel(
                    selectedRequest.type
                  )}
                </div>
              </div>

              <div className="help-details-field">
                <label>
                  {t.description}
                </label>

                <div className="help-details-description">
                  {selectedRequest.description ||
                    "-"}
                </div>
              </div>

              <div className="help-details-field">
                <label>
                  {t.file}
                </label>

                {!selectedRequest.file_path ? (
                  <div className="help-details-file-empty">
                    <Paperclip
                      size={17}
                      strokeWidth={2}
                    />

                    <span>
                      {t.noFile}
                    </span>
                  </div>
                ) : isImageFile(
                    selectedRequest
                  ) ? (
                  <div className="help-details-image-wrapper">
                    <a
                      href={getFileUrl(
                        selectedRequest
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="help-details-image-link"
                    >
                      <img
                        src={getFileUrl(
                          selectedRequest
                        )}
                        alt={
                          selectedRequest.file_name ||
                          "Attachment"
                        }
                        className="help-details-image"
                      />
                    </a>

                    <div className="help-details-file-name">
                      <Paperclip
                        size={15}
                        strokeWidth={2}
                      />

                      <span>
                        {selectedRequest.file_name ||
                          "Image"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <a
                    href={getFileUrl(
                      selectedRequest
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="help-details-file-link"
                  >
                    <Paperclip
                      size={17}
                      strokeWidth={2}
                    />

                    <span>
                      {selectedRequest.file_name ||
                        "Attachment"}
                    </span>
                  </a>
                )}
              </div>

              <div className="help-details-meta">
                <div className="help-details-meta-item">
                  <span>
                    ID
                  </span>

                  <strong>
                    {selectedRequest.id ||
                      "-"}
                  </strong>
                </div>

                <div className="help-details-meta-item">
                  <span>
                    {t.role}
                  </span>

                  <strong>
                    {selectedRequest.role ||
                      selectedRequest.user_role ||
                      "-"}
                  </strong>
                </div>

                <div className="help-details-meta-item">
                  <span>
                    {t.date}
                  </span>

                  <strong>
                    {formatDate(
                      selectedRequest.created_at
                    )}
                  </strong>
                </div>
              </div>
            </div>

            <div className="help-details-footer">
              <button
                type="button"
                className="help-details-close-button"
                onClick={() =>
                  setSelectedRequest(
                    null
                  )
                }
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}