/**
 * NIIMBOT protocol helpers for:
 * - reading battery/firmware after a GATT session is open
 * - silent reconnect via navigator.bluetooth.getDevices()
 *
 * Based on the same frame/opcodes used by niimbot-web-bluetooth.
 */

import type { NiimbotPersistedPrinter } from '@/services/niimbot/types'

export const NIIMBOT_SVC_UUID = 'e7810a71-73ae-499d-8c15-faa9aef0c3f2'
export const NIIMBOT_CHAR_UUID = 'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f'

const INFO_MODEL = 0x08
const INFO_SOFTWARE = 0x09
const INFO_BATTERY = 0x0a

const MODEL_IDS: Record<number, { label: string; task: 'b1' | 'v4'; dpi: number }> = {
  4096: { label: 'Niimbot B1', task: 'b1', dpi: 203 },
  4097: { label: 'Niimbot B1 Pro', task: 'v4', dpi: 300 },
  4098: { label: 'Niimbot B1 SE', task: 'b1', dpi: 203 },
  4608: { label: 'Niimbot M2-H', task: 'b1', dpi: 300 },
}

const BATTERY_LEVEL_MAP: Record<number, number> = {
  0: 0,
  1: 25,
  2: 50,
  3: 75,
  4: 100,
}

export interface NiimbotSessionInfo {
  model: string
  name: string
  modelId: number | null
  protocolVersion: number | null
  dpi: number | null
  batteryPercent: number | null
  firmware: string | null
  bluetoothDeviceId: string | null
  device: BluetoothDevice
}

