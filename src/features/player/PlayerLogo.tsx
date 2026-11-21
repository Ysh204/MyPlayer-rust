export function PlayerLogo({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="18" viewBox="0 0 276 316" aria-hidden="true" focusable="false">
      <use href="/myplayer-pro.svg#mark" width="276" height="316" />
    </svg>
  );
}
