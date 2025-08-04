#!/usr/bin/env node

// Development environment setup script

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
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n🔄 ${description}...`, 'blue');
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed`, 'green');
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description} exists`, 'green');
    return true;
  } else {
    log(`❌ ${description} missing`, 'red');
    return false;
  }
}

function createFileFromTemplate(templatePath, targetPath, description) {
  try {
    if (!fs.existsSync(targetPath)) {
      fs.copyFileSync(templatePath, targetPath);
      log(`✅ Created ${description}`, 'green');
    } else {
      log(`ℹ️  ${description} already exists`, 'yellow');
    }
  } catch (error) {
    log(`❌ Failed to create ${description}`, 'red');
    log(error.message, 'red');
  }
}

async function main() {
  log('🚀 Setting up Kaka Story Generator development environment\n', 'bright');

  // Check Node.js version
  const nodeVersion = process.version;
  log(`Node.js version: ${nodeVersion}`, 'cyan');
  
  if (parseInt(nodeVersion.slice(1)) < 18) {
    log('❌ Node.js 18+ is required', 'red');
    process.exit(1);
  }

  // Check required files
  log('\n📋 Checking required files...', 'bright');
  const requiredFiles = [
    ['package.json', 'Package configuration'],
    ['prisma/schema.prisma', 'Database schema'],
    ['shopify.app.toml', 'Shopify app configuration']
  ];

  let allFilesExist = true;
  for (const [file, description] of requiredFiles) {
    if (!checkFile(file, description)) {
      allFilesExist = false;
    }
  }

  if (!allFilesExist) {
    log('\n❌ Required files are missing. Please check your project structure.', 'red');
    process.exit(1);
  }

  // Create .env file from template if it doesn't exist
  log('\n🔧 Setting up environment configuration...', 'bright');
  createFileFromTemplate('.env.example', '.env', 'Environment file (.env)');

  // Install dependencies
  runCommand('npm install', 'Installing dependencies');

  // Generate Prisma client
  runCommand('npx prisma generate', 'Generating Prisma client');

  // Run database migrations
  runCommand('npx prisma migrate deploy', 'Running database migrations');

  // Check if Shopify CLI is installed
  log('\n🛠️  Checking Shopify CLI...', 'bright');
  try {
    execSync('shopify version', { stdio: 'pipe' });
    log('✅ Shopify CLI is installed', 'green');
  } catch (error) {
    log('❌ Shopify CLI not found', 'red');
    log('Please install it with: npm install -g @shopify/cli @shopify/theme', 'yellow');
  }

  // Create development directories
  log('\n📁 Creating development directories...', 'bright');
  const directories = [
    'uploads',
    'temp',
    'logs',
    'backups'
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`✅ Created ${dir}/ directory`, 'green');
    } else {
      log(`ℹ️  ${dir}/ directory already exists`, 'yellow');
    }
  });

  // Create gitignore entries for development directories
  const gitignorePath = '.gitignore';
  let gitignoreContent = '';
  
  if (fs.existsSync(gitignorePath)) {
    gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  }

  const gitignoreEntries = [
    '# Development directories',
    'uploads/',
    'temp/',
    'logs/',
    'backups/',
    '',
    '# Environment variables',
    '.env.local',
    '.env.production',
    '',
    '# Database',
    '*.sqlite-journal',
    '*.db-journal'
  ];

  const entriesToAdd = gitignoreEntries.filter(entry => 
    !gitignoreContent.includes(entry) && entry.trim() !== ''
  );

  if (entriesToAdd.length > 0) {
    fs.appendFileSync(gitignorePath, '\n' + entriesToAdd.join('\n') + '\n');
    log('✅ Updated .gitignore', 'green');
  }

  // Check environment variables
  log('\n🔍 Checking environment variables...', 'bright');
  if (fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    const requiredEnvVars = [
      'SHOPIFY_API_KEY',
      'SHOPIFY_API_SECRET',
      'SCOPES',
      'GOOGLE_AI_API_KEY'
    ];

    const missingVars = requiredEnvVars.filter(variable => 
      !envContent.includes(`${variable}=`) || 
      envContent.includes(`${variable}=your_`) ||
      envContent.includes(`${variable}=`)
    );

    if (missingVars.length > 0) {
      log('⚠️  Please configure the following environment variables in .env:', 'yellow');
      missingVars.forEach(variable => {
        log(`   - ${variable}`, 'yellow');
      });
    } else {
      log('✅ All required environment variables are configured', 'green');
    }
  }

  // Final success message
  log('\n🎉 Development environment setup completed!', 'bright');
  log('\nNext steps:', 'cyan');
  log('1. Configure your .env file with actual API keys', 'white');
  log('2. Run "npm run dev" to start the development server', 'white');
  log('3. Visit your Shopify Partner Dashboard to configure your app', 'white');
  log('\nHappy coding! 🚀', 'green');
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  log('\n❌ Unhandled error occurred:', 'red');
  log(error.message, 'red');
  process.exit(1);
});

// Run the setup
main().catch(error => {
  log('\n❌ Setup failed:', 'red');
  log(error.message, 'red');
  process.exit(1);
});