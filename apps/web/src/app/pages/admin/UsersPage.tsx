/**
 * Placeholder — wire up to GET /api/users (already protected by JwtAuthGuard).
 */
export default function AdminUsersPage() {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-lg">
      <h2 className="font-manrope text-headline-lg text-on-surface mb-sm">Users</h2>
      <p className="text-body-md text-on-surface-variant">
        Stub page. The data source already exists at <code>GET /api/users</code> (gated by{' '}
        <code>JwtAuthGuard</code>); call it via <code>apiClient.get('/users')</code>.
      </p>
    </div>
  );
}
