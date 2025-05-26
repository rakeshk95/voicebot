
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, Mail, Activity, Settings } from 'lucide-react';

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const users = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      status: 'Active',
      campaigns: 3,
      lastActive: '2024-01-20',
      conversion: 4.2
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      status: 'Inactive',
      campaigns: 1,
      lastActive: '2024-01-15',
      conversion: 2.8
    },
    {
      id: 3,
      name: 'Mike Chen',
      email: 'mike@example.com',
      status: 'Active',
      campaigns: 5,
      lastActive: '2024-01-21',
      conversion: 6.1
    },
    {
      id: 4,
      name: 'Emily Davis',
      email: 'emily@example.com',
      status: 'Pending',
      campaigns: 0,
      lastActive: '2024-01-18',
      conversion: 0
    }
  ];

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'Active').length;
  const avgConversion = (users.reduce((sum, u) => sum + u.conversion, 0) / users.length).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <Button className="bg-primary">Add New User</Button>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{totalUsers}</p>
              </div>
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{activeUsers}</p>
              </div>
              <Activity className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Conversion</p>
                <p className="text-2xl font-bold">{avgConversion}%</p>
              </div>
              <Mail className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline">Filter</Button>
        <Button variant="outline">Export</Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Campaigns</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Conversion</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(user.status)}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.campaigns}</TableCell>
                  <TableCell>{new Date(user.lastActive).toLocaleDateString()}</TableCell>
                  <TableCell>{user.conversion}%</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;
