import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { BackHandler } from 'react-native';

const RouteHistoryContext = createContext(null);

const AUTH_PATHS = new Set(['/', '/login', '/register']);
const USER_ROOT_PATHS = new Set([
  '/(tabs)/home',
  '/(tabs)/english-pro',
  '/(tabs)/leaderboard',
  '/(tabs)/profile',
  '/(tabs)/settings',
  '/home',
  '/english-pro',
  '/leaderboard',
  '/profile',
  '/settings',
]);
const USER_HOME_FALLBACK_PATHS = new Set([
  '/notifications',
  '/flashcard',
  '/payment',
  '/quiz',
  '/(tabs)/english-pro',
]);
const USER_SETTINGS_FALLBACK_PATHS = new Set([
  '/app-settings',
  '/change-password',
  '/create-exam',
  '/history',
  '/language',
  '/profile-info',
  '/saved-exams',
]);
const USER_SHARED_PATHS = new Set([
  '/app-settings',
  '/change-password',
  '/create-exam',
  '/flashcard',
  '/history',
  '/language',
  '/notifications',
  '/payment',
  '/profile-info',
  '/quiz',
  '/saved-exams',
]);

const normalizePath = (path) => {
  if (!path) return '';
  const [withoutQuery] = String(path).split('?');
  return withoutQuery.replace(/\/$/, '') || '/';
};

const toVisiblePath = (path) => normalizePath(path).replace(/^\/\(tabs\)/, '');

const isAdminPath = (path) => {
  const normalized = normalizePath(path);
  return normalized === '/admin' || normalized.startsWith('/admin/');
};

const isUserPath = (path) => {
  const normalized = normalizePath(path);
  const visiblePath = toVisiblePath(path);
  return normalized.startsWith('/(tabs)') || USER_ROOT_PATHS.has(visiblePath) || USER_SHARED_PATHS.has(normalized);
};

export const isBackPathAllowedForRole = (path, user) => {
  const normalized = normalizePath(path);
  if (!user || !normalized || AUTH_PATHS.has(normalized)) return false;

  const isAdmin = user.isAdmin || user.role === 'ADMIN';
  return isAdmin ? isAdminPath(normalized) : isUserPath(normalized);
};

const isRootPathForRole = (path, user) => {
  const normalized = normalizePath(path);
  if (!user || !normalized) return false;

  const isAdmin = user.isAdmin || user.role === 'ADMIN';
  return isAdmin ? normalized === '/admin' : USER_ROOT_PATHS.has(toVisiblePath(normalized));
};

const getDefaultFallbackPath = (path, user) => {
  const normalized = normalizePath(path);
  if (!user || !normalized) return null;

  const isAdmin = user.isAdmin || user.role === 'ADMIN';
  if (isAdmin) {
    return normalized.startsWith('/admin/') ? '/admin' : null;
  }

  if (USER_SETTINGS_FALLBACK_PATHS.has(normalized)) return '/(tabs)/settings';
  if (USER_HOME_FALLBACK_PATHS.has(normalized)) return '/(tabs)/home';
  return null;
};

export function RoleBackProvider({ children }) {
  const pathname = usePathname();
  const historyRef = useRef([]);

  useEffect(() => {
    const normalized = normalizePath(pathname);
    if (!normalized) return;

    const history = historyRef.current;
    if (history[history.length - 1] === normalized) return;

    history.push(normalized);
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }
  }, [pathname]);

  const value = useMemo(() => ({
    getPreviousPath: () => {
      const history = historyRef.current;
      return history.length > 1 ? history[history.length - 2] : null;
    },
  }), []);

  return (
    <RouteHistoryContext.Provider value={value}>
      {children}
    </RouteHistoryContext.Provider>
  );
}

export function useRoleBack(fallbackPath = null) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const history = useContext(RouteHistoryContext);

  const canGoBackSafely = useCallback(() => {
    if (isRootPathForRole(pathname, user)) return false;
    if (!router.canGoBack()) return false;
    return isBackPathAllowedForRole(history?.getPreviousPath?.(), user);
  }, [history, pathname, router, user]);

  const goBack = useCallback(() => {
    if (canGoBackSafely()) {
      router.back();
      return true;
    }

    const resolvedFallbackPath = fallbackPath || getDefaultFallbackPath(pathname, user);
    if (toVisiblePath(resolvedFallbackPath) === toVisiblePath(pathname)) return false;

    if (isBackPathAllowedForRole(resolvedFallbackPath, user)) {
      router.navigate(resolvedFallbackPath);
      return true;
    }

    return false;
  }, [canGoBackSafely, fallbackPath, pathname, router, user]);

  const handleHardwareBack = useCallback(() => {
    if (!user) return false;
    goBack();
    return true;
  }, [goBack, user]);

  return { canGoBackSafely, goBack, handleHardwareBack };
}

export function RoleBackHardwareGuard() {
  const { handleHardwareBack } = useRoleBack();

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => sub.remove();
  }, [handleHardwareBack]);

  return null;
}
