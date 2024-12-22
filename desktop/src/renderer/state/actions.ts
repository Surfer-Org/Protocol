import { IPreferences, IUser, IRun } from '../types/interfaces';


export const setApplicationFont = (font: string) => ({
  type: 'SET_APPLICATION_FONT',
  payload: font,
});

export const setContentScale = (scale: number) => ({
  type: 'SET_CONTENT_SCALE',
  payload: scale,
});

export const setDefaultChatPanelPosition = (position: 'left' | 'right') => ({
  type: 'SET_DEFAULT_CHAT_PANEL_POSITION',
  payload: position,
});

export const setHighlightButtons = (highlight: boolean) => ({
  type: 'SET_HIGHLIGHT_BUTTONS',
  payload: highlight,
});

export const setShowSystemMessages = (show: boolean) => ({
  type: 'SET_SHOW_SYSTEM_MESSAGES',
  payload: show,
});

export const setUserProfileActiveTab = (
  tab: IPreferences['userProfileActiveTab']
) => ({
  type: 'SET_USER_PROFILE_ACTIVE_TAB',
  payload: tab,
});

export const setUserOS = (os: IUser['os']) => ({
  type: 'SET_USER_OS',
  payload: os,
});


export const addRun = (run: IRun) => ({
  type: 'ADD_RUN',
  payload: run,
});

export const updateRunStatus = (runId: string, status: IRun['status'], endDate?: string) => ({
  type: 'UPDATE_RUN_STATUS',
  payload: { runId, status, endDate },
});


export const deleteRunsForPlatform = (platformId: string) => ({
  type: 'DELETE_RUNS_FOR_PLATFORM',
  payload: platformId,
});

export const deleteRun = (runId: string) => ({
  type: 'DELETE_RUN',
  payload: runId,
});

export const setActiveWebviewIndex = (index: number) => ({
  type: 'SET_ACTIVE_WEBVIEW_INDEX',
  payload: index,
});

export const startRun = (run: IRun) => ({
  type: 'START_RUN',
  payload: run,
});

export const setActiveRunIndex = (index: number) => ({
  type: 'SET_ACTIVE_RUN_INDEX',
  payload: index,
});

export const adjustActiveRunIndex = () => ({
  type: 'ADJUST_ACTIVE_RUN_INDEX',
});


export const toggleRunVisibility = () => ({
  type: 'TOGGLE_RUN_VISIBILITY',
});

export const stopRun = (runID: string) => ({
  type: 'STOP_RUN',
  payload: { runID },
});

export const updateRunLogs = (runId: string, logs: string[]) => ({
  type: 'UPDATE_RUN_LOGS',
  payload: { runId, logs },
});

export const updateExportStatus = (company: string, name: string, runID: string, exportPath: string, exportSize: number) => ({
  type: 'UPDATE_EXPORT_STATUS',
  payload: { company, name, runID, exportPath, exportSize },
});

export const setExportRunning = (runId: string, isRunning: boolean) => ({
  type: 'SET_EXPORT_RUNNING',
  payload: { runId, isRunning },
});

export const updateBreadcrumb = (breadcrumb: { text: string; link: string }[]) => ({
  type: 'UPDATE_BREADCRUMB',
  payload: breadcrumb,
});

export const setCurrentRoute = (route: string) => ({
  type: 'SET_CURRENT_ROUTE',
  payload: { route },
});

export const setIsFullScreen = (isFullScreen: boolean) => ({
  type: 'SET_IS_FULL_SCREEN',
  payload: isFullScreen,
});

export const setIsMac = (isMac: boolean) => ({
  type: 'SET_IS_MAC',
  payload: isMac,
});

export const updateBreadcrumbToIndex = (index: number) => ({
  type: 'UPDATE_BREADCRUMB_TO_INDEX',
  payload: index,
});

export const stopAllJobs = () => ({
  type: 'STOP_ALL_JOBS',
});

export const updateRunURL = (runId: string, newUrl: string) => ({
  type: 'UPDATE_RUN_URL',
  payload: { runId, newUrl }
});

export const setIsRunLayerVisible = (isVisible: boolean) => ({
  type: 'SET_IS_RUN_LAYER_VISIBLE',
  payload: isVisible,
});

export const updateExportSize = (runId: string, size: string) => ({
  type: 'UPDATE_EXPORT_SIZE',
  payload: { runId, size }
});

export const updateRunConnected = (runId: string, isConnected: boolean) => ({
  type: 'UPDATE_RUN_CONNECTED',
  payload: {runId, isConnected}
})

export const setVectorizationProgress = (runId: string, progress: { current: number; total: number; percentage: number }) => ({
  type: 'SET_VECTORIZATION_PROGRESS',
  payload: { runId, progress },
});

  export const clearVectorizationProgress = (runId: string) => ({
    type: 'CLEAR_VECTORIZATION_PROGRESS',
    payload: { runId },
  });
