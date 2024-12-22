import cors from 'cors';
import * as dotenv from 'dotenv';
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  nativeImage,
  shell,
  Tray,
} from 'electron';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import express, { query } from 'express';
import fs from 'fs';
import path from 'path';
import {} from '../../';
import {
  checkConnectedPlatforms,
  convertMboxToJson,
  extractZip,
  findMboxFile,
  getTotalFolderSize,
  parseChatGPTConversations,
  processNotionExport,
} from './helpers/platforms';
import { getImessageData } from './helpers/imessage';
import MenuBuilder from './helpers/menu';
import {
  getLinkedinCredentials,
  getNotionCredentials,
  getTwitterCredentials,
} from './helpers/network';
import { resolveHtmlPath } from './helpers/util';
import { spawn } from 'child_process';
dotenv.config();
const { download } = require('electron-dl');
import { checkPythonAvailability, checkAndInstallPythonRequirements, setupPythonEnvironment } from './helpers/util';

// Preventing multiple instances of Surfer

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
  process.exit(0);
} else {
  app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

const port = 2024;

// Add this function to check if server is running
const isServerRunning = async (): Promise<boolean> => {
  try {
    const response = await fetch(`http://localhost:${port}/api/health`);
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

// Replace the Express setup with this
const setupExpressServer = async () => {
  const serverRunning = await isServerRunning();

  if (serverRunning) {
    console.log(`Server already running on port ${port}, skipping setup`);
    return;
  }

  const expressApp = express();
  expressApp.use(cors());
  expressApp.use(express.json());

  expressApp.get('/', (req, res) => {
    // this would be the surferClient.connect()
    res.send('Hello World');
  });

  // Health check endpoint
  expressApp.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  expressApp.post('/api/get', async (req, res) => {
    console.log('GET REQUEST: ', req.body);
    const { platformId } = req.body;

    mainWindow?.webContents.send('get-runs');
    const runsResponse: any = await new Promise((resolve) => {
      ipcMain.once('get-runs-response', (event, runs) => resolve(runs));
    });

    // Filter runs for this platform with successful status
    const successfulRuns = runsResponse.filter(
      (r: any) => r.platformId === platformId && r.status === 'success',
    );

    console.log('successful runs: ', successfulRuns);

    if (successfulRuns.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No successful runs found for this platform, please export data first',
      });
    }

    // Sort by startDate descending and get latest
    const latestRun = successfulRuns.sort(
      (a: any, b: any) =>
        new Date(b.endDate || b.startDate).getTime() -
        new Date(a.endDate || b.startDate).getTime(),
    )[0];



    console.log('latest run: ', latestRun.id);
    const exportPath = fs.readdirSync(latestRun.exportPath);
    const jsonFile = exportPath.find((file: any) => file.endsWith('.json'));

    if (!jsonFile) {
      return res
        .status(404)
        .json({ success: false, error: 'No JSON file found in export path' });
    }

    const filePath = path.join(latestRun.exportPath, jsonFile);
    const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json({ success: true, data: fileData });
  });

  expressApp.post('/api/export', async (req, res) => {
    console.log('Export request: ', req.body);
    const { platformId } = req.body;

    try {
      mainWindow?.webContents.send('api-export', platformId);

      // Get initial run with timeout
      const currentRun: any = await new Promise((resolve) => {
        ipcMain.once('run-started', (event, run) => resolve(run));
      });

      console.log('Found current run:', currentRun.id);

      // Monitor run status with timeout
      const finalRun = await new Promise((resolve) => {
        const checkRunStatus = async () => {
          mainWindow?.webContents.send('get-runs');
          const runsResponse: any = await new Promise((resolve) => {
            ipcMain.once('get-runs-response', (event, runs) => resolve(runs));
          });

          const finalRun = runsResponse.find(
            (r: any) => r.id === currentRun.id,
          );
          if (finalRun?.status === 'success') {
            clearInterval(statusInterval);
            resolve(finalRun);
          }
        };

        const statusInterval = setInterval(checkRunStatus, 1000);
      });

      console.log('final run status: ', finalRun.status);
      // Process results
      const latestRunPath = finalRun.exportPath;
      if (!fs.existsSync(latestRunPath)) {
        throw new Error('Export path not found');
      }

      const files = fs.readdirSync(latestRunPath);
      const jsonFile = files.find((file) => file.endsWith('.json'));
      if (!jsonFile) {
        throw new Error('No JSON file found in export folder');
      }

      const filePath = path.join(latestRunPath, jsonFile);
      const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      res.json({
        success: true,
        data: fileData,
        exportPath: path.dirname(filePath),
        exportSize: getTotalFolderSize(path.dirname(filePath)),
      });
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Unknown export error',
      });
    }
  });

  expressApp.get('/api/search/:query/:platform', async (req, res) => {
    console.log('Search request: ', req.params);
    const { query, platform } = req.params;
    const searchResponse = await searchVectorDB(query, platform);
    console.log('Search response: ', searchResponse);
    res.json({ success: true, data: searchResponse });
  });

  expressApp
    .listen(port, () => {
      console.log(`Server is running on port ${port}`);
    })
    .on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is busy, server not started`);
      } else {
        console.error('Server error:', err);
      }
    });
};

autoUpdater.autoDownload = false; // Prevent auto-download
autoUpdater.autoInstallOnAppQuit = false;
autoUpdater.autoRunAppAfterInstall = true;

let downloadingItems = new Map();

ipcMain.on('connect-platform', (event, platform: any) => {
  const { company, name, connectURL, connectSelector, id } = platform;
  //console.log('CONNECTING TO PLATFORM: ', company, name, connectURL, connectSelector);
  const popupWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  popupWindow.loadURL(connectURL);
  popupWindow.show();

  popupWindow.webContents.on('did-finish-load', async () => {
    let elementFound = false;
    let errorCount = 0;
    while (!elementFound && errorCount < 3 && connectSelector) {
      try {
        const elementExists = await popupWindow.webContents.executeJavaScript(`
          (() => {
            const element = document.querySelector('${connectSelector.replace(/'/g, "\\'")}');
            return !!element;
          })();
        `);

        if (elementExists) {
          console.log('ELEMENT FOUND, closing popup');
          const platformPath = path.join(
            app.getPath('userData'),
            'exported_data',
            company,
            name,
          );
          fs.mkdirSync(platformPath, { recursive: true });
          mainWindow?.webContents.send('element-found', id);
          elementFound = true;
          popupWindow.destroy();
        } else {
          console.log('ELEMENT NOT FOUND, STILL LOOKING!');
          mainWindow?.webContents.send('element-not-found', id);
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        errorCount++;
        console.error('Error checking for element, debug:', error);
        popupWindow.destroy();
      }
    }
  });
});

ipcMain.on('get-twitter-credentials', async (event, company, name) => {
  return await getTwitterCredentials(company, name);
});

ipcMain.on('get-notion-credentials', async (event, company, name) => {
  return await getNotionCredentials(company, name);
});

ipcMain.on('get-linkedin-credentials', async (event, company, name) => {
  return await getLinkedinCredentials(company, name);
});

ipcMain.handle('check-connected-platforms', async (event, platforms) => {
  return checkConnectedPlatforms(platforms);
});

ipcMain.handle('get-current-db', async (event) => {
  const scriptPath = getAssetPath('current_db.py');
  const pythonPath = await checkPythonAvailability(false, 'current db');

  if (!pythonPath) {
    throw new Error('Python not found');
  }

  const args = [
    scriptPath,
    app.getPath('userData')
  ];

  return new Promise((resolve, reject) => {
    const currentDBProcess = spawn(pythonPath, args, {
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let outputData = '';
    let errorData = '';

    currentDBProcess.stdout.on('data', (data) => {
      outputData += data.toString();
      console.log('outputData: ', outputData);
    });

    currentDBProcess.stderr.on('data', (data) => {
      errorData += data.toString();
      console.log('errorData: ', errorData);
    });

    currentDBProcess.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(outputData);
        } catch (e) {
          reject(new Error('Failed to parse current db results'));
        }
      } else {
        reject(new Error(errorData || 'Current DB failed'));
      }
    });
  });
});

const getPlatforms = async () => {
  const platformsDir = app.isPackaged
    ? path.join(__dirname)
    : path.join(__dirname, 'platforms');

  // Helper function to get JS files
  const getAllJsFiles = async (dir: string): Promise<string[]> => {
    const excludedFiles = [
      '248.js',
      'main.js',
      'preload.js',
      'preloadElectron.js',
      'preloadFunctions.js',
      'preloadWebview.js',
      'calendar.js',
      'feed.js',
      'github.js',
      'twitter.js',
      'youtube.js',
    ];

    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      entries.map((entry) => {
        const res = path.resolve(dir, entry.name);
        return entry.isDirectory() ? getAllJsFiles(res) : res;
      }),
    );

    return files
      .flat()
      .filter(
        (file) =>
          file.endsWith('.js') && !excludedFiles.includes(path.basename(file)),
      );
  };

  // Helper function to get metadata with default values
  const getMetadata = async (company: string, name: string) => {
    const metadataPath = path.join(platformsDir, company, `${name}.json`);
    try {
      return fs.existsSync(metadataPath)
        ? JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
        : {};
    } catch {
      return {};
    }
  };

  try {
    if (!fs.existsSync(platformsDir)) {
      console.error('Platforms directory does not exist:', platformsDir);
      return [];
    }

    const jsFiles = await getAllJsFiles(platformsDir);

    return Promise.all(
      jsFiles.map(async (file) => {
        const relativePath = path.relative(platformsDir, file);
        const name = path.basename(file, '.js');
        const company = relativePath.split(path.sep)[0] || 'Platform';
        const metadata = await getMetadata(company, name);

        return {
          id: metadata.id || `${name}-001`,
          company: metadata.company || company,
          name: metadata.name || name,
          filename: name,
          description: metadata.description || 'No description available',
          isUpdated: Boolean(metadata.isUpdated),
          logoURL: metadata.logoURL || name,
          needsConnection: metadata.needsConnection ?? true,
          connectURL: metadata.connectURL || null,
          connectSelector: metadata.connectSelector || null,
          exportFrequency: metadata.exportFrequency || null,
          vectorize_config: metadata.vectorize_config || null,
        };
      }),
    );
  } catch (error) {
    console.error('Error reading platforms directory:', error);
    return [];
  }
};

ipcMain.handle('get-platforms', async () => {
  return getPlatforms();
});

ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData');
});

ipcMain.on('get-platform', (event) => {
  event.reply('platform', process.platform);
});

app.on('web-contents-created', (_event, contents) => {
  contents.on('will-attach-webview', (_wawevent, webPreferences, _params) => {
    // Use __dirname to get the path of the current directory
    const preloadPath = path.join(__dirname, 'preloadWebview.js');
    webPreferences.preload = preloadPath;
  });
});

ipcMain.on('get-version-number', (event) => {
  event.reply('version-number', app.getVersion());
});

ipcMain.handle(
  'get-imessage-data',
  async (event, company: string, name: string, id: string) => {
    return getImessageData(event, company, name, id);
  },
);

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

class AppUpdater {
  constructor() {
    console.log('Creating new App Updater');
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

export let mainWindow: BrowserWindow | null = null;

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}
const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

export const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

ipcMain.handle('vectorize-last-run', async () => {
  const scriptPath = getAssetPath('vectorize.py');
  const pythonPath = await checkPythonAvailability(false, 'vectorizing your data');
  mainWindow?.webContents.send('get-runs');
  const runsResponse: any = await new Promise((resolve) => {
    ipcMain.once('get-runs-response', (event, runs) => resolve(runs));
  });

  // Filter runs for this platform with successful status
  const successfulRuns = runsResponse.filter(
    (r: any) => r.status === 'success',
  );

  const latestRun = successfulRuns.sort(
    (a: any, b: any) =>
      new Date(b.endDate || b.startDate).getTime() -
      new Date(a.endDate || b.startDate).getTime(),
  )[0];

  const jsonFile = fs.readdirSync(latestRun.exportPath).filter(file => file.endsWith('.json'))[0];
  const jsonFilePath = path.join(latestRun.exportPath, jsonFile);
  console.log('jsonFilePath: ', jsonFilePath);
  const parsedLatestRun = Buffer.from(JSON.stringify(latestRun)).toString('base64');

  if (pythonPath) {
    return new Promise((resolve, reject) => {
      const vectorDB = spawn(pythonPath, [
        scriptPath,
        app.getPath('userData'),
        jsonFilePath,
        parsedLatestRun
      ], {
        shell: false,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Handle stdout (normal output)
      vectorDB.stdout.on('data', (data) => {
        const output = data.toString();
        // console.log('output: ', output);
        
        // Split output into lines and process each line separately
        const lines = output.split('\n');
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine) {  // Only process non-empty lines
            if (trimmedLine.startsWith('progress:')) {
              // Format: "progress:platformId:current/total"
              const [_, platformId, progress] = trimmedLine.split(':');
              const [current, total] = progress.split('/');
              const formattedProgress = `${platformId}:${current}:${total}`;
              mainWindow?.webContents.send('vector-db-progress', formattedProgress);
            } else {
              mainWindow?.webContents.send('vector-db-output', trimmedLine);
            }
          }
        }
      });

      // Handle stderr (error output)
      vectorDB.stderr.on('data', (data) => {
        const error = data.toString();
        console.error('Vector DB Error:', error);
        mainWindow?.webContents.send('vector-db-error', error);
      });

      // Handle process completion
      vectorDB.on('close', (code) => {
        console.log(`Vector DB process exited with code ${code}`);
        mainWindow?.webContents.send('vector-db-close', code);
        if (code === 0) {
          resolve({ success: true, code });
        } else {
          reject({ success: false, code });
        }
      });

      // Handle errors
      vectorDB.on('error', (error) => {
        console.error('Vector DB Process Error:', error);
        reject({ success: false, error: error.message });
      });
    });
  } else {
    throw new Error('Python not found');
  }
});

ipcMain.handle('search-vector-db', async (event, query, platform) => {
  return searchVectorDB(query, platform);
});

async function searchVectorDB(query: string, platform: string) {
  const scriptPath = getAssetPath('search_vector_db.py');
  const pythonPath = await checkPythonAvailability(false, 'searching over your data');

  if (!pythonPath) {
    throw new Error('Python not found');
  }

  return new Promise((resolve, reject) => {
    const searchProcess = spawn(pythonPath, [
      scriptPath,
      app.getPath('userData'),
      query,
      platform
    ], {
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let outputData = '';
    let errorData = '';

    searchProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    searchProcess.stderr.on('data', (data) => {
      errorData += data.toString();
      console.error('Python stderr:', errorData);
    });

    searchProcess.on('close', (code) => {
      console.log('Search process exited with code:', code);
      if (code === 0) {
        try {
          const results = JSON.parse(outputData);
          resolve(results);
        } catch (e) {
          console.error('Failed to parse results:', e);
          reject(new Error('Failed to parse search results'));
        }
      } else {
        reject(new Error(errorData || 'Search failed'));
      }
    });

    searchProcess.on('error', (error) => {
      console.error('Spawn error:', error);
      reject(new Error(`Failed to start search process: ${error.message}`));
    });
  });
}


let isQuitting = false;

export const createWindow = async (visible: boolean = true) => {
  if (mainWindow) {
    return;
  }

  mainWindow = new BrowserWindow({
    show: true,
    width: 1560,
    height: 1024,
    minWidth: 720,
    minHeight: 400,
    icon: getAssetPath('icon.png'),
    backgroundColor: '#000000',
    autoHideMenuBar: false,
    simpleFullscreen: true,
    titleBarStyle: process.platform === 'darwin' ? 'hidden' : 'default',
    trafficLightPosition: { x: 12, y: 19 },
    title: '',
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      webSecurity: app.isPackaged ? true : false,
      webviewTag: true,
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));
  // Add this to reset renderer ready state when window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url); // Open URL in user's browser.
    return { action: 'deny' }; // Prevent the app from opening the URL.
  });

  //banish new windows
  // mainWindow.webContents.on('did-attach-webview', (_, contents) => { contents._events["-new-window"] = () => { return false; }; });

  //banish new tabss
  mainWindow.webContents.on('did-attach-webview', (event, wc) => {
    wc.setWindowOpenHandler((details) => {
      console.log('webview-new-window', wc.id, details);

      // THIS IS MAINLY FOR AUTH-RELATED STUFF. WE CAN INCORPORTATE HUMAN IN THE LOOP HERE FOR AUTH PURPOSES!
      if (
        details.url.includes('https://accounts.google.com') ||
        details.url.includes('about:blank') ||
        details.url.includes('file://') ||
        details.url.includes('https://www.notion.so/verifyNoPopupBlocker') ||
        details.url.includes('https://appleid.apple.com/auth/') ||
        details.url.includes(
          'https://proddatamgmtqueue.blob.core.windows.net/exportcontainer/',
        ) ||
        details.url.includes('file.notion.so') ||
        details.url.includes('https://chatgpt.com/backend-api/content')
      ) {
        console.log('ALLOWING THIS URL: ', details.url);
        return { action: 'allow' };
      }

      //mainWindow?.webContents.send('webview-new-window', wc.id, details);
      mainWindow?.webContents.send('url', details.url);
      console.log('opening in same tab: ', details.url);

      return { action: 'deny' };
    });
  });

  ipcMain.on('show-dev-tools', (event) => {
    try {
      console.log('OPENING DEVTOOLS!');
      mainWindow?.webContents.openDevTools();
    } catch (error) {
      console.error('Error opening dev tools:', error);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  new AppUpdater();

  let lastDownloadUrl = '';
  let lastDownloadTime = 0;

  mainWindow.webContents.session.on(
    'will-download',
    (event, item, webContents) => {
      const url = item.getURL();
      const fileName = item.getFilename();
      const fileSize = item.getTotalBytes();

      const now = Date.now();
      if (url === lastDownloadUrl && now - lastDownloadTime < 1000) {
        console.log('Ignoring duplicate download request');
        return;
      }

      lastDownloadUrl = url;
      lastDownloadTime = now;

      console.log('Intercepted download:', { url, fileName, fileSize });

      const userData = app.getPath('userData');
      const surferDataPath = path.join(userData, 'exported_data');
      let companyPath: string;
      let platformPath: string;
      let idPath: string;

      let platformId;
      const timestamp = Date.now();

      if (url.includes('file.notion.so')) {
        companyPath = path.join(surferDataPath, 'Notion');
        platformPath = path.join(companyPath, 'Notion');
        platformId = `notion-001`;
        idPath = path.join(platformPath, `${platformId}-${timestamp}`);
      } else if (
        url.includes('proddatamgmtqueue.blob.core.windows.net/exportcontainer/') ||
        url.includes('https://chatgpt.com/backend-api/content')
      ) {
        companyPath = path.join(surferDataPath, 'OpenAI');
        platformPath = path.join(companyPath, 'ChatGPT');
        platformId = `chatgpt-001`;
        idPath = path.join(platformPath, `${platformId}-${timestamp}`);
      } else if (url.includes('takeout-download.usercontent.google.com')) {
        companyPath = path.join(surferDataPath, 'Google');
        platformPath = path.join(companyPath, 'Gmail');
        platformId = `gmail-001`;
        idPath = path.join(platformPath, platformId);
      } else {
        console.error('Unknown download URL, needs to be handled:', url);
        return;
      }

      fs.mkdirSync(idPath, { recursive: true });

      event.preventDefault();

      console.log('Starting download:', url);

      download(mainWindow, url, {
        directory: idPath,
        filename: fileName,
        onStarted: (downloadItem: Electron.DownloadItem) => {
          downloadItem.on('done', (event: Electron.Event, state: string) => {
            if (state === 'completed') {
              console.log('Download completed successfully:', url);
            } else if (state === 'cancelled') {
              console.log('Download was cancelled:', url);
            }
          });
        },
        onProgress: (percent: number) => {
          mainWindow?.webContents.send('download-progress', {
            fileName,
            percent,
          });
        },
        saveAs: false,
      })
        .then(async (dl: Electron.DownloadItem) => {
          console.log('Download completed:', dl.getSavePath());
          const filePath = dl.getSavePath();
          if (filePath.toLowerCase().endsWith('.zip')) {
            const extractPath = path.join(idPath, 'extracted');

            try {
              await extractZip(filePath, extractPath);
              console.log('Outer ZIP extracted to:', extractPath);

              const innerZipFile = fs
                .readdirSync(extractPath)
                .find((file) => file.endsWith('.zip'));

              if (innerZipFile) {
                const innerZipPath = path.join(extractPath, innerZipFile);
                await extractZip(innerZipPath, extractPath);
                console.log('Inner ZIP extracted to:', extractPath);

                // Delete the inner ZIP file after extraction
                fs.unlinkSync(innerZipPath);
              }

              // Delete the original ZIP file
              fs.unlinkSync(filePath);

              console.log('Zip fully extracted to:', extractPath);

              if (url.includes('takeout-download.usercontent.google.com')) {
                const mboxFilePath = findMboxFile(extractPath);
                if (mboxFilePath) {
                  const jsonOutputPath = path.join(
                    extractPath,
                    `${platformId}.json`,
                  );

                  try {
                    console.log('Converting MBOX to JSON:', mboxFilePath);
                    const accountID =
                      new URL(url).searchParams.get('authuser') || '0';
                    await convertMboxToJson(
                      mboxFilePath,
                      jsonOutputPath,
                      accountID,
                      'Google',
                      'Gmail',
                      platformId,
                    );
                    console.log('MBOX converted to JSON:', jsonOutputPath);

                    mainWindow?.webContents.send(
                      'export-complete',
                      'Google',
                      'Gmail',
                      platformId,
                      extractPath,
                      getTotalFolderSize(extractPath),
                    );
                  } catch (error) {
                    console.error('Error converting MBOX to JSON:', error);
                    mainWindow?.webContents.send('download-error', {
                      fileName,
                      error: 'Error converting MBOX to JSON: ' + error.message,
                    });
                  }
                } else {
                  console.log('No MBOX file found in the extracted content.');
                }
              }

              // ... existing code ...
              else if (url.includes('file.notion.so')) {
                try {
                  const { jsonOutputPath, exportData } =
                    await processNotionExport(
                      extractPath,
                      platformId,
                      timestamp,
                    );

                  mainWindow?.webContents.send(
                    'export-complete',
                    'Notion',
                    'Notion',
                    platformId,
                    extractPath,
                    getTotalFolderSize(extractPath),
                  );
                } catch (error) {
                  console.error('Error processing Notion export:', error);
                  mainWindow?.webContents.send('download-error', {
                    fileName,
                    error: 'Error processing Notion export: ' + error.message,
                  });
                }
              }
              else if (
                url.includes(
                  'proddatamgmtqueue.blob.core.windows.net/exportcontainer/',
                ) ||
                url.includes('https://chatgpt.com/backend-api/content')
              ) {
                try {
                  const outputPath = parseChatGPTConversations(
                    extractPath,
                    platformId,
                    timestamp,
                  );
                  mainWindow?.webContents.send(
                    'export-complete',
                    'OpenAI',
                    'ChatGPT',
                    platformId,
                    extractPath,
                    getTotalFolderSize(extractPath),
                  );
                } catch (error) {
                  console.error('Error processing ChatGPT export:', error);
                  mainWindow?.webContents.send('download-error', {
                    fileName,
                    error: 'Error processing ChatGPT export: ' + error.message,
                  });
                }
              } else {
                console.log('Unknown export, you will need to handle it!');
              }

              // mainWindow?.webContents.send(
              //   'export-complete',
              //   path.basename(companyPath),
              //   path.basename(platformPath),
              //   platformId,
              //   extractPath,
              //   getTotalFolderSize(extractPath)
              // );
            } catch (error) {
              console.error('Error extracting ZIP:', error);
              mainWindow?.webContents.send('download-error', {
                fileName,
                error: 'Error extracting ZIP: ' + error.message,
              });
            }
          } else {
            console.log('Non-zip file. No extraction needed.');
            mainWindow?.webContents.send(
              'export-complete',
              path.basename(companyPath),
              path.basename(platformPath),
              platformId,
              idPath,
              getTotalFolderSize(idPath),
            );
          }
        })
        .catch((error: Error) => {
          console.error('Download failed:', error);
          console.error('Error stack:', error.stack);
          mainWindow?.webContents.send('download-error', {
            fileName,
            error: error.message,
          });
        });
    },
  );

  // Only handle background running in production
  if (app.isPackaged) {
    mainWindow.on('close', (event) => {
      if (!isQuitting) {
        event.preventDefault();
        mainWindow?.hide();
        return false;
      }
      return true;
    });
  } else {
    // In development, just close normally
    mainWindow.on('close', () => {
      mainWindow = null;
    });
  }
};

ipcMain.on('open-external', (event, url) => {
  shell.openExternal(url);
});

ipcMain.on('check-for-updates', () => {
  autoUpdater
    .checkForUpdates()
    .then((updateCheckResult) => {
      if (
        updateCheckResult.updateInfo &&
        updateCheckResult.updateInfo.version &&
        updateCheckResult.updateInfo.version === app.getVersion()
      ) {
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'No Updates',
          buttons: ['OK'],
          message: 'You are already on the latest version.',
        });
      }
    })
    .catch((err) => {
      dialog.showErrorBox(
        'Update Error',
        'Failed to check for updates: ' + err.toString(),
      );
    });
});

ipcMain.on(
  'handle-update',
  (event, company, name, platformId, data, runID, customFilePath = null) => {
    const userData = app.getPath('userData');
    const filePath = customFilePath
      ? customFilePath
      : path.join(
          userData,
          'exported_data',
          company,
          name,
          platformId,
          `${platformId}.json`,
        );

    let existingData;
    if (fs.existsSync(filePath)) {
      try {
        existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        // Check if the existing data has the correct structure
        if (
          !existingData.company ||
          !existingData.name ||
          !existingData.runID ||
          !existingData.timestamp ||
          !Array.isArray(existingData.content)
        ) {
          throw new Error('Invalid data structure');
        }
      } catch (error) {
        console.error('Error reading or parsing existing file:', error);
        // If there's an error or invalid structure, we'll create a new structure
        existingData = null;
      }
    }

    if (!existingData) {
      // Create the necessary directories if they don't exist
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      // Initialize the file with the basic structure
      existingData = {
        company,
        name,
        runID,
        timestamp: Date.now(),
        content: [],
      };
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
    }

    let parsedData = JSON.parse(data);

    // Add the added_to_db key
    parsedData.added_to_db = new Date().toISOString();

    // Append the updated email content to the existing data
    existingData.content.push(parsedData);

    // Write the updated data
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
  },
);

ipcMain.on(
  'handle-update-complete',
  (event, runID, platformId, company, name, customFilePath = null) => {
    const filePath = customFilePath
      ? customFilePath
      : path.join(
          app.getPath('userData'),
          'exported_data',
          company,
          name,
          platformId,
          `${platformId}.json`,
        );
    console.log('this filepath: ', filePath);
    let folderPath;
    if (filePath.includes('extracted')) {
      folderPath = path.join(
        app.getPath('userData'),
        'exported_data',
        company,
        name,
        platformId,
        'extracted',
      );
    } else {
      folderPath = path.join(
        app.getPath('userData'),
        'exported_data',
        company,
        name,
        platformId,
      );
    }

    if (fs.existsSync(filePath)) {
      // here folder path is sent, but could we send filepath?
      mainWindow?.webContents.send(
        'export-complete',
        company,
        name,
        runID,
        folderPath,
        getTotalFolderSize(folderPath),
      );
    }
  },
);

ipcMain.on(
  'handle-export',
  (event, runID, platformId, filename, company, name, content, isUpdated) => {
    // Create export path
    const exportPath = path.join(
      app.getPath('userData'),
      'exported_data',
      company,
      name,
      runID,
    );

    // Create directory structure
    fs.mkdirSync(exportPath, { recursive: true });

    const filePath = path.join(exportPath, `${platformId}_${Date.now()}.json`);

    // Write data
    fs.writeFileSync(
      filePath,
      JSON.stringify(
        {
          company,
          name,
          runID,
          timestamp: Date.now(),
          content: Array.isArray(content) ? content : [content],
        },
        null,
        2,
      ),
    );

    // Notify completion
    mainWindow?.webContents.send(
      'export-complete',
      company,
      name,
      runID,
      exportPath,
      getTotalFolderSize(exportPath),
    );
  },
);

ipcMain.on('connect-website', (event, company) => {
  mainWindow?.webContents.send('connect-website', company);
});

autoUpdater.on('update-available', (info) => {
  dialog
    .showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: `Version ${info.version} is available. Would you like to download it now?`,
      buttons: ['Yes', 'No'],
      defaultId: 0,
      cancelId: 1,
    })
    .then((result) => {
      if (result.response === 0) {
        // User clicked 'Yes'
        mainWindow?.webContents.send('update-download-progress', 0);
        autoUpdater.downloadUpdate();
      }
    });
});

autoUpdater.on('download-progress', (progressObj) => {
  let message = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
  console.log(message);
  // Optionally, send this to the renderer to show a progress bar
  mainWindow?.webContents.send('update-download-progress', progressObj.percent);
});

autoUpdater.on('update-downloaded', (info) => {
  dialog
    .showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message:
        'Update downloaded. The application will restart to install the update.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1,
    })
    .then((result) => {
      if (result.response === 0) {
        mainWindow?.webContents.send('update-download-progress', 100);
        autoUpdater.quitAndInstall();
      } else {
        mainWindow?.webContents.send('update-download-progress', null);
      }
    });
});

autoUpdater.on('error', (info) => {
  console.log('AUTOUPDATER');
  console.log(info);
  dialog.showMessageBox({
    type: 'info', // Can be "none", "info", "error", "question" or "warning"
    title: 'Surfer', // Title of the alert window
    message: String(info), // The content of the alert
    buttons: ['OK'], // Defines a single OK button
  });
  // curWindow.showMessage(info);
});

ipcMain.handle('restart-app', () => {
  app.relaunch();
  app.exit(0);
});

let tray: Tray | null = null;
let forceQuit = false;

app.on('window-all-closed', () => {
  try {
    downloadingItems.forEach((item, key) => {
      if (item) {
        item.cancel();
        downloadingItems.delete(key);
      }
    });
  } catch (error) {
    console.log('DOWNLOAD CANCEL ERROR: ', error);
  }

  if (!app.isPackaged || forceQuit) {
    isQuitting = true;
    app.quit();
  }
});

app
  .whenReady()
  .then(async () => {
    app.setAccessibilitySupportEnabled(true);

    // Only set login items in production
    if (app.isPackaged) {
      app.setLoginItemSettings({
        openAtLogin: true,
        openAsHidden: true,
        path: app.getPath('exe'),
      });
    }

    // Set up Python environment before anything else
    const pythonPath = await setupPythonEnvironment();
    if (!pythonPath) {
      console.error('Failed to set up Python environment');
      // You might want to handle this case appropriately
    }

    await setupExpressServer();
    createWindow();

    autoUpdater.checkForUpdates();

    app.on('activate', () => {
      if (mainWindow === null) {
        createWindow();
      } else {
        mainWindow.show();
      }
    });

    // Only create tray icon in production
    if (app.isPackaged) {
      const iconPath = getAssetPath('icon.png');
      let icon = nativeImage.createFromPath(iconPath);
      icon = icon.resize({
        height: 16,
        width: 16,
      });

      tray = new Tray(icon);
      tray.setToolTip('Surfer');

      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Show Window',
          click: () => {
            if (mainWindow === null) {
              createWindow();
            } else {
              mainWindow.show();
            }
          },
        },
        {
          type: 'separator',
        },
        {
          label: 'Quit',
          click: () => {
            isQuitting = true;
            forceQuit = true;
            app.quit();
          },
        },
      ]);

      tray.setContextMenu(contextMenu);

      tray.on('click', () => {
        if (mainWindow === null) {
          createWindow();
        } else {
          mainWindow.show();
        }
      });
    }
  })
  .catch(console.log);

ipcMain.on('open-folder', (event, folderPath) => {
  if (folderPath) {
    shell
      .openPath(folderPath)
      .then((error) => {
        if (error) {
          console.error('Error opening folder:', error);
          // Optionally, you can send an error message back to the renderer process
          event.reply('open-folder-error', error);
        }
      })
      .catch((error) => {
        console.error('Error opening folder:', error);
        // Optionally, you can send an error message back to the renderer process
        event.reply('open-folder-error', error.message);
      });
  } else {
    console.error('Invalid folder path');
    // Optionally, you can send an error message back to the renderer process
    event.reply('open-folder-error', 'Invalid folder path');
  }
});

ipcMain.on('get-run-files', (event, exportPath) => {
  try {
    console.log('Reading files from:', exportPath);
    const files: { name: string; content: string }[] = [];

    function readFilesRecursively(currentPath: string) {
      const items = fs.readdirSync(currentPath);
      items.forEach((item) => {
        const itemPath = path.join(currentPath, item);
        const stats = fs.statSync(itemPath);
        if (stats.isDirectory()) {
          readFilesRecursively(itemPath);
        } else {
          const fileExtension = path.extname(item).toLowerCase();
          if (['.json'].includes(fileExtension)) {
            const content = fs.readFileSync(itemPath, 'utf-8');
            files.push({ name: item, content });
          }
        }
      });
    }

    readFilesRecursively(exportPath);

    console.log('Files length:', files.length);
    event.reply('run-files', files);
  } catch (error) {
    console.error('Error reading files:', error);
    event.reply('run-files', []); // Always send an array, even if empty
  }
});

ipcMain.on('open-platform-export-folder', (event, company, name) => {
  console.log('open-platform-export-folder', company, name);
  const exportFolderPath = path.join(
    app.getPath('userData'),
    'exported_data',
    company,
    name,
  );
  console.log('exportFolderPath', exportFolderPath);
  shell.openPath(exportFolderPath);
});