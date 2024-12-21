import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { ChevronLeft, ChevronRight, Eye, Square, Bug } from 'lucide-react';
import { IAppState } from '../types/interfaces';
import {
  setActiveRunIndex,
  toggleRunVisibility,
  stopRun,
  adjustActiveRunIndex,
  updateRunURL,
  updateExportStatus,
  updateRunLogs,
  updateRunConnected
} from '../state/actions';
import { Button } from './ui/button';

const FullScreenOverlay = styled.div<{ isVisible: boolean }>`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 50;
  display: flex;
  flex-direction: column;
  opacity: ${(props) => (props.isVisible ? 1 : 0)};
  pointer-events: ${(props) => (props.isVisible ? 'auto' : 'none')};
  transition: opacity 0.1s ease-in-out;
`;

const WebviewContainer = styled.div`
  flex-grow: 1;
  padding: 16px;
  background-color: #f0f0f0;
`;

const FakeBrowser = styled.div`
  background-color: #2c2c2c;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  height: 100%;
`;

const BrowserHeader = styled.div`
  background-color: #3c3c3c;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const RunCounter = styled.span`
  color: white;
  font-size: 14px;
`;

const RightSection = styled.div`
  display: flex;
  gap: 16px;
`;

const HeaderButton = styled.button`
  background-color: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #ffffff1a;
  }
`;

const StopButton = styled(HeaderButton)`
  background-color: #ff5f56;
  color: white;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  font-weight: 500;

  &:hover {
    background-color: #ff3b30;
  }
`;

const HideButton = styled(HeaderButton)`
  background-color: #4a4a4a;
  color: white;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  font-weight: 500;

  &:hover {
    background-color: #5a5a5a;
  }
`;

const NavButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const IconButton = styled.button`
  background-color: transparent;
  border: none;
  cursor: ${(props) => (props.disabled ? 'default' : 'pointer')};
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s;
  color: white;

  &:hover {
    background-color: ${(props) =>
      props.disabled ? 'transparent' : '#ffffff1a'};
  }
