import fs from 'fs';
import path from 'path';
import { mboxParser } from 'mbox-parser';
import yauzl from 'yauzl';
import { app } from 'electron'

export function checkConnectedPlatforms(platforms: any[]) {
  const userDataPath = app.getPath('userData');
  const connectedPlatforms : any = {};

  for (const platform of platforms) {
    const { company, name } = platform;
    const platformPath = path.join(userDataPath, 'exported_data', company, name);
    connectedPlatforms[platform.id] = fs.existsSync(platformPath);
  }

  return connectedPlatforms;
}

export async function convertMboxToJson(
  mboxFilePath: string,
  jsonOutputPath: string,
  id: string,
  company: string,
  name: string,
  runID: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(mboxFilePath);

    const cleanEmailBody = (body: string | undefined): string => {
      if (!body) return '';
      return body
        // Remove image links
        .replace(/\[https?:\/\/[^\]]+\]/g, '')
        // Remove URLs
        .replace(/https?:\/\/\S+/g, '')
        // Remove unicode control characters and null bytes
        .replace(/[\u0000-\u001F\u007F-\u009F\u000f\u0007]/g, '')
        // Remove HTML tags
        .replace(/<[^>]*>/g, '')
        // Remove CSS styles
        .replace(/[^{]*\{[^}]*\}/g, '')
        // Remove HTML entities
        .replace(/&[a-z]+;/g, ' ')
        // Remove HTML attributes
        .replace(/\s*[a-zA-Z-]+=\"[^\"]*\"/g, '')
        // Remove multiple spaces
        .replace(/\s+/g, ' ')
        // Replace all newlines with spaces
        .replace(/\n/g, ' ')
        // Remove leading/trailing whitespace
        .trim();
    };

    const data = {
      company,
      name,
      runID,
      timestamp: Date.now(),
      content: [],
    };

    mboxParser(readStream)
      .then((messages) => {
        messages.forEach((message) => {
          const jsonMessage = {
            accountID: id,
            from: message.from?.text,
            to: Array.isArray(message.to) 
              ? message.to.map(t => t.text).join(', ')
              : message.to?.text || '',
            subject: message.subject,
            timestamp: message.date,
            body: cleanEmailBody(message.text),
            added_to_db: new Date().toISOString(),
          };

          data.content.push(jsonMessage);
        });

        fs.writeFileSync(jsonOutputPath, JSON.stringify(data, null, 2));
        console.log('MBOX to JSON conversion completed');
        resolve();
      })
      .catch((error) => {
        console.error('Error parsing MBOX:', error);
        reject(error);
      });
  });
}

export const findMboxFile = (dir: string): string | null => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      const result = findMboxFile(filePath);
      if (result) return result;
    } else if (file.toLowerCase().endsWith('.mbox')) {
      return filePath;
    }
  }
  return null;
};

export function extractZip(source: string, target: string) {
  return new Promise((resolve, reject) => {
    yauzl.open(source, { lazyEntries: true }, (err, zipfile) => {
        if (err) return reject(err);

        zipfile.readEntry();
        zipfile.on('entry', (entry) => {
          const fullPath = path.join(target, entry.fileName);
          const directory = path.dirname(fullPath);

          if (/\/$/.test(entry.fileName)) {
            // Directory entry
            try {
              fs.mkdirSync(fullPath, { recursive: true });
              zipfile.readEntry();
            } catch (err) {
              reject(err);
            }
          } else {
            // File entry
            try {
              fs.mkdirSync(directory, { recursive: true });
              zipfile.openReadStream(entry, (err, readStream) => {
                if (err) return reject(err);
                const writeStream = fs.createWriteStream(fullPath);
                readStream.on('end', () => {
                  writeStream.end();
                  zipfile.readEntry();
                });
                readStream.pipe(writeStream);
              });
            } catch (err) {
              reject(err);
            }
          }
        });

        zipfile.on('end', resolve);
        zipfile.on('error', reject);
      });
    });
  }

export function getTotalFolderSize(folderPath: string): number {
  let totalSize = 0;
  const files = fs.readdirSync(folderPath);

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isFile()) {
        totalSize += stats.size;
      } else if (stats.isDirectory()) {
        totalSize += getTotalFolderSize(filePath);
      }
    }

    return totalSize;
  }

export async function processNotionExport(
  extractPath: string,
  platformId: string,
  timestamp: number
): Promise<{ jsonOutputPath: string; exportData: any }> {
  const files: { title: string; text: string }[] = [];

  function readNotionFiles(extractPath: string) {
    const items = fs.readdirSync(extractPath);

    for (const item of items) {
      const fullPath = path.join(extractPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        readNotionFiles(fullPath);
      } else if (item.endsWith('.md')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        files.push({
          title: path.basename(item, '.md'),
          text: content,
        });
      }
    }
  }

  readNotionFiles(extractPath);

  const exportData = {
    company: 'Notion',
    name: 'Notion',
    runID: `${platformId}`,
    timestamp: timestamp,
    content: files,
  };

  const jsonOutputPath = path.join(
    extractPath,
    `${platformId}-${timestamp}.json`
  );
  
  fs.writeFileSync(
    jsonOutputPath,
    JSON.stringify(exportData, null, 2)
  );

  return { jsonOutputPath, exportData };
}

interface Message {
  text: string;
  type: 'ai' | 'human';
  timestamp?: number;
}

interface Conversation {
  title: string;
  messages: Message[];
}

export function parseChatGPTConversations(extractPath: string, platformId: string, timestamp: number) {
  // Read the conversations.json file
  const filePath = path.join(extractPath, 'conversations.json');
  const rawData = fs.readFileSync(filePath, 'utf8');
  const conversations = JSON.parse(rawData);

  // Transform the conversations into the desired format
  const parsedConversations: Conversation[] = conversations.map((conv: any) => {
    const messages: Message[] = [];
    const nodes = Object.values(conv.mapping);
    
    // Sort nodes by create_time to maintain conversation order
    const sortedNodes = nodes
      .filter((node: any) => 
        node.message && 
        node.message.content && 
        node.message.content.parts && 
        node.message.content.parts[0] !== ""
      )
      .sort((a: any, b: any) => {
        const timeA = a.message.create_time || 0;
        const timeB = b.message.create_time || 0;
        return timeA - timeB;
      });

    // Extract messages from sorted nodes
    sortedNodes.forEach((node: any) => {
      messages.push({
        text: node.message.content.parts[0],
        type: node.message.author.role === 'assistant' ? 'ai' : 'human',
        timestamp: node.message.create_time
      });
    });

    return {
      title: conv.title,
      messages
    };
  });

  // Write the transformed data to a new JSON file
  const outputPath = path.join(extractPath, '1_parsed_conversations.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    company: 'OpenAI',
    name: 'ChatGPT',
    runID: platformId,
    timestamp: timestamp,
    content: parsedConversations
  }, null, 2));

  return outputPath;
}
