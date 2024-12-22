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
import { getAssetPath, mainWindow } from '../main';
import { execSync } from 'child_process';
import { app } from 'electron';

// Add a new variable to track Python setup status
let pythonSetupPromise: Promise<string | null> | null = null;
let pythonSetupComplete = false;

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
  if (pythonSetupPromise) {
    return pythonSetupPromise;
  }

  pythonSetupPromise = (async () => {
    const userData = app.getPath('userData');
    const venvPath = path.join(userData, 'venv');
    
    // Send initial setup message
    mainWindow?.webContents.send('python-setup-progress', {
      status: 'starting',
      message: 'Setting up Python environment...'
    });
    
    const pythonCmd = await checkPythonAvailability(true);
    if (!pythonCmd) {
      mainWindow?.webContents.send('python-setup-progress', {
        status: 'error',
        message: 'No Python installation found'
      });
      return null;
    }

    try {
      if (!fs.existsSync(venvPath)) {
        mainWindow?.webContents.send('python-setup-progress', {
          status: 'progress',
          message: 'Creating virtual environment...'
        });
        
        try {
          await execAsync(`${pythonCmd} -m venv "${venvPath}"`);
        } catch (venvError) {
          mainWindow?.webContents.send('python-setup-progress', {
            status: 'error',
            message: 'Failed to create virtual environment'
          });
          throw venvError;
        }
        
        const pythonVenvPath = process.platform === 'win32'
          ? path.join(venvPath, 'Scripts', 'python.exe')
          : path.join(venvPath, 'bin', 'python');
        
        mainWindow?.webContents.send('python-setup-progress', {
          status: 'progress',
          message: 'Upgrading pip...'
        });
        
        try {
          await execAsync(`"${pythonVenvPath}" -m pip install --upgrade pip`);
        } catch (pipError) {
          mainWindow?.webContents.send('python-setup-progress', {
            status: 'warning',
            message: 'Pip upgrade failed, continuing...'
          });
        }
        
        mainWindow?.webContents.send('python-setup-progress', {
          status: 'progress',
          message: 'Installing required packages...'
        });
        
        try {
          const requirementsPath = process.platform === 'win32'
            ? getAssetPath('windows_requirements.txt')
            : getAssetPath('requirements.txt');
            
          await execAsync(`"${pythonVenvPath}" -m pip install -r "${requirementsPath}"`);
        } catch (reqError) {
          mainWindow?.webContents.send('python-setup-progress', {
            status: 'error',
            message: 'Failed to install requirements'
          });
          throw reqError;
        }
      }

      const finalPythonPath = process.platform === 'win32'
        ? path.join(venvPath, 'Scripts', 'python.exe')
        : path.join(venvPath, 'bin', 'python');
      
      mainWindow?.webContents.send('python-setup-progress', {
        status: 'complete',
        message: 'Python environment setup complete!'
      });
      
      pythonSetupComplete = true;
      return finalPythonPath;

    } catch (error) {
      mainWindow?.webContents.send('python-setup-progress', {
        status: 'error',
        message: `Setup failed: ${error.message}`
      });
      pythonSetupComplete = false;
      return null;
    }
  })();

  return pythonSetupPromise;
}

// Add a new function to check if Python is ready
export function isPythonReady(): boolean {
  return pythonSetupComplete;
}

export async function checkPythonAvailability(on_startup: boolean = false, action: string = 'this action'): Promise<string | null> {
  // If setup is in progress, wait for it to complete
  if (pythonSetupPromise && !pythonSetupComplete) {
    // Show "waiting" dialog
    const waitingDialog = dialog.showMessageBox({
      type: 'info',
      title: 'Setting Up Python Environment',
      message: 'Python environment is being set up. This may take a few minutes. The action will automatically continue once setup is complete.',
      buttons: ['Ok'],
      defaultId: 0,
      noLink: true,
    });

    try {
      const pythonPath = await pythonSetupPromise;
      if (pythonPath) {
        return pythonPath;
      }
    } catch (error) {
      console.error('Python setup failed:', error);
    }
  }

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