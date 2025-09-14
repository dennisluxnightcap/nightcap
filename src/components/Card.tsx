import { ReactNode } from "react";

export default function Card({
  title,
  children,
}: {
  title?: string;               // ← optional now
  children: ReactNode;
}) {
  return (
    <section className="card">
      {title && <h2>{title}</h2>}   {/* ← only renders if truthy */}
      <div className="card-body">{children}</div>
    </section>
  );
}
