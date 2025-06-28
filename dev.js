#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting NEHORAI Portfolio development server...');

// Change to client directory and run npm install then npm run dev
process.chdir(path.join(__dirname, 'client'));

const installProcess = spawn('npm', ['install'], { stdio: 'inherit' });

installProcess.on('close', (code) => {
  if (code !== 0) {
    console.error('Failed to install dependencies');
    process.exit(1);
  }
  
  console.log('Dependencies installed. Starting development server...');
  
  const devProcess = spawn('npm', ['run', 'dev', '--', '--host', '0.0.0.0', '--port', '5000'], { 
    stdio: 'inherit' 
  });
  
  devProcess.on('close', (code) => {
    process.exit(code);
  });
});