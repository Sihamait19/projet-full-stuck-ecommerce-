import { Navigate } from "react-router-dom";

function PrivateRoute({ children, user }) {
  return user ? children : <Navigate to="/login" />;
}

export default PrivateRoute;