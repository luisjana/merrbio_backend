const sequelize = require('./db');
const User = require('./models/User');
require('dotenv').config();

(async () => {
  try {
    await sequelize.sync();

    const existingAdmin = await User.findOne({ where: { username: process.env.ADMIN_USERNAME } });

    if (existingAdmin) {
      console.log('⚠️  Admin ekziston tashmë:', existingAdmin.username);
    } else {
      const admin = await User.create({
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD,
        role: process.env.ADMIN_ROLE
      });

      console.log('✅ Admin u shtua me sukses:', admin.username);
    }
  } catch (error) {
    console.error('❌ Gabim gjatë shtimit të admin:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
})();
