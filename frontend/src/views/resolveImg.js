export default function resolveImg(src) {
  if (!src) return "/static/fallback.jpg";
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/")) {
    return src;
  }
  return `/${src.replace(/^\/?/, "")}`; // ensure one leading slash
}
