import { useState, useCallback, useEffect } from "react";

interface FsDocument extends HTMLDocument {
  mozFullScreenElement?: Element;
  msFullscreenElement?: Element;
  webkitFullscreenElement?: Element;
  msExitFullscreen?: () => void;
  mozCancelFullScreen?: () => void;
  webkitExitFullscreen?: () => void;
}

interface FsDocumentElement extends HTMLElement {
  msRequestFullscreen?: () => void;
  mozRequestFullScreen?: () => void;
  webkitRequestFullscreen?: () => void;
}

export function checkFullScreen(): boolean {
  const fsDoc = document as FsDocument;
  return !!(fsDoc.fullscreenElement || fsDoc.mozFullScreenElement || fsDoc.webkitFullscreenElement || fsDoc.msFullscreenElement);
}

export default function useFullscreen() {
  const [isFullScreen, setIsFullScreen] = useState<boolean>(checkFullScreen);

  const handleFullscreenChange = useCallback(() => {
    setIsFullScreen(checkFullScreen());
  }, []);

  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, [handleFullscreenChange]);

  const toggle = useCallback(() => {
    const fsDoc = document as FsDocument;

    if (checkFullScreen()) {
      if (fsDoc.exitFullscreen) {
        fsDoc.exitFullscreen();
      } else if (fsDoc.mozCancelFullScreen) {
        fsDoc.mozCancelFullScreen();
      } else if (fsDoc.webkitExitFullscreen) {
        fsDoc.webkitExitFullscreen();
      } else if (fsDoc.msExitFullscreen) {
        fsDoc.msExitFullscreen();
      }
    } else {
      const element = document.documentElement as FsDocumentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    }
  }, []);

  return [isFullScreen, toggle] as const;
}
