"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type BarcodeResult = {
  rawValue: string;
};

type BarcodeDetectorInstance = {
  detect(source: CanvasImageSource): Promise<BarcodeResult[]>;
};

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorInstance;

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

type Props = {
  onDetected: (value: string) => void;
};

export default function CameraQrScanner({
  onDetected,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);

  const [scanning, setScanning] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(
    null,
  );
  const [error, setError] = useState("");

  const stopScanner = useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanning(false);
  }, []);

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
        typeof window.BarcodeDetector !== "undefined",
    );

    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  async function startScanner() {
    if (!window.BarcodeDetector) {
      setSupported(false);
      return;
    }

    setError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: "environment",
          },
        },
        audio: false,
      });

      streamRef.current = stream;

      const video = videoRef.current;

      if (!video) {
        throw new Error("Camera preview is unavailable.");
      }

      video.srcObject = stream;
      await video.play();

      const detector = new window.BarcodeDetector({
        formats: ["qr_code"],
      });

      setScanning(true);

      const scanFrame = async () => {
        const activeVideo = videoRef.current;

        if (
          !activeVideo ||
          !streamRef.current ||
          activeVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
        ) {
          frameRef.current =
            window.requestAnimationFrame(scanFrame);
          return;
        }

        try {
          const results = await detector.detect(activeVideo);

          const value = results[0]?.rawValue?.trim();

          if (value) {
            stopScanner();
            onDetected(value);
            return;
          }
        } catch {
          // Some browsers intermittently fail while the camera is
          // focusing. Continue scanning until stopped by the user.
        }

        frameRef.current =
          window.requestAnimationFrame(scanFrame);
      };

      frameRef.current =
        window.requestAnimationFrame(scanFrame);
    } catch (err) {
      stopScanner();

      setError(
        err instanceof Error
          ? err.message
          : "Unable to access the camera.",
      );
    }
  }

  return (
    <div className="camera-scanner">
      <div className="camera-scanner-preview">
        <video
          aria-label="QR scanner camera preview"
          muted
          playsInline
          ref={videoRef}
        />

        {!scanning && (
          <div className="camera-scanner-placeholder">
            Camera preview
          </div>
        )}
      </div>

      {supported === false && (
        <p className="muted">
          Camera QR scanning is not supported by this browser.
          Enter the token manually instead.
        </p>
      )}

      {error && <p className="error">{error}</p>}

      <div className="actions">
        {!scanning ? (
          <button
            disabled={supported === false}
            onClick={() => void startScanner()}
            type="button"
          >
            Start Camera Scanner
          </button>
        ) : (
          <button
            className="secondary"
            onClick={stopScanner}
            type="button"
          >
            Stop Camera
          </button>
        )}
      </div>
    </div>
  );
}
