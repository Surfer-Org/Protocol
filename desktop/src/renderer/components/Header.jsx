import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Eye, Home, Moon, Sun, Users, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faDiscord } from '@fortawesome/free-brands-svg-icons';
import { useSelector, useDispatch } from 'react-redux';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from "./ui/breadcrumb";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { useTheme } from './ui/theme-provider';
import { setCurrentRoute, toggleRunVisibility, updateBreadcrumbToIndex, setIsMac, setIsFullScreen } from '../state/actions';
import { Button } from './ui/button';
import { Toggle } from './ui/toggle';
import { setIsRunLayerVisible } from '../state/actions';

const getStyleHorizontalLock = (style) =>
  style?.transform
    ? {
        ...style,
        transform: `translate(${style.transform.split(',')[0].split('(').pop()}, 0px)`,
      }
    : style;

const StyledSurferHeader = styled.div`
  align-items: center;
  border-bottom-style: solid;
  border-bottom-width: 0.8px;
  border-color: hsl(var(--border));
  display: flex;
  gap: 16px;
  height: 55px;
  padding: 13.72px 13px 14.28px;
  position: relative;
  width: 100%;
  -webkit-app-region: drag;
  user-select: none;
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));

  & .div {
    align-items: center;
    display: flex;
    height: 36px;
    flex: 1;
    flex-grow: 1;
    justify-content: space-between;
    margin-bottom: -4.49px;
    margin-top: -4.49px;
    position: relative;
  }

  & .header-main-content {
    align-items: center;
    display: flex;
    flex: 1;
    flex-grow: 1;
    gap: 16px;
    position: relative;
  }

  & .browser-controls {
    height: 13px;
    position: relative;
    width: 52px;
  }

  & .option-expand {
    background-color: #27ca40;
    border: 0.5px solid;
    border-color: #3eaf3f;
    border-radius: 6px;
    height: 12px;
    left: 40px;
    position: absolute;
    top: 1px;
    width: 12px;
  }

  & .option-minimize {
    background-color: #ffc130;
    border: 0.5px solid;
    border-color: #e1a325;
    border-radius: 6px;
    height: 12px;
    left: 20px;
    position: absolute;
    top: 1px;
    width: 12px;
  }

  & .option-close {
    background-color: #ff6058;
    border: 0.5px solid;
    border-color: #e14942;
    border-radius: 6px;
    height: 12px;
    left: 0;
    position: absolute;
    top: 1px;
    width: 12px;
  }

  & .header-tabs {
    display: flex;
    flex: 1;
    overflow-x: auto;
    padding-right: 24px;
    -webkit-app-region: drag;
    align-items: center;
    height: 100%;
  }

  & .tabs-container {
    display: flex;
    flex: 1;
    align-items: center;
    height: 100%;
    overflow: hidden; // Hide overflowing content during transitions
  }

  & .img-button,
  & .history-button {
    height: 32px;
    width: 32px;
    background-color: hsl(var(--secondary));
    border-radius: 9999px;
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    -webkit-app-region: no-drag;
    transition:
      background-color 0.2s ease,
      color 0.2s ease;
    color: hsl(var(--secondary-foreground));
  }

  & .img-button:hover,
  & .history-button:hover {
    background-color: hsl(var(--accent));
    color: hsl(var(--accent-foreground));
  }


  & .surfer-tab {
    align-items: center;
    background-color: hsl(var(--background));
    border-radius: 9999px;
    display: flex;
    justify-content: space-between;
    padding: 6px 6px 6px 12px;
    position: relative;
    margin-right: 8px;
    height: 36px;
    cursor: pointer;
    flex-grow: inherit;
    -webkit-app-region: no-drag;
    transition: background-color 0.2s ease;
  }

  & .surfer-tab:hover {
    background-color: hsl(var(--secondary));
  }

  & .surfer-tab.selected {
    background-color: hsl(var(--secondary));
    color: hsl(var(--secondary-foreground));
  }

  & .div-2 {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
  }

  & .frame-2 {
    height: 18px;
    width: 18px;
    flex-shrink: 0;
    border-radius: 6px;
  }

  & .tab-right-content {
    display: flex;
    align-items: center;
    margin-left: 8px;
  }

  & .close-icon {
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }

  & .close-icon:hover {
    opacity: 1;
  }

  & .px-2 {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  & .py-1\.5 {
    padding-top: 0.375rem;
    padding-bottom: 0.375rem;
  }

  & .text-sm {
    font-size: 0.875rem;
    line-height: 1.25rem;
  }

  & .font-bold {
    font-weight: 700;
  }

  & .text-white {
    color: #ffffff;
  }

  & .tab-name {
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    color: #ffffff;
    display: -webkit-box;
    font-family: 'SF Pro-Medium', Helvetica;
    font-size: 13px;
    font-weight: 500;
    height: 16px;
    left: 0;
    letter-spacing: 0.2px;
    line-height: normal;
    overflow: hidden;
    position: fixed;
    text-overflow: ellipsis;
    top: 0;
  }

  & .span {
    letter-spacing: 0.02px;
  }

  & .tab-name-5 {
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    color: #484848;
    display: -webkit-box;
    font-family: 'Inter-Medium', Helvetica;
    font-size: 13px;
    font-weight: 500;
    height: 15px;
    left: 0;
    letter-spacing: 0.2px;
    line-height: normal;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  & .tab-name-2 {
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    color: #707070;
    display: -webkit-box;
    flex: 1;
    font-family: 'Inter-Medium', Helvetica;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.2px;
    line-height: normal;
    margin-top: -0.5px;
    overflow: hidden;
    position: relative;
    text-overflow: ellipsis;
  }

  & .live-indicator {
    align-items: center;
    display: inline-flex;
    flex: 0 0 auto;
    padding: 0px 0px 0px 8px;
    position: relative;
  }

  & .live-indicator-2 {
    align-items: center;
    display: inline-flex;
    flex: 0 0 auto;
    gap: 4px;
    position: relative;
  }

  & .frame-3 {
    height: 17px;
    position: relative;
    width: 17px;
  }

  & .live-indicator-3 {
    align-items: center;
    background-color: #22c55e1a;
    border-radius: 9999px;
    display: inline-flex;
    flex: 0 0 auto;
    height: 23.99px;
    padding: 3.99px 10px 4px 4px;
    position: relative;
  }

  & .background-2 {
    background-color: #22c55e;
    border-radius: 9999px;
    height: 6px;
    position: relative;
    width: 6px;
    animation: blinkBackground 1s infinite; // Add blinking animation
  }

  @keyframes blinkBackground {
    0% {
      background-color: #22c55e;
    }
    50% {
      background-color: transparent;
    }
    100% {
      background-color: #22c55e;
    }
  }

  & .live-indicator-text {
    color: #22c55e;
    font-family: 'SF Pro Text-Regular', Helvetica;
    font-size: 12px;
    font-weight: 400;
    letter-spacing: 0;
    line-height: 16px;
    margin-top: -1px;
    position: relative;
    white-space: nowrap;
    width: fit-content;
  }

  & .button-menu-2 {
    align-items: center;
    background: linear-gradient(
      180deg,
      rgb(27, 27, 29) 0%,
      rgb(27, 27, 29) 100%
    );
    border-radius: 9999px;
    display: flex;
    flex: 1;
    flex-grow: 1;
    justify-content: space-between;
    padding: 6px 6px 6px 12px;
    position: relative;
  }

  & .p {
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    color: #ffffff;
    display: -webkit-box;
    font-family: 'Inter-Medium', Helvetica;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.2px;
    line-height: normal;
    overflow: hidden;
    position: relative;
    text-overflow: ellipsis;
    width: fit-content;
  }

  & .tab-name-3 {
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    color: #484848;
    display: -webkit-box;
    flex: 1;
    font-family: 'Inter-Medium', Helvetica;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.2px;
    line-height: normal;
    overflow: hidden;
    position: relative;
    text-overflow: ellipsis;
  }

  & .container-wrapper {
    align-items: center;
    display: inline-flex;
    flex: 0 0 auto;
    position: relative;
  }

  & .overlay-2 {
    align-items: center;
    background-color: #c522221a;
    border-radius: 9999px;
    display: inline-flex;
    flex: 0 0 auto;
    height: 23.99px;
    padding: 3.99px 10px 4px 4px;
    position: relative;
  }

  & .background-3 {
    background-color: #c52222;
    border-radius: 9999px;
    height: 6px;
    position: relative;
    width: 6px;
  }

  & .text-wrapper-2 {
    color: #c52222;
    font-family: 'SF Pro Text-Regular', Helvetica;
    font-size: 12px;
    font-weight: 400;
    letter-spacing: 0;
    line-height: 16px;
    margin-top: -1px;
    position: relative;
    white-space: nowrap;
    width: fit-content;
  }

  & .header-option-panel {
    align-items: center;
    display: inline-flex;
    flex: 0 0 auto;
    gap: 8px;
    position: relative;
    -webkit-app-region: no-drag;
    height: 100%;
    // margin-right: 2px;
  }

  & .SVG {
    height: 16px;
    position: relative;
    width: 16px;
  }

  & .text-wrapper-3 {
    color: #ffffffb2;
    font-family: 'SF Pro Text-Regular', Helvetica;
    font-size: 14px;
    font-weight: 400;
    letter-spacing: 0;
    line-height: 20px;
    margin-top: -1px;
    position: relative;
    text-align: center;
    white-space: nowrap;
    width: fit-content;
  }

  & .auth-button {
    cursor: pointer;
    align-items: center;
    background-color: hsl(var(--background));
    border-radius: 9999px;
    display: flex;
    flex-direction: column;
    height: 32px;
    justify-content: center;
    position: relative;
    width: 32px;
    cursor: pointer;
    -webkit-app-region: no-drag;
    transition: background-color 0.2s ease;
  }

  & .auth-button:hover {
    background-color: hsl(var(--background));
    cursor: pointer;
  }

  & .image-user-profile {
    margin-bottom: -2px;
    margin-left: -2px;
    margin-right: -2px;
    margin-top: -2px;
    padding: 3px;
    object-fit: cover;
    position: relative;
    border-radius: 9999px;
    object-fit: fill;
    cursor: pointer;
    background-color: hsl(var(--secondary));
  }

  & .tab-wrapper {
    flex: 1;
    min-width: 0; // Allow tabs to shrink below their content size
    transition: flex 150ms ease; // Changed from 300ms to 150ms
  }

  /* Update animation styles */
  .tab-enter {
    opacity: 0;
    flex: 0.01 !important;
  }
  .tab-enter-active {
    opacity: 1;
    flex: 1 !important;
    transition:
      opacity 150ms ease,
      flex 150ms ease; // Changed from 300ms to 150ms
  }
  .tab-exit {
    opacity: 1;
    flex: 1;
  }
  .tab-exit-active {
    opacity: 0;
    flex: 0.01 !important;
    transition:
      opacity 150ms ease,
      flex 150ms ease; // Changed from 300ms to 150ms
  }
`;

