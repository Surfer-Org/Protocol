import { parseISO, isToday, isYesterday, format } from 'date-fns';

const GITHUB_BASE_URL = 'https://github.com/Surfer-Org/Protocol/tree/main';

export const formatLastRunTime = (dateString: string) => {
  const date = parseISO(dateString);
  if (isToday(date)) {
    return `Today at ${format(date, 'h:mm a')}`;
  } else if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'h:mm a')}`;
  } else {
    return format(date, "MMM d, yyyy 'at' h:mm a");
  }
};

export const formatExportSize = (sizeInBits: number) => {
  if (!sizeInBits) return 'Unknown size';

    const units = ['KB', 'MB', 'GB', 'TB'];
    let size = sizeInBits / (8 * 1024); // Convert bits to KB
    let unitIndex = 0;

    while (size >= 1000 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    // Format to a maximum of 4 digits
    let formattedSize;
    if (size >= 100) {
      formattedSize = Math.round(size).toString();
    } else if (size >= 10) {
      formattedSize = size.toFixed(1);
    } else {
      formattedSize = size.toFixed(2);
    }

  return `${formattedSize} ${units[unitIndex]}`;
};



export const getCodeExamples = async (run: any) => {
  const fetchGithubFile = async (path: string) => {
    const response = await fetch(
      `https://raw.githubusercontent.com/Surfer-Org/Protocol/main/${path}`
    );
    return response.text();
  };

  const claudePath = 'cookbook/python/claude-mcp/README.md';
  const claudeCode = await fetchGithubFile(claudePath);

  const dashboardPath = 'cookbook/python/streamlit-chatbot/app.py';
  const dashboardCode = await fetchGithubFile(dashboardPath);

  const knowledgeGraphPath = 'cookbook/python/knowledge-graph/app.py';
  const knowledgeGraphCode = await fetchGithubFile(knowledgeGraphPath);

  return {
    dashboard: {
      code: dashboardCode,
      githubUrl: `${GITHUB_BASE_URL}/${dashboardPath}`
    },
    knowledge_graph: {
      code: knowledgeGraphCode,
      githubUrl: `${GITHUB_BASE_URL}/${knowledgeGraphPath}`
    },
    claude: {
      code: claudeCode,
      githubUrl: `${GITHUB_BASE_URL}/${claudePath}`
    }
  };    
};

export const getLanguageFromFilename = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  const extensionMap: { [key: string]: string } = {
    'js': 'javascript',
    'jsx': 'jsx',
    'ts': 'typescript',
    'tsx': 'tsx',
    'py': 'python',
    'md': 'markdown',
    'json': 'json',
    'html': 'html',
    'css': 'css',
    'yml': 'yaml',
    'yaml': 'yaml',
    'sh': 'bash',
    'bash': 'bash',
    'sql': 'sql',
    // Add more mappings as needed
  };

  return extensionMap[extension || ''] || 'plaintext';
};