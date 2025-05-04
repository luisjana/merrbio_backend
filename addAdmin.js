// addAdmin.js
const sequelize = require('./db');
const User = require('./models/User');

(async () => {
  try {
    // Sigurohemi që databaza është gati dhe tabelat ekzistojnë
    await sequelize.sync();

    // Kontrollojmë nëse admin ekziston
    const existingAdmin = await User.findOne({ where: { username: 'admin1' } });

    if (existingAdmin) {
      console.log('⚠️  Admin ekziston tashmë:', existingAdmin.username);
    } else {
      // Krijojmë admin të ri
      const admin = await User.create({
        username: 'admin1',
        password: 'admin123',
        role: 'admin'
      });

      console.log('✅ Admin u shtua me sukses:', admin.username);
    }
  } catch (error) {
    console.error('❌ Gabim gjatë shtimit të admin:', error);
  } finally {
    await sequelize.close(); // Mbyll lidhjen me databazën
    process.exit();
  }
})();
