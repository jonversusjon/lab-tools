import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useState, useEffect, lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import "./App.css";
import AppHeader from "./components/AppHeader";
import QpcrProtocol from "./components/QpcrProtocol";
import AppNavbar from "./components/AppNavbar";
import {
  initializeDarkMode,
  toggleDarkMode as toggleDarkModeUtil,
  applyDarkMode,
} from "./utils";
import Dashboard from "./pages/Dashboard";

// Lazy load components for better performance
const SerialCalculator = lazy(() =>
  import("./components/SerialCalculator/serialCalculatorPage")
);
const PlateMapGenerator = lazy(() =>
  import("./components/PlateMapGenerator/PlateMapGenerator")
);

// Loading component for lazy-loaded routes
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

// Define route configurations in one place for better maintainability
const ROUTE_CONFIGS = {
  calculatorsTools: {
    "serial-dilution-calculator": {
      component: SerialCalculator,
      title: "Serial Dilution Calculator",
    },
    "plate-map-generator": {
      component: PlateMapGenerator,
      title: "Plate Map Generator",
    },
  },
  assays: {
    qpcr: {
      component: QpcrProtocol,
      title: "qPCR Protocol",
    },
  },
};

// Wrapper component for consistent page layout
const PageWrapper = ({ children }) => (
  <div className="pt-6 pb-10 px-4">
    <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden p-6 transition-colors duration-300">
      {children}
    </div>
  </div>
);

// Component to render pages based on route parameters
function GenericPage() {
  const { tab, child } = useParams();

  // Check for specific routes that should render specific components
  if (tab && child && ROUTE_CONFIGS[tab]?.[child]) {
    const { component: Component, title } = ROUTE_CONFIGS[tab][child];
    return (
      <PageWrapper>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {title}
        </h1>
        <Suspense fallback={<LoadingFallback />}>
          <Component />
        </Suspense>
      </PageWrapper>
    );
  }

  // Default generic page rendering for routes without specific components
  const title = child
    ? child.replace(/-/g, " ")
    : (tab || "Home").replace(/-/g, " ");

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {title}
      </h1>
      <p className="mt-4 text-gray-600 dark:text-gray-300">
        Content for {title} will be displayed here.
      </p>
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
        <p className="text-sm text-blue-600 dark:text-blue-300">
          This is a placeholder page. Specific content for this protocol or tool
          will be added in the future.
        </p>
      </div>
    </PageWrapper>
  );
}

// Tracks current path to enable resume functionality
function RouteTracker() {
  const location = useLocation();
  useEffect(() => {
    localStorage.setItem("lastRoute", location.pathname);
  }, [location]);
  return null;
}

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const initialDarkMode = initializeDarkMode();
    setDarkMode(initialDarkMode);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = toggleDarkModeUtil(darkMode);
    setDarkMode(newDarkMode);
    applyDarkMode(newDarkMode);
  };

  return (
    <BrowserRouter>
      <RouteTracker />
      <div className="min-h-screen transition-colors duration-300 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <AppHeader darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <AppNavbar />
        <Suspense fallback={<LoadingFallback />}>
          <ErrorBoundary>
            <Routes>
              {/* Dashboard landing page with resume support */}
              <Route path="/" element={<Dashboard />} />
              {/* Handle all nav paths */}
              <Route path="/:tab" element={<GenericPage />} />
              <Route path="/:tab/:child" element={<GenericPage />} />

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}

export default App;
