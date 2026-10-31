import React, { useLayoutEffect } from 'react';
import { useProfile } from './ProfileContext';
import { message } from 'antd';
import { useNavigate } from '@/routing-shim';
import { SafetyCertificateFilled, LoadingOutlined, ArrowRightOutlined, ArrowLeftOutlined } from '@ant-design/icons';

const StepNavigation = ({ onValidateStep, isSaving }) => {
  const { currentStep, totalSteps, goToStep, registerStepValidator, setIsStepSaving } = useProfile();
  const navigate = useNavigate();

  useLayoutEffect(() => {
    if (onValidateStep) {
      return registerStepValidator(onValidateStep);
    }
  }, [onValidateStep, registerStepValidator]);

  useLayoutEffect(() => {
    if (setIsStepSaving) {
      setIsStepSaving(Boolean(isSaving));
    }
  }, [isSaving, setIsStepSaving]);

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      await goToStep(currentStep + 1);
    } else {
      if (onValidateStep) {
        const isValid = await onValidateStep();
        if (!isValid) {
          message.error('Please complete all mandatory fields before submitting.');
          return;
        }
      }
      message.success('Your Careerfast profile has been created successfully!');
      navigate('/candidate-profile/mainprofile');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 shadow-xs border border-gray-100">
      {/* Left Trust Badge */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="w-8 h-8 rounded-xl bg-[#F5F0FF] flex items-center justify-center shrink-0 border border-purple-100">
          <SafetyCertificateFilled className="text-sm sm:text-base text-[#6B21A8]" />
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-bold text-gray-800 mb-0 leading-tight">
            Your information is safe with us
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5 leading-tight mb-0">
            We do not share your personal details without your consent.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={handleBack}
            disabled={isSaving}
            className="flex-1 sm:flex-initial text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-2 md:px-4 sm:px-6 py-2.5 rounded-xl border border-gray-200 transition-colors disabled:opacity-50 text-center flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeftOutlined className="text-[11px]" />
            <span>Back</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleNext}
          disabled={isSaving}
          className="flex-1 sm:flex-initial px-2 md:px-4 sm:px-6 py-2.5 rounded-xl bg-[#F95721] hover:bg-[#E04B18] text-white font-medium text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? (
            <>
              <LoadingOutlined className="text-xs" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <span>{currentStep < totalSteps ? 'Save & Continue' : 'Complete Profile'}</span>
              <ArrowRightOutlined className="text-xs" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default StepNavigation;
