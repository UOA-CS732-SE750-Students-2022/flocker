import { Routes, Route, Navigate } from 'react-router-dom';
import SignIn from '../../auth/SignIn';
import DashboardLayout from '../../layouts/DashboardLayout';
import CreateMeetingView from '../../views/CreateMeetingView';
import MeetingsView from '../../views/MeetingsView';

const AuthenticatedRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/signin" />} />
    <Route path="/signin" element={<SignIn />} />
    <Route path="/dashboard" element={<DashboardLayout />}>
      <Route index element={<Navigate to="meetings" />} />
      <Route path="meetings" element={<MeetingsView />} />
      <Route path="create-meeting" element={<CreateMeetingView />} />
    </Route>
  </Routes>
);

export default AuthenticatedRoutes;
