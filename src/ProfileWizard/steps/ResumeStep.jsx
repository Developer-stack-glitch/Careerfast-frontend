import React, { useState } from 'react';
import { useProfile } from '../ProfileContext';
import StepNavigation from '../StepNavigation';
import StepHeaderIllustration from '../StepHeaderIllustration';
import { Upload, message, Spin, Progress } from 'antd';
import { CloudUploadOutlined, FilePdfOutlined, CheckCircleFilled, DeleteOutlined } from '@ant-design/icons';
import { updateResume } from '../../ApiService/action';

const { Dragger } = Upload;

const ResumeStep = () => {
  const { profileData, updateProfileSection } = useProfile();
  const [fileList, setFileList] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // AI Parsing State
  const [showParsePrompt, setShowParsePrompt] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parseComplete, setParseComplete] = useState(false);

  const beforeUpload = (file) => {
    const isValidType = file.type === 'application/pdf' ||
      file.type === 'application/msword' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (!isValidType) {
      message.error('You can only upload PDF, DOC, or DOCX files!');
      return Upload.LIST_IGNORE;
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Resume must be smaller than 5MB!');
      return Upload.LIST_IGNORE;
    }

    return isValidType && isLt5M;
  };

  const handleUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    setIsUploading(true);

    try {
      const loginDetails = JSON.parse(localStorage.getItem('loginDetails') || '{}');
      const userId = loginDetails.id || localStorage.getItem('user_id');

      const formData = new FormData();
      formData.append('resume', file);
      formData.append('user_id', userId);
      formData.append('id', userId);

      const res = await updateResume(formData);

      if (res && res.status === 200) {
        onSuccess("ok");
        message.success(`${file.name} uploaded successfully.`);
        updateProfileSection('resume', file);
        setFileList([file]);
        setShowParsePrompt(true);
      } else {
        onError(new Error('Upload failed'));
        message.error(`Upload failed.`);
      }
    } catch (err) {
      onError(err);
      message.error(`Upload failed.`);
    } finally {
      setIsUploading(false);
    }
  };

  const reviewParsedInfo = () => {
    message.info('Reviewing extracted information (Mocked)');
    setParseComplete(false);
    setShowParsePrompt(false);
  };

  const handleValidate = async () => {
    return true; // Optional step
  };

  const parseSteps = [
    { label: 'Personal information', threshold: 25 },
    { label: 'Experience', threshold: 50 },
    { label: 'Education', threshold: 75 },
    { label: 'Skills', threshold: 100 },
  ];

  return (
    <div className="w-full">
      {/* Top Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <span className="text-xs font-bold text-[#6B21A8] uppercase tracking-wider block mb-1">
            STEP 7 OF 8
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight mb-2">
            Add your resume
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-xl leading-relaxed mb-0">
            Upload your latest resume so recruiters can understand your experience.
          </p>
        </div>
        <StepHeaderIllustration />
      </div>

      {/* Main White Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8">

        {/* Upload Area */}
        <Dragger
          name="resume"
          multiple={false}
          customRequest={handleUpload}
          beforeUpload={beforeUpload}
          showUploadList={false}
          style={{ background: '#F8F9FE', border: '2px dashed #D1C7F0', borderRadius: '16px', padding: '32px 0' }}
        >
          <p className="text-4xl mb-3">
            <CloudUploadOutlined className="text-[#6B21A8]" />
          </p>
          <p className="text-sm font-bold text-gray-800">
            Upload your resume
          </p>
          <p className="text-xs text-gray-500 mt-1.5">
            Drag & drop your file here, or <span className="text-[#6B21A8] font-semibold">Browse Files</span>
          </p>
          <p className="text-[11px] text-gray-400 mt-3">Supported formats: PDF, DOC, DOCX (Max: 5MB)</p>
        </Dragger>

        {/* Uploaded Resume Card */}
        {(fileList.length > 0 || profileData.resume) && (
          <div className="mt-6 border border-green-200 bg-green-50/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <FilePdfOutlined className="text-xl text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-0">
                  Resume uploaded <CheckCircleFilled className="text-green-500 text-xs" />
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5 mb-0">
                  {fileList[0]?.name || (profileData.resume?.name) || (typeof profileData.resume === 'string' && !profileData.resume.startsWith('data:') ? profileData.resume.split('/').pop().split('\\').pop() : 'Current_Resume.pdf')}
                </p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <Upload
                name="resume"
                customRequest={handleUpload}
                beforeUpload={beforeUpload}
                showUploadList={false}
              >
                <button type="button" className="px-4 py-2 rounded-xl border border-[#6B21A8] text-[#6B21A8] hover:bg-purple-50 font-bold text-xs transition-colors">
                  Replace
                </button>
              </Upload>
            </div>
          </div>
        )}

        {/* Uploading spinner */}
        {isUploading && (
          <div className="mt-4 text-center">
            <Spin /> <span className="ml-2 text-gray-500 text-xs">Uploading...</span>
          </div>
        )}

        {/* AI Parsing Progress */}
        {isParsing && (
          <div className="mt-6 border border-gray-100 rounded-2xl p-6 bg-white shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-0 mb-4">Analyzing your resume...</h3>

            <div className="space-y-2.5 mb-5">
              {parseSteps.map(({ label, threshold }) => (
                <div key={label} className="flex items-center text-xs gap-2">
                  {parseProgress >= threshold ? (
                    <CheckCircleFilled className="text-green-500 text-xs" />
                  ) : parseProgress >= threshold - 25 ? (
                    <Spin size="small" />
                  ) : (
                    <span className="w-3 h-3 border border-gray-300 rounded-full inline-block" />
                  )}
                  <span className={parseProgress >= threshold ? "text-gray-900 font-semibold" : "text-gray-500"}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <Progress percent={parseProgress} strokeColor="#6B21A8" showInfo={false} size="small" />
          </div>
        )}

        {/* AI Parsing Complete */}
        {parseComplete && (
          <div className="mt-6 border border-green-200 rounded-2xl p-6 bg-green-50/50">
            <h3 className="text-sm font-bold text-gray-900 mb-0 mb-1.5">Extraction Complete</h3>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              We found information that can be added to your profile. Please review it before we save anything.
            </p>
            <button
              type="button"
              onClick={reviewParsedInfo}
              className="px-5 py-2.5 rounded-xl bg-[#F95721] hover:bg-[#E04B18] text-white font-bold text-xs transition-colors"
            >
              Review Information
            </button>
          </div>
        )}

      </div>

      <StepNavigation onValidateStep={handleValidate} isSaving={isUploading} />
    </div>
  );
};

export default ResumeStep;
