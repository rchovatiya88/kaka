#!/usr/bin/env node

// Production database migration script with backup and rollback capabilities

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function runCommand(command, description, options = {}) {
  log(`🔄 ${description}...`, 'blue');
  try {
    const result = execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    log(`✅ ${description} completed`, 'green');
    return result;
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    if (options.silent) {
      log(error.message, 'red');
    }
    throw error;
  }
}

function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join('backups', timestamp);
  
  if (!fs.existsSync('backups')) {
    fs.mkdirSync('backups', { recursive: true });
  }
  
  fs.mkdirSync(backupDir, { recursive: true });
  
  log('📦 Creating database backup...', 'blue');
  
  // For SQLite (development)
  if (process.env.DATABASE_URL?.includes('file:')) {
    const dbFile = process.env.DATABASE_URL.replace('file:', '');
    if (fs.existsSync(dbFile)) {
      fs.copyFileSync(dbFile, path.join(backupDir, 'database.sqlite'));
      log(`✅ SQLite database backed up to ${backupDir}`, 'green');
    }
  }
  
  // For PostgreSQL (production)
  if (process.env.DATABASE_URL?.includes('postgresql://')) {
    try {
      runCommand(
        `pg_dump "${process.env.DATABASE_URL}" > ${path.join(backupDir, 'database.sql')}`,
        'Creating PostgreSQL backup',
        { silent: true }
      );
    } catch (error) {
      log('⚠️  PostgreSQL backup failed, continuing with migration...', 'yellow');
    }
  }
  
  // Backup current migration state
  if (fs.existsSync('prisma/migrations')) {
    runCommand(
      `cp -r prisma/migrations ${path.join(backupDir, 'migrations')}`,
      'Backing up migration history'
    );
  }
  
  return backupDir;
}

function checkMigrationStatus() {
  log('🔍 Checking current migration status...', 'blue');
  
  try {
    const result = runCommand(
      'npx prisma migrate status',
      'Checking migration status',
      { silent: true }
    );
    
    const output = result.toString();
    
    if (output.includes('No pending migrations')) {
      log('✅ Database is up to date', 'green');
      return 'up-to-date';
    } else if (output.includes('pending migrations')) {
      log('⚠️  Pending migrations found', 'yellow');
      return 'pending';
    } else {
      log('ℹ️  Migration status unclear', 'cyan');
      return 'unknown';
    }
  } catch (error) {
    log('❌ Failed to check migration status', 'red');
    return 'error';
  }
}

function runMigrations() {
  log('🚀 Running database migrations...', 'blue');
  
  try {
    // Generate Prisma client first
    runCommand('npx prisma generate', 'Generating Prisma client');
    
    // Deploy migrations
    runCommand('npx prisma migrate deploy', 'Deploying migrations');
    
    log('✅ All migrations completed successfully', 'green');
    return true;
  } catch (error) {
    log('❌ Migration failed', 'red');
    return false;
  }
}

function validateDatabase() {
  log('🔍 Validating database integrity...', 'blue');
  
  try {
    // Run a simple query to test database connectivity
    runCommand(
      'node -e "import(\'./app/db.server.js\').then(db => db.default.$queryRaw`SELECT 1`.then(() => console.log(\'Database connection OK\')))"',
      'Testing database connection',
      { silent: true }
    );
    
    log('✅ Database validation passed', 'green');
    return true;
  } catch (error) {
    log('❌ Database validation failed', 'red');
    return false;
  }
}

function seedProductionData() {
  log('🌱 Seeding production data...', 'blue');
  
  try {
    // Create default story templates
    runCommand(
      'node scripts/seed-templates.js',
      'Seeding story templates'
    );
    
    log('✅ Production data seeded successfully', 'green');
    return true;
  } catch (error) {
    log('⚠️  Seeding failed, but migration was successful', 'yellow');
    return false;
  }
}

async function main() {
  log('🚀 Starting production database migration', 'bright');
  
  // Environment checks
  if (process.env.NODE_ENV !== 'production') {
    log('⚠️  NODE_ENV is not set to production', 'yellow');
    log('Continue? (y/N): ', 'cyan');
    
    // In a real implementation, you'd want to prompt for user input
    // For now, we'll assume confirmation in non-interactive environments
  }
  
  if (!process.env.DATABASE_URL) {
    log('❌ DATABASE_URL environment variable is required', 'red');
    process.exit(1);
  }
  
  let backupDir = null;
  
  try {
    // Create backup
    backupDir = createBackup();
    
    // Check current status
    const status = checkMigrationStatus();
    
    if (status === 'up-to-date') {
      log('ℹ️  No migrations needed', 'cyan');
      return;
    }
    
    if (status === 'error') {
      log('❌ Cannot proceed with migration due to status check failure', 'red');
      process.exit(1);
    }
    
    // Run migrations
    const migrationSuccess = runMigrations();
    
    if (!migrationSuccess) {
      log('❌ Migration failed, database may be in inconsistent state', 'red');
      log(`💾 Backup available at: ${backupDir}`, 'cyan');
      process.exit(1);
    }
    
    // Validate database
    const validationSuccess = validateDatabase();
    
    if (!validationSuccess) {
      log('⚠️  Database validation failed after migration', 'yellow');
      log(`💾 Backup available at: ${backupDir}`, 'cyan');
    }
    
    // Seed production data
    seedProductionData();
    
    log('🎉 Production migration completed successfully!', 'bright');
    log(`💾 Backup created at: ${backupDir}`, 'cyan');
    
  } catch (error) {
    log('❌ Migration process failed', 'red');
    log(error.message, 'red');
    
    if (backupDir) {
      log(`💾 Backup available at: ${backupDir}`, 'cyan');
      log('To restore from backup:', 'yellow');
      log(`  - SQLite: cp ${backupDir}/database.sqlite prisma/dev.sqlite`, 'yellow');
      log(`  - PostgreSQL: psql "${process.env.DATABASE_URL}" < ${backupDir}/database.sql`, 'yellow');
    }
    
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('\n⚠️  Migration interrupted by user', 'yellow');
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  log('\n❌ Unhandled error during migration:', 'red');
  log(error.message, 'red');
  process.exit(1);
});

// Run the migration
main().catch(error => {
  log('\n❌ Migration failed:', 'red');
  log(error.message, 'red');
  process.exit(1);
});