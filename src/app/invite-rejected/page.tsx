'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import TopNavigation from '@/components/navigation/TopNavigation';
import { XCircleIcon } from '@heroicons/react/24/outline';

export default function InviteRejectedPage() {
  return (
    <div className="min-h-screen bg-background">
      <TopNavigation showAuthButtons={false} />
      <div className="py-20 px-4">
        <Container>
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-light">
              <XCircleIcon className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-text mb-4">Invitation Declined</h1>
              <p className="text-muted-text mb-6">
                You have successfully declined the team invitation. The inviter has been notified.
              </p>
              <div className="space-y-3">
                <Link href="/signin">
                  <Button className="w-full">Sign In to Your Account</Button>
                </Link>
                <Link
                  href="/signup"
                  className="block w-full py-2.5 text-sm text-muted-text hover:text-text transition-colors"
                >
                  Create a New Account
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
}
