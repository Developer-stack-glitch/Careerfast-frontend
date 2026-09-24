import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useProfile } from '../ProfileContext';
import StepNavigation from '../StepNavigation';
import StepHeaderIllustration from '../StepHeaderIllustration';
import { Form, Select, Switch, message, Input, Spin } from 'antd';
import { GlobalOutlined, LockOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { updateVisibility } from '../../ApiService/action';
import {
  fetchWorldwideCompanies,
  getInitialCompanies,
} from '../../Common/worldwideDataService';

const { Option } = Select;

const visibilityOptions = [
  {
    key: 'Public',
    icon: <GlobalOutlined className="text-base" />,
    title: 'Public',
    badge: null,
    description: 'Recruiters can discover your profile through candidate search and view your full details.',
  },
  {
    key: 'Limited',
    icon: <EyeInvisibleOutlined className="text-base" />,
    title: 'Limited',
    badge: 'Default',
    description: 'Your profile is visible in search, but certain personal contact details are hidden until you connect.',
  },
  {
    key: 'Private',
    icon: <LockOutlined className="text-base" />,
    title: 'Private',
    badge: null,
    description: 'Your profile will not appear in recruiter searches. You can only apply to jobs directly.',
  },
];

const VisibilityStep = () => {
  const { profileData, updateProfileSection } = useProfile();
  const [form] = Form.useForm();
  const [visibilityMode, setVisibilityMode] = useState(profileData.visibility.mode || 'Limited');
  const [isSaving, setIsSaving] = useState(false);

  // Worldwide companies state
  const [companyOptions, setCompanyOptions] = useState(getInitialCompanies);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const companySearchTimer = useRef(null);

  useEffect(() => {
    const savedCompanies = profileData.visibility.hiddenCompanies || [];
    if (savedCompanies.length > 0) {
      setCompanyOptions(prev => [...new Set([...savedCompanies, ...prev])]);
    }

    form.setFieldsValue({
      mode: profileData.visibility.mode || 'Limited',
      hiddenCompanies: savedCompanies,
      allowContact: profileData.visibility.allowContact !== undefined ? profileData.visibility.allowContact : true,
      showInSearch: profileData.visibility.showInSearch !== undefined ? profileData.visibility.showInSearch : true,
    });
  }, [profileData.visibility, form]);

  // Debounced search for worldwide companies via third-party API
  const handleSearchCompanies = useCallback((query) => {
    if (companySearchTimer.current) clearTimeout(companySearchTimer.current);

    if (!query || !query.trim()) {
      setCompanyOptions(getInitialCompanies());
      setLoadingCompanies(false);
      return;
    }

    setLoadingCompanies(true);
    companySearchTimer.current = setTimeout(async () => {
      try {
        const results = await fetchWorldwideCompanies(query);
        const currentSelected = form.getFieldValue('hiddenCompanies') || [];
        // Preserve selected items in options
        setCompanyOptions([...new Set([...currentSelected, ...results])]);
      } catch (err) {
        console.error('Error searching worldwide companies:', err);
      } finally {
        setLoadingCompanies(false);
      }
    }, 280);
  }, [form]);

  const handleModeSelect = (mode) => {
    setVisibilityMode(mode);
    form.setFieldsValue({ mode });
  };

  const handleValidate = async () => {
    try {
      const values = await form.validateFields();
      setIsSaving(true);

      updateProfileSection('visibility', values);

      try {
        const loginDetails = JSON.parse(localStorage.getItem('loginDetails') || '{}');
        const userId = loginDetails.id || localStorage.getItem('user_id');
        const payload = {
          visibility_mode: values.mode,
          hidden_companies: values.hiddenCompanies,
          allow_contact: values.allowContact,
          show_in_search: values.showInSearch,
          user_id: userId,
        };
        await updateVisibility(payload);
      } catch (err) {
        console.error("API error", err);
      }

      setIsSaving(false);
      return true;
    } catch (error) {
      console.error('Validation failed:', error);
      setIsSaving(false);
      return false;
    }
  };

  return (
    <div className="w-full">
      {/* Top Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <span className="text-xs font-bold text-[#6B21A8] uppercase tracking-wider block mb-1">
            STEP 8 OF 8
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight mb-2">
            Choose who can discover your profile
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-xl leading-relaxed mb-0">
            Control how recruiters can find and contact you.
          </p>
        </div>
        <StepHeaderIllustration />
      </div>

      {/* Main White Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8">
        <Form form={form} layout="vertical">

          <Form.Item name="mode" className="hidden">
            <Input />
          </Form.Item>

          {/* Visibility Options */}
          <div className="space-y-3 mb-8">
            {visibilityOptions.map(opt => {
              const isSelected = visibilityMode === opt.key;
              return (
                <div
                  key={opt.key}
                  onClick={() => handleModeSelect(opt.key)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${isSelected
                    ? 'border-[#6B21A8] bg-[#F5F0FF]'
                    : 'border-gray-100 border-gray-200 bg-white'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#6B21A8] text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                      {opt.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm font-bold ${isSelected ? 'text-[#3B0764]' : 'text-gray-700'}`}>
                        {opt.title}
                        {opt.badge && (
                          <span className="text-[10px] font-semibold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-lg ml-2">
                            {opt.badge}
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed mb-0">{opt.description}</p>
                    </div>
                    <div className="ml-auto flex-shrink-0 mt-1">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-[#6B21A8]' : 'border-gray-300'
                        }`}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#6B21A8]" />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hidden Companies */}
          <div className="border-t border-gray-100 pt-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-1.5">Hide from specific companies</h3>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">Recruiters from these companies won't see your profile in search, even if your visibility is Public.</p>

            <Form.Item name="hiddenCompanies">
              <Select
                mode="tags"
                showSearch
                placeholder="Search worldwide companies (e.g. Google, Amazon, Microsoft, TCS)..."
                className="w-full rounded-xl text-sm"
                onSearch={handleSearchCompanies}
                filterOption={false}
                loading={loadingCompanies}
                notFoundContent={
                  loadingCompanies ? (
                    <div className="py-3 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                      <Spin size="small" /> Searching worldwide companies...
                    </div>
                  ) : (
                    <div className="py-2 text-center text-xs text-gray-400">
                      Type any company name & press Enter to add
                    </div>
                  )
                }
              >
                {companyOptions.map(company => (
                  <Option key={company} value={company}>{company}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          {/* Additional Preferences */}
          <div className="border-t border-gray-100 pt-6 space-y-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Additional Preferences</h3>

            <div className="flex items-center justify-between gap-4 p-3 bg-[#F8F9FE] rounded-2xl">
              <div>
                <p className="text-sm font-semibold mb-0 text-gray-900">Allow recruiters to contact me directly</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Recruiters can send you messages regarding job opportunities.</p>
              </div>
              <Form.Item name="allowContact" valuePropName="checked" className="mb-0">
                <Switch />
              </Form.Item>
            </div>

            <div className="flex items-center justify-between gap-4 p-3 bg-[#F8F9FE] rounded-2xl mt-0">
              <div>
                <p className="text-sm font-semibold mb-0 text-gray-900">Show my profile in external search engines</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Allow search engines like Google to index your public profile.</p>
              </div>
              <Form.Item name="showInSearch" valuePropName="checked" className="mb-0">
                <Switch />
              </Form.Item>
            </div>
          </div>

        </Form>
      </div>

      <StepNavigation onValidateStep={handleValidate} isSaving={isSaving} />
    </div>
  );
};

export default VisibilityStep;
