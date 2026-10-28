import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell, ProtectedRoute } from "./components/layout";
import { AccountScreen } from "./features/account";
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
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
