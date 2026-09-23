import { HashRouter, Route, Routes } from 'react-router-dom';
import { ApiProvider } from './app/api-context.js';
import { ProfileProvider } from './app/profile-context.js';
import { NoticeDetailPage } from './pages/NoticeDetailPage.js';
import { OnboardingPage } from './pages/OnboardingPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { QuestionPage } from './pages/QuestionPage.js';
import { ResultPage } from './pages/ResultPage.js';

/**
 * 정적 사이트(Render Static Site)로 배포하므로 서버 rewrite 없이 도는 HashRouter 를 쓴다.
 * 배포 설정이 생기면 BrowserRouter 로 바꿔도 화면 코드는 그대로다.
 */
export function App() {
  return (
    <ApiProvider>
      <ProfileProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<ResultPage />} />
            <Route path="/notices/:noticeId" element={<NoticeDetailPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/question/:field" element={<QuestionPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<ResultPage />} />
          </Routes>
        </HashRouter>
      </ProfileProvider>
    </ApiProvider>
  );
}
