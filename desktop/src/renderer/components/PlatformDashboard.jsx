import { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { startRun, toggleRunVisibility, setExportRunning, setVectorizationProgress, clearVectorizationProgress } from '../state/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { ArrowUpRight, Check, X, Link, Search, ChevronLeft, ChevronRight, Eye, Plus } from 'lucide-react';
import { Input } from "./ui/input";
import RunDetails from './RunDetails';
import ConfettiExplosion from 'react-confetti-explosion';
import { TooltipProvider } from "./ui/tooltip";
import { formatLastRunTime} from '../helpers';
import { MoonLoader } from 'react-spinners';
import { IoSync } from "react-icons/io5";
import { useToast } from "./ui/use-toast";
import { Progress } from './ui/progress'

const PlatformDashboard = ({ onPlatformClick, webviewRef }) => {
  const dispatch = useDispatch();
  const runs = useSelector(state => state.app.runs);
  const runsWithProgress = runs.filter(run => run.vectorization_progress && run.vectorization_progress.percentage !== 100);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [selectedRun, setSelectedRun] = useState(null);
  const [completedRuns, setCompletedRuns] = useState({});
  const prevRunsRef = useRef({});
  const [platformLogos, setPlatformLogos] = useState({});
  const [connectedPlatforms, setConnectedPlatforms] = useState({});
  const [filteredPlatforms, setFilteredPlatforms] = useState([]);
  const [allPlatforms, setAllPlatforms] = useState([]);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isVectorizing, setIsVectorizing] = useState(false);


useEffect(() => {
  console.log('runsWithProgress: ', runsWithProgress);
}, [runsWithProgress]);

useEffect(() => {
  // Listen for runs request from main process
  const handleGetRunsRequest = () => {
    // Get runs from IndexedDB
    window.electron.ipcRenderer.send('get-runs-response', runs);
  };

  window.electron.ipcRenderer.on('get-runs', handleGetRunsRequest);

  // Cleanup listener
  return () => {
    window.electron.ipcRenderer.removeAllListeners('get-runs', handleGetRunsRequest);
  };
}, [runs]);

useEffect(() => {
    window.electron.ipcRenderer.on('stop-runs', () => {
        // Stop all pending or running runs
        const activeRuns = runs.filter(run => 
            run && (run.status === 'pending' || run.status === 'running')
        );

        // Stop each run
        activeRuns.forEach(run => {
            dispatch(stopRun(run.id));
        });

        // Notify main process that runs have been stopped
        window.electron.ipcRenderer.sendMessage('runs-stopped');
    });

    // Cleanup listener
    return () => {
        window.electron.ipcRenderer.removeAllListeners('stop-runs');
    };
}, [runs]); // Add runs as dependency

  const getLatestRun = (platformId) => {
    const platformRuns = runs.filter(run => run.platformId === platformId);
    if (platformRuns.length === 0) return null;

    return platformRuns.reduce((latest, current) => {
      const latestDate = latest.startDate ? new Date(latest.startDate) : new Date(0);
      const currentDate = current.startDate ? new Date(current.startDate) : new Date(0);
      return currentDate > latestDate ? current : latest;
    });
  };


  useEffect(() => {
    const loadPlatforms = async () => {
      try {
        const platforms = await window.electron.ipcRenderer.invoke('get-platforms');
        console.log('platforms: ', platforms);
        setAllPlatforms(platforms);
      } catch (error) {
        console.error('Error loading platforms:', error);
        setAllPlatforms([]);
      }
    };

    loadPlatforms();
  }, []);

  useEffect(() => {
    setFilteredPlatforms(allPlatforms.filter(platform =>
      platform.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      platform.company.toLowerCase().includes(searchTerm.toLowerCase())
    ));
  }, [searchTerm, allPlatforms]);


  useEffect(() => {
    const checkConnectedPlatforms = async () => {
      const connected = await window.electron.ipcRenderer.invoke('check-connected-platforms', allPlatforms);
      setConnectedPlatforms(connected);
    };

    checkConnectedPlatforms();
  }, [allPlatforms]);

  useEffect(() => {
    const handleElementFound = (id) => {
      const platform = allPlatforms.find(p => p.id === id);
      console.log('PLATFORM: ', platform);
      if (platform) {
        setConnectedPlatforms(prev => ({ ...prev, [platform.id]: true }));
        
        toast({
          title: `${platform.name} Connected!`,
          description: "You can now fetch data from this platform.",
          duration: 3000,
        });
      }
    };

    window.electron.ipcRenderer.on('element-found', handleElementFound);

    return () => {
      window.electron.ipcRenderer.removeListener('element-found', handleElementFound);
    };
  }, [allPlatforms, toast]);

  useEffect(() => {
    const handleAPIExport = (id) => {
      const platform = allPlatforms.find(p => p.id === id);
      if (connectedPlatforms[platform.id]) { // if platform is connected then export
        handleExportClick(platform);
      }

      else {
        toast({
          title: `${platform.name} Not Connected!`,
          description: "Please connect the platform before exporting.",
          duration: 3000,
        });
      }
    };

    window.electron.ipcRenderer.on('api-export', handleAPIExport);

    return () => {
      window.electron.ipcRenderer.removeListener('api-export', handleAPIExport);
    };
  }, []);

  const pageCount = Math.ceil(filteredPlatforms.length / itemsPerPage);
  const paginatedPlatforms = filteredPlatforms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const clearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const getCurrentDB = async () => {
    const currentDB = await window.electron.ipcRenderer.invoke('get-current-db');
    console.log('currentDB: ', currentDB);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleExportClick = async (platform) => {
    console.log('platform: ', platform);


    const newRun = {
      id: `${platform.id}-${Date.now()}`,
      filename: platform.filename,
      isConnected: true,
      company: platform.company,
      name: platform.name,
      platformId: platform.id,
      tasks: [],
      startDate: new Date().toISOString(),
      status: 'running',
      isUpdated: platform.isUpdated,
      exportSize: null, 
      url: 'about:blank',
      vectorize_config: platform.vectorize_config,
      vectorization_progress: 0,
    }; 


    dispatch(startRun(newRun));
    dispatch(toggleRunVisibility());
    dispatch(setExportRunning(newRun.id, true));
  };

  const getPlatformLogo = async (platform) => {
    try {

      // FIX SO THAT WE GET THIS WORKING FOR LINKEDIN WHICH HAS A LOGO URL!
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

  useEffect(() => {
    filteredPlatforms.forEach(platform => {
      if (!platformLogos[platform.id]) {
        getPlatformLogo(platform);
      }
    });
  }, [filteredPlatforms]);

  const isExportRunning = useCallback((platformId) => {
    return runs.some(run => run.platformId === platformId && run.status === 'running');
  }, [runs]);

  const isExportVectorizing = useCallback((platformId) => {
    return runs.some(run => run.platformId === platformId && run.vectorization_progress.percentage !== 100);
  }, [runs]);


const renderRunStatus = (platform) => {
  const latestRun = getLatestRun(platform.id);
  if (!latestRun ) return null;

  // Show loading spinner if running and no logs
  if (latestRun.status === 'running' && (!latestRun.logs || latestRun.logs.length === 0)) {
    return <div><MoonLoader size={16} color="#888888" /></div>;
  }

  const logLines = latestRun && latestRun.logs ? latestRun.logs.split('\n') : [];

  switch (latestRun.status) {
    case 'running':
      return (
        <div className="flex items-center w-full">
          <div id="log-container" className="w-full max-h-[100px] overflow-y-auto bg-gray-100 dark:bg-gray-900 text-green-600 dark:text-green-400 p-2 rounded">
            <pre className="font-mono text-xs whitespace-pre-wrap break-all m-0">
              {logLines.map((line, index) => (
                <span key={index} className={line === 'YOU NEED TO SIGN IN (click the eye in the top right)!' ? 'text-red-500' : ''}>
                  {line}
                  {index < logLines.length - 1 && '\n'}
                </span>
              ))}
            </pre>
          </div>
        </div>
      );

    case 'success':
      return (
        <div className="flex items-center space-x-2">
          {completedRuns[latestRun.id] && (
            <ConfettiExplosion
              particleCount={50}
              width={200}
              duration={2200}
              force={0.4}
            />
          )}
          <div>
            <Check className="text-green-500" size={16} />
          </div>
          <span className="text-gray-500">-</span>
          <span
            className="cursor-pointer flex items-center hover:underline"
            onClick={() => setSelectedRun(latestRun)}
          >
            {formatLastRunTime(latestRun.endDate || latestRun.startDate)}
            <ArrowUpRight size={22} className="ml-1" color="#5a5a5a" />
          </span>
        </div>
      );

    case 'error':
    case 'stopped':
      return (
        <div className="flex items-center space-x-2">
          <X className="text-red-500" size={16} />
          <span className="text-gray-500">-</span>
          <span className="hover:underline cursor-pointer" onClick={() => setSelectedRun(latestRun)}>
          {formatLastRunTime(latestRun.endDate || latestRun.startDate)}
          </span>
        </div>
      );

    default:
      return null;
  }
};

  useEffect(() => {
    const logContainers = document.querySelectorAll('#log-container');
    if (logContainers) {
      logContainers.forEach(container => {
        container.scrollTop = container.scrollHeight;
      });
    }
  }, [runs]);

  useEffect(() => {
    runs.forEach(run => {
      const prevRun = prevRunsRef.current[run.id];
      if (prevRun && prevRun.status === 'running' && run.status === 'success' && !completedRuns[run.id]) {
        setCompletedRuns(prev => ({ ...prev, [run.id]: true }));
        setSelectedRun(run);
        setTimeout(() => {
          setCompletedRuns(prev => {
            const newState = { ...prev };
            delete newState[run.id];
            return newState;
          });
        }, 2200); // Duration of the confetti explosion
      }
    });

    // Update prevRunsRef for the next render
    prevRunsRef.current = runs.reduce((acc, run) => {
      acc[run.id] = run;
      return acc;
    }, {});
  }, [runs]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await window.electron.ipcRenderer.invoke('search-vector-db', searchQuery);
      console.log('results: ', results);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };
// useEffect(() => {
//   console.log('vectorizationProgress: ', vectorizationProgress);
// }, [vectorizationProgress]);

  useEffect(() => {
    const handleVectorDBProgress = (progress) => {
      const [platformId, current, total] = progress.split(':');
      const percentage = Math.round((parseInt(current) / parseInt(total)) * 100);
      
      // Find ALL running platforms with matching platformId
      const currentRun = runs
        .filter(run => run.platformId === platformId)
        .reduce((latest, current) => {
          if (!latest) return current;
          const latestDate = latest.startDate ? new Date(latest.startDate) : new Date(0);
          const currentDate = current.startDate ? new Date(current.startDate) : new Date(0);
          return currentDate > latestDate ? current : latest;
        }, null);

      //   // Only update if the progress is increasing or it's the same total
      //   (!run.vectorization_progress || 
      //    run.vectorization_progress.total === parseInt(total) ||
      //    parseInt(current) > run.vectorization_progress.current)
      // );

      if (currentRun) {
        dispatch(setVectorizationProgress(currentRun.id, {
          current: parseInt(current),
          total: parseInt(total),
          percentage
        }));
      }
    };

    window.electron.ipcRenderer.on('vector-db-progress', handleVectorDBProgress);
    return () => {
      window.electron.ipcRenderer.removeAllListeners('vector-db-progress');
    };
  }, [runs, dispatch]);

  useEffect(() => {
    const handleVectorDBOutput = (output) => {
      console.log('vectorDBOutput: ', output);
    };

    window.electron.ipcRenderer.on('vector-db-output', handleVectorDBOutput);
    return () => {
      window.electron.ipcRenderer.removeAllListeners('vector-db-output');
    };
  }, [runs.length]);

  return (
    <div className="w-full h-full flex-col px-[50px] pt-6 pb-6 select-none">
      <div className="flex-shrink-0 mb-4">
        <div className="relative w-full max-w-2xl">
          <div className="flex items-center mb-2 space-x-4">
            <div className="flex justify-between items-center w-full">
              <div className="relative flex-grow mr-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="text"
                  placeholder="Search company or platform..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 pr-10 w-full"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* <Button className='cursor-pointer' onClick={getCurrentDB}>Get Current DB</Button> */}

      {/* <div className="mt-4 space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Search vector database..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button 
            variant="outline" 
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>
        
        {searchResults && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Search Results</h3>
            <div className="space-y-2">
              {searchResults.documents.map((doc, index) => (
                <div key={searchResults.ids[index]} className="p-4 border rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">
                    Score: {(1 - searchResults.distances[index]).toFixed(4)}
                  </div>
                  <div>{doc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div> */}


      {/* <Button className='mb-2 mt-2' variant="outline" size="sm" onClick={vectorizeLastRun} disabled={isVectorizing}>
        <IoSync 
          size={16} 
          className={`mr-2 ${isVectorizing ? 'animate-spin' : ''}`}
        />
        {isVectorizing ? 'Vectorizing...' : 'Vectorize Last Run'}
      </Button> */}
      
      {paginatedPlatforms.length > 0 ? (
        <div className="flex flex-col flex-grow overflow-hidden">
          <div className="overflow-x-auto overflow-y-hidden">
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Platform</TableHead>
                    <TableHead></TableHead>
                    <TableHead>Latest Run</TableHead>
                    <TableHead>Actions</TableHead>
                    {runsWithProgress.length > 0  && <TableHead>Vectorization Progress</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPlatforms.map((platform) => {
                    const platformRun = runs.find(run => run.platformId === platform.id);
                    return (
                      <TableRow key={platform.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <div
                              className="flex items-center space-x-2 cursor-pointer hover:underline"
                              onClick={() => onPlatformClick(platform)}
                            >
                 {platformLogos[platform.id] && (
                  <img 
                    src={platformLogos[platform.id]} 
                    alt={platform.name} 
                    className="flex-shrink-0" 
                    style={{ width: '24px', height: '24px' }}
                  />
                )}
                            <div className="flex items-center min-w-0">
                              <p className="flex items-center whitespace-nowrap overflow-hidden">
                                <span className="font-semibold">{platform.name}</span>
                              </p>
                              <ArrowUpRight size={22} className="ml-1 flex-shrink-0" color="#5a5a5a" />
                            </div>
                          </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{platform.description || 'No description available'}</p>
                        </TableCell>
                        <TableCell>
                          {renderRunStatus(platform)}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {!connectedPlatforms[platform.id] && platform.needsConnection ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.electron.ipcRenderer.send('connect-platform', platform)}
                              >
                                <Link size={16} className="mr-2" />
                                Connect
                              </Button>
                            ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleExportClick(platform)}
                                  disabled={isExportRunning(platform.id) || isExportVectorizing(platform.id)}
                                >
                                  <IoSync
                                    size={16}
                                    className={`mr-2 ${isExportRunning(platform.id) ? 'animate-spin' : ''}`}
                                  />
                                  {isExportRunning(platform.id) ? 'Fetching...' : 'Fetch Data'}
                                </Button>
      
                            )}
                          </div>
                        </TableCell>
                        {runsWithProgress.length > 0 && (
                          <TableCell>
                            {runsWithProgress.find(run => run.platformId === platform.id)?.vectorization_progress ? (
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={runsWithProgress.find(run => run.platformId === platform.id)?.vectorization_progress.percentage} 
                                  className="w-[100px]"
                                />
                                <span className="text-sm text-gray-500">
                                  {runsWithProgress.find(run => run.platformId === platform.id)?.vectorization_progress.percentage}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">N/A</span>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TooltipProvider>
          </div>
          {filteredPlatforms.length > itemsPerPage && (
            <div className="flex-shrink-0 flex justify-between items-center mt-4">
              <div>
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPlatforms.length)} of {filteredPlatforms.length} platforms
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pageCount}
                >
                  Next
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center py-8 bg-gray-100 rounded-md">
            <p className="text-gray-500 text-lg">Didn't find anything? <a className="underline cursor-pointer" onClick={() => window.electron.ipcRenderer.send('open-external', 'https://github.com/Surfer-Org/Protocol/blob/main/desktop/ADD_PLATFORMS.md')}>Build a platform for "{searchTerm}"</a></p>
            <button
              onClick={clearSearch}
              className="mt-2 text-blue-500 hover:underline"
            >
              Clear search
            </button>
          </div>
        </div>
      )}
      {selectedRun && (
        <RunDetails
          runId={selectedRun.id}
          onClose={() => setSelectedRun(null)}
        />
      )}
    </div>
  );
};

export default PlatformDashboard;