function pack(cmd: number, data: number[]): Uint8Array<ArrayBuffer> {
  const pkt = new Uint8Array(7 + data.length)
  pkt[0] = 0x55
  pkt[1] = 0x55
  pkt[2] = cmd
  pkt[3] = data.length
  let crc = cmd ^ data.length
  for (let i = 0; i < data.length; i += 1) {
    pkt[4 + i] = data[i] ?? 0
    crc ^= data[i] ?? 0
  }
  pkt[4 + data.length] = crc & 0xff
  pkt[5 + data.length] = 0xaa
  pkt[6 + data.length] = 0xaa
  return pkt
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function writePacket(
  characteristic: BluetoothRemoteGATTCharacteristic,
  bytes: Uint8Array<ArrayBuffer>,
): Promise<void> {
  try {
    await characteristic.writeValueWithoutResponse(bytes)
  } catch {
    await characteristic.writeValueWithResponse(bytes)
  }
}

async function sendWait(
  characteristic: BluetoothRemoteGATTCharacteristic,
  cmd: number,
  data: number[],
  expectCmd: number | null,
  timeoutMs: number,
): Promise<{ cmd: number; data: number[] } | null> {
  return new Promise((resolve) => {
    let settled = false
    const timer = window.setTimeout(() => {
      if (!settled) {
        settled = true
        characteristic.removeEventListener('characteristicvaluechanged', onValue)
        resolve(null)
      }
    }, timeoutMs)

    const onValue = (event: Event) => {
      const target = event.target as BluetoothRemoteGATTCharacteristic
      const view = target.value
      if (!view || view.byteLength < 7) {
        return
      }
      if (view.getUint8(0) !== 0x55 || view.getUint8(1) !== 0x55) {
        return
      }
      const responseCmd = view.getUint8(2)
      if (expectCmd != null && responseCmd !== expectCmd) {
        return
      }
      const len = view.getUint8(3)
      const payload: number[] = []
      for (let i = 0; i < len && 4 + i < view.byteLength; i += 1) {
        payload.push(view.getUint8(4 + i))
      }
      if (!settled) {
        settled = true
        window.clearTimeout(timer)
        characteristic.removeEventListener('characteristicvaluechanged', onValue)
        resolve({ cmd: responseCmd, data: payload })
      }
    }

    characteristic.addEventListener('characteristicvaluechanged', onValue)
    void writePacket(characteristic, pack(cmd, data)).catch(() => {
      if (!settled) {
        settled = true
        window.clearTimeout(timer)
        characteristic.removeEventListener('characteristicvaluechanged', onValue)
        resolve(null)
      }
    })
  })
}

function decodeBattery(data: number[] | null): number | null {
  if (!data || data.length === 0) {
    return null
  }
  const raw = data[0] ?? 0
  if (raw in BATTERY_LEVEL_MAP) {
    return BATTERY_LEVEL_MAP[raw] ?? null
  }
  if (raw > 4 && raw <= 100) {
    return raw
  }
  return null
}

function decodeFirmware(data: number[] | null): string | null {
  if (!data || data.length === 0) {
    return null
  }
  if (data.length >= 2) {
    const major = data[0] ?? 0
    const minor = data[1] ?? 0
    return `${major}.${String(minor).padStart(2, '0')}`
  }
  return String(data[0])
}

export async function listPermittedNiimbotDevices(): Promise<BluetoothDevice[]> {
  if (!navigator.bluetooth?.getDevices) {
    return []
  }
  try {
    const devices = await navigator.bluetooth.getDevices()
    return devices.filter((device) => {
      const name = device.name ?? ''
      return (
        name.startsWith('B1') ||
        name.startsWith('M2') ||
        name.startsWith('D1') ||
        name.startsWith('B2')
      )
    })
  } catch {
    return []
  }
}

export async function findConnectedNiimbotDevice(): Promise<BluetoothDevice | null> {
  const devices = await listPermittedNiimbotDevices()
  return devices.find((device) => Boolean(device.gatt?.connected)) ?? null
}

export async function resolveBluetoothDeviceId(
  preferredName?: string | null,
): Promise<string | null> {
  const devices = await listPermittedNiimbotDevices()
  const connected =
    devices.find((device) => device.gatt?.connected && (!preferredName || device.name === preferredName)) ??
    devices.find((device) => device.gatt?.connected) ??
    devices.find((device) => preferredName && device.name === preferredName) ??
    devices[0]
  return connected?.id ?? null
}

async function openSession(device: BluetoothDevice): Promise<{
  device: BluetoothDevice
  characteristic: BluetoothRemoteGATTCharacteristic
}> {
  if (!device.gatt) {
    throw new Error('Dispositivo Bluetooth sem suporte GATT.')
  }

  const server = device.gatt.connected ? device.gatt : await device.gatt.connect()
  const service = await server.getPrimaryService(NIIMBOT_SVC_UUID)
  const characteristic = await service.getCharacteristic(NIIMBOT_CHAR_UUID)

  try {
    await characteristic.startNotifications()
  } catch {
    // Already notifying.
  }

  // Initial connection packet (same as niimbot-web-bluetooth).
  await writePacket(
    characteristic,
    new Uint8Array([0x03, 0x55, 0x55, 0xc1, 0x01, 0x01, 0xc1, 0xaa, 0xaa]),
  )
  await sleep(200)

  return { device, characteristic }
}

async function identifyOnCharacteristic(
  device: BluetoothDevice,
  characteristic: BluetoothRemoteGATTCharacteristic,
): Promise<NiimbotSessionInfo> {
  let protocolVersion: number | null = null
  let modelId: number | null = null

  const status = await sendWait(characteristic, 0xa5, [0x01], 0xb5, 1000)
  if (status && status.data.length >= 13) {
    const n = (status.data[11] ?? 0) * 100 + (status.data[12] ?? 0)
    protocolVersion = n >= 204 && n < 300 ? 3 : n >= 302 ? 5 : n >= 300 ? 4 : 0
  }

  const modelResp = await sendWait(characteristic, 0x40, [INFO_MODEL], 0x48, 1000)
  if (modelResp && modelResp.data.length >= 1) {
    modelId =
      modelResp.data.length >= 2
        ? ((modelResp.data[0] ?? 0) << 8) | (modelResp.data[1] ?? 0)
        : (modelResp.data[0] ?? 0) << 8
  }

  const meta = modelId != null ? MODEL_IDS[modelId] : undefined
  if (meta?.task === 'b1') {
    await sendWait(characteristic, 0xa5, [0x01], 0xb5, 800)
    for (const sub of [0x08, 0x0b, 0x0d, 0x0a, 0x07, 0x03, 0x0c, 0x09]) {
      await sendWait(characteristic, 0x40, [sub], null, 500)
    }
    await sendWait(characteristic, 0xdc, [0x04], 0xd9, 800)
  }

  await sleep(40)
  const batteryData = await sendWait(characteristic, 0x40, [INFO_BATTERY], null, 800)
  await sleep(40)
  const firmwareData = await sendWait(characteristic, 0x40, [INFO_SOFTWARE], null, 800)

  return {
    model: meta?.label ?? (modelId != null ? `NIIMBOT (id ${modelId})` : 'NIIMBOT'),
    name: device.name?.trim() || 'Impressora NIIMBOT',
    modelId,
    protocolVersion,
    dpi: meta?.dpi ?? null,
    batteryPercent: decodeBattery(batteryData?.data ?? null),
    firmware: decodeFirmware(firmwareData?.data ?? null),
    bluetoothDeviceId: device.id,
    device,
  }
}

/**
 * Best-effort read of battery + firmware on an already-connected device.
 */
export async function readNiimbotExtendedInfo(): Promise<{
  batteryPercent: number | null
  firmware: string | null
}> {
  const empty = { batteryPercent: null, firmware: null }
  const device = await findConnectedNiimbotDevice()
  if (!device?.gatt?.connected) {
    return empty
  }

  try {
    const service = await device.gatt.getPrimaryService(NIIMBOT_SVC_UUID)
    const characteristic = await service.getCharacteristic(NIIMBOT_CHAR_UUID)
    try {
      await characteristic.startNotifications()
    } catch {
      // already active
    }
    await sleep(40)
    const battery = await sendWait(characteristic, 0x40, [INFO_BATTERY], null, 800)
    await sleep(40)
    const firmware = await sendWait(characteristic, 0x40, [INFO_SOFTWARE], null, 800)
    return {
      batteryPercent: decodeBattery(battery?.data ?? null),
      firmware: decodeFirmware(firmware?.data ?? null),
    }
  } catch {
    return empty
  }
}

export async function attachNiimbotDisconnectListener(
  onDisconnected: () => void,
  device?: BluetoothDevice | null,
): Promise<() => void> {
  const target = device ?? (await findConnectedNiimbotDevice())
  if (!target) {
    return () => undefined
  }

  const handler = () => {
    onDisconnected()
  }
  target.addEventListener('gattserverdisconnected', handler)
  return () => {
    target.removeEventListener('gattserverdisconnected', handler)
  }
}

/**
 * Finds an already-permitted BluetoothDevice for a saved printer (no chooser).
 */
export async function resolvePermittedNiimbotDevice(
  saved: Pick<NiimbotPersistedPrinter, 'name' | 'bluetoothDeviceId'>,
): Promise<BluetoothDevice> {
  const devices = await listPermittedNiimbotDevices()
  if (devices.length === 0) {
    throw new Error('NO_PERMITTED_DEVICE')
  }

  const device =
    (saved.bluetoothDeviceId
      ? devices.find((entry) => entry.id === saved.bluetoothDeviceId)
      : undefined) ??
    devices.find((entry) => entry.name === saved.name) ??
    devices[0]

  if (!device) {
    throw new Error('NO_PERMITTED_DEVICE')
  }

  return device
}

/**
 * Silent reconnect to a previously permitted printer (no chooser UI).
 * Requires Chrome getDevices() permission persistence.
 *
 * Prefer handing the device to the driver via `withPermittedBluetoothDevice`
 * so print jobs share the same GATT session.
 */
export async function reconnectSavedNiimbotDevice(
  saved: NiimbotPersistedPrinter,
): Promise<NiimbotSessionInfo> {
  const device = await resolvePermittedNiimbotDevice(saved)

  // Best-effort presence scan (may require experimental flags).
  try {
    if ('watchAdvertisements' in device && typeof device.watchAdvertisements === 'function') {
      await Promise.race([
        new Promise<void>((resolve, reject) => {
          const controller = new AbortController()
          const onAd = () => {
            controller.abort()
            resolve()
          }
          device.addEventListener('advertisementreceived', onAd, { once: true })
          void device.watchAdvertisements({ signal: controller.signal }).catch(reject)
          window.setTimeout(() => {
            controller.abort()
            resolve()
          }, 4000)
        }),
        sleep(4000),
      ])
    }
  } catch {
    // Ignore — proceed to direct GATT connect.
  }

  const session = await openSession(device)
  return identifyOnCharacteristic(session.device, session.characteristic)
}

export async function disconnectBluetoothDevice(device?: BluetoothDevice | null): Promise<void> {
  try {
    const target = device ?? (await findConnectedNiimbotDevice())
    if (target?.gatt?.connected) {
      target.gatt.disconnect()
    }
  } catch {
    // already gone
  }
}
