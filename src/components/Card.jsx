export default function Card({ title, children, className = "" }) {
  return (
    <section className={`dashboard-card ${className}`}>
      {title && <h2 className="card-title">{title}</h2>}
      {children}
    </section>
  );
}