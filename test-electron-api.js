// Simple test to verify electronAPI is available
console.log('Testing electronAPI availability...');

// Check if we're in an Electron environment
if (typeof window !== 'undefined' && window.electronAPI) {
  console.log('✅ electronAPI is available');
  console.log('Available methods:', Object.keys(window.electronAPI));
  
  // Test a simple method
  window.electronAPI.getInstalledGames()
    .then(games => {
      console.log('✅ getInstalledGames works:', games);
    })
    .catch(error => {
      console.error('❌ getInstalledGames failed:', error);
    });
} else {
  console.error('❌ electronAPI is not available');
  console.log('Window object:', typeof window);
  console.log('electronAPI:', typeof window?.electronAPI);
} 