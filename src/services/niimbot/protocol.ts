/**
 * Minimal NIIMBOT protocol helpers for reading PrinterInfo after the
 * niimbot-web-bluetooth driver has already opened the GATT connection.
 *
 * Subcodes follow niimbluelib PrinterInfoType:
 * SoftWareVersion = 9, BatteryChargeLevel = 10.
 */

const SVC_UUID = 'e7810a71-73ae-499d-8c15-faa9aef0c3f2'
const CHAR_UUID = 'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f'

const INFO_SOFTWARE = 0x09
const INFO_BATTERY = 0x0a

const BATTERY_LEVEL_MAP: Record<number, number> = {
  0: 0,
  1: 25,
  2: 50,
  3: 75,
  4: 100,
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

async function findConnectedNiimbotDevice(): Promise<BluetoothDevice | null> {
  if (!navigator.bluetooth?.getDevices) {
    return null
  }

  try {
    const devices = await navigator.bluetooth.getDevices()
    return (
      devices.find((device) => {
        const name = device.name ?? ''
        const connected = Boolean(device.gatt?.connected)
        return (
          connected &&
          (name.startsWith('B1') || name.startsWith('M2') || name.startsWith('D1') || name.startsWith('B2'))
        )
      }) ?? null
    )
  } catch {
    return null
  }
}

async function queryPrinterInfo(
  characteristic: BluetoothRemoteGATTCharacteristic,
  sub: number,
  timeoutMs = 800,
): Promise<number[] | null> {
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
      const len = view.getUint8(3)
      const data: number[] = []
      for (let i = 0; i < len && 4 + i < view.byteLength; i += 1) {
        data.push(view.getUint8(4 + i))
      }
      if (!settled) {
        settled = true
        window.clearTimeout(timer)
        characteristic.removeEventListener('characteristicvaluechanged', onValue)
        resolve(data)
      }
    }

    characteristic.addEventListener('characteristicvaluechanged', onValue)
    void characteristic
      .writeValueWithoutResponse(pack(0x40, [sub]))
      .catch(() => {
        void characteristic.writeValueWithResponse(pack(0x40, [sub])).catch(() => {
          if (!settled) {
            settled = true
            window.clearTimeout(timer)
            characteristic.removeEventListener('characteristicvaluechanged', onValue)
            resolve(null)
          }
        })
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

export interface NiimbotExtendedInfo {
  batteryPercent: number | null
  firmware: string | null
}

/**
 * Best-effort read of battery + firmware on the already-connected device.
 * Returns nulls when Web Bluetooth does not expose getDevices() or the printer
 * does not answer the PrinterInfo queries.
 */
export async function readNiimbotExtendedInfo(): Promise<NiimbotExtendedInfo> {
  const empty: NiimbotExtendedInfo = { batteryPercent: null, firmware: null }
  const device = await findConnectedNiimbotDevice()
  if (!device?.gatt?.connected) {
    return empty
  }

  try {
    const service = await device.gatt.getPrimaryService(SVC_UUID)
    const characteristic = await service.getCharacteristic(CHAR_UUID)
    try {
      await characteristic.startNotifications()
    } catch {
      // Notifications may already be active from niimbot-web-bluetooth.
    }

    await sleep(40)
    const batteryData = await queryPrinterInfo(characteristic, INFO_BATTERY)
    await sleep(40)
    const firmwareData = await queryPrinterInfo(characteristic, INFO_SOFTWARE)

    return {
      batteryPercent: decodeBattery(batteryData),
      firmware: decodeFirmware(firmwareData),
    }
  } catch {
    return empty
  }
}

export async function attachNiimbotDisconnectListener(
  onDisconnected: () => void,
): Promise<() => void> {
  const device = await findConnectedNiimbotDevice()
  if (!device) {
    return () => undefined
  }

  const handler = () => {
    onDisconnected()
  }
  device.addEventListener('gattserverdisconnected', handler)
  return () => {
    device.removeEventListener('gattserverdisconnected', handler)
  }
}
