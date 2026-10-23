import { Navigate } from 'react-router-dom';

/**
 * Editorial stories were removed in the October 2026 legal review: they described people, results and
 * partnerships that weren't real. Old links land on the live fundraisers instead.
 */
export default function StoryDetail() {
  return <Navigate to="/stories" replace />;
}
