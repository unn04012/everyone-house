import { NavLink } from 'react-router-dom';

/** 데스크톱 상단 내비게이션. 모바일에서는 화면별 topbar 를 쓴다. */
export function AppNav({ trailing, desktopOnly = false }: { trailing?: React.ReactNode; desktopOnly?: boolean }) {
  return (
    <nav className={desktopOnly ? 'app-nav desktop-only' : 'app-nav'}>
      <span className="brand">
        <span className="brand__mark" aria-hidden="true" />
        공공임대 알리미
      </span>
      {trailing ?? (
        <span className="nav-links">
          <NavLink to="/" className={({ isActive }) => (isActive ? 'is-active' : undefined)} end>
            공고 결과
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
            내 프로필
          </NavLink>
        </span>
      )}
    </nav>
  );
}