export const Header = () => {
  const dispatch = useDispatch();
  const breadcrumb = useSelector((state) => state.app.breadcrumb);
  const isRunLayerVisible = useSelector((state) => state.app.isRunLayerVisible);
  const runs = useSelector((state) => state.app.runs);
  const isFullScreen = useSelector((state) => state.app.isFullScreen);
  const isMac = useSelector((state) => state.app.isMac);
  const { theme, setTheme } = useTheme();
  const activeRuns = runs.filter((run) => run.status === 'running').length;
  const [allPlatforms, setAllPlatforms] = useState([]); 
  const [platformLogos, setPlatformLogos] = useState({});
  const LOGO_SIZE = 18; // Set a consistent size for all logos
  const [pythonStatus, setPythonStatus] = useState({
    status: 'idle',
    message: ''
  });

  useEffect(() => {
    const loadPlatforms = async () => {
      try {
        const platforms = await window.electron.ipcRenderer.invoke('get-platforms');
        console.log('PLATFORMS: ', platforms);

        setAllPlatforms(platforms);
      } catch (error) {
        console.error('Error loading platforms:', error);
        setAllPlatforms([]);
      }
    };

    loadPlatforms();
  }, []);

  const getPlatformLogo = async (platform) => {
    try {
      const response = await fetch(`https://logo.clearbit.com/${platform.name}.com`);
      if (response.ok) {
        const blob = await response.blob();
        const logoUrl = URL.createObjectURL(blob);
        setPlatformLogos(prev => ({ ...prev, [platform.id]: logoUrl }));
      } else {
        const companyResponse = await fetch(`https://logo.clearbit.com/${platform.company}.com`);
        if (companyResponse.ok) {
          const blob = await companyResponse.blob();
          const logoUrl = URL.createObjectURL(blob);
          setPlatformLogos(prev => ({ ...prev, [platform.id]: logoUrl }));
        } else if (platform.logoURL) {
          const logoUrlResponse = await fetch(platform.logoURL);
          const logoBlob = await logoUrlResponse.blob();  
          const logoUrl = URL.createObjectURL(logoBlob);
          setPlatformLogos(prev => ({ ...prev, [platform.id]: logoUrl }));
        }
      }
    } catch (error) {
      console.error(`Error fetching logo for ${platform.name}:`, error);
      if (platform.logoURL) {
          const logoUrlResponse = await fetch(platform.logoURL);
          const logoBlob = await logoUrlResponse.blob();  
          const logoUrl = URL.createObjectURL(logoBlob);
          setPlatformLogos(prev => ({ ...prev, [platform.id]: logoUrl }));
      }
    }
  };

  const [versionNumber, setVersionNumber] = useState(null);

  useEffect(() => {
    window.electron.ipcRenderer.send('get-version-number');
    const versionNumberListener = (event) => {
      if (event) {
        console.log('Version number:', event);
        setVersionNumber(event);
      }
    };

    window.electron.ipcRenderer.on('version-number', versionNumberListener);

    return () => {
      window.electron.ipcRenderer.removeListener(
        'version-number',
        versionNumberListener,
      );
    };
  }, []);

  const getIconForBreadcrumb = (item) => {
    if (item.text === 'Home') {
      return <Home size={16} className="mr-2" color={theme === 'dark' ? '#ffffff' : '#000000'} />;
    }
    if (item.link.startsWith('/platform/')) {
      const platformId = item.link.split('/')[2];
      const platform = allPlatforms.find(p => p.id === platformId);
      if (platform) {
        if (platformLogos[platform.id]) {
          return (
            <img
              src={platformLogos[platform.id]}
              alt={platform.name}
              className="mr-2"
              style={{ width: `${LOGO_SIZE}px`, height: `${LOGO_SIZE}px` }}
            />
          );
        } else {
          // Trigger logo fetch if not available
          getPlatformLogo(platform);
          return null; // Return null or a placeholder while loading
        }
      }
    }
    return null;
  };

  useEffect(() => {
    const handlePlatformReply = (platform) => {
      console.log('Platform:', platform);
      dispatch(setIsMac(platform === 'darwin'));
    };

    window.electron.ipcRenderer.on('platform', handlePlatformReply);

    window.electron.ipcRenderer.send('get-platform');
    
    return () => {
      window.electron.ipcRenderer.removeListener('platform', handlePlatformReply);
    };
  }, [dispatch]);

  useEffect(() => {
    dispatch(setIsRunLayerVisible(runs.some(run => run.status === 'running') && isRunLayerVisible));
  }, [runs, dispatch]);

  const handleBreadcrumbClick = (link, index) => {
    const parts = link.split('/');
    let view = 'home';

    if (parts.length > 1) {
      view = parts[1];
      if (view === 'platform' && parts.length > 2) {
        const platform = allPlatforms.find(p => p.id === parts[2]);
      }
    }

    dispatch(setCurrentRoute(link));
    dispatch(updateBreadcrumbToIndex(index));
  };

  const handleViewRuns = () => {
    dispatch(toggleRunVisibility()); 
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    // Listen for Python setup progress
    const handlePythonProgress = (data) => {
      setPythonStatus(data);
    };

    window.electron.ipcRenderer.on('python-setup-progress', handlePythonProgress);

    return () => {
      window.electron.ipcRenderer.removeListener('python-setup-progress', handlePythonProgress);
    };
  }, []);

  const renderPythonStatus = () => {
    if (pythonStatus.status === 'idle') return null;

    const statusStyles = {
      starting: { icon: <Loader2 className="animate-spin" size={16} />, color: 'text-blue-500' },
      progress: { icon: <Loader2 className="animate-spin" size={16} />, color: 'text-blue-500' },
      error: { icon: <AlertCircle size={16} />, color: 'text-red-500' },
      warning: { icon: <AlertCircle size={16} />, color: 'text-yellow-500' },
      complete: { icon: <CheckCircle2 size={16} />, color: 'text-green-500' }
    };

    const { icon, color } = statusStyles[pythonStatus.status] || statusStyles.progress;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${color}`}>
              {icon}
              <span className="max-w-[200px] truncate">{pythonStatus.message}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{pythonStatus.message}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <StyledSurferHeader theme={theme} className="bg-background text-foreground">
      <div className="div">
        <div className="header-main-content">
          {!isFullScreen && isMac && <div className="browser-controls" />}
          <div className="header-option-panel">
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumb.map((item, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <BreadcrumbSeparator>/</BreadcrumbSeparator>}
                    <BreadcrumbItem>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBreadcrumbClick(item.link, index)}
                        className="flex items-center px-2 py-1"
                      >
                        {getIconForBreadcrumb(item)}
                        {item.text}
                      </Button>
                    </BreadcrumbItem>  
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
        <div className="header-option-panel">
          {renderPythonStatus()}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-blue-500 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white">
                  v{versionNumber}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Version {versionNumber}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.electron.ipcRenderer.send('open-external', 'https://discord.gg/5KQkWApkYC')}
                  className="flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faDiscord} size="lg" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Join the Surfer Community</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.electron.ipcRenderer.send('open-external', 'https://github.com/Surfer-Org/Protocol/tree/main/desktop')}
                  className="flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faGithub} size="lg" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Contribute to Surfer</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={activeRuns > 0 ? handleViewRuns : undefined}
                  className={`bg-green-500 history-button relative ${activeRuns === 0 ? 'cursor-not-allowed opacity-50' : ''}`}
                  disabled={activeRuns === 0}
                >
                  <Eye size={18} />
                  {activeRuns > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                      {activeRuns}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{activeRuns > 0 ? "View Runs" : "No Active Runs"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  pressed={theme === 'dark'}
                  onPressedChange={handleThemeToggle}
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </StyledSurferHeader>
  );
};
