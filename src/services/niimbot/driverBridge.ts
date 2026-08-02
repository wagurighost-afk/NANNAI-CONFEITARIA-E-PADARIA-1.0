/**
 * Bridge helpers around niimbot-web-bluetooth.
 *
 * The upstream driver always calls `navigator.bluetooth.requestDevice()`.
 * For silent reconnect / print without reopening the chooser, we temporarily
 * override `requestDevice` to return an already-permitted BluetoothDevice.
 */

export function getNiimbotDriver(): NonNullable<Window['Niimbot']> {
  const api = typeof window !== 'undefined' ? window.Niimbot : undefined
  if (!api) {
    throw new Error('Driver niimbot-web-bluetooth não carregado. Recarregue a página.')
  }
  return api
}

/**
 * True when the driver already holds a live GATT session (safe to printImage).
 * Heuristic: printer info present + a permitted device currently connected.
 */
export async function isDriverSessionLive(
  hasConnectedPermittedDevice: () => Promise<boolean>,
): Promise<boolean> {
  try {
    const driver = getNiimbotDriver()
    if (!driver.printer) {
      return false
    }
    return hasConnectedPermittedDevice()
  } catch {
    return false
  }
}

/**
 * Runs `fn` while `navigator.bluetooth.requestDevice` returns `device`.
 * Restores the original implementation afterward (success or failure).
 */
export async function withPermittedBluetoothDevice<T>(
  device: BluetoothDevice,
  fn: () => Promise<T>,
): Promise<T> {
  if (typeof navigator === 'undefined' || !navigator.bluetooth) {
    throw new Error('Web Bluetooth indisponível. Use Chrome ou Edge em HTTPS ou localhost.')
  }

  const bluetooth = navigator.bluetooth as Bluetooth & {
    requestDevice: (options?: RequestDeviceOptions) => Promise<BluetoothDevice>
  }
  const original = bluetooth.requestDevice.bind(bluetooth)

  bluetooth.requestDevice = async () => device
  try {
    return await fn()
  } finally {
    bluetooth.requestDevice = original
  }
}
