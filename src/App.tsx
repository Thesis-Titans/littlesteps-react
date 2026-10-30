import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell, ProtectedRoute } from "./components/layout";
import { AccountScreen } from "./features/account";
import { ChildGate } from "./features/children/components/ChildGate";
import { ChildrenScreen } from "./features/children/components/ChildrenScreen";
import { EditChildScreen } from "./features/children/components/EditChildScreen";
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
          <Route element={<ChildGate />}>
            <Route path="/today" element={<TodayScreen />} />
            <Route path="/explore" element={<ExploreScreen />} />
            <Route path="/milestones" element={<MilestonesScreen />} />
            <Route path="/journal" element={<JournalScreen />} />
            <Route path="/this-week" element={<ThisWeekScreen />} />
          </Route>
          <Route path="/account" element={<AccountScreen />} />
          <Route path="/children" element={<ChildrenScreen />} />
          <Route path="/children/:childId/edit" element={<EditChildScreen />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
