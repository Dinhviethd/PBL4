import { useTabCommunication } from "@/utils/tabCommunication";
import { useState } from "react";

const TabCommunicationTest = () => {
  const tabCommunication = useTabCommunication();
  const [testResults, setTestResults] = useState([]);

  const addTestResult = (message) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runTests = () => {
    setTestResults([]);
    
    // Test 1: Basic connection
    addTestResult("Starting tab communication tests...");
    tabCommunication.testConnection();
    addTestResult("Sent test message to other tabs");

    // Test 2: Register as password reset tab
    tabCommunication.registerAsPasswordResetTab();
    addTestResult("Registered current tab as password reset tab");

    // Test 3: Check if has password reset tab
    const hasTab = tabCommunication.hasPasswordResetTab();
    addTestResult(`Has password reset tab: ${hasTab}`);

    // Test 4: Clear password reset tab
    setTimeout(() => {
      tabCommunication.clearPasswordResetTab();
      addTestResult("Cleared password reset tab info");
      
      const hasTabAfterClear = tabCommunication.hasPasswordResetTab();
      addTestResult(`Has password reset tab after clear: ${hasTabAfterClear}`);
    }, 2000);
  };

  const simulateRedirect = () => {
    const success = tabCommunication.requestPasswordResetRedirect("/auth/confirm-password-reset?token=123&email=test@example.com");
    addTestResult(`Redirect request sent: ${success ? 'Success' : 'Failed - No target tab'}`);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Tab Communication Test</h2>
      
      <div className="space-y-4 mb-6">
        <button 
          onClick={runTests}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Run Tests
        </button>
        
        <button 
          onClick={simulateRedirect}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ml-2"
        >
          Simulate Redirect
        </button>
        
        <button 
          onClick={() => setTestResults([])}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 ml-2"
        >
          Clear Results
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Test Results:</h3>
        <div className="space-y-1 font-mono text-sm">
          {testResults.length === 0 ? (
            <p className="text-gray-500">No tests run yet</p>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className="text-gray-800">{result}</div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <h4 className="font-semibold mb-2">Instructions:</h4>
        <ol className="list-decimal list-inside space-y-1">
          <li>Open this page in multiple tabs</li>
          <li>Run tests in one tab</li>
          <li>Check console in other tabs for received messages</li>
          <li>Test redirect functionality between tabs</li>
        </ol>
      </div>
    </div>
  );
};

export default TabCommunicationTest;