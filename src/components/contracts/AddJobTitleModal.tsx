import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus } from 'lucide-react';

interface AddJobTitleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onValueChange: (v: string) => void;
  onSubmit: () => Promise<void> | void;
  submitting?: boolean;
}

export default function AddJobTitleModal({
  open,
  onOpenChange,
  value,
  onValueChange,
  onSubmit,
  submitting,
}: AddJobTitleModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Job Title</DialogTitle>
          <DialogDescription>Create a new job title for your company.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="newJobTitle">Job Title Name</label>
            <Input
              id="newJobTitle"
              placeholder="e.g., Senior React Developer"
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => onSubmit()} disabled={submitting || !value.trim()}>
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
