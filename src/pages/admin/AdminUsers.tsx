import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Search, Mail, ShieldCheck, ShieldOff } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  user_id: string;
  roles: string[];
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: allRoles } = await supabase
      .from('user_roles')
      .select('user_id, role');

    const usersWithRoles = (profiles || []).map(profile => ({
      ...profile,
      roles: allRoles?.filter(r => r.user_id === profile.user_id).map(r => r.role) || []
    }));

    setUsers(usersWithRoles);
    setLoading(false);
  };

  const toggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    if (userId === currentUser?.id) {
      toast.error("You can't remove your own admin role");
      return;
    }
    setToggling(userId);
    try {
      if (isCurrentlyAdmin) {
        await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'admin');
        toast.success('Admin role removed');
      } else {
        await supabase.from('user_roles').insert({ user_id: userId, role: 'admin' as any });
        toast.success('Admin role granted');
      }
      await fetchUsers();
    } catch {
      toast.error('Failed to update role');
    }
    setToggling(null);
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const roleBadgeVariant = (role: string) => {
    if (role === 'admin') return 'default' as const;
    if (role === 'donor') return 'secondary' as const;
    return 'outline' as const;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">View and manage all platform users</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users by email or name..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground">No users found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => {
              const isAdmin = user.roles.includes('admin');
              const isSelf = user.user_id === currentUser?.id;
              return (
                <Card key={user.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-foreground">{user.full_name || 'No name'}</p>
                          {user.roles.map(role => (
                            <Badge key={role} variant={roleBadgeVariant(role)}>
                              {role}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Joined {format(new Date(user.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div>
                        {isAdmin ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isSelf || toggling === user.user_id}
                            onClick={() => toggleAdmin(user.user_id, true)}
                            className="gap-1.5"
                          >
                            <ShieldOff className="w-4 h-4" />
                            Remove Admin
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            disabled={toggling === user.user_id}
                            onClick={() => toggleAdmin(user.user_id, false)}
                            className="gap-1.5"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            Make Admin
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
