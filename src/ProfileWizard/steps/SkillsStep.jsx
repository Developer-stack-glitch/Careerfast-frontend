import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useProfile } from '../ProfileContext';
import StepNavigation from '../StepNavigation';
import StepHeaderIllustration from '../StepHeaderIllustration';
import { Select, Modal, Input, message, Spin, Tooltip } from 'antd';
import {
  PlusOutlined,
  CloseOutlined,
  SearchOutlined,
  CheckOutlined,
  EditOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  FireOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { updateSkills } from '../../ApiService/action';
import {
  fetchWorldwideSkills,
  getInitialSkills,
  SKILL_CATEGORIES,
} from '../../Common/worldwideDataService';

const { Option } = Select;

const EXPERIENCE_PRESETS = [
  'Less than 1 year',
  '1 - 2 years',
  '3 - 5 years',
  '5+ years',
];

const SkillsStep = () => {
  const { profileData, updateProfileField } = useProfile();

  const initialSkills = Array.isArray(profileData.skills)
    ? profileData.skills
    : typeof profileData.skills === 'string' && profileData.skills.length > 0
    ? profileData.skills.split(',')
    : [];

  const [selectedSkills, setSelectedSkills] = useState(initialSkills);
  const [searchValue, setSearchValue] = useState('');
  const [skillOptions, setSkillOptions] = useState(getInitialSkills);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Popular');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSkillIndex, setActiveSkillIndex] = useState(null);
  const [skillExperience, setSkillExperience] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const searchTimer = useRef(null);

  // Sync from context when loaded
  useEffect(() => {
    if (Array.isArray(profileData.skills)) {
      setSelectedSkills(profileData.skills);
    }
  }, [profileData.skills]);

  // Debounced search for worldwide skills via third-party ESCO API and master catalog
  const handleSearchSkills = useCallback((query) => {
    setSearchValue(query);
    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (!query || !query.trim()) {
      setSkillOptions(SKILL_CATEGORIES[activeCategory] || getInitialSkills());
      setLoadingSkills(false);
      return;
    }

    setLoadingSkills(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const results = await fetchWorldwideSkills(query);
        setSkillOptions(results);
      } catch (err) {
        console.error('Error searching worldwide skills:', err);
      } finally {
        setLoadingSkills(false);
      }
    }, 280);
  }, [activeCategory]);

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setSearchValue('');
    setSkillOptions(SKILL_CATEGORIES[category] || getInitialSkills());
  };

  const isSkillSelected = (skillName) => {
    const clean = skillName.trim().toLowerCase();
    return selectedSkills.some(s => {
      const base = s.split(' | ')[0].trim().toLowerCase();
      return base === clean;
    });
  };

  const handleAddSkill = (skill) => {
    if (!skill || !skill.trim()) return;
    const cleanSkill = skill.trim();

    if (!isSkillSelected(cleanSkill)) {
      const newSkills = [...selectedSkills, cleanSkill];
      setSelectedSkills(newSkills);
      updateProfileField('skills', '', newSkills);
      setSearchValue('');
    } else {
      message.info(`"${cleanSkill}" is already in your skills list`);
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    const newSkills = selectedSkills.filter(skill => skill !== skillToRemove);
    setSelectedSkills(newSkills);
    updateProfileField('skills', '', newSkills);
  };

  const handleClearAll = () => {
    setSelectedSkills([]);
    updateProfileField('skills', '', []);
  };

  const openExperienceModal = (index) => {
    if (index === null || index === undefined || !selectedSkills[index]) return;
    setActiveSkillIndex(index);
    const skillParts = (selectedSkills[index] || '').split(' | ');
    if (skillParts.length > 1) {
      setSkillExperience(skillParts[1]);
    } else {
      setSkillExperience('');
    }
    setIsModalOpen(true);
  };

  const handleSaveExperience = () => {
    if (activeSkillIndex === null || !selectedSkills[activeSkillIndex]) {
      setIsModalOpen(false);
      return;
    }
    const newSkills = [...selectedSkills];
    const skillParts = (newSkills[activeSkillIndex] || '').split(' | ');
    const baseSkill = skillParts[0];

    if (skillExperience && skillExperience.trim() !== '') {
      newSkills[activeSkillIndex] = `${baseSkill} | ${skillExperience.trim()}`;
    } else {
      newSkills[activeSkillIndex] = baseSkill;
    }

    setSelectedSkills(newSkills);
    updateProfileField('skills', '', newSkills);
    setIsModalOpen(false);
    setActiveSkillIndex(null);
  };

  const handleRemoveExperienceOnly = () => {
    if (activeSkillIndex === null || !selectedSkills[activeSkillIndex]) {
      setIsModalOpen(false);
      return;
    }
    const newSkills = [...selectedSkills];
    const skillParts = (newSkills[activeSkillIndex] || '').split(' | ');
    newSkills[activeSkillIndex] = skillParts[0];
    setSelectedSkills(newSkills);
    updateProfileField('skills', '', newSkills);
    setIsModalOpen(false);
    setActiveSkillIndex(null);
  };

  const handleValidate = async () => {
    setIsSaving(true);
    try {
      const loginDetails = JSON.parse(localStorage.getItem('loginDetails') || '{}');
      const userId = loginDetails.id || localStorage.getItem('user_id');
      const payload = {
        skills: selectedSkills,
        user_id: userId,
      };
      await updateSkills(payload);
      setIsSaving(false);
      return true;
    } catch (error) {
      setIsSaving(false);
      message.error('Failed to save skills');
      return false;
    }
  };

  const activeCategorySkills = SKILL_CATEGORIES[activeCategory] || [];

  return (
    <div className="w-full">
      {/* Top Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <span className="text-xs font-bold text-[#6B21A8] uppercase tracking-wider block mb-1">
            STEP 5 OF 8
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight mb-2">
            Showcase your skills
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-xl leading-relaxed mb-0">
            Add the skills recruiters look for to match you with top worldwide opportunities.
          </p>
        </div>
        <StepHeaderIllustration />
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">

        {/* Search Worldwide Skills Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
              <SearchOutlined className="text-[#6B21A8]" /> Search and add skills
            </label>
            <span className="text-[11px] font-normal text-gray-400">
              Type any skill & press Enter to add
            </span>
          </div>

          <Select
            mode="tags"
            showSearch
            className="w-full text-sm custom-skill-select"
            placeholder="Search worldwide skills (e.g. React, Python, AWS, Docker, Figma, SEO)..."
            value={[]}
            onChange={(values) => {
              if (values.length > 0) {
                handleAddSkill(values[values.length - 1]);
              }
            }}
            onSearch={handleSearchSkills}
            searchValue={searchValue}
            filterOption={false}
            loading={loadingSkills}
            notFoundContent={
              loadingSkills ? (
                <div className="py-4 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                  <Spin size="small" /> Searching worldwide skills database...
                </div>
              ) : searchValue ? (
                <div className="py-2.5 text-center text-xs text-gray-400">
                  Press <kbd className="px-1.5 py-0.5 bg-gray-100 border rounded text-[11px] font-semibold text-gray-600">Enter</kbd> to add "{searchValue}" as a custom skill
                </div>
              ) : null
            }
          >
            {skillOptions
              .filter(skill => !isSkillSelected(skill))
              .map(skill => (
                <Option key={skill} value={skill}>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="font-medium text-gray-800">
                      {skill}
                    </span>
                    <span className="text-[11px] text-purple-600 flex items-center gap-0.5 font-normal">
                      <PlusOutlined /> Add
                    </span>
                  </div>
                </Option>
              ))}
          </Select>
        </div>

        {/* Category Filter Tabs */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1">
              <FireOutlined className="text-orange-500" /> Explore By Category
            </span>
            <span className="text-[11px] text-gray-400">Click to quickly add</span>
          </div>

          <div className="flex flex-wrap gap-1.5 pb-1">
            {Object.keys(SKILL_CATEGORIES).map(cat => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#6B21A8] text-white shadow-sm shadow-purple-200 font-semibold'
                      : 'bg-gray-50 text-gray-600 hover:bg-purple-50 hover:text-[#6B21A8] border border-gray-200/70'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick-Add Chips for Active Category */}
        <div className="mb-7 bg-[#FAF7FF] border border-purple-100/80 rounded-2xl p-3.5">
          <div className="flex flex-wrap gap-2">
            {activeCategorySkills.map(skill => {
              const selected = isSkillSelected(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleAddSkill(skill)}
                  disabled={selected}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                    selected
                      ? 'bg-purple-100/70 text-[#6B21A8] cursor-default border border-purple-200/50'
                      : 'bg-white text-gray-700 hover:bg-purple-50 hover:text-[#6B21A8] hover:border-purple-300 border border-purple-200/70 shadow-xs cursor-pointer active:scale-95'
                  }`}
                >
                  {selected ? (
                    <>
                      <CheckOutlined className="text-[10px] text-purple-600" />
                      <span>{skill}</span>
                    </>
                  ) : (
                    <>
                      <PlusOutlined className="text-[10px] text-[#6B21A8]" />
                      <span>{skill}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Skills Section */}
        <div className="border-t border-gray-100 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900 mb-0">Your Added Skills</h2>
              <span className="px-2 py-0.5 bg-purple-100 text-[#6B21A8] rounded-full text-xs font-semibold">
                {selectedSkills.length}
              </span>
              {selectedSkills.length >= 5 ? (
                <span className="text-[11px] text-emerald-600 font-medium hidden sm:inline">
                  • Excellent skills profile!
                </span>
              ) : selectedSkills.length >= 3 ? (
                <span className="text-[11px] text-blue-600 font-medium hidden sm:inline">
                  • Good start! Add 2+ more for best results
                </span>
              ) : (
                <span className="text-[11px] text-amber-600 font-medium hidden sm:inline">
                  • Add at least 3 skills to stand out
                </span>
              )}
            </div>

            {selectedSkills.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] text-gray-400 hover:text-red-500 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {selectedSkills.length === 0 ? (
            <div className="bg-gradient-to-b from-gray-50 to-[#FAF7FF] rounded-2xl p-8 text-center border border-dashed border-purple-200">
              <div className="w-11 h-11 bg-purple-100 text-[#6B21A8] rounded-2xl flex items-center justify-center mx-auto mb-2 text-lg">
                <GlobalOutlined />
              </div>
              <p className="text-xs font-semibold text-gray-700 mb-1">No skills added yet</p>
              <p className="text-[11px] text-gray-400 max-w-sm mx-auto mb-0">
                Search in the box above or click on any category pills to quickly add your technical and professional skills.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {selectedSkills.map((skill, index) => {
                const parts = skill.split(' | ');
                const skillName = parts[0];
                const hasExp = parts.length > 1 && parts[1].trim() !== '';

                return (
                  <div
                    key={index}
                    className="group inline-flex items-center bg-white hover:bg-purple-50/50 border border-purple-200 hover:border-purple-300 rounded-xl shadow-xs transition-all overflow-hidden"
                  >
                    {/* Skill Title & Experience Pill */}
                    <button
                      type="button"
                      onClick={() => openExperienceModal(index)}
                      className="px-3 py-2 flex items-center gap-2 text-left cursor-pointer hover:bg-purple-50 transition-colors"
                      title="Click to add or update experience"
                    >
                      <span className="text-xs font-bold text-gray-800 group-hover:text-[#6B21A8]">
                        {skillName}
                      </span>

                      {hasExp ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#6B21A8]/10 text-[#6B21A8] px-2 py-0.5 rounded-md">
                          <ClockCircleOutlined className="text-[9px]" /> {parts[1]}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400 group-hover:text-[#6B21A8] bg-gray-100 group-hover:bg-purple-100/60 px-1.5 py-0.5 rounded transition-colors flex items-center gap-0.5">
                          <ClockCircleOutlined className="text-[9px]" /> + Exp
                        </span>
                      )}
                    </button>

                    {/* Remove Skill Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="px-2.5 py-2 text-gray-300 hover:text-red-500 hover:bg-red-50 border-l border-gray-100 transition-colors text-xs flex items-center justify-center cursor-pointer"
                      title="Remove skill"
                    >
                      <CloseOutlined className="text-[10px]" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Experience Helper Tip */}
          <div className="mt-5 p-3.5 bg-[#F9F7FD] rounded-xl border border-purple-100/70 flex items-start gap-2.5">
            <BulbOutlined className="text-[#6B21A8] text-sm mt-0.5 shrink-0" />
            <p className="text-[11px] text-gray-600 leading-relaxed mb-0">
              <strong className="text-gray-800">Recruiter Tip:</strong> Click on any added skill above to set your years of experience (e.g. <em>3 years</em>). Profiles with specific skills and experience receive up to <strong>70% more interview invites</strong>.
            </p>
          </div>
        </div>
      </div>

      <StepNavigation onValidateStep={handleValidate} isSaving={isSaving} />

      {/* Neat Experience Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
            <ClockCircleOutlined className="text-[#6B21A8] text-base" />
            <div>
              <span className="text-sm font-bold text-gray-900 block">
                Add Experience for {activeSkillIndex !== null && selectedSkills[activeSkillIndex] ? selectedSkills[activeSkillIndex].split(' | ')[0] : 'Skill'}
              </span>
              <span className="text-[11px] text-gray-400 font-normal">
                Helps recruiters know your proficiency level (optional)
              </span>
            </div>
          </div>
        }
        open={isModalOpen}
        onOk={handleSaveExperience}
        onCancel={() => {
          setIsModalOpen(false);
          setActiveSkillIndex(null);
        }}
        wrapClassName="profile-wizard-scope profile-wizard-modal"
        okText="Save Experience"
        okButtonProps={{ className: "bg-[#F95721] hover:bg-[#F95721] rounded-xl font-medium" }}
        cancelButtonProps={{ className: "rounded-xl font-medium" }}
      >
        <div className="pt-4 pb-2">
          {/* Quick Presets */}
          <label className="block text-xs font-semibold text-gray-700 mb-2">
            Quick Select Preset
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {EXPERIENCE_PRESETS.map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => setSkillExperience(preset)}
                className={`py-2 px-2 text-center rounded-xl text-xs font-medium border transition-all ${
                  skillExperience === preset
                    ? 'bg-[#6B21A8] text-white border-[#6B21A8] shadow-xs'
                    : 'bg-gray-50 hover:bg-purple-50 text-gray-700 border-gray-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Custom Input */}
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Or Type Custom Duration
          </label>
          <Input
            placeholder="e.g. 2 years, 6 months"
            value={skillExperience}
            onChange={(e) => setSkillExperience(e.target.value)}
            className="h-11 rounded-xl text-sm border-gray-200"
            allowClear
          />

          {/* Remove existing experience button if set */}
          {activeSkillIndex !== null && selectedSkills[activeSkillIndex]?.includes(' | ') && (
            <div className="mt-3 text-right">
              <button
                type="button"
                onClick={handleRemoveExperienceOnly}
                className="text-xs text-red-500 hover:text-red-700 transition-colors underline"
              >
                Remove experience from this skill
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default SkillsStep;
