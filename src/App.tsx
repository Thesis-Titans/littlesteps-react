import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell, ProtectedRoute } from "./components/layout";
import { AboutScreen, AccountScreen, HelpScreen, PrivacyScreen, SettingsScreen } from "./features/account";
import { ExploreScreen } from "./features/explore";
import { JournalScreen } from "./features/journal";
import { MilestonesScreen } from "./features/milestones";
import { ThisWeekScreen } from "./features/this-week";
import { TodayScreen } from "./features/today";

export function App() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/today" element={<TodayScreen />} />
          <Route path="/explore" element={<ExploreScreen />} />
          <Route path="/milestones" element={<MilestonesScreen />} />
          <Route path="/journal" element={<JournalScreen />} />
          <Route path="/this-week" element={<ThisWeekScreen />} />
          <Route path="/account" element={<AccountScreen />} />
          <Route path="/account/settings" element={<SettingsScreen />} />
          <Route path="/account/privacy" element={<PrivacyScreen />} />
          <Route path="/account/about" element={<AboutScreen />} />
          <Route path="/account/help" element={<HelpScreen />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
