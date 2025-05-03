const sequelize = require('./db');
const User = require('./models/User');
const bcrypt = require('bcrypt');

(async () => {
  try {
    await sequelize.sync();

    const existingAdmin = await User.findOne({ where: { username: 'admin1' } });

    if (existingAdmin) {
      console.log('⚠️  Admin ekziston tashmë:', existingAdmin.username);
    } else {
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      const admin = await User.create({
        username: 'admin1',
        password: hashedPassword,
        role: 'admin'
      });

      console.log('✅ Admin u shtua me sukses:', admin.username, '-', admin.role);
    }
  } catch (error) {
    console.error('❌ Gabim gjatë shtimit të admin:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
})();
