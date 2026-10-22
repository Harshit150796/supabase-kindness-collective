import { Navigate } from 'react-router-dom';

/**
 * Featured stories were taken down in the October 2026 legal review (the hurricane relief story claimed
 * work with FEMA and totals that never happened). Old links land on the live fundraisers instead.
 */
export default function FeaturedStoryDetail() {
  return <Navigate to="/stories" replace />;
}
