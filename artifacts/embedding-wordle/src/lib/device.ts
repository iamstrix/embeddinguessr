export function getDeviceId(): string {
  const KEY = "ew_device_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = "dev_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem(KEY, id);
  }
  return id;
}
