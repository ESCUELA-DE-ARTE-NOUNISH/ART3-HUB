#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Path to the .env file
const envPath = path.join(__dirname, '..', '.env');

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.error('\x1b[31mError: .env file not found in ArtHubApp directory\x1b[0m');
  console.log('Please create an .env file first.');
  rl.close();
  process.exit(1);
}

// Read the current .env file
let envContent = fs.readFileSync(envPath, 'utf8');

console.log('\x1b[36m=== Pinata IPFS Setup ===\x1b[0m');
console.log('\nThis script will help you set up Pinata API keys for IPFS storage.');
console.log('\nYou can get your API keys from https://app.pinata.cloud/keys');

// Check if Pinata keys already exist
const hasPinataKeys = 
  envContent.includes('NEXT_PUBLIC_PINATA_API_KEY=') && 
  envContent.includes('PINATA_API_KEY=') && 
  envContent.includes('PINATA_SECRET_API_KEY=');

if (hasPinataKeys) {
  console.log('\n\x1b[33mPinata keys already exist in your .env file.\x1b[0m');
  rl.question('Do you want to update them? (y/n): ', (answer) => {
    if (answer.toLowerCase() !== 'y') {
      console.log('\nSetup cancelled. Existing keys will be used.');
      rl.close();
      return;
    }
    promptForKeys();
  });
} else {
  promptForKeys();
}

function promptForKeys() {
  rl.question('\nEnter your Pinata API Key: ', (apiKey) => {
    if (!apiKey.trim()) {
      console.log('\x1b[31mAPI Key cannot be empty. Please try again.\x1b[0m');
      return promptForKeys();
    }

    rl.question('Enter your Pinata API Secret: ', (secretKey) => {
      if (!secretKey.trim()) {
        console.log('\x1b[31mAPI Secret cannot be empty. Please try again.\x1b[0m');
        return promptForKeys();
      }

      // Update or add the Pinata keys
      const pinataConfig = `
# Pinata IPFS Configuration
NEXT_PUBLIC_PINATA_API_KEY=${apiKey}
PINATA_API_KEY=${apiKey}
PINATA_SECRET_API_KEY=${secretKey}
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
`;

      // Check if keys already exist and replace them
      if (hasPinataKeys) {
        // Replace existing keys
        envContent = envContent.replace(
          /NEXT_PUBLIC_PINATA_API_KEY=.*\n/g, 
          `NEXT_PUBLIC_PINATA_API_KEY=${apiKey}\n`
        );
        envContent = envContent.replace(
          /PINATA_API_KEY=.*\n/g, 
          `PINATA_API_KEY=${apiKey}\n`
        );
        envContent = envContent.replace(
          /PINATA_SECRET_API_KEY=.*\n/g, 
          `PINATA_SECRET_API_KEY=${secretKey}\n`
        );
        
        // Add gateway and API base URL if they don't exist
        if (!envContent.includes('NEXT_PUBLIC_PINATA_GATEWAY=')) {
          envContent += `NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud\n`;
        }
        if (!envContent.includes('NEXT_PUBLIC_API_BASE_URL=')) {
          envContent += `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000\n`;
        }
      } else {
        // Add new keys
        envContent += pinataConfig;
      }

      // Write back to .env file
      fs.writeFileSync(envPath, envContent);

      console.log('\n\x1b[32mSuccess! Pinata API keys have been added to your .env file.\x1b[0m');
      console.log('\nYou may need to restart your development server for changes to take effect.');
      rl.close();
    });
  });
} 