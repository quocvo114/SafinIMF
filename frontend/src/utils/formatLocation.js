export function formatLocationDisplay(loc) {
  if (!loc) return "Chưa có vị trí";
  const match = loc.match(/\(([^)]+)\)/);
  if (match && match[1]) {
    const inside = match[1].trim();
    if (!/^[\d.-]+,\s*[\d.-]+$/.test(inside)) {
      return inside;
    }
  }
  if (/^[\d.-]+,\s*[\d.-]+$/.test(loc.trim())) {
    return "Chưa cập nhật địa chỉ cụ thể";
  }
  return loc;
}
