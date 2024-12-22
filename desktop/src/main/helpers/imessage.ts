import { exec, spawn } from 'child_process';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { mainWindow } from '../main';
import { getTotalFolderSize } from './platforms';
const execAsync = promisify(exec);
import { checkPythonAvailability } from './util';

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../../assets');

const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

// Add this function at the top level, outside getImessageData
const showPasswordPrompt = (): Promise<string | null> => {
  return new Promise((resolve) => {
    const promptWindow = new BrowserWindow({
      width: 500,
      height: 300,
      show: false,
      alwaysOnTop: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    promptWindow.loadURL(getAssetPath('password-prompt.html'));

    promptWindow.once('ready-to-show', () => {
      promptWindow.show();
    });

    ipcMain.once('submit-password', (event, password) => {
      resolve(password);
      promptWindow.close();
    });

    promptWindow.on('closed', () => {
      resolve(null);
    });
  });
};

const showDiskAccessInstructions = async () => {
  const isDev = false;
  const result = await dialog.showMessageBox({
    type: 'info',
    title: `Disk Access Required${isDev ? ' (Development)' : ''}`,
    message: `Disk Access Required${isDev ? ' (Development)' : ''}`,
    detail:
      'To access iMessages, please grant Full Disk Access permission:\n\n' +
      '1. Open the Privacy tab in System Preferences\n' +
      '2. Select Full Disk Access from the left sidebar\n' +
      `3. Check the box next to ${isDev ? 'the application you are running the app locally on' : 'the Surfer Desktop app'}\n\n` +
      'After granting access, try again.',
    buttons: ['Open System Preferences', 'Cancel'],
    defaultId: 0,
  });

  if (result.response === 0) {
    exec(
      'open x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles',
    );
  }
};

// Add this helper function at the top level


export async function getImessageData(
  event: any,
  company: string,
  name: string,
  id: string,
) {
  const username = process.env.USERNAME || process.env.USER;
  if (!username) {
    console.error('No username found');
    return null;
  }

  //Use python scripting for Windows
  if (process.platform === 'win32') {
    const defaultPath = path.join(
      'C:',
      'Users',
      username,
      'Apple',
      'MobileSync',
      'Backup',
    );

    if (
      !fs.existsSync(defaultPath) ||
      fs.readdirSync(defaultPath).length === 0
    ) {
      dialog.showMessageBox({
        type: 'error',
        title: 'iMessages Folder Not Found',
        message:
          'The iMessages folder was not found. Please backup your iPhone to your PC first using the iTunes Desktop app.',
      });
      return null;
    }

    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select iMessages Folder',
      buttonLabel: 'Select',
      defaultPath: defaultPath,
    });

    if (result.filePaths.length > 0) {
      const selectedFolder = result.filePaths[0];
      mainWindow?.webContents.send(
        'console-log',
        id,
        'Got folder, now exporting iMessages (will take a few minutes)',
      );

      // Rest of your Windows logic here
      const pythonCommand = await checkPythonAvailability(false, 'iMessage export');
      if (!pythonCommand) return null;

      // const requirementsPath = getAssetPath('imessage_windows_reqs.txt');
      // const requirements = fs
      //   .readFileSync(requirementsPath, 'utf-8')
      //   .split('\n');
      const imessagePath = path.join(
        app.getPath('userData'),
        'exported_data',
        company,
        name,
      );

      // let packagesInstalled = false;
      // for (const req of requirements) {
      //   if (req.trim() !== '' && !fs.existsSync(imessagePath)) {
      //     console.log('Installing', req.trim());
      //     try {
      //       const { stdout, stderr } = await execAsync(
      //         `${pythonCommand} -m pip install ${req.trim()}`,
      //       );
      //       console.log(`Installed ${req.trim()} successfully.`);
      //       packagesInstalled = true;
      //     } catch (installError) {
      //       console.error(`Failed to install ${req.trim()}:`, installError);
      //     }
      //   }
      // }

      if (!fs.existsSync(imessagePath)) {
        fs.mkdirSync(imessagePath, { recursive: true });
        console.log(`Created directory: ${imessagePath}`);
      }

      let isValidPassword = false;
      let pythonProcess: any;

      while (!isValidPassword) {
        const password = await showPasswordPrompt();

        if (password === null) {
          throw new Error('Password input cancelled');
        }

        const scriptPath = getAssetPath('imessage_windows.py');

        try {
          const output = await new Promise<string>((resolve, reject) => {
            pythonProcess = spawn(
              pythonCommand,
              [
                scriptPath,
                selectedFolder,
                company,
                name,
                password,
                app.getPath('userData'),
                id
              ],
              {
                shell: false,
                stdio: ['pipe', 'pipe', 'pipe']
              }
            );

            let output = '';

            pythonProcess.stdout.on('data', (data : any) => {
              const dataStr = data.toString();
              output += dataStr;
              console.log('Python script output:', dataStr);
              mainWindow?.webContents.send('console-log', id, dataStr);
            });

            pythonProcess.stderr.on('data', (data: any) => {
              const error = data.toString();
              console.error('Python script error:', error);
              mainWindow?.webContents.send('console-error', id, error);
            });

            pythonProcess.on('close', (code: any) => {
              console.log('Python script exited with code', code);
              if (code === 0) {
                resolve(output.trim());
              } else {
                reject(new Error(`Python script exited with code ${code}`));
              }
            });
          });

          if (output.includes('Backup decrypted successfully')) {
            isValidPassword = true;
            // Get the output directory path from the last line of Python output
            const outputDir = output.split('\n').filter(Boolean).pop() || '';

            mainWindow?.webContents.send(
              'console-log',
              id,
              'iMessage export complete!',
            );
            mainWindow?.webContents.send(
              'export-complete',
              company,
              name,
              id,
              outputDir, // Use the output directory instead of selectedFolder
              getTotalFolderSize(outputDir), // Use the output directory for size calculation
            );
            return outputDir; // Return the output directory path
          } else if (output.includes('INVALID_PASSWORD')) {
            await dialog.showMessageBox({
              type: 'error',
              title: 'Invalid Password',
              message: 'The entered password is incorrect. Please try again.',
            });
          } else {
            throw new Error('Unexpected output from Python script');
          }
        } catch (error) {
          console.error('Error running Python script:', error);
          await dialog.showMessageBox({
            type: 'error',
            title: 'Invalid Password',
            message: `The entered password is incorrect. Please try again.`,
          });
        }
      }
    }
  }
  //Use native ts for macOS
  else if (process.platform === 'darwin') {
    try {
      const pythonCommand = await checkPythonAvailability(false, 'iMessage export');
      if (!pythonCommand) return null;

      const scriptPath = getAssetPath('imessage_mac.py');
      const userDataPath = app.getPath('userData');

      const output = await new Promise<string>((resolve, reject) => {
        const pythonProcess = spawn(
          pythonCommand,
          [scriptPath, company, name, id, userDataPath],
          {
            shell: false,
            stdio: ['pipe', 'pipe', 'pipe']
          }
        );

        let output = '';

        pythonProcess.stdout.on('data', (data) => {
          const dataStr = data.toString();
          output += dataStr;
          console.log('Python script output:', dataStr);
          mainWindow?.webContents.send('console-log', id, dataStr);
        });

        pythonProcess.stderr.on('data', (data) => {
          const error = data.toString();
          console.error('Python script error:', error);
          mainWindow?.webContents.send('console-error', id, error);
        });

        pythonProcess.on('close', (code) => {
          if (code === 0) {
            resolve(output.trim());
          } else {
            if (code == 13) {
              showDiskAccessInstructions();
            }
            reject(new Error(`Python script exited with code ${code}`));
          }
        });
      });

      const outputDir = output.split('\n').filter(Boolean).pop() || '';

      mainWindow?.webContents.send(
        'console-log',
        id,
        'iMessage export complete!',
      );
      mainWindow?.webContents.send(
        'export-complete',
        company,
        name,
        id,
        outputDir,
        getTotalFolderSize(outputDir),
      );

      return outputDir;
    } catch (error) {
      console.error('Error accessing Mac iMessage database:', error);
      return null;
    }
  } else {
    console.log('Unsupported platform:', process.platform);
    return null;
  }
}
