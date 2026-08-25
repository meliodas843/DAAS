export default function ChartScroll({
  children,
  minWidth = 700,
  height = 340,
  contentHeight,
  className = ""
}) {
  const finalHeight =
    contentHeight || height;

  return (
    <div
      className={`chart-scroll ${className}`}
      style={{
        height: `${height}px`
      }}
    >
      <div
        className="chart-scroll-content"
        style={{
          minWidth: `${minWidth}px`,
          height: `${finalHeight}px`
        }}
      >
        {children}
      </div>
    </div>
  );
}