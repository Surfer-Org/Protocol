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
  status: 'pending' | 'running' | 'success' | 'error' | 'stopped';
  url: string;
  exportSize?: number;
  exportPath?: string;
  company: string;
  name: string;
  currentStep?: string;
  isUpdated?: boolean;
  vectorize_config?: any;
  logs?: string;
}