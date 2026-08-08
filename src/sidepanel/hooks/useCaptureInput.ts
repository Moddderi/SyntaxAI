import { useCallback, useEffect, useRef, useState, type ClipboardEvent, type DragEvent } from 'react';
import type { PastedImage } from '../types/capture.types';
import { MAX_CAPTURE_IMAGES } from '../types/capture.types';

interface UseCaptureInputResult {
  text: string;
  setText: (value: string) => void;
  pastedImages: PastedImage[];
  removeImage: (id: string) => void;
  reset: () => void;
  clearImages: () => void;
  isDragging: boolean;
  handleDragOver: (event: DragEvent<HTMLElement>) => void;
  handleDragLeave: (event: DragEvent<HTMLElement>) => void;
  handleDrop: (event: DragEvent<HTMLElement>) => void;
  handlePaste: (event: ClipboardEvent<HTMLElement>) => void;
}

function createImageId(): string {
  return crypto.randomUUID();
}

function extractImageFiles(dataTransfer: DataTransfer): File[] {
  return Array.from(dataTransfer.files).filter((file) =>
    file.type.startsWith('image/'),
  );
}

function extractClipboardImageFiles(clipboardData: DataTransfer): File[] {
  const pastedFiles = Array.from(clipboardData.files).filter((file) =>
    file.type.startsWith('image/'),
  );

  if (pastedFiles.length > 0) {
    return pastedFiles;
  }

  return Array.from(clipboardData.items)
    .filter((item) => item.type.startsWith('image/'))
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null);
}

function createPastedImage(file: File): PastedImage {
  return {
    id: createImageId(),
    file,
    previewUrl: URL.createObjectURL(file),
  };
}

export function useCaptureInput(): UseCaptureInputResult {
  const [text, setText] = useState('');
  const [pastedImages, setPastedImages] = useState<PastedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const pastedImagesRef = useRef(pastedImages);

  pastedImagesRef.current = pastedImages;

  const applyImageFiles = useCallback((files: File[]) => {
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      return;
    }

    setPastedImages((previous) => {
      const remainingSlots = MAX_CAPTURE_IMAGES - previous.length;

      if (remainingSlots <= 0) {
        return previous;
      }

      return [
        ...previous,
        ...imageFiles.slice(0, remainingSlots).map((file) => createPastedImage(file)),
      ];
    });
  }, []);

  const removeImage = useCallback((id: string) => {
    setPastedImages((previous) => {
      const target = previous.find((image) => image.id === id);

      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return previous.filter((image) => image.id !== id);
    });
  }, []);

  const reset = useCallback(() => {
    setText('');
    setPastedImages((previous) => {
      previous.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
      });
      return [];
    });
    setIsDragging(false);
  }, []);

  const clearImages = useCallback(() => {
    setPastedImages((previous) => {
      previous.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
      });
      return [];
    });
    setIsDragging(false);
  }, []);

  useEffect(() => {
    return () => {
      pastedImagesRef.current.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
      });
    };
  }, []);

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      setIsDragging(true);
    },
    [],
  );

  const handleDragLeave = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();

      if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
        return;
      }

      setIsDragging(false);
    },
    [],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      setIsDragging(false);
      applyImageFiles(extractImageFiles(event.dataTransfer));
    },
    [applyImageFiles],
  );

  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLElement>) => {
      const imageFiles = extractClipboardImageFiles(event.clipboardData);

      if (imageFiles.length === 0) {
        return;
      }

      event.preventDefault();
      applyImageFiles(imageFiles);
    },
    [applyImageFiles],
  );

  return {
    text,
    setText,
    pastedImages,
    removeImage,
    reset,
    clearImages,
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handlePaste,
  };
}
