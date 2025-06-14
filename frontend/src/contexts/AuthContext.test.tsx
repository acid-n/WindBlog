import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { jwtDecode } from 'jwt-decode';

jest.mock('jwt-decode');

beforeEach(() => {
  localStorage.clear();
  (jwtDecode as jest.Mock).mockReturnValue({ user_id: 1 });
});

test('login сохраняет токены и пользователя', async () => {
  const wrapper = ({ children }: any) => <AuthProvider>{children}</AuthProvider>;
  const { result } = renderHook(() => useAuth(), { wrapper });
  await act(async () => {
    await result.current.login('access', 'refresh');
  });
  expect(localStorage.getItem('accessToken')).toBe('access');
  expect(result.current.user).not.toBeNull();
});

test('logout очищает токены', () => {
  localStorage.setItem('accessToken', 'a');
  const wrapper = ({ children }: any) => <AuthProvider>{children}</AuthProvider>;
  const { result } = renderHook(() => useAuth(), { wrapper });
  act(() => {
    result.current.logout();
  });
  expect(localStorage.getItem('accessToken')).toBeNull();
});

