import { combineReducers } from 'redux';
import {
  IAppState,
  IPreferences,
  IRun,
} from '../types/interfaces';
import { initialAppState } from './initialStates';

const preferencesReducer = (
  state: IPreferences = initialAppState.preferences,
  action: any,
): IPreferences => {
  switch (action.type) {
    case 'SET_CONTENT_SCALE':
      return { ...state, contentScale: action.payload }; // Add this case for contentScale
    default:
      return state;
  }
};




const appReducer = (state = initialAppState.app, action: any) => {
  switch (action.type) {
    // App-related cases
    case 'SET_CURRENT_ROUTE':
      return { ...state, route: action.payload.route };
    case 'SET_ACTIVE_RUN_INDEX':
      return {
        ...state,
        activeRunIndex: Math.min(Math.max(0, action.payload), state.runs.length - 1)
      };
    case 'TOGGLE_RUN_VISIBILITY':
      return { ...state, isRunLayerVisible: !state.isRunLayerVisible };
    case 'SET_IS_RUN_LAYER_VISIBLE':
      return { ...state, isRunLayerVisible: action.payload };
    case 'UPDATE_BREADCRUMB':
      return { ...state, breadcrumb: action.payload };
    case 'UPDATE_BREADCRUMB_TO_INDEX':
      return { ...state, breadcrumb: state.breadcrumb.slice(0, action.payload + 1) };
    case 'SET_IS_FULL_SCREEN':
      return { ...state, isFullScreen: action.payload };
    case 'SET_IS_MAC':
      return { ...state, isMac: action.payload };

    // Runs-related cases
    case 'START_RUN':
      return { ...state, runs: [...state.runs, action.payload] };
    case 'DELETE_RUN':
      //if the last run is closed, set isRunLayerVisible to false
      return { ...state, runs: state.runs.filter(run => run.id !== action.payload), isRunLayerVisible: state.runs.length > 0 };
    case 'UPDATE_RUN_STATUS':
      return {
        ...state,
        runs: state.runs.map(run =>
          run.id === action.payload.runId
            ? { ...run, status: action.payload.status, endDate: action.payload.endDate }
            : run
        )
      };
    case 'UPDATE_STEP_STATUS':
      return {
        ...state,
        runs: state.runs.map(run =>
          run.id === action.payload.runId
            ? {
                ...run,
                tasks: run.tasks.map(task =>
                  task.id === action.payload.taskId
                    ? {
                        ...task,
                        steps: task.steps.map(step =>
                          step.id === action.payload.stepId
                            ? {
                                ...step,
                                status: action.payload.status,
                                startTime: action.payload.startTime,
                                endTime: action.payload.endTime,
                                logs: action.payload.logs || step.logs
                              }
                            : step
                        )
                      }
                    : task
                )
              }
            : run
        )
      };

    case 'STOP_RUN':
      return {
        ...state,
        runs: state.runs.map(run =>
          run.id === action.payload.runID
            ? { ...run, status: 'stopped', endDate: new Date().toISOString() }
            : run
        ),
        isRunLayerVisible: state.runs.some(run => run.status === 'running')
      };
    case 'UPDATE_EXPORT_STATUS':

      return {
        ...state,
        runs: state.runs.map(run =>
          run.id === action.payload.runID
            ? { ...run, status: 'success', exportPath: action.payload.exportPath, exportSize: action.payload.exportSize, endDate: new Date().toISOString() }
            : run
        )
      };
    case 'SET_EXPORT_RUNNING':
      return {
        ...state,
        runs: state.runs.map(run =>
          run.id === action.payload.runId
            ? { ...run, status: action.payload.isRunning ? 'running' : 'pending' }
            : run
        )
      };

    case 'BIG_STEPPER':
      return {
        ...state,
        runs: state.runs.map(run => {
          if (run.id === action.payload.runId) {

              return { ...run, currentStep: action.payload.step };
            
          }
          return run;
        })
      };
    case 'UPDATE_RUN_LOGS':
      return {
        ...state,
        runs: state.runs.map(run =>
          run.id === action.payload.runId
            ? { ...run, logs: action.payload.logs != null ? run.logs + action.payload.logs.join('\n') + '\n' : '' }
            : run
        )
      };
    case 'STOP_ALL_JOBS':
      return {
        ...state,
        runs: state.runs.map(run => ({
          ...run,
          status: run.status === 'running' ? 'stopped' : run.status,
          endDate: run.status === 'running' ? new Date().toISOString() : run.endDate,
          tasks: run.tasks.map(task => ({
            ...task,
            status: task.status === 'running' ? 'stopped' : task.status,
            endTime: task.status === 'running' ? new Date().toISOString() : task.endTime,
            steps: task.steps.map(step => ({
              ...step,
              status: step.status === 'running' ? 'stopped' : step.status,
              endTime: step.status === 'running' ? new Date().toISOString() : step.endTime,
            })),
          })),
        }))
      };
    case 'UPDATE_RUN_URL':
      return {
        ...state,
        runs: state.runs.map(run =>
          run.id === action.payload.runId
            ? { ...run, url: action.payload.newUrl }
            : run
        )
      };
    case 'UPDATE_EXPORT_SIZE':
      return {
        ...state,
        runs: state.runs.map(run =>
          run.id === action.payload.runId
            ? { ...run, exportSize: action.payload.size }
            : run
        )
      };

      case 'UPDATE_RUN_CONNECTED':
        return {
          ...state,
          runs: state.runs.map(run =>
            run.id === action.payload.runId
              ? { ...run, isConnected: action.payload.isConnected }
              : run
          )
        }
    case 'SET_VECTORIZATION_PROGRESS':
      return {
        ...state,
        runs: state.runs.map(run => 
          run.id === action.payload.runId
            ? { ...run, vectorization_progress: action.payload.progress }
            : run
        )
      };

    case 'CLEAR_VECTORIZATION_PROGRESS':
      return {
        ...state,
        runs: state.runs.map(run => 
          run.id === action.payload.runId
            ? { ...run, vectorization_progress: undefined }
            : run
        )
      };
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  preferences: preferencesReducer,
  app: appReducer,
});

export default rootReducer;

// Update the selector to get the active run
export const getActiveRun = (state: IAppState) => {
  const { runs, activeRunIndex } = state.app;
  return runs[activeRunIndex] || null;
};
