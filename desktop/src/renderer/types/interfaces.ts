export interface IPreferences {
  contentScale: number;
}

export interface IAppState {
  preferences: IPreferences;
  app: {
    route: string;
    activeRunIndex: number;
    isFullScreen: boolean;
    isMac: boolean;
    isRunLayerVisible: boolean;
    breadcrumb: { text: string; link: string }[];
    runs: IRun[];
  };
}

export const initialState: IAppState = {
  preferences: {
    contentScale: 1,
  },
  app: {
    route: '/',
    activeRunIndex: 0,
    isFullScreen: false,
    isMac: false,
    isRunLayerVisible: false,
    breadcrumb: [{ text: 'Home', link: '/' }],
    runs: [],
  },
};


export interface IRun {
  id: string;
  platformId: string;
  filename: string;
  isConnected: boolean;
  startDate: string;
  endDate?: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'stopped' | 'vectorizing';
  url: string;
  exportSize?: number;
  exportPath?: string;
  company: string;
  name: string;
  currentStep?: string;
  isUpdated?: boolean;
  vectorize_config?: any;
  vectorization_progress?: any;
  logs?: string;
  vectorizationProgress?: {
    current: number;
    total: number;
    percentage: number;
  };
}