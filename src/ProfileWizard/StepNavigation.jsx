import React, { useLayoutEffect } from 'react';
import { useProfile } from './ProfileContext';
import { message } from 'antd';
import { useNavigate } from '@/routing-shim';
import { SafetyCertificateFilled, LoadingOutlined } from '@ant-design/icons';

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
    <div className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
      {/* Left Trust Badge */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#F5F0FF] flex items-center justify-center shrink-0">
          <SafetyCertificateFilled className="text-base text-[#6B21A8]" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800 mb-0 leading-tight">Your information is safe with us.</p>
          <p className="text-[12px] text-gray-400 mt-0.5 leading-tight mb-0">We do not share your personal details without your consent.</p>
        </div>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={handleBack}
            disabled={isSaving}
            className="text-xs font-semibold text-gray-500 hover:text-gray-800 px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
          >
            Back
          </button>
        )}

        <button
          type="button"
          onClick={handleNext}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-[#F95721] hover:bg-[#E04B18] text-white font-medium text-sm transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <LoadingOutlined className="text-xs" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <span>{currentStep < totalSteps ? 'Save & Continue' : 'Complete Profile'}</span>
              <span>→</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default StepNavigation;
