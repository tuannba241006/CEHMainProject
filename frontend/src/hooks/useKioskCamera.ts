import { useEffect, useRef, useState } from "react"
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser"

export const kioskQrPattern = /^CEH1K\.([1-9][0-9]*)\.([0-9]{6})$/

type CameraState = "idle" | "requesting" | "active" | "denied" | "unavailable"

export function useKioskCamera(onCode: (code: string) => void) {
  const [cameraState, setCameraState] = useState<CameraState>("idle")
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const requestRef = useRef<symbol | null>(null)
  const onCodeRef = useRef(onCode)

  useEffect(() => {
    onCodeRef.current = onCode
  }, [onCode])

  useEffect(() => () => {
    requestRef.current = null
    controlsRef.current?.stop()
  }, [])

  function stopCamera() {
    requestRef.current = null
    controlsRef.current?.stop()
    controlsRef.current = null
    setCameraState("idle")
  }

  async function startCamera() {
    const video = videoRef.current
    if (!video || requestRef.current) return

    const request = Symbol()
    requestRef.current = request
    setCameraState("requesting")

    try {
      const reader = new BrowserQRCodeReader()
      const controls = await reader.decodeFromConstraints(
        { audio: false, video: { facingMode: { ideal: "environment" } } },
        video,
        (result, _error, scanner) => {
          const code = result?.getText()
          if (requestRef.current !== request || !code || !kioskQrPattern.test(code)) return

          // A scan consumes this camera session, even if the request fails.
          requestRef.current = null
          controlsRef.current = null
          scanner.stop()
          setCameraState("idle")
          onCodeRef.current(code)
        },
      )
      if (requestRef.current !== request) {
        controls.stop()
        return
      }
      controlsRef.current = controls
      setCameraState("active")
    } catch (error) {
      if (requestRef.current !== request) return
      requestRef.current = null
      setCameraState(
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "denied"
          : "unavailable",
      )
    }
  }

  return { cameraState, videoRef, startCamera, stopCamera }
}
