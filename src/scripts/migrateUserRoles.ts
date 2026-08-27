import { sequelize } from '../config/database';

/**
 * Migration script to update User roles from (admin, staff) to (superadmin, admin, viewer)
 * and upgrade existing admin users to superadmin
 */
async function migrateUserRoles() {
  try {
    console.log('Starting user role migration...');

    // Step 1: Alter the table to support new roles
    await sequelize.query(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('superadmin', 'admin', 'viewer') NOT NULL DEFAULT 'viewer'
    `);
    console.log('✓ Updated role column to support superadmin, admin, viewer');

    // Step 2: Upgrade all existing 'admin' users to 'superadmin'
    const [results] = await sequelize.query(`
      UPDATE users 
      SET role = 'superadmin' 
      WHERE role = 'admin'
    `);
    console.log(`✓ Upgraded ${(results as any).affectedRows} admin user(s) to superadmin`);

    // Step 3: Verify the changes
    const [users] = await sequelize.query(`
      SELECT id, name, email, role FROM users
    `);
    console.log('\nCurrent users:');
    console.table(users);

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateUserRoles();
