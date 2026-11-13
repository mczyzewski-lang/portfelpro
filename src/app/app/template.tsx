/** Każde przejście między ekranami panelu ma krótkie, płynne wejście (wyłączane przez prefers-reduced-motion). */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
