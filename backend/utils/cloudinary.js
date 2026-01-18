import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'

dotenv.config()

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

/**
 * Upload an image to Cloudinary
 * @param {string} filePath - Path to the file or base64 data URI
 * @param {object} options - Upload options
 * @returns {Promise<object>} - Cloudinary upload result
 */
export const uploadImage = async (filePath, options = {}) => {
    try {
        const defaultOptions = {
            folder: 'legalnexus/verification',
            resource_type: 'image',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            max_bytes: 5 * 1024 * 1024, // 5MB limit
            transformation: [
                { width: 1200, height: 1200, crop: 'limit' },
                { quality: 'auto:good' }
            ]
        }

        const result = await cloudinary.uploader.upload(filePath, {
            ...defaultOptions,
            ...options
        })

        return {
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height
        }
    } catch (error) {
        console.error('Cloudinary upload error:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - The public ID of the image
 * @returns {Promise<object>} - Deletion result
 */
export const deleteImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId)
        return {
            success: result.result === 'ok',
            result: result.result
        }
    } catch (error) {
        console.error('Cloudinary delete error:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Get optimized URL for an image
 * @param {string} publicId - The public ID of the image
 * @param {object} transformations - Transformation options
 * @returns {string} - Optimized URL
 */
export const getOptimizedUrl = (publicId, transformations = {}) => {
    return cloudinary.url(publicId, {
        secure: true,
        transformation: [
            { quality: 'auto', fetch_format: 'auto' },
            ...Object.entries(transformations).map(([key, value]) => ({ [key]: value }))
        ]
    })
}

export default cloudinary
