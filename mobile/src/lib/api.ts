import AsyncStorage from '@react-native-async-storage/async-storage';

// Use 10.0.2.2 for Android Emulator, or localhost for iOS simulator
const API_BASE_URL = 'http://10.0.2.2:5000/api/v1';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  let token = '';
  try {
    const authStorage = await AsyncStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      token = parsed?.state?.token || '';
    }
  } catch (e) {
    console.error('Failed to parse auth token', e);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'An error occurred while fetching data');
  }

  return data;
}
