/**
 * Migration Script: Add Email Verification Columns to Parents Table
 * 
 * Adds:
 * - email_verified (BOOLEAN, default false)
 * - verification_code (VARCHAR(10), nullable)
 * - verification_code_expires (DATETIME, nullable)
 */

import { sequelize } from '../config/database';
import { QueryInterface } from 'sequelize';

async function addEmailVerificationColumns() {
  const queryInterface: QueryInterface = sequelize.getQueryInterface();

  try {
    console.log('Starting migration: Add email verification columns to parents table...\n');

    // Check if columns already exist
    const tableDescription = await queryInterface.describeTable('parents');
    
    if (tableDescription.email_verified) {
      console.log('✓ Column "email_verified" already exists');
    } else {
      await queryInterface.addColumn('parents', 'email_verified', {
        type: 'BOOLEAN',
        allowNull: false,
        defaultValue: false,
      });
      console.log('✓ Added column "email_verified"');
    }

    if (tableDescription.verification_code) {
      console.log('✓ Column "verification_code" already exists');
    } else {
      await queryInterface.addColumn('parents', 'verification_code', {
        type: 'VARCHAR(10)',
        allowNull: true,
      });
      console.log('✓ Added column "verification_code"');
    }

    if (tableDescription.verification_code_expires) {
      console.log('✓ Column "verification_code_expires" already exists');
    } else {
      await queryInterface.addColumn('parents', 'verification_code_expires', {
        type: 'DATETIME',
        allowNull: true,
      });
      console.log('✓ Added column "verification_code_expires"');
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNote: Existing parent accounts have email_verified set to false by default.');
    console.log('You may want to manually set email_verified=true for existing accounts.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the migration
addEmailVerificationColumns()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
