const sequelize = require('./db');
const User = require('./models/User');

(async () => {
  try {
    await sequelize.sync();

    const admin = await User.create({
      username: 'admin1',     // ndrysho nëse do tjetër emër
      password: 'admin123',   // ndrysho fjalëkalimin
      role: 'admin'
    });

    console.log('✅ Admin u shtua me sukses:', admin.username);
  } catch (error) {
    console.error('❌ Gabim gjatë shtimit të admin:', error);
  } finally {
    process.exit();
  }
})();
