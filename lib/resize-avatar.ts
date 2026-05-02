/**
 * Browser-only: downscale image for storing as data URL on User.avatarUrl (Mongo string field).
 */
export async function resizeImageFileToJpegDataUrl(
  file: File,
  opts?: { maxSide?: number; maxBytes?: number }
): Promise<string> {
  const maxSide = opts?.maxSide ?? 384
  const maxBytes = opts?.maxBytes ?? 420_000

  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file (PNG or JPEG).')
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      try {
        let q = 0.88
        let width = img.naturalWidth || img.width
        let height = img.naturalHeight || img.height
        if (!width || !height) {
          reject(new Error('Could not read image dimensions.'))
          return
        }
        const scale = Math.min(1, maxSide / Math.max(width, height))
        const w = Math.max(1, Math.round(width * scale))
        const h = Math.max(1, Math.round(height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Your browser cannot process this image.'))
          return
        }
        ctx.drawImage(img, 0, 0, w, h)

        let dataUrl = canvas.toDataURL('image/jpeg', q)
        while (dataUrl.length > maxBytes && q > 0.45) {
          q -= 0.07
          dataUrl = canvas.toDataURL('image/jpeg', q)
        }
        if (dataUrl.length > maxBytes) {
          reject(new Error('Image is still too large. Try a smaller file.'))
          return
        }
        resolve(dataUrl)
      } catch (e) {
        reject(e instanceof Error ? e : new Error('Could not process image.'))
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not load this image.'))
    }
    img.src = objectUrl
  })
}
