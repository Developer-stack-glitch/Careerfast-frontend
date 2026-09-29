import React from 'react';
import { useProfile, isStepMandatoryComplete } from './ProfileContext';
import { motion } from 'framer-motion';
import { RightOutlined, RocketFilled, CheckOutlined } from '@ant-design/icons';

const steps = [
  { id: 1, title: 'Basic Information' },
  { id: 2, title: 'Professional Details' },
  { id: 3, title: 'Work Experience' },
  { id: 4, title: 'Education' },
  { id: 5, title: 'Skills' },
  { id: 6, title: 'Job Preferences' },
  { id: 7, title: 'Resume' },
  { id: 8, title: 'Visibility' },
  { id: 9, title: 'Review' },
];

const ProfileSidebar = () => {
  const { currentStep, goToStep, calculateCompletion, profileData, isStepSaving } = useProfile();
  const completion = calculateCompletion();

  // Count how many of the 8 main steps are completed
  const calculateCompletedStepsCount = () => {
    let count = 0;
    const { basic, professional, experience, education, skills, jobPreferences, resume, visibility } = profileData;
    if (basic?.firstName && basic?.lastName && basic?.email && basic?.city && basic?.state && (basic?.isEmailVerified === true || basic?.isEmailVerified === 1)) count++;
    if (professional?.jobTitle && professional?.headline) count++;
    if (experience?.isFresher || experience?.list?.length > 0) count++;
    if (education?.length > 0) count++;
    if (skills?.length > 0) count++;
    if (jobPreferences?.preferredRoles?.length > 0 || jobPreferences?.expectedSalary) count++;
    if (resume) count++;
    if (visibility?.mode) count++;
    return count;
  };

  const isStepCompleted = (stepId) => {
    if (stepId === 1) {
      return isStepMandatoryComplete(1, profileData);
    }
    if (stepId === 2) {
      return isStepMandatoryComplete(2, profileData);
    }
    if (stepId === 3) {
      return Boolean(profileData.experience?.isFresher || (profileData.experience?.list && profileData.experience.list.length > 0) || currentStep > 3);
    }
    if (stepId === 4) {
      return Boolean((profileData.education && profileData.education.length > 0) || currentStep > 4);
    }
    if (stepId === 5) {
      return Boolean((profileData.skills && profileData.skills.length > 0) || currentStep > 5);
    }
    if (stepId === 6) {
      return isStepMandatoryComplete(6, profileData);
    }
    if (stepId === 7) {
      return Boolean(profileData.resume || currentStep > 7);
    }
    if (stepId === 8) {
      return Boolean(profileData.visibility?.mode || currentStep > 8);
    }
    return false;
  };

  const completedStepsCount = calculateCompletedStepsCount();

  return (
    <div className="w-full md:w-[290px] shrink-0 bg-white rounded-3xl p-4 flex flex-col justify-between self-start sticky top-24">
      <div>
        {/* Header */}
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Create Your Profile</h2>
        <p className="text-xs text-gray-500 mt-1 mb-4 leading-relaxed">
          Complete your profile to get better job recommendations
        </p>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <motion.div
                className={`h-full rounded-full transition-colors ${completion === 100 ? 'bg-emerald-500' : 'bg-[#4C1D95]'}`}
                initial={{ width: 0 }}
                animate={{ width: `${completion}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <span className={`text-xs font-bold ${completion === 100 ? 'text-emerald-600' : 'text-gray-800'}`}>{completion}%</span>
          </div>
          <p className="text-[11px] font-medium text-gray-600 mt-1.5">
            {completedStepsCount} of 8 steps completed
          </p>
        </div>

        {/* Steps List */}
        <nav aria-label="Profile Steps">
          <ol className="space-y-1 pl-0">
            {steps.map((step) => {
              const isCurrent = currentStep === step.id;
              const isCompleted = isStepCompleted(step.id);

              const isFresher = profileData.experience.isFresher === true || profileData.professional.careerLevel === 'Fresher';
              const displayTitle = step.id === 3 && isFresher ? 'Internships & Projects' : step.title;

              return (
                <li key={step.id}>
                  <button
                    type="button"
                    disabled={isStepSaving}
                    onClick={() => goToStep(step.id)}
                    className={`w-full flex items-center justify-between mb-3 px-3 py-2.5 rounded-xl text-left transition-all ${isCurrent
                      ? 'bg-[#F5F0FF] text-[#3B0764]'
                      : 'text-gray-600 hover:bg-gray-50'
                      } ${isStepSaving ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${isCurrent
                          ? 'bg-[#3B0764] text-white'
                          : isCompleted
                            ? 'bg-emerald-100 text-emerald-700 border-1 border-emerald-200/80'
                            : 'bg-gray-100 text-gray-500'
                          }`}
                      >
                        {isCompleted && !isCurrent ? <CheckOutlined className="text-[10px] font-bold text-emerald-700" /> : step.id}
                      </span>
                      <span
                        className={`text-sm font-medium truncate ${isCurrent ? 'font-bold text-[#3B0764]' : isCompleted ? 'text-gray-800' : 'text-gray-600'
                          }`}
                      >
                        {displayTitle}
                      </span>
                    </div>

                    <RightOutlined
                      className={`text-[10px] shrink-0 ml-2 ${isCurrent ? 'text-[#6B21A8]' : 'text-gray-300'
                        }`}
                    />
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Bottom Promo Card */}
      <div className="mt-4 bg-[#F5F0FF] rounded-2xl p-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-[#6B21A8] shrink-0 shadow-sm">
          <RocketFilled className="text-lg text-[#6B21A8]" />
        </div>
        <div>
          <p className="text-[11px] text-gray-600 leading-tight mb-0">A complete profile gets</p>
          <p className="text-xs font-extrabold text-[#3B0764] mt-0.5 mb-0">3x more profile views</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileSidebar;
