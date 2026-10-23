import { Navigate } from 'react-router-dom';

/**
 * CMS stories were removed in the October 2026 legal review: the seeded ones described programs,
 * places and totals that weren't real. Old links land on the live fundraisers instead.
 */
export default function CMSStoryDetail() {
  return <Navigate to="/stories" replace />;
}
