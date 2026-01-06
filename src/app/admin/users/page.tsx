"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Download, Upload } from "lucide-react";
import { UsersDataTable } from "@/components/admin/users-data-table";
import { UserStatsCards } from "@/components/admin/user-stats-cards";
import { UserDetailsModal, ConfirmationModal } from "@/components/admin/user-actions";
import { 
  fetchUsersList, 
  fetchUserStats, 
  UserListItem, 
  UserStats 
} from "@/services/admin-client";

export default function AdminUsersPage() {
  // State management
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  
  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState("created_at");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [pageSize, setPageSize] = useState(20);
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);

  // Load user stats
  const loadUserStats = async () => {
    setIsStatsLoading(true);
    try {
      const stats = await fetchUserStats();
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setIsStatsLoading(false);
    }
  };

  // Load users list
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const result = await fetchUsersList(
        currentPage,
        pageSize,
        searchQuery,
        sortColumn,
        sortDirection
      );
      
      setUsers(result.users);
      setTotalUsers(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadUserStats();
  }, []);

  // Load users when parameters change
  useEffect(() => {
    loadUsers();
  }, [currentPage, pageSize, searchQuery, sortColumn, sortDirection]);

  // Event handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (search: string) => {
    setSearchQuery(search);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortDirection(direction);
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleViewUser = (user: UserListItem) => {
    setSelectedUser(user);
    setIsDetailsModalOpen(true);
  };

  const handleSuspendUser = (user: UserListItem) => {
    setSelectedUser(user);
    setIsSuspendModalOpen(true);
  };

  const handleDeleteUser = (user: UserListItem) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleExportUsers = () => {
    // TODO: Implement user export functionality
    console.log('Exporting users...');
  };

  const handleImportUsers = () => {
    // TODO: Implement user import functionality
    console.log('Importing users...');
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, view their activity, and control access permissions.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExportUsers}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={handleImportUsers}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* User Statistics Cards */}
      {userStats && (
        <UserStatsCards stats={userStats} isLoading={isStatsLoading} />
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Users</CardTitle>
            <div className="flex items-center space-x-2">
              <Select 
                value={pageSize.toString()} 
                onValueChange={(value) => {
                  setPageSize(parseInt(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <UsersDataTable
            users={users}
            total={totalUsers}
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onSearch={handleSearch}
            onSort={handleSort}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Modals */}
      <UserDetailsModal
        user={selectedUser}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedUser(null);
        }}
      />

      <ConfirmationModal
        isOpen={isSuspendModalOpen}
        onClose={() => {
          setIsSuspendModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={() => {
          // TODO: Implement user suspension
          console.log('Suspending user:', selectedUser?.email);
        }}
        title="Suspend User"
        description={`Are you sure you want to suspend ${selectedUser?.email}? They will no longer be able to access the application.`}
        confirmText="Suspend"
        variant="destructive"
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={() => {
          // TODO: Implement user deletion
          console.log('Deleting user:', selectedUser?.email);
        }}
        title="Delete User"
        description={`Are you sure you want to permanently delete ${selectedUser?.email}? This action cannot be undone and will remove all their data.`}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}