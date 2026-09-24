import React, { useState, useEffect } from 'react';
import { useProfile } from '../ProfileContext';
import StepNavigation from '../StepNavigation';
import { Form, Input, Select, Upload, DatePicker, Row, Col, Modal, Button, App } from 'antd';
import {
  LoadingOutlined,
  CheckCircleFilled,
  SafetyCertificateOutlined,
  MailOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { updateBasicDetails, updateProfileImage, verifyEmail, verifyOtp } from '../../ApiService/action';
import dayjs from 'dayjs';

const { Option } = Select;

const BasicInformationStep = () => {
  const { message } = App.useApp();
  const { profileData, updateProfileSection } = useProfile();
  const [form] = Form.useForm();
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Email verification states
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      firstName: profileData.basic.firstName || '',
      lastName: profileData.basic.lastName || '',
      email: profileData.basic.email || '',
      mobile: profileData.basic.mobile || '',
      city: profileData.basic.city || '',
      state: profileData.basic.state || '',
      dob: profileData.basic.dob ? dayjs(profileData.basic.dob) : null,
      gender: profileData.basic.gender || undefined,
    });

    if (profileData.basic.isEmailVerified !== undefined) {
      setIsEmailVerified(Boolean(profileData.basic.isEmailVerified));
    }
  }, [profileData.basic, form]);

  // Resend countdown timer
  useEffect(() => {
    let timer;
    if (timerActive && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(timer);
  }, [timerActive, countdown]);

  const handleInitiateOtp = async () => {
    const currentEmail = form.getFieldValue('email') || profileData.basic.email;
    if (!currentEmail) {
      message.error('Please enter an email address first');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(currentEmail)) {
      message.error('Please enter a valid email address');
      return;
    }

    try {
      setIsSendingOtp(true);
      const res = await verifyEmail({ email: currentEmail });
      if (res && (res.status === 200 || res.status === 201)) {
        message.success(res?.data?.message || 'Verification code sent to your email!');
        setOtpValue('');
        setIsOtpModalOpen(true);
        setCountdown(30);
        setTimerActive(true);
      } else {
        message.error(res?.data?.message || 'Failed to send verification OTP');
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      message.error(err?.response?.data?.message || err?.message || 'Failed to send verification OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    await handleInitiateOtp();
  };

  const handleVerifyOtp = async () => {
    if (!otpValue || otpValue.length < 6) {
      message.error('Please enter the 6-digit OTP code');
      return;
    }
    const currentEmail = form.getFieldValue('email') || profileData.basic.email;

    try {
      setIsVerifyingOtp(true);
      const res = await verifyOtp({ email: currentEmail, otp: otpValue });
      if (
        res &&
        (res.status === 200 ||
          res.data?.message?.toLowerCase().includes('success') ||
          res.data?.message?.toLowerCase().includes('verified'))
      ) {
        message.success(res?.data?.message || 'Email verified successfully!');
        setIsEmailVerified(true);
        setIsOtpModalOpen(false);

        // Update profile context
        updateProfileSection('basic', {
          isEmailVerified: true,
          email: currentEmail,
        });

        // Update localStorage
        try {
          const loginDetails = JSON.parse(localStorage.getItem('loginDetails') || '{}');
          loginDetails.is_email_verified = 1;
          localStorage.setItem('loginDetails', JSON.stringify(loginDetails));
        } catch (e) {
          console.error(e);
        }
      } else {
        message.error(res?.data?.message || 'Invalid or expired OTP');
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      message.error(err?.response?.data?.message || err?.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleValidate = async () => {
    try {
      const values = await form.validateFields();
      setIsSaving(true);

      const newBasicData = {
        ...values,
        dob: values.dob ? values.dob.format('YYYY-MM-DD') : null,
        isEmailVerified,
      };

      updateProfileSection('basic', newBasicData);

      const loginDetails = JSON.parse(localStorage.getItem('loginDetails') || '{}');
      const userId = loginDetails.id || localStorage.getItem('user_id');

      const payload = {
        first_name: values.firstName,
        last_name: values.lastName,
        name: `${values.firstName} ${values.lastName}`.trim(),
        city: values.city,
        state: values.state,
        location: [values.city, values.state].filter(Boolean).join(', '),
        dob: newBasicData.dob,
        gender: values.gender,
        user_id: userId,
      };

      const res = await updateBasicDetails(payload);
      setIsSaving(false);

      if (res && res.status === 200) {
        return true;
      } else {
        message.error('Failed to save basic details');
        return false;
      }
    } catch (error) {
      console.error('Validation failed:', error);
      setIsSaving(false);
      return false;
    }
  };

  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG file!');
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Image must be smaller than 5MB!');
      return false;
    }
    return true;
  };

  const handlePhotoUpload = async (info) => {
    if (info.file.status === 'uploading') {
      setUploadingPhoto(true);
      return;
    }
    if (info.file.status === 'done' || info.file.originFileObj) {
      const loginDetails = JSON.parse(localStorage.getItem('loginDetails') || '{}');
      const userId = loginDetails.id || localStorage.getItem('user_id');

      const formData = new FormData();
      formData.append('profile_image', info.file.originFileObj);
      formData.append('user_id', userId);

      try {
        const res = await updateProfileImage(formData);
        if (res && res.status === 200) {
          message.success('Profile photo updated successfully');
          updateProfileSection('basic', { profilePhoto: URL.createObjectURL(info.file.originFileObj) });
        }
      } catch (err) {
        message.error('Failed to upload profile photo');
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  return (
    <div className="w-full">
      {/* Top Header */}
      <div className="mb-6">
        <span className="text-xs font-bold text-[#6B21A8] uppercase tracking-wider block mb-1">
          STEP 1 OF 8
        </span>
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight mb-2">
          Tell us about yourself
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 max-w-xl leading-relaxed mb-0">
          Add your basic information so recruiters can identify and contact you.
        </p>
      </div>

      {/* Main Step White Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8">
        {/* Upload Photo Section */}
        <div className="flex flex-col items-center justify-center pb-6">
          <Upload
            name="avatar"
            showUploadList={false}
            beforeUpload={beforeUpload}
            onChange={handlePhotoUpload}
            customRequest={({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0)}
          >
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-purple-200 bg-purple-50/20 hover:bg-purple-50 flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden group">
              {profileData.basic.profilePhoto ? (
                <img
                  src={profileData.basic.profilePhoto}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full group-hover:opacity-75 transition-opacity"
                />
              ) : uploadingPhoto ? (
                <LoadingOutlined className="text-xl text-[#6B21A8]" />
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <span className="text-2xl text-[#6B21A8] font-light leading-none mb-1">+</span>
                  <span className="text-[11px] font-semibold text-[#6B21A8]">Upload</span>
                </div>
              )}
            </div>
          </Upload>
          <p className="text-xs text-gray-500 mt-2.5 text-center mb-0">
            Upload a professional photo (JPG/PNG, max 5MB). <span className="italic text-gray-400">Optional</span>
          </p>
        </div>

        {/* Form Inputs */}
        <Form form={form} layout="vertical" className="mt-4" requiredMark={false} scrollToFirstError>
          <Row gutter={20}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="firstName"
                label={<span className="text-xs font-semibold text-gray-800"><span className="text-red-500 mr-1">*</span>First Name</span>}
                rules={[{ required: true, whitespace: true, message: 'Please enter your first name' }]}
              >
                <Input
                  placeholder="Enter first name"
                  className="h-11 rounded-xl text-sm border-gray-200"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="lastName"
                label={<span className="text-xs font-semibold text-gray-800"><span className="text-red-500 mr-1">*</span>Last Name</span>}
                rules={[{ required: true, whitespace: true, message: 'Please enter your last name' }]}
              >
                <Input
                  placeholder="Enter last name"
                  className="h-11 rounded-xl text-sm border-gray-200"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={20}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label={
                  <div className="flex items-center gap-2 justify-between w-full">
                    <span className="text-xs font-semibold text-gray-800">
                      <span className="text-red-500 mr-1">*</span>Email Address
                    </span>
                    {isEmailVerified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border-1 border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircleFilled className="text-emerald-500 text-xs" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border-1 border-amber-200 px-2 py-0.5 rounded-full">
                        <SafetyCertificateOutlined className="text-amber-500 text-xs" /> Not Verified
                      </span>
                    )}
                  </div>
                }
                rules={[
                  { required: true, whitespace: true, message: 'Please enter your email address' },
                  { type: 'email', message: 'Please enter a valid email address' },
                ]}
              >
                <Input
                  placeholder="Enter your email address"
                  disabled={isEmailVerified}
                  onChange={() => {
                    if (isEmailVerified) setIsEmailVerified(false);
                  }}
                  suffix={
                    isEmailVerified ? (
                      <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium pr-1">
                        <CheckCircleFilled className="text-emerald-500 text-base" />
                      </span>
                    ) : (
                      <Button
                        type="primary"
                        size="small"
                        loading={isSendingOtp}
                        onClick={handleInitiateOtp}
                        className="bg-[#6B21A8] hover:bg-[#581C87] text-white rounded-lg text-xs font-medium px-2.5 h-7 shadow-none border-none flex items-center gap-1"
                      >
                        <SafetyCertificateOutlined /> Verify with OTP
                      </Button>
                    )
                  }
                  className={`h-11 rounded-xl text-sm border-gray-200 ${isEmailVerified ? 'bg-gray-50 text-gray-600' : 'bg-white'
                    }`}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="mobile"
                label={<span className="text-xs font-semibold text-gray-800">Mobile Number</span>}
              >
                <Input
                  placeholder="Enter your mobile number"
                  disabled
                  className="h-11 rounded-xl text-sm border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={20}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="city"
                label={<span className="text-xs font-semibold text-gray-800"><span className="text-red-500 mr-1">*</span>Current City</span>}
                rules={[{ required: true, whitespace: true, message: 'Please enter your city' }]}
              >
                <Input
                  placeholder="e.g. Bangalore"
                  className="h-11 rounded-xl text-sm border-gray-200"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="state"
                label={<span className="text-xs font-semibold text-gray-800"><span className="text-red-500 mr-1">*</span>State</span>}
                rules={[{ required: true, whitespace: true, message: 'Please enter your state' }]}
              >
                <Input
                  placeholder="e.g. Karnataka"
                  className="h-11 rounded-xl text-sm border-gray-200"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={20}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="dob"
                label={<span className="text-xs font-semibold text-gray-800">Date of Birth <span className="text-gray-400 font-normal">(Optional)</span></span>}
              >
                <DatePicker
                  placeholder="Select date"
                  format="YYYY-MM-DD"
                  className="h-11 w-full rounded-xl text-sm border-gray-200"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="gender"
                label={<span className="text-xs font-semibold text-gray-800">Gender <span className="text-gray-400 font-normal">(Optional)</span></span>}
              >
                <Select
                  placeholder="Select gender"
                  className="h-11 w-full rounded-xl text-sm"
                  allowClear
                >
                  <Option value="Man">Man</Option>
                  <Option value="Woman">Woman</Option>
                  <Option value="Non-binary">Non-binary</Option>
                  <Option value="Prefer to self-describe">Prefer to self-describe</Option>
                  <Option value="Prefer not to say">Prefer not to say</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Info footnote */}
          <div className="text-gray-400 text-xs mt-1">
            <span>Some job listings have minimum age requirements — this isn't shown on your public profile.</span>
          </div>
        </Form>
      </div>

      {/* Email Verification OTP Modal */}
      <Modal
        open={isOtpModalOpen}
        onCancel={() => setIsOtpModalOpen(false)}
        footer={null}
        centered
        width={440}
        destroyOnHidden
        className="email-otp-modal"
      >
        <div className="text-center py-4 px-2">
          <div className="w-16 h-16 bg-purple-100/80 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-200 shadow-sm">
            <MailOutlined className="text-3xl text-[#6B21A8]" />
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-1">Verify Your Email</h3>
          <p className="text-xs text-gray-500 max-w-xs mx-auto mb-6">
            We've sent a 6-digit verification code to{' '}
            <span className="font-semibold text-gray-800">
              {form.getFieldValue('email') || profileData.basic.email}
            </span>
          </p>

          <div className="flex justify-center mb-6">
            <Input.OTP
              length={6}
              value={otpValue}
              onChange={(text) => setOtpValue(text)}
              size="large"
            />
          </div>

          <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-6">
            {countdown > 0 ? (
              <span className="flex items-center gap-1 text-gray-400">
                <ClockCircleOutlined /> Resend code in{' '}
                <strong className="text-[#6B21A8]">{countdown}s</strong>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                Didn't receive the code?
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isSendingOtp}
                  className="text-[#6B21A8] hover:text-[#581C87] font-semibold underline disabled:opacity-50 cursor-pointer"
                >
                  {isSendingOtp ? 'Sending...' : 'Resend OTP'}
                </button>
              </span>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1 h-11 rounded-xl text-xs font-semibold border-gray-200 text-gray-600 hover:text-gray-800 hover:border-gray-300"
              onClick={() => setIsOtpModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              loading={isVerifyingOtp}
              onClick={handleVerifyOtp}
              disabled={otpValue.length < 6}
              className="flex-1 h-11 rounded-xl text-xs font-semibold bg-[#6B21A8] hover:bg-[#581C87] text-white border-none shadow-md disabled:bg-purple-300 disabled:text-white"
            >
              Verify OTP
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bottom Action Bar */}
      <StepNavigation onValidateStep={handleValidate} isSaving={isSaving} />
    </div>
  );
};

export default BasicInformationStep;
