import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { Router } from '@angular/router';
import { UserService, User, UserFilterDto, PagedResult, ApiResponse } from '../../service/user.service';

// Use interfaces from UserService
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  pendingUsers: number;
  adminUsers: number;
  managerUsers: number;
  regularUsers: number;
  cashierUsers: number;
}

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  // Data
  users: User[] = [];
  filteredUsers: User[] = [];
  selectedUsers: number[] = [];
  stats: UserStats = {
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    suspendedUsers: 0,
    pendingUsers: 0,
    adminUsers: 0,
    managerUsers: 0,
    regularUsers: 0,
    cashierUsers: 0
  };

  // Filter and search
  filter: UserFilterDto = {
    searchQuery: '',
    role: 'all',
    status: 'all',
    department: 'all',
    sortBy: 'username',
    sortOrder: 'asc',
    page: 1,
    pageSize: 10,
    isActive: true // Set default to true to match working API call
  };

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  // UI state
  isLoading = false;
  showAddUserModal = false;
  showEditUserModal = false;
  showDeleteConfirmModal = false;
  selectedUserForAction: User | null = null;

  // Available options
  roles = ['admin', 'manager', 'user', 'cashier'];
  statuses = ['active', 'inactive', 'suspended', 'pending'];
  departments = ['Sales', 'Inventory', 'Finance', 'HR', 'IT', 'Operations'];

  constructor(
    private spinnerService: NgxSpinnerService,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    console.log('User Management Component initialized');
    
    // Setup search with debounce
    this.searchSubject$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        console.log('Search term after debounce:', searchTerm);
        this.filter.searchQuery = searchTerm;
        this.loadUsersWithFilters();
      });
    
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.spinnerService.show();
    
    this.userService.getAllUsers(this.filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ApiResponse<PagedResult<User>>) => {
          if (response.success && response.data && response.data.items) {
            this.users = response.data.items.map(user => ({
              ...user,
              status: user.status || (user.isActive ? 'active' : 'inactive'),
              lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
              createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
              updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date()
            }));
            this.calculateStats();
            this.applyFilters();
          } else {
            console.error('Failed to load users:', response.message || 'No data received');
            this.users = [];
          }
          this.isLoading = false;
          this.spinnerService.hide();
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.users = [];
          this.isLoading = false;
          this.spinnerService.hide();
        }
      });
  }

  loadUsersWithFilters(): void {
    this.isLoading = true;
    this.spinnerService.show();
    
    console.log('Loading users with filters:', this.filter);
    
    this.userService.getAllUsers(this.filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ApiResponse<PagedResult<User>>) => {
          if (response.success && response.data && response.data.items) {
            this.users = response.data.items.map(user => ({
              ...user,
              status: user.status || (user.isActive ? 'active' : 'inactive'),
              lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
              createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
              updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date()
            }));
            this.applyFilters();
          } else {
            console.error('Failed to load users with filters:', response.message || 'No data received');
            this.users = [];
          }
          this.isLoading = false;
          this.spinnerService.hide();
        },
        error: (error) => {
          console.error('Error loading users with filters:', error);
          this.users = [];
          this.isLoading = false;
          this.spinnerService.hide();
        }
      });
  }

