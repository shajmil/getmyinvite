/**
 * Compresses an image file on the client side using Canvas API.
 * Converts to WebP format with controlled dimensions and quality.
 */
export async function compressImage(
  file: File,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      if (!e.target?.result) {
        reject(new Error("Failed to read file"));
        return;
      }
      img.src = e.target.result as string;
    };

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Maintain aspect ratio while resizing
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas 2D context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to convert canvas to blob"));
          }
        },
        "image/webp",
        quality
      );
    };

    img.onerror = (err) => reject(err);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Perform a file upload (presigned url request then upload chunk).
 * Accepts File or Blob.
 */
export async function uploadFile(
  file: File | Blob,
  onProgress?: (percent: number) => void,
  customFilename?: string
): Promise<{ url: string; key: string }> {
  // Compress first if it's a raw non-WebP image File
  let uploadData: Blob = file;
  let uploadType = file.type || "image/webp";
  let uploadName = customFilename || (file instanceof File ? file.name : `cropped-${Date.now()}.webp`);

  if (file instanceof File && file.type.startsWith("image/") && file.type !== "image/gif" && file.type !== "image/webp") {
    try {
      uploadData = await compressImage(file);
      uploadType = "image/webp";
      uploadName = uploadName.replace(/\.[^/.]+$/, "") + ".webp";
    } catch (err) {
      console.warn("Client compression failed, uploading raw image", err);
    }
  }

  // 1. Ask for presigned URL
  const presignedRes = await fetch("/api/uploads/presigned", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: uploadName,
      contentType: uploadType,
      size: uploadData.size,
    }),
  });

  const presignedData = await presignedRes.json();
  if (!presignedRes.ok) {
    throw new Error(presignedData.error || "Failed to initiate upload");
  }

  const { uploadUrl, publicUrl, key } = presignedData;

  // 2. Perform the upload
  const xhr = new XMLHttpRequest();
  
  return new Promise((resolve, reject) => {
    xhr.open(presignedData.isLocal ? "POST" : "PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", uploadType);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ url: publicUrl, key });
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network upload error"));
    xhr.send(uploadData);
  });
}
