import React, { useState } from 'react';
import { useProfile } from '../ProfileContext';
import StepNavigation from '../StepNavigation';
import { Tag, Progress } from 'antd';
import { EditOutlined, EnvironmentOutlined, UserOutlined, FilePdfOutlined, CheckCircleFilled, MailOutlined } from '@ant-design/icons';
import { updateBasicDetails, updateAbout, updateSkills, updateVisibility } from '../../ApiService/action';
import dayjs from 'dayjs';

const SectionHeader = ({ title, stepNumber, onEdit }) => (
  <div className="flex justify-between items-center mb-4">
    <h3 className="text-sm font-bold text-gray-900 mb-0">{title}</h3>
    <button
      type="button"
      onClick={() => onEdit(stepNumber)}
      className="flex items-center gap-1.5 text-xs font-semibold text-[#6B21A8] hover:text-[#581C87] transition-colors"
    >
      <EditOutlined className="text-[10px]" />
      <span>Edit</span>
    </button>
  </div>
);

const ReviewStep = () => {
  const { profileData, goToStep, calculateCompletion } = useProfile();
  const [isSaving, setIsSaving] = useState(false);

  const completion = calculateCompletion();

  const handleEdit = (stepNumber) => {
    goToStep(stepNumber);
  };

  const handleFinalSubmit = async () => {
    try {
      setIsSaving(true);
      const loginDetails = JSON.parse(localStorage.getItem('loginDetails') || '{}');
      const userId = loginDetails.id || localStorage.getItem('user_id');

      // Final consolidated sync to ensure all data is in MySQL
      const basicPayload = {
        first_name: profileData.basic.firstName,
        last_name: profileData.basic.lastName,
        name: `${profileData.basic.firstName} ${profileData.basic.lastName}`.trim(),
        gender: profileData.basic.gender,
        dob: profileData.basic.dob ? dayjs(profileData.basic.dob).format('YYYY-MM-DD') : null,
        city: profileData.basic.city,
        state: profileData.basic.state,
        location: [profileData.basic.city, profileData.basic.state].filter(Boolean).join(', '),
        user_type: profileData.professional.jobTitle,
        job_title: profileData.professional.jobTitle,
        total_years: profileData.experience.isFresher ? '0 years' : profileData.professional.totalExperience,
        experience: profileData.experience.isFresher ? '0 years' : profileData.professional.totalExperience,
        experince_type: profileData.experience.isFresher ? 'Fresher' : 'Experience',
        is_fresher: profileData.experience.isFresher,
        headline: profileData.professional.headline,
        about: profileData.professional.summary,
        user_id: userId,
      };

      const promises = [
        updateBasicDetails(basicPayload),
        updateAbout({ about: profileData.professional.summary, user_id: userId, id: userId }),
        updateSkills({ skills: profileData.skills, user_id: userId }),
        updateVisibility({
          visibility_mode: profileData.visibility.mode,
          hidden_companies: profileData.visibility.hiddenCompanies,
          allow_contact: profileData.visibility.allowContact,
          show_in_search: profileData.visibility.showInSearch,
          user_id: userId,
        }),
      ];

      await Promise.allSettled(promises);
      setIsSaving(false);
      return true;
    } catch (err) {
      console.error('Final profile save error:', err);
      setIsSaving(false);
      return true;
    }
  };

  return (
    <div className="w-full">
      {/* Top Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <span className="text-xs font-bold text-[#6B21A8] uppercase tracking-wider block mb-1">
            FINAL REVIEW
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight mb-2">
            Review your profile
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-xl leading-relaxed mb-0">
            Here's how recruiters will see your profile. Make sure everything looks great.
          </p>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 mb-4 border border-gray-100 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Avatar + Main Info */}
          <div className="flex items-center gap-5 min-w-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-gray-100 bg-purple-50 shrink-0 flex items-center justify-center shadow-xs">
              {profileData.basic.profilePhoto ? (
                <img src={profileData.basic.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserOutlined className="text-2xl text-[#6B21A8] opacity-50" />
              )}
            </div>

            <div className="space-y-1 text-left min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-0">
                  {profileData.basic.firstName} {profileData.basic.lastName}
                </h2>
                {profileData.basic.isEmailVerified ? (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <CheckCircleFilled className="text-[10px] text-emerald-500" /> Verified
                  </span>
                ) : (
                  <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    Pending
                  </span>
                )}
              </div>

              <p className="text-sm font-semibold text-[#6B21A8] mb-0">
                {profileData.professional.jobTitle || 'Candidate'}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 pt-0.5">
                {profileData.basic.city && (
                  <span className="inline-flex items-center gap-1">
                    <EnvironmentOutlined className="text-gray-400" />
                    <span>{profileData.basic.city}{profileData.basic.state ? `, ${profileData.basic.state}` : ''}</span>
                  </span>
                )}

                {profileData.basic.email && (
                  <span className="inline-flex items-center gap-1">
                    <MailOutlined className="text-gray-400" />
                    <span>{profileData.basic.email}</span>
                  </span>
                )}

                {profileData.experience.isFresher ? (
                  <span className="text-[#6B21A8] font-medium">🎓 Fresher</span>
                ) : profileData.professional.totalExperience ? (
                  <span>• {profileData.professional.totalExperience}</span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Right Side: Profile Strength + Edit */}
          <div className="flex items-center sm:justify-end gap-3.5 border-t lg:border-t-0 pt-4 lg:pt-0 border-gray-100 shrink-0">
            <div className={`border rounded-2xl px-4 py-2.5 min-w-[190px] ${completion === 100 ? 'bg-emerald-50/50 border-emerald-200' : 'bg-[#FAF8FF] border-purple-100'}`}>
              <div className="flex justify-between items-center text-xs font-semibold mb-1">
                <span className="text-gray-500 text-[10px] uppercase tracking-wider">Profile Strength</span>
                <span className={`font-extrabold text-xs ${completion === 100 ? 'text-emerald-700' : 'text-[#6B21A8]'}`}>{completion}%</span>
              </div>
              <Progress percent={completion} strokeColor={completion === 100 ? '#10B981' : '#6B21A8'} trailColor={completion === 100 ? '#D1FAE5' : '#EDE9FE'} showInfo={false} size={['100%', 5]} />
            </div>

            <button
              type="button"
              onClick={() => handleEdit(1)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B21A8] hover:text-[#581C87] bg-purple-50/70 hover:bg-purple-100/80 border border-purple-200 px-3.5 py-2.5 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <EditOutlined />
              <span>Edit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="space-y-4">

        {/* Professional Summary */}
        <div className="bg-white rounded-3xl p-6">
          <SectionHeader title="Professional Summary" stepNumber={2} onEdit={handleEdit} />
          {profileData.professional.headline && (
            <p className="text-xs font-bold text-gray-800 mb-1.5">{profileData.professional.headline}</p>
          )}
          {profileData.professional.summary ? (
            <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">{profileData.professional.summary}</p>
          ) : (
            <p className="text-xs text-gray-400 italic">No summary provided.</p>
          )}
        </div>

        {/* Work Experience */}
        <div className="bg-white rounded-3xl p-6">
          <SectionHeader title="Work Experience" stepNumber={3} onEdit={handleEdit} />

          {profileData.experience.list.length > 0 ? (
            <div className="space-y-4">
              {profileData.experience.list.map((exp, idx) => (
                <div key={idx} className="relative pl-5 border-l-2 border-purple-200">
                  <div className="absolute w-2.5 h-2.5 bg-white border-2 border-[#6B21A8] rounded-full -left-[6px] top-1" />
                  <h4 className="text-xs font-bold text-gray-900">{exp.job_title || exp.jobTitle}</h4>
                  <p className="text-xs text-gray-600 font-medium mb-0">{exp.company_name || exp.company}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 mb-0">
                    {exp.start_date ? dayjs(exp.start_date).format('MMM YYYY') : exp.startDate ? dayjs(exp.startDate).format('MMM YYYY') : ''} – {' '}
                    {exp.currentlyWorking || (!exp.end_date && !exp.endDate) ? 'Present' : (exp.end_date ? dayjs(exp.end_date).format('MMM YYYY') : dayjs(exp.endDate).format('MMM YYYY'))}
                  </p>
                  {exp.description && <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{exp.description}</p>}
                </div>
              ))}
            </div>
          ) : profileData.experience.isFresher ? (
            <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-3 text-xs text-[#6B21A8] font-medium flex items-center gap-2">
              <span>🎓</span> Registered as a Fresher (No prior full-time work experience)
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No experience added.</p>
          )}
        </div>

        {/* Education */}
        <div className="bg-white rounded-3xl p-6">
          <SectionHeader title="Education" stepNumber={4} onEdit={handleEdit} />

          {profileData.education.length > 0 ? (
            <div className="space-y-4">
              {profileData.education.map((edu, idx) => (
                <div key={idx} className="relative pl-5 border-l-2 border-gray-200">
                  <div className="absolute w-2.5 h-2.5 bg-white border-2 border-gray-400 rounded-full -left-[6px] top-1" />
                  <h4 className="text-xs font-bold text-gray-900">
                    {edu.education_level === '10th'
                      ? '10th Standard'
                      : edu.education_level === '12th'
                        ? `12th Standard ${edu.specialization ? `(${edu.specialization})` : ''}`
                        : `${edu.degree_name || edu.degree || edu.education_level} ${edu.specialization ? `in ${edu.specialization}` : ''}`}
                  </h4>
                  <p className="text-xs text-gray-600 font-medium mb-0">{edu.institute_name || edu.institution}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 mb-0">
                    {edu.education_level === '10th' || edu.education_level === '12th'
                      ? (edu.end_year || edu.endYear ? `Passing Year: ${edu.end_year || edu.endYear}` : '')
                      : `${edu.start_year || edu.startYear || ''} – ${edu.end_year || edu.endYear || ''}`}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No education added.</p>
          )}
        </div>

        {/* Skills */}
        <div className="bg-white rounded-3xl p-6">
          <SectionHeader title="Skills" stepNumber={5} onEdit={handleEdit} />

          {profileData.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profileData.skills.map((skill, idx) => {
                const parts = skill.split(' | ');
                return (
                  <span key={idx} className="px-3 py-1.5 bg-[#F5F0FF] text-[#6B21A8] border-1 border-purple-200 rounded-xl text-xs font-semibold">
                    {parts[0]} {parts.length > 1 && <span className="opacity-60 ml-1">| {parts[1]}</span>}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No skills added.</p>
          )}
        </div>

        {/* Job Preferences */}
        <div className="bg-white rounded-3xl p-6">
          <SectionHeader title="Job Preferences" stepNumber={6} onEdit={handleEdit} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] text-gray-400 mb-0.5">Preferred Roles</p>
              <p className="text-xs font-semibold text-gray-800">{profileData.jobPreferences.preferredRoles?.join(', ') || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 mb-0.5">Preferred Locations</p>
              <p className="text-xs font-semibold text-gray-800">{profileData.jobPreferences.preferredLocations?.join(', ') || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 mb-0.5">Work Mode</p>
              <p className="text-xs font-semibold text-gray-800">{profileData.jobPreferences.workMode?.join(', ') || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 mb-0.5">Notice Period</p>
              <p className="text-xs font-semibold text-gray-800">{profileData.jobPreferences.noticePeriod || 'Not specified'}</p>
            </div>
          </div>
        </div>

        {/* Resume & Visibility Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Resume */}
          <div className="bg-white rounded-3xl p-6">
            <SectionHeader title="Resume" stepNumber={7} onEdit={handleEdit} />

            {profileData.resume ? (
              <div className="flex items-center p-3.5 border border-gray-100 rounded-2xl bg-[#F8F9FE]">
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0 mr-3">
                  <FilePdfOutlined className="text-base text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate mb-0">
                    {profileData.resume?.name || (typeof profileData.resume === 'string' && !profileData.resume.startsWith('data:') ? profileData.resume.split('/').pop().split('\\').pop() : 'Current_Resume.pdf')}
                  </p>
                  <p className="text-[10px] text-green-600 font-medium flex items-center gap-1 mt-0.5 mb-0">
                    <CheckCircleFilled className="text-[10px]" /> Uploaded
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No resume uploaded.</p>
            )}
          </div>

          {/* Visibility */}
          <div className="bg-white rounded-3xl p-6">
            <SectionHeader title="Visibility" stepNumber={8} onEdit={handleEdit} />

            <div className="p-3.5 border border-gray-100 rounded-2xl bg-[#F8F9FE] space-y-2.5">
              <div>
                <p className="text-xs font-bold text-gray-800 mb-0.5">{profileData.visibility.mode || 'Limited'} Profile</p>
                <p className="text-[11px] text-gray-500 leading-relaxed mb-0">
                  {profileData.visibility.mode === 'Public' && 'Visible to all recruiters in search.'}
                  {(profileData.visibility.mode === 'Limited' || !profileData.visibility.mode) && 'Visible with limited contact details.'}
                  {profileData.visibility.mode === 'Private' && 'Hidden from recruiter search.'}
                </p>
              </div>

              {profileData.visibility.hiddenCompanies && profileData.visibility.hiddenCompanies.length > 0 && (
                <div className="pt-2 border-t border-gray-200/50">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Hidden From ({profileData.visibility.hiddenCompanies.length})
                  </p>
                  <p className="text-xs font-medium text-purple-700 mb-0">
                    {profileData.visibility.hiddenCompanies.join(', ')}
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-gray-200/50 flex flex-wrap gap-2 text-[11px]">
                <span className={`px-2 py-0.5 rounded-md font-medium ${profileData.visibility.allowContact !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {profileData.visibility.allowContact !== false ? '✓ Direct contact allowed' : '✕ Direct contact disabled'}
                </span>
                <span className={`px-2 py-0.5 rounded-md font-medium ${profileData.visibility.showInSearch !== false ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                  {profileData.visibility.showInSearch !== false ? '✓ Search indexed' : '✕ Search index disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <StepNavigation onValidateStep={handleFinalSubmit} isSaving={isSaving} />
    </div>
  );
};

export default ReviewStep;