`;
interface WebviewManagerProps {
  webviewRefs: { [key: string]: React.RefObject<HTMLIFrameElement> };
  getWebviewRef: (runId: string) => React.RefObject<HTMLIFrameElement>;
}

import { debounce } from 'lodash'; // Make sure to import debounce from lodash

const WebviewManager: React.FC<WebviewManagerProps> = ({
  webviewRefs,
  getWebviewRef,
}) => {
  const dispatch = useDispatch();
  const runs = useSelector((state: IAppState) => state.app.runs);
  const activeRuns = runs.filter(
    (run) => run.status === 'pending' || run.status === 'running',
  );
  const activeRunIndex = useSelector(
    (state: IAppState) => state.app.activeRunIndex,
  );
  const isRunLayerVisible = useSelector(
    (state: IAppState) => state.app.isRunLayerVisible,
  );


  useEffect(() => {
    if (activeRuns.length === 0 && isRunLayerVisible) {
      dispatch(toggleRunVisibility());
    }
  }, [activeRuns, isRunLayerVisible, dispatch]);


  const handleNewRun = async (id: string | null = null, isSignIn: boolean = false) => {
    const newRun = id ? runs.find((run) => run.id === id) : runs[runs.length - 1];
    window.electron.ipcRenderer.send('run-started', newRun);
    if (!newRun) return;

    if (isSignIn) {
      dispatch(updateRunConnected(newRun.id, true));
    }

    if (newRun.status === 'running') {
      console.log('Run started:', newRun);
      if (!id) {
        dispatch(updateRunLogs(newRun.id, null));
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
      const webviewRef = getWebviewRef(newRun.id);
      
      if (webviewRef.current) {
        webviewRef.current.send(  
          'export-platform',
          newRun.id,
          newRun.platformId,
          newRun.filename,
          newRun.company,
          newRun.name,
          newRun.isUpdated
        );
      }
    }
  };

  const handleLogs = useCallback((runId: string, ...logs: any[]) => {
    console.log('these are the logs: ', logs)
    const run = runs.find((run) => run.id === runId);
    if (!run) return;
    dispatch(updateRunLogs(runId, logs));
  }, [dispatch, runs]);

  const handleChangeUrl = useCallback(async (url: string, id: string) => {
    const run = runs.find((run) => run.id === id);
    dispatch(updateRunURL(id, url));
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const webviewRef = getWebviewRef(id);
    console.log('SENDING TO THIS WEBVIEW REF!!! ', webviewRef.current);
    handleNewRun();
    //webviewRef.current?.send('change-url-success', url, id);
  }, [dispatch, runs, getWebviewRef]);

  useEffect(() => {
    window.electron.ipcRenderer.on('console-log', handleLogs);

    return () => {
      window.electron.ipcRenderer.removeAllListeners('console-log', handleLogs);
    };
  }, [runs.length])
  
  useEffect(() => {
    const ipcMessageHandler = async (event) => {
      const { channel, args } = event;

      if (channel === 'get-run-id') { 
        const run = runs.find((run) => run.status === 'running' && run.name === args[0]);
        if (run) {
          console.log('sent run id');
          const webviewRef = getWebviewRef(run.id);
          webviewRef.current?.send('got-run-id', run.id);
        }
      }

      if (channel === 'console-log') {
        handleLogs(args[0], ...args.slice(1));
      }

      if (channel === 'toggle-visibility') {
        dispatch(toggleRunVisibility());
      }

      if (channel === 'change-url') {
        await handleChangeUrl(args[0], args[1]);
      }

    };

    const webviewRefsArray = Object.values(webviewRefs);
    webviewRefsArray.forEach((webviewRef) => {
      if (webviewRef.current) {
        webviewRef.current.addEventListener('ipc-message', ipcMessageHandler);
      }
    });

    return () => {
      webviewRefsArray.forEach((webviewRef) => {
        if (webviewRef.current) {
          webviewRef.current.removeEventListener('ipc-message', ipcMessageHandler);
        }
      });
    };
  }, [runs.length]);

  useEffect(() => {
    if (runs.length > 0) {
      handleNewRun();
    }
  }, [runs.length]);

  useEffect(() => {
    const handleExportComplete = async (
      company: string,
      name: string,
      runID: number,
      folderPath: string,
      exportSize: number
    ) => {

      if (runID.toString().slice(-4) === '-001'){
        const downloadRun = activeRuns.filter(
          (run) => run.platformId === runID.toString(),
        )[0];

        console.log('stopping download run: ', downloadRun); 
        dispatch(updateExportStatus(company, name, downloadRun.id, folderPath, exportSize));
      }


       else {
        console.log(
          'stopping run for platform id: ',
          company,
          name,
          ', and runID: ',
          runID,
        );

        dispatch(updateExportStatus(company, name, runID.toString(), folderPath, exportSize));
       }
       // start vectorization here!!!
       const vectorization_response = await window.electron.ipcRenderer.invoke('vectorize-last-run', runID.toString());
       console.log('vectorization_response: ', vectorization_response);

    };



    window.electron.ipcRenderer.on('export-complete', handleExportComplete);

    return () => {
      window.electron.ipcRenderer.removeAllListeners('export-complete');
    };
  }, [runs.length]);

  useEffect(() => {
    dispatch(adjustActiveRunIndex());
  }, [runs.length, dispatch]);

  const handlePrevRun = () => {
    dispatch(setActiveRunIndex(activeRunIndex - 1));
  };

  const handleNextRun = () => {
    dispatch(setActiveRunIndex(activeRunIndex + 1));
  };

  const handleStopRun = async () => {
    const activeRun = activeRuns[activeRunIndex];
    if (
      activeRun &&
      (activeRun.status === 'pending' || activeRun.status === 'running')
    ) {
      dispatch(stopRun(activeRun.id));
      console.log('Stopping run:', activeRun.id);
    }
  };

  // Update active run index whenever runs change
  useEffect(() => {
    const newActiveRuns = runs.filter(
      (run) => run.status === 'pending' || run.status === 'running',
    );
    if (newActiveRuns.length > 0) {
      const newIndex = Math.min(activeRunIndex, newActiveRuns.length - 1);
      dispatch(setActiveRunIndex(newIndex));
    } else {
      dispatch(setActiveRunIndex(-1)); // No active runs
    }
  }, [runs, dispatch]);

  const isActiveRunStoppable = () => {
    const activeRun = activeRuns[activeRunIndex];
    return activeRun && activeRun.status === 'running';
  };

  const currentRunIndex = Math.min(activeRunIndex, activeRuns.length - 1);

  const handleOpenDevTools = () => {
    const activeRun = activeRuns[activeRunIndex];
    if (activeRun) {
      const webviewRef = getWebviewRef(activeRun.id);
      webviewRef.current?.openDevTools();
    }
  };

  // useEffect(() => {
  //   handleOpenDevTools();
  // }, [webviewRefs.length]);
  
  function modifyUserAgent(userAgent) {
    // Regular expression to match the Chrome version
    const chromeVersionRegex = /(Chrome\/)\d+(\.\d+){3}/;

    // Replace the Chrome version with 127.0.0.0
    return userAgent.replace(chromeVersionRegex, '$1127.0.0.0');
  }

  useEffect(() => {
    const webviewRefsArray = Object.values(webviewRefs);
    webviewRefsArray.forEach((webviewRef) => {
      if (webviewRef.current) {
        const setWebview = () => {
          const oldAgent = webviewRef.current.getUserAgent();
          const newAgent = modifyUserAgent(oldAgent);

          webviewRef.current.setUserAgent(newAgent);
          webviewRef.current.setZoomFactor(0.8);
        };

        webviewRef.current.addEventListener('dom-ready', setWebview);
        webviewRef.current.addEventListener('did-navigate', setWebview);
        webviewRef.current.addEventListener('did-navigate-in-page', setWebview);

        return () => {
          webviewRef.current.removeEventListener('dom-ready', setWebview);
          webviewRef.current.removeEventListener('did-navigate', setWebview);
          webviewRef.current.removeEventListener('did-navigate-in-page', setWebview);
        };
      }
    });
  }, [runs.length]); 
 
  const lastNavigationTimes: { [runId: string]: number } = {};

  const debouncedHandleNewRun = debounce((runId: string) => {
    handleNewRun(runId);
  }, 1000); // Debounce for 1 second

  const handleDidNavigate = (event: Electron.DidNavigateEvent, runId: string) => {
    if (!event.url.includes('about:blank')) {
      const now = Date.now();
      if (lastNavigationTimes[runId] && now - lastNavigationTimes[runId] < 3000) {
        console.log('Ignoring duplicate navigation for:', runId);
        return;
      }

      lastNavigationTimes[runId] = now;

      console.log('Navigating webview for run:', runId);
      debouncedHandleNewRun(runId);

      console.log('Webview navigated to:', event.url);
    }
  };

  useEffect(() => {
    const webviewRefsArray = Object.entries(webviewRefs);
    webviewRefsArray.forEach(([runId, webviewRef]) => {
      if (webviewRef.current) {
        console.log('Adding did-navigate event listener for run:', runId);
        webviewRef.current.addEventListener('did-navigate', (event) => handleDidNavigate(event, runId));
      }
    });

    return () => {
      webviewRefsArray.forEach(([runId, webviewRef]) => {
        if (webviewRef.current) {
          console.log('Removing did-navigate event listener for run:', runId);
          webviewRef.current.removeEventListener('did-navigate', (event) => handleDidNavigate(event, runId));
        }
      });
    };
  }, [runs.length]);


  return (
    <FullScreenOverlay isVisible={isRunLayerVisible}>
      <WebviewContainer>
        <FakeBrowser>
          <BrowserHeader>
            <LeftSection>
              <NavButtons>
                <IconButton onClick={handleOpenDevTools}>
                  <Bug size={18} color="#ffffffb3" />
                </IconButton>
                <IconButton
                  onClick={handlePrevRun}
                  disabled={activeRunIndex === 0}
                >
                  <ChevronLeft size={16} />
                </IconButton>
                <RunCounter>{`${currentRunIndex + 1}/${activeRuns.length}`}</RunCounter>
                <IconButton
                  onClick={() => handleNextRun()}
                  disabled={activeRunIndex === activeRuns.length - 1}
                >
                  <ChevronRight size={16} />
                </IconButton>
              </NavButtons>
            </LeftSection>
            <RightSection>
              {activeRuns[activeRunIndex] && !activeRuns[activeRunIndex].isConnected && (
                <Button
                  onClick={() => handleNewRun(activeRuns[activeRunIndex].id, true)}
                  style={{ marginRight: '8px' }}
                >
                  I've signed in to {activeRuns[activeRunIndex].name}!
                </Button>
              )}
              {isActiveRunStoppable() && (
                <>
                  <StopButton onClick={handleStopRun}>
                    <Square size={16} fill="white" />
                    <span>Stop</span>
                  </StopButton>  
                  <HideButton onClick={() => dispatch(toggleRunVisibility())}>
                    <Eye size={16} />
                    <span>Hide</span>
                  </HideButton>
                </>
              )}
            </RightSection>
          </BrowserHeader>
          <div style={{ position: 'relative', height: 'calc(100% - 40px)' }}>
            {activeRuns.map((run, index) => (
              <div key={run.id} style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: index === activeRunIndex ? 'block' : 'none',
              }}>
                <webview
                  src={run.url}
                  ref={getWebviewRef(run.id)}
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                  id={`webview-${run.id}`}
                  allowpopups=""
                  nodeintegration="true"
                  crossOrigin="anonymous"
                />
              </div>
            ))}
          </div>
        </FakeBrowser>
      </WebviewContainer>
    </FullScreenOverlay>
  );
};

export default WebviewManager;
