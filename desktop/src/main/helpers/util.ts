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

export async function checkPythonAvailability(on_startup: boolean = false, action: string = 'this action'): Promise<string | null> {
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
  }

  else {
    await dialog.showMessageBox({
      type: 'error',
      title: 'Python Required for this action',
      message: `Python is required for ${action}. Please go to https://www.python.org/downloads/ and install Python 3.10 or later.`,
    });
  }
} 