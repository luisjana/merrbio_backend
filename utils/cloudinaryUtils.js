const { cloudinary } = require('../cloudinaryConfig');


async function deleteImageFromCloudinary(imageUrl) {
  try {
    const parts = imageUrl.split('/');
    const fileName = parts[parts.length - 1];
    const publicId = `merrbio-products/${fileName.split('.')[0]}`;

    await cloudinary.uploader.destroy(publicId);
    console.log(`✅ Image ${publicId} deleted from Cloudinary`);
  } catch (err) {
    console.error('❌ Error deleting image from Cloudinary:', err);
  }
}

module.exports = { deleteImageFromCloudinary };
