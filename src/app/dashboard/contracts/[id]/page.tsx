'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/store';
import { fetchContractById, deleteContract } from '@/store/contracts/contractsThunks';
import {
  selectCurrentContract,
  selectContractsLoading,
  selectContractsError,
} from '@/store/contracts/contractsSelectors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Send,
  Copy,
  FileText,
  Calendar,
  User,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const contractId = params.id as string;
  const contract = useSelector(selectCurrentContract);
  const loading = useSelector(selectContractsLoading);
  const error = useSelector(selectContractsError);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (contractId) {
      dispatch(fetchContractById(contractId));
    }
  }, [dispatch, contractId]);

  const handleDelete = async () => {
    if (!contract) return;

    try {
      setIsDeleting(true);
      const result = await dispatch(deleteContract(contract.id));
      if (result.type === 'contracts/deleteContract/fulfilled') {
        router.push('/dashboard/contracts');
      }
    } catch (error) {
      console.error('Error deleting contract:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const copyContractLink = () => {
    if (contract) {
      const link = `${window.location.origin}/dashboard/contracts/${contract.id}`;
      navigator.clipboard.writeText(link);
      // Could add a toast notification here
    }
  };

  if (loading && !contract) {
    return (
      <DashboardLayout title="Contract Details" loading>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Contract Details">
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Link href="/dashboard/contracts">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contracts
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (!contract) {
    return (
      <DashboardLayout title="Contract Details">
        <div className="space-y-6">
          <Alert>
            <AlertDescription>Contract not found.</AlertDescription>
          </Alert>
          <Link href="/dashboard/contracts">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contracts
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={contract.title}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/contracts">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{contract.title}</h1>
              <p className="text-muted-foreground">Contract template details and management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={copyContractLink}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            <Link href={`/dashboard/contracts/${contract.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button>
              <Send className="h-4 w-4 mr-2" />
              Send to Candidate
            </Button>
          </div>
        </div>

        {/* Contract Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Contract Content</CardTitle>
                <CardDescription>Preview of the contract template</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: contract.content }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contract Details */}
            <Card>
              <CardHeader>
                <CardTitle>Template Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{contract.title}</p>
                    <p className="text-sm text-muted-foreground">Template Title</p>
                  </div>
                </div>

                {contract.jobTitle && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Badge variant="secondary">{contract.jobTitle.name}</Badge>
                      <p className="text-sm text-muted-foreground">Job Title</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {contract.creator?.firstName} {contract.creator?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">Created By</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {new Date(contract.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Created</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {new Date(contract.updatedAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href={`/dashboard/contracts/${contract.id}/edit`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Template
                  </Button>
                </Link>

                <Button variant="outline" className="w-full justify-start">
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate Template
                </Button>

                <Button className="w-full justify-start">
                  <Send className="h-4 w-4 mr-2" />
                  Send to Candidate
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Delete Contract Template</CardTitle>
                <CardDescription>
                  Are you sure you want to delete &quot;{contract.title}&quot;? This action cannot
                  be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 pt-4">
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
