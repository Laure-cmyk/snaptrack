/**
 * Compresse une image en la redimensionnant et en réduisant sa qualité
 * @param {File} file - Le fichier image à compresser
 * @param {number} maxWidth - Largeur maximale de l'image
 * @param {number} maxHeight - Hauteur maximale de l'image
 * @param {number} quality - Qualité de compression (0-1)
 * @returns {Promise<string>} - L'image compressée en base64
 */
export function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (e) => {
            const img = new Image()

            img.onload = () => {
                const canvas = document.createElement('canvas')
                let width = img.width
                let height = img.height

                // Calculer les nouvelles dimensions en conservant le ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width
                        width = maxWidth
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height
                        height = maxHeight
                    }
                }

                canvas.width = width
                canvas.height = height

                const ctx = canvas.getContext('2d')
                ctx.drawImage(img, 0, 0, width, height)

                // Convertir en base64 avec compression
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
                resolve(compressedDataUrl)
            }

            img.onerror = () => {
                reject(new Error('Erreur lors du chargement de l\'image'))
            }

            img.src = e.target.result
        }

        reader.onerror = () => {
            reject(new Error('Erreur lors de la lecture du fichier'))
        }

        reader.readAsDataURL(file)
    })
}

/**
 * Calcule la taille approximative d'une chaîne base64 en Ko
 * @param {string} base64String - La chaîne base64
 * @returns {number} - La taille en Ko
 */
export function getBase64Size(base64String) {
    if (!base64String) return 0
    const sizeInBytes = (base64String.length * 3) / 4
    return Math.round(sizeInBytes / 1024)
}
