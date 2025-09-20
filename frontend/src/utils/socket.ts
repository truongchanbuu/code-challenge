export function computeSocketBase() {
  const explicit = import.meta.env.VITE_SOCKET_URL?.replace(
    /\/socket\.io.*$/,
    "",
  );
  if (explicit) return explicit;
  const base = import.meta.env.VITE_API_BASE_URL;
  return base ? base.replace(/\/api\/?$/, "") : "/";
}
