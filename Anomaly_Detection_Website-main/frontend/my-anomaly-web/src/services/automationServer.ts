export async function triggerBackendAutomation(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('http://localhost:5000/api/automation', { method: 'POST' });
    if (!response.ok) {
      return { success: false, error: 'Failed to trigger backend automation' };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to trigger backend automation' };
  }
}
