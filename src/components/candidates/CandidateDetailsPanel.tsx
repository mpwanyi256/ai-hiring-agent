import React, { useState } from 'react';
import SidePanel from '../ui/SidePanel';
import { CandidateWithEvaluation } from '@/types/candidates';
import { Tab } from '@headlessui/react';
import { UserIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import GeneralTab from './GeneralTab';
import EvaluationsTab from './EvaluationsTab';
import ExperienceTab from './ExperienceTab';
import EventsTab from './EventsTab';
import MessagesTab from './MessagesTab';
import InterviewSchedulingModal from '../interviews/InterviewSchedulingModal';

// --- Main Panel ---
interface CandidateDetailsPanelProps {
  isOpen: boolean;
  candidate: CandidateWithEvaluation;
  onClose: () => void;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const tabs = [
  { name: 'General', Component: GeneralTab },
  { name: 'Evaluations', Component: EvaluationsTab },
  { name: 'Experience', Component: ExperienceTab },
  { name: 'Events', Component: EventsTab },
  { name: 'Messages', Component: MessagesTab },
];

const statusColorMap: Record<string, string> = {
  under_review: 'bg-gray-100 text-gray-700',
  shortlisted: 'bg-blue-100 text-blue-700',
  interview_scheduled: 'bg-primary-100 text-primary-700',
  reference_check: 'bg-yellow-100 text-yellow-700',
  offer_extended: 'bg-teal-100 text-teal-700',
  offer_accepted: 'bg-green-100 text-green-700',
  hired: 'bg-green-200 text-green-800',
  rejected: 'bg-red-100 text-red-700',
  withdrawn: 'bg-gray-200 text-gray-500',
};

const CandidateDetailsPanel: React.FC<CandidateDetailsPanelProps> = ({
  isOpen,
  candidate,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [schedulingModalOpen, setSchedulingModalOpen] = useState(false);
  const statusClass = statusColorMap[candidate.status] || 'bg-gray-100 text-gray-700';

  const handleScheduleEvent = () => setSchedulingModalOpen(true);
  const handleCloseSchedulingModal = () => setSchedulingModalOpen(false);

  return (
    <SidePanel isOpen={isOpen} onClose={onClose} width="xl">
      {/* Top Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b pb-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-3xl font-bold text-primary-700">
            <UserIcon className="w-10 h-10 text-primary-500" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl font-semibold text-gray-900">
                {candidate.firstName} {candidate.lastName}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ml-2 ${statusClass}`}>
                {candidate.status?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <EnvelopeIcon className="w-4 h-4" /> {candidate.email}
            </div>
          </div>
        </div>
      </div>
      {/* Tabs Section */}
      <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
        <Tab.List className="flex space-x-2 border-b mb-6 bg-white">
          {tabs.map((tab) => (
            <Tab
              key={tab.name}
              className={({ selected }: { selected: boolean }) =>
                classNames(
                  'px-4 py-2 text-sm font-medium rounded-t',
                  selected
                    ? 'bg-white border-b-2 border-primary-600 text-primary-700'
                    : 'bg-gray-50 text-gray-500 hover:text-primary-700',
                )
              }
            >
              {tab.name}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels>
          {tabs.map((tab) => (
            <Tab.Panel key={tab.name}>
              {tab.name === 'General' ? (
                <tab.Component candidate={candidate} onScheduleEvent={handleScheduleEvent} />
              ) : (
                <tab.Component candidate={candidate} />
              )}
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
      {/* Interview Scheduling Modal */}
      <InterviewSchedulingModal
        isOpen={schedulingModalOpen}
        onClose={handleCloseSchedulingModal}
        candidate={candidate}
        jobId={candidate.jobId}
        jobTitle={candidate.jobTitle}
      />
    </SidePanel>
  );
};

export default CandidateDetailsPanel;
