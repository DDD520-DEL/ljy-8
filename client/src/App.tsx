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
import Shop from './pages/Shop';
import MyExchanges from './pages/MyExchanges';
import AdminShopManage from './pages/AdminShopManage';
import AnnouncementsList from './pages/AnnouncementsList';
import AnnouncementDetail from './pages/AnnouncementDetail';
import AdminAnnouncementManage from './pages/AdminAnnouncementManage';
import AdminVerificationManage from './pages/AdminVerificationManage';
import Donations from './pages/Donations';
import DonationDetail from './pages/DonationDetail';
import PublishDonation from './pages/PublishDonation';
import MyDonations from './pages/MyDonations';
import Demands from './pages/Demands';
import DemandDetail from './pages/DemandDetail';
import PublishDemand from './pages/PublishDemand';
import MyDemands from './pages/MyDemands';
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
        <Route path="shop" element={<Shop />} />
        <Route
          path="my-exchanges"
          element={
            <PrivateRoute>
              <MyExchanges />
            </PrivateRoute>
          }
        />
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
        <Route path="donations" element={<Donations />} />
        <Route path="donations/:id" element={<DonationDetail />} />
        <Route
          path="publish/donation"
          element={
            <PrivateRoute>
              <PublishDonation />
            </PrivateRoute>
          }
        />
        <Route
          path="my-donations"
          element={
            <PrivateRoute>
              <MyDonations />
            </PrivateRoute>
          }
        />
        <Route path="demands" element={<Demands />} />
        <Route path="demands/:id" element={<DemandDetail />} />
        <Route
          path="publish/demand"
          element={
            <PrivateRoute>
              <PublishDemand />
            </PrivateRoute>
          }
        />
        <Route
          path="my-demands"
          element={
            <PrivateRoute>
              <MyDemands />
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
        <Route
          path="admin/shop"
          element={
            <PrivateRoute>
              <AdminShopManage />
            </PrivateRoute>
          }
        />
        <Route path="announcements" element={<AnnouncementsList />} />
        <Route path="announcements/:id" element={<AnnouncementDetail />} />
        <Route
          path="admin/announcements"
          element={
            <PrivateRoute>
              <AdminAnnouncementManage />
            </PrivateRoute>
          }
        />
        <Route
          path="admin/verification"
          element={
            <PrivateRoute>
              <AdminVerificationManage />
            </PrivateRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
