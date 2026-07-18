import { useNexusStore } from "./lib/store";
import SetupScreen from "./components/SetupScreen";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import Terminal from "./components/Terminal";
import AIWorkspace from "./components/AIWorkspace";
import Scanner from "./components/Scanner";

function App() {
  const { config, activeTab } = useNexusStore();

  if (!config.isSetupComplete) {
    return <SetupScreen />;
  }

  return (
    <Layout>
      {activeTab === "dashboard" && <Dashboard />}
      {activeTab === "scanner" && <Scanner />}
      {activeTab === "workspace" && <AIWorkspace />}
      {activeTab === "terminal" && <Terminal />}
    </Layout>
  );
}

export default App;
