export function OsdOverlay({ message }: { message: string | null }) {
  return <div className="status-position" role="status">{message && <span className="status-message">{message}</span>}</div>;
}
