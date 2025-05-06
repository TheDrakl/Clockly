import { Navigate } from 'react-router-dom';

const PublicRoute = ({ isAuthenticated, children }) => {
  if (isAuthenticated) {
    return <Navigate to="/profile" replace />;
  }
  return children;
};

export default PublicRoute;