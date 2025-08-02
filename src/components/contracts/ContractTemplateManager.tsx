'use client';

import { useState, useEffect } from 'react';
import { RootState, useAppDispatch, useAppSelector } from '@/store';
import {
  fetchContracts,
  createContract,
  updateContract,
  deleteContract,
} from '@/store/contracts/contractsThunks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// Note: AlertDialog component not available, will handle deletion confirmation differently
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Copy,
  MoreHorizontal,
  Search,
  Eye,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { Contract, ContractCategory, CreateContractData } from '@/types/contracts';

export default function ContractTemplateManager() {
  const dispatch = useAppDispatch();
  const { contracts } = useAppSelector((state: RootState) => state.contracts);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [deleteContractId, setDeleteContractId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateContractData>({
    title: '',
    content: '',
    category: 'general',
    employmentTypeId: undefined,
  });

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'technical', label: 'Technical' },
    { value: 'executive', label: 'Executive' },
    { value: 'intern', label: 'Intern' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'custom', label: 'Custom' },
  ];

  const employmentTypes = [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'temporary', label: 'Temporary' },
    { value: 'internship', label: 'Internship' },
  ];

  useEffect(() => {
    if (contracts.length === 0) {
      dispatch(fetchContracts());
    }
  }, [dispatch, contracts.length]);

  useEffect(() => {
    filterContracts();
  }, [contracts, searchTerm, categoryFilter, statusFilter]);

  const filterContracts = () => {
    let filtered = contracts;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (contract) =>
          contract.title.toLowerCase().includes(term) ||
          contract.category.toLowerCase().includes(term) ||
          contract.content.toLowerCase().includes(term),
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((contract) => contract.category === categoryFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((contract) => contract.status === statusFilter);
    }

    setFilteredContracts(filtered);
  };

  const handleCreateContract = async () => {
    try {
      const result = await dispatch(createContract(formData));
      if (createContract.fulfilled.match(result)) {
        toast.success('Contract template created successfully');
        setIsCreateModalOpen(false);
        resetForm();
      } else {
        throw new Error(result.error?.message || 'Failed to create contract');
      }
    } catch (error) {
      console.error('Error creating contract:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create contract');
    }
  };

  const handleUpdateContract = async () => {
    if (!selectedContract) return;

    try {
      const result = await dispatch(
        updateContract({
          id: selectedContract.id,
          ...formData,
        }),
      );
      if (updateContract.fulfilled.match(result)) {
        toast.success('Contract template updated successfully');
        setIsEditModalOpen(false);
        setSelectedContract(null);
        resetForm();
      } else {
        throw new Error(result.error?.message || 'Failed to update contract');
      }
    } catch (error) {
      console.error('Error updating contract:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update contract');
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    try {
      const result = await dispatch(deleteContract(contractId));
      if (deleteContract.fulfilled.match(result)) {
        toast.success('Contract template deleted successfully');
        setDeleteContractId(null);
      } else {
        throw new Error(result.error?.message || 'Failed to delete contract');
      }
    } catch (error) {
      console.error('Error deleting contract:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete contract');
    }
  };

  const handleDuplicateContract = async (contract: Contract) => {
    const duplicateData = {
      title: `${contract.title} (Copy)`,
      content: contract.content,
      category: contract.category,
      employmentTypeId: contract.employmentTypeId,
    };

    try {
      const result = await dispatch(createContract(duplicateData));
      if (createContract.fulfilled.match(result)) {
        toast.success('Contract template duplicated successfully');
      } else {
        throw new Error(result.error?.message || 'Failed to duplicate contract');
      }
    } catch (error) {
      console.error('Error duplicating contract:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to duplicate contract');
    }
  };

  const openEditModal = (contract: Contract) => {
    setSelectedContract(contract);
    setFormData({
      title: contract.title,
      content: contract.content,
      category: contract.category,
      employmentTypeId: contract.employmentTypeId,
    });
    setIsEditModalOpen(true);
  };

  const openPreviewModal = (contract: Contract) => {
    setSelectedContract(contract);
    setIsPreviewModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: 'general',
      employmentTypeId: undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    const categoryConfig = {
      general: 'bg-blue-100 text-blue-800',
      technical: 'bg-purple-100 text-purple-800',
      executive: 'bg-orange-100 text-orange-800',
      intern: 'bg-green-100 text-green-800',
      freelance: 'bg-yellow-100 text-yellow-800',
      custom: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge
        className={
          categoryConfig[category as keyof typeof categoryConfig] || 'bg-gray-100 text-gray-800'
        }
      >
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contract Templates</h1>
          <p className="text-gray-600">Manage and organize your contract templates</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Contract Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Template Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Senior Developer Contract"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value as ContractCategory })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employmentType">Employment Type *</Label>
                  <Select
                    value={formData.employmentTypeId || ''}
                    onValueChange={(value) => setFormData({ ...formData, employmentTypeId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {employmentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="content">Contract Body *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={12}
                  placeholder="Enter the contract template content..."
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateContract}
                  disabled={!formData.title || !formData.content}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Templates ({filteredContracts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Employment Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{contract.title}</div>
                        <div className="text-sm text-gray-500"></div>
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryBadge(contract.category)}</TableCell>
                    <TableCell>
                      <span className="capitalize">{contract.employmentType?.name || 'N/A'}</span>
                    </TableCell>
                    <TableCell>{getStatusBadge(contract.status)}</TableCell>
                    <TableCell>{formatDate(contract.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openPreviewModal(contract)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditModal(contract)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateContract(contract)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteContractId(contract.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredContracts.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No contract templates found</p>
                <p className="text-sm text-gray-400">
                  {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Create your first contract template to get started'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Contract Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-title">Template Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value as ContractCategory })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-employmentType">Employment Type *</Label>
                <Select
                  value={formData.employmentTypeId || ''}
                  onValueChange={(value) => setFormData({ ...formData, employmentTypeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {employmentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-content">Contract Body *</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={12}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateContract}
                disabled={!formData.title || !formData.content}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contract Preview: {selectedContract?.title}</DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Category:</span>{' '}
                  {getCategoryBadge(selectedContract.category)}
                </div>
                <div>
                  <span className="font-medium">Employment Type:</span>{' '}
                  {selectedContract.employmentType?.name || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Status:</span>{' '}
                  {getStatusBadge(selectedContract.status)}
                </div>
              </div>
              <div className="border-t pt-4">
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedContract.content }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteContractId} onOpenChange={() => setDeleteContractId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contract Template</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this contract template? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteContractId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteContractId && handleDeleteContract(deleteContractId)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
