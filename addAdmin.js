const sequelize = require('./db');
const User = require('./models/User');

(async () => {
  try {
    await sequelize.sync();

    const existingAdmin = await User.findOne({ where: { username: 'admin1' } });

    if (existingAdmin) {
      console.log('⚠️ Admin ekziston tashmë:', existingAdmin.username);
    } else {
      const username = 'admin1';
      const rawPassword = 'admin123';

      const admin = await User.create({
        username,
        password: rawPassword,  // ruaj plaintext (kujdes!)
        role: 'admin',
      });

      console.log('✅ Admin u shtua me sukses:', admin.username);
      console.log(`ℹ️ Username: ${username}, Password: ${rawPassword}`);
    }
  } catch (error) {
    console.error('❌ Gabim gjatë shtimit të admin:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
})();
