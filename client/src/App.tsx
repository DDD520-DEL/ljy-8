import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Items from './pages/Items';
import ItemDetail from './pages/ItemDetail';
import PublishItem from './pages/PublishItem';
import Skills from './pages/Skills';
import SkillDetail from './pages/SkillDetail';
import SkillSchedule from './pages/SkillSchedule';
import PublishSkill from './pages/PublishSkill';
import Neighborhood from './pages/Neighborhood';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Disputes from './pages/Disputes';
import DisputeDetail from './pages/DisputeDetail';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import AdminDashboard from './pages/AdminDashboard';
import { useAuthStore } from './store/authStore';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="items" element={<Items />} />
        <Route path="items/:id" element={<ItemDetail />} />
        <Route
          path="publish/item"
          element={
            <PrivateRoute>
              <PublishItem />
            </PrivateRoute>
          }
        />
        <Route path="skills" element={<Skills />} />
        <Route path="skills/:id" element={<SkillDetail />} />
        <Route
          path="skills/:id/schedule"
          element={
            <PrivateRoute>
              <SkillSchedule />
            </PrivateRoute>
          }
        />
        <Route
          path="publish/skill"
          element={
            <PrivateRoute>
              <PublishSkill />
            </PrivateRoute>
          }
        />
        <Route
          path="neighborhood"
          element={
            <PrivateRoute>
              <Neighborhood />
            </PrivateRoute>
          }
        />
        <Route
          path="orders"
          element={
            <PrivateRoute>
              <Orders />
            </PrivateRoute>
          }
        />
        <Route
          path="orders/borrow/:id"
          element={
            <PrivateRoute>
              <OrderDetail type="borrow" />
            </PrivateRoute>
          }
        />
        <Route
          path="orders/service/:id"
          element={
            <PrivateRoute>
              <OrderDetail type="service" />
            </PrivateRoute>
          }
        />
        <Route
          path="disputes"
          element={
            <PrivateRoute>
              <Disputes />
            </PrivateRoute>
          }
        />
        <Route
          path="disputes/:id"
          element={
            <PrivateRoute>
              <DisputeDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="notifications"
          element={
            <PrivateRoute>
              <Notifications />
            </PrivateRoute>
          }
        />
        <Route
          path="admin/dashboard"
          element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
