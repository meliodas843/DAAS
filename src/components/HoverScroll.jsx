import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

export default function HoverScroll({
  children,
  direction = "vertical",
  className = ""
}) {
  const viewportRef =
    useRef(null);

  const draggingRef =
    useRef(false);

  const dragStartRef =
    useRef({
      pointer: 0,
      scroll: 0
    });

  const [
    hovered,
    setHovered
  ] = useState(false);

  const [
    metrics,
    setMetrics
  ] = useState({
    hasOverflow: false,
    thumbSize: 0,
    thumbPosition: 0
  });

  const updateMetrics =
    useCallback(() => {
      const viewport =
        viewportRef.current;

      if (!viewport) {
        return;
      }

      if (
        direction ===
        "horizontal"
      ) {
        const clientSize =
          viewport.clientWidth;

        const scrollSize =
          viewport.scrollWidth;

        const scrollPosition =
          viewport.scrollLeft;

        const hasOverflow =
          scrollSize >
          clientSize + 1;

        if (!hasOverflow) {
          setMetrics({
            hasOverflow: false,
            thumbSize: 0,
            thumbPosition: 0
          });

          return;
        }

        const ratio =
          clientSize /
          scrollSize;

        const thumbSize =
          Math.max(
            clientSize *
              ratio,
            38
          );

        const maxThumbPosition =
          Math.max(
            clientSize -
              thumbSize,
            0
          );

        const maxScroll =
          Math.max(
            scrollSize -
              clientSize,
            1
          );

        const thumbPosition =
          (scrollPosition /
            maxScroll) *
          maxThumbPosition;

        setMetrics({
          hasOverflow: true,
          thumbSize,
          thumbPosition
        });

        return;
      }

      const clientSize =
        viewport.clientHeight;

      const scrollSize =
        viewport.scrollHeight;

      const scrollPosition =
        viewport.scrollTop;

      const hasOverflow =
        scrollSize >
        clientSize + 1;

      if (!hasOverflow) {
        setMetrics({
          hasOverflow: false,
          thumbSize: 0,
          thumbPosition: 0
        });

        return;
      }

      const ratio =
        clientSize /
        scrollSize;

      const thumbSize =
        Math.max(
          clientSize *
            ratio,
          38
        );

      const maxThumbPosition =
        Math.max(
          clientSize -
            thumbSize,
          0
        );

      const maxScroll =
        Math.max(
          scrollSize -
            clientSize,
          1
        );

      const thumbPosition =
        (scrollPosition /
          maxScroll) *
        maxThumbPosition;

      setMetrics({
        hasOverflow: true,
        thumbSize,
        thumbPosition
      });
    }, [
      direction
    ]);

  useEffect(() => {
    const viewport =
      viewportRef.current;

    if (!viewport) {
      return;
    }

    updateMetrics();

    const observer =
      new ResizeObserver(
        updateMetrics
      );

    observer.observe(
      viewport
    );

    const content =
      viewport
        .firstElementChild;

    if (content) {
      observer.observe(
        content
      );
    }

    viewport.addEventListener(
      "scroll",
      updateMetrics,
      {
        passive: true
      }
    );

    window.addEventListener(
      "resize",
      updateMetrics
    );

    return () => {
      observer.disconnect();

      viewport.removeEventListener(
        "scroll",
        updateMetrics
      );

      window.removeEventListener(
        "resize",
        updateMetrics
      );
    };
  }, [
    updateMetrics,
    children
  ]);

  const handleThumbPointerDown =
    (event) => {
      const viewport =
        viewportRef.current;

      if (
        !viewport ||
        !metrics.hasOverflow
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      draggingRef.current =
        true;

      dragStartRef.current = {
        pointer:
          direction ===
          "horizontal"
            ? event.clientX
            : event.clientY,
        scroll:
          direction ===
          "horizontal"
            ? viewport.scrollLeft
            : viewport.scrollTop
      };

      const handleMove =
        (moveEvent) => {
          if (
            !draggingRef.current
          ) {
            return;
          }

          if (
            direction ===
            "horizontal"
          ) {
            const delta =
              moveEvent.clientX -
              dragStartRef.current
                .pointer;

            const trackSize =
              viewport.clientWidth;

            const movableTrack =
              Math.max(
                trackSize -
                  metrics.thumbSize,
                1
              );

            const maxScroll =
              Math.max(
                viewport.scrollWidth -
                  viewport.clientWidth,
                0
              );

            viewport.scrollLeft =
              dragStartRef.current
                .scroll +
              (delta /
                movableTrack) *
                maxScroll;

            return;
          }

          const delta =
            moveEvent.clientY -
            dragStartRef.current
              .pointer;

          const trackSize =
            viewport.clientHeight;

          const movableTrack =
            Math.max(
              trackSize -
                metrics.thumbSize,
              1
            );

          const maxScroll =
            Math.max(
              viewport.scrollHeight -
                viewport.clientHeight,
              0
            );

          viewport.scrollTop =
            dragStartRef.current
              .scroll +
            (delta /
              movableTrack) *
              maxScroll;
        };

      const handleUp =
        () => {
          draggingRef.current =
            false;

          window.removeEventListener(
            "pointermove",
            handleMove
          );

          window.removeEventListener(
            "pointerup",
            handleUp
          );
        };

      window.addEventListener(
        "pointermove",
        handleMove
      );

      window.addEventListener(
        "pointerup",
        handleUp
      );
    };

  return (
    <div
      className={`hover-scroll-shell hover-scroll-${direction} ${className}`}
      onMouseEnter={() => {
        setHovered(true);
        updateMetrics();
      }}
      onMouseLeave={() => {
        if (
          !draggingRef.current
        ) {
          setHovered(false);
        }
      }}
    >
      <div
        ref={viewportRef}
        className="hover-scroll-viewport"
      >
        {children}
      </div>

      {metrics.hasOverflow && (
        <div
          className={`hover-scroll-track ${
            hovered
              ? "visible"
              : ""
          }`}
        >
          <div
            className="hover-scroll-thumb"
            onPointerDown={
              handleThumbPointerDown
            }
            style={
              direction ===
              "horizontal"
                ? {
                    width:
                      `${metrics.thumbSize}px`,
                    transform:
                      `translateX(${metrics.thumbPosition}px)`
                  }
                : {
                    height:
                      `${metrics.thumbSize}px`,
                    transform:
                      `translateY(${metrics.thumbPosition}px)`
                  }
            }
          />
        </div>
      )}
    </div>
  );
}