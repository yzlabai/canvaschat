// Client-side user service functions

export async function getUserInfo() {
  try {
    const response = await fetch('/api/userinfo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const result = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.message || 'Failed to get user info');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
}