// Mock data generation removed - using real API service

  calculateStats(): void {
    this.stats = {
      totalUsers: this.users.length,
      activeUsers: this.users.filter(u => u.isActive).length,
      inactiveUsers: this.users.filter(u => !u.isActive).length,
      suspendedUsers: this.users.filter(u => u.status === 'suspended').length,
      pendingUsers: this.users.filter(u => u.status === 'pending').length,
      adminUsers: this.users.filter(u => u.role === 'admin').length,
      managerUsers: this.users.filter(u => u.role === 'manager').length,
      regularUsers: this.users.filter(u => u.role === 'user').length,
      cashierUsers: this.users.filter(u => u.role === 'cashier').length
    };
  }

  applyFilters(): void {
    console.log('Applying filters...');
    let filtered = [...this.users];

    // Apply search filter
    if (this.filter.searchQuery.trim()) {
      const query = this.filter.searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query) ||
        user.department?.toLowerCase().includes(query)
      );
    }

    // Apply role filter
    if (this.filter.role !== 'all') {
      filtered = filtered.filter(user => user.role === this.filter.role);
    }

    // Apply status filter
    if (this.filter.status !== 'all') {
      if (this.filter.status === 'active') {
        filtered = filtered.filter(user => user.isActive);
      } else if (this.filter.status === 'inactive') {
        filtered = filtered.filter(user => !user.isActive);
      } else {
        filtered = filtered.filter(user => user.status === this.filter.status);
      }
    }

    // Apply department filter
    if (this.filter.department !== 'all') {
      filtered = filtered.filter(user => user.department === this.filter.department);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (this.filter.sortBy) {
        case 'username':
          comparison = a.username.localeCompare(b.username);
          break;
        case 'firstName':
          comparison = a.firstName.localeCompare(b.firstName);
          break;
        case 'lastName':
          comparison = a.lastName.localeCompare(b.lastName);
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'role':
          comparison = a.role.localeCompare(b.role);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'lastLogin':
          comparison = (a.lastLogin?.getTime() || 0) - (b.lastLogin?.getTime() || 0);
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
      }
      return this.filter.sortOrder === 'asc' ? comparison : -comparison;
    });

    this.filteredUsers = filtered;
    this.calculatePagination();
    console.log('Filtered users:', this.filteredUsers.length);
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages || 1;
    }
    // Update filter page number
    this.filter.page = this.currentPage;
  }

  get paginatedUsers(): User[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredUsers.slice(start, end);
  }

  // Event handlers
  onSearchChange(): void {
    console.log('Search input changed to:', this.filter.searchQuery);
    this.currentPage = 1;
    this.searchSubject$.next(this.filter.searchQuery);
  }

  onFilterChange(): void {
    console.log('Filter changed:', this.filter);
    this.currentPage = 1;
    this.applyFilters();
  }

  onSortChange(): void {
    console.log('Sort changed:', this.filter.sortBy, this.filter.sortOrder);
    this.applyFilters();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.filter.page = page;
      this.loadUsersWithFilters();
    }
  }

  // Selection methods
  toggleUserSelection(userId: number): void {
    const index = this.selectedUsers.indexOf(userId);
    if (index > -1) {
      this.selectedUsers.splice(index, 1);
    } else {
      this.selectedUsers.push(userId);
    }
  }

  selectAll(): void {
    this.selectedUsers = this.paginatedUsers.map(user => user.id);
  }

  deselectAll(): void {
    this.selectedUsers = [];
  }

  // User actions
  addUser(): void {
    this.router.navigate(['/add-user']);
  }

  editUser(user: User): void {
    this.selectedUserForAction = user;
    this.showEditUserModal = true;
  }

  deleteUser(user: User): void {
    this.selectedUserForAction = user;
    this.showDeleteConfirmModal = true;
  }

  confirmDeleteUser(): void {
    if (this.selectedUserForAction) {
      this.spinnerService.show();
      
      this.userService.deleteUser(this.selectedUserForAction.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: ApiResponse<string>) => {
            if (response.success) {
              // Remove user from arrays
              this.users = this.users.filter(u => u.id !== this.selectedUserForAction!.id);
              this.filteredUsers = this.filteredUsers.filter(u => u.id !== this.selectedUserForAction!.id);
              
              // Remove from selection if selected
              this.selectedUsers = this.selectedUsers.filter(id => id !== this.selectedUserForAction!.id);
              
              // Recalculate stats and filters
              this.calculateStats();
              this.applyFilters();
              
              console.log(`User ${this.selectedUserForAction.username} deleted successfully`);
            } else {
              console.error('Failed to delete user:', response.message || 'Unknown error');
            }
            
            // Close modal and reset state after API call completes
            this.showDeleteConfirmModal = false;
            this.selectedUserForAction = null;
            this.spinnerService.hide();
          },
          error: (error) => {
            console.error('Error deleting user:', error);
            
            // Close modal and reset state even on error
            this.showDeleteConfirmModal = false;
            this.selectedUserForAction = null;
            this.spinnerService.hide();
          }
        });
    }
  }

  toggleUserStatus(user: User): void {
    const updateData = {
      isActive: !user.isActive
    };
    
    this.spinnerService.show();
    
    this.userService.updateUser(user.id, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ApiResponse<User>) => {
                                if (response.success && response.data) {
             // Update local user data
             const updatedUser = response.data;
             user.isActive = updatedUser.isActive;
             user.status = updatedUser.isActive ? 'active' : 'inactive';
             user.updatedAt = updatedUser.updatedAt ? new Date(updatedUser.updatedAt) : new Date();
             
             this.calculateStats();
             this.applyFilters();
             
             console.log(`User ${user.username} status changed to ${user.status}`);
           } else {
             console.error('Failed to update user status:', response.message || 'Unknown error');
           }
          this.spinnerService.hide();
        },
        error: (error) => {
          console.error('Error updating user status:', error);
          this.spinnerService.hide();
        }
      });
  }

  // Utility methods
  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'admin':
        return 'badge bg-danger';
      case 'manager':
        return 'badge bg-warning';
      case 'cashier':
        return 'badge bg-info';
      case 'user':
        return 'badge bg-secondary';
      default:
        return 'badge bg-secondary';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active':
        return 'badge bg-success';
      case 'inactive':
        return 'badge bg-secondary';
      case 'suspended':
        return 'badge bg-warning';
      case 'pending':
        return 'badge bg-info';
      default:
        return 'badge bg-secondary';
    }
  }

  getDepartmentBadgeClass(department: string): string {
    const colors = ['bg-primary', 'bg-success', 'bg-info', 'bg-warning', 'bg-danger', 'bg-secondary'];
    const index = this.departments.indexOf(department);
    return `badge ${colors[index % colors.length]}`;
  }

  exportUserReport(): void {
    console.log('Exporting user report...');
    // Implement export functionality
  }

  bulkAction(action: string): void {
    console.log(`Performing bulk action: ${action} on ${this.selectedUsers.length} users`);
    // Implement bulk actions
  }

  // Modal management
  closeModals(): void {
    this.showAddUserModal = false;
    this.showEditUserModal = false;
    this.showDeleteConfirmModal = false;
    this.selectedUserForAction = null;
  }
}
