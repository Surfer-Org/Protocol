/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path from 'path';
const urlLib = require('url');
const fs = require('fs');
const mime = require('mime');
import { net } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { dialog } from 'electron';
import { promisify } from 'util';
import { exec } from 'child_process';
const execAsync = promisify(exec);
import { getAssetPath } from '../main';
import { execSync } from 'child_process';
import { app } from 'electron';

export function resolveHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1213;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

export function getFilesInFolder(folderPath: string) {
  const files: any[] = [];

  const entries = fs.readdirSync(folderPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(folderPath, entry.name);
    console.log(entryPath);

    if (entry.isDirectory()) {
      files.push(...getFilesInFolder(entryPath));
    } else {
      const stats = fs.statSync(entryPath);
      const formattedDate =
        stats.birthtime.toLocaleDateString('en-US') +
        ' ' +
        stats.birthtime.toLocaleTimeString('en-US');

      files.push({
        name: entry.name,
        path: entryPath,
        size: stats.size,
        createdDate: formattedDate,
        type: mime.getType(entryPath),
      });
    }
  }

  return files;
}

export async function setupPythonEnvironment(): Promise<string | null> {
  // Run the setup in the background
  (async () => {
    const userData = app.getPath('userData');
    const venvPath = path.join(userData, 'venv');
    
    console.log('Setting up Python environment in background...');
    console.log('User data path:', userData);
    console.log('Virtual env path:', venvPath);
    
    // Get python command
    const pythonCmd = await checkPythonAvailability(true);
    if (!pythonCmd) {
      console.error('No Python installation found');
      return null;
    }
    console.log('Found Python command:', pythonCmd);

    try {
      // Check if venv already exists
      if (!fs.existsSync(venvPath)) {
        console.log('Creating new virtual environment...');
        
        try {
          const createVenvResult = await execAsync(`${pythonCmd} -m venv "${venvPath}"`, {

          });
          console.log('Create venv stdout:', createVenvResult.stdout);
          console.log('Create venv stderr:', createVenvResult.stderr);
        } catch (venvError) {
          console.error('Failed to create virtual environment:', venvError);
          throw venvError;
        }
        
        const pythonVenvPath = process.platform === 'win32'
          ? path.join(venvPath, 'Scripts', 'python.exe')
          : path.join(venvPath, 'bin', 'python');
        
        console.log('Virtual env Python path:', pythonVenvPath);
        
        if (!fs.existsSync(pythonVenvPath)) {
          throw new Error(`Virtual environment Python not found at: ${pythonVenvPath}`);
        }
        
        try {
          console.log('Upgrading pip...');
          const pipUpgradeResult = await execAsync(`"${pythonVenvPath}" -m pip install --upgrade pip`, {
          });
          console.log('Pip upgrade stdout:', pipUpgradeResult.stdout);
        } catch (pipError) {
          console.error('Failed to upgrade pip:', pipError);
          // Continue even if pip upgrade fails
        }
        
        try {
          const requirementsPath = getAssetPath('requirements.txt');
          console.log('Installing requirements from:', requirementsPath);
          
          const installResult = await execAsync(`"${pythonVenvPath}" -m pip install -r "${requirementsPath}"`, {

          });
          console.log('Requirements install stdout:', installResult.stdout);
        } catch (reqError) {
          console.error('Failed to install requirements:', reqError);
          // Continue even if requirements installation fails
        }
        
        console.log('Virtual environment setup complete!');
      } else {
        console.log('Virtual environment already exists at:', venvPath);
      }

      // Return the path to the virtual environment's Python executable
      const finalPythonPath = process.platform === 'win32'
        ? path.join(venvPath, 'Scripts', 'python.exe')
        : path.join(venvPath, 'bin', 'python');
      
      console.log('Using Python path:', finalPythonPath);
      return finalPythonPath;

    } catch (error) {
      console.error('Error setting up virtual environment:', error);
      
      try {
        if (fs.existsSync(venvPath)) {
          fs.rmSync(venvPath, { recursive: true, force: true });
          console.log('Cleaned up failed virtual environment');
        }
      } catch (cleanupError) {
        console.error('Failed to clean up virtual environment:', cleanupError);
      }
      
      // Show error dialog in background
      dialog.showMessageBox({
        type: 'error',
        title: 'Python Environment Setup Failed',
        message: `Failed to set up Python virtual environment: ${error.message}\nPlease make sure Python is installed correctly.`,
      });
      return null;
    }
  })().catch(console.error); // Handle any errors in the background process

  // Return immediately to not block app startup
  return process.platform === 'win32'
    ? path.join(app.getPath('userData'), 'venv', 'Scripts', 'python.exe')
    : path.join(app.getPath('userData'), 'venv', 'bin', 'python');
}

export async function checkPythonAvailability(on_startup: boolean = false, action: string = 'this action'): Promise<string | null> {
  // First check if we have a virtual environment
  const userData = app.getPath('userData');
  const venvPythonPath = process.platform === 'win32'
    ? path.join(userData, 'venv', 'Scripts', 'python.exe')
    : path.join(userData, 'venv', 'bin', 'python');

  // If venv exists, use it
  if (fs.existsSync(venvPythonPath)) {
    try {
      const { stdout } = await execAsync(`"${venvPythonPath}" --version`);
      console.log('Using virtual environment Python:', stdout);
      return venvPythonPath;
    } catch (error) {
      console.log('Virtual environment exists but failed to execute Python');
    }
  }

  // Fall back to system Python if no venv or venv failed
  const commands = process.platform === 'win32' 
    ? ['python', 'py'] 
    : ['python3', 'python'];

  for (const cmd of commands) {
    try {
      const { stdout } = await execAsync(`${cmd} --version`);
      console.log(`Found Python using '${cmd}':`, stdout);
      return cmd;
    } catch (error) {
      console.log(`${cmd} not found, trying next...`);
    }
  }
  
  // Show error dialog if no Python version is found
  if (on_startup) {
    await dialog.showMessageBox({
      type: 'error',
      title: 'Some features require Python',
      message: 'Python is required for iMessage export, local vectorization, and more. Please go to https://www.python.org/downloads/ and install Python 3.10 or later.',
    });
  } else {
    await dialog.showMessageBox({
      type: 'error',
      title: 'Python Required for this action',
      message: `Python is required for ${action}. Please go to https://www.python.org/downloads/ and install Python 3.10 or later.`,
    });
  }
  return null;
}