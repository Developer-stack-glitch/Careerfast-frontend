import React, { useState, useRef } from 'react';
import {
  UploadCloud, FileSpreadsheet, FileText, CheckCircle2, AlertCircle,
  X, Loader2, Download, ArrowRight, RefreshCw, Users, AlertTriangle, Check,
  Database, Table, Eye, Layers, ChevronRight, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { previewBulkCandidates, uploadBulkCandidates, downloadCandidateTemplateUrl } from '../ApiService/action';

export default function BulkCandidateUploadModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState('upload'); // 'upload' | 'preview' | 'uploading' | 'summary'
  const [file, setFile] = useState(null);
  const [source, setSource] = useState('auto'); // 'auto' | 'naukri' | 'foundit' | 'generic'
  const [updateExisting, setUpdateExisting] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewTab, setPreviewTab] = useState('table'); // 'table' | 'db_tables'
  const [inspectingCandidate, setInspectingCandidate] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setSource('auto');
    setUpdateExisting(false);
    setLoadingPreview(false);
    setPreviewData(null);
    setUploadResult(null);
    setIsSubmitting(false);
    setIsDragOver(false);
    setPreviewTab('table');
    setInspectingCandidate(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    const allowedExtensions = ['.xlsx', '.xls', '.csv', '.pdf'];
    const fileName = selectedFile.name.toLowerCase();
    const isValid = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      toast.error('Please upload an Excel (.xlsx, .xls), CSV (.csv), or PDF file.');
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleProceedToPreview = async () => {
    if (!file) {
      toast.error('Please choose a file to upload first.');
      return;
    }

    try {
      setLoadingPreview(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('source', source);

      const res = await previewBulkCandidates(formData);

      if (res && res.success && res.preview) {
        setPreviewData(res.preview);
        setStep('preview');
        toast.success(`Successfully parsed ${res.preview.totalRows} candidates!`);
      } else {
        toast.error(res?.message || 'Failed to parse candidate data.');
      }
    } catch (err) {
      console.error('Error parsing candidate file:', err);
      toast.error(err.response?.data?.message || err.message || 'Error parsing file.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExecuteUpload = async () => {
    if (!previewData || !previewData.allCandidates || previewData.allCandidates.length === 0) {
      toast.error('No candidate data to upload.');
      return;
    }

    try {
      setIsSubmitting(true);
      setStep('uploading');

      const payload = {
        candidates: previewData.allCandidates,
        updateExisting: updateExisting,
        source: previewData.source || source
      };

      const res = await uploadBulkCandidates(payload, false);

      if (res && res.success) {
        setUploadResult(res.stats);
        setStep('summary');
        toast.success('Bulk upload completed successfully!');
        if (onSuccess) onSuccess();
      } else {
        toast.error(res?.message || 'Bulk upload failed.');
        setStep('preview');
      }
    } catch (err) {
      console.error('Error during bulk upload execution:', err);
      toast.error(err.response?.data?.message || err.message || 'Bulk upload failed.');
      setStep('preview');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadTemplate = (type) => {
    const url = downloadCandidateTemplateUrl(type);
    window.open(url, '_blank');
  };

  const sampleCandidate = previewData?.sampleCandidates?.[0] || null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 shrink-0">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-0">Bulk Candidate Upload</h2>
              <p className="text-xs text-gray-500 mt-0.5 mb-0">
                Import candidates dynamically from <span className="font-semibold text-indigo-600">Naukri</span>, <span className="font-semibold text-blue-600">Foundit (Monster)</span>, or standard Excel/CSV.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between px-8 py-3 bg-gray-50/80 border-b border-gray-100 text-xs font-medium text-gray-500">
          <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-indigo-600 font-bold' : step !== 'upload' ? 'text-emerald-600' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 'upload' ? 'bg-indigo-600 text-white' : 'bg-emerald-500 text-white'}`}>
              {step !== 'upload' ? '✓' : '1'}
            </span>
            <span>Upload File</span>
          </div>
          <div className="w-10 h-0.5 bg-gray-200"></div>
          <div className={`flex items-center gap-2 ${step === 'preview' ? 'text-indigo-600 font-bold' : ['uploading', 'summary'].includes(step) ? 'text-emerald-600' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 'preview' ? 'bg-indigo-600 text-white' : ['uploading', 'summary'].includes(step) ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {['uploading', 'summary'].includes(step) ? '✓' : '2'}
            </span>
            <span>Preview & Field Mapping</span>
          </div>
          <div className="w-10 h-0.5 bg-gray-200"></div>
          <div className={`flex items-center gap-2 ${step === 'summary' ? 'text-indigo-600 font-bold' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 'summary' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              3
            </span>
            <span>Results & Summary</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-6">

              {/* Source Format Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Select Candidate Source
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'auto', label: 'Auto Detect', desc: 'Auto-identify columns' },
                    { id: 'naukri', label: 'Naukri.com', desc: 'Naukri Candidate Export' },
                    { id: 'foundit', label: 'Foundit / Monster', desc: 'Foundit Candidate Export' },
                    { id: 'generic', label: 'Custom Excel/CSV', desc: 'Standard spreadsheet' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSource(s.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${source === s.id
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[13px] font-bold ${source === s.id ? 'text-indigo-700' : 'text-gray-800'}`}>
                          {s.label}
                        </span>
                        {source === s.id && <Check className="w-4 h-4 text-indigo-600" />}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 mb-0 leading-tight">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Choose or Drop File
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${isDragOver
                    ? 'border-indigo-500 bg-indigo-50/70 scale-[0.99]'
                    : file
                      ? 'border-emerald-400 bg-emerald-50/30'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50/50'
                    }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,.pdf"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  />

                  {file ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                        {file.name.endsWith('.pdf') ? <FileText className="w-7 h-7" /> : <FileSpreadsheet className="w-7 h-7" />}
                      </div>
                      <div className="text-center">
                        <h4 className="text-sm font-bold text-gray-900 mb-0">{file.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5 mb-0">
                          {(file.size / 1024).toFixed(1)} KB • Click or drop another file to replace
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                        <UploadCloud className="w-7 h-7" />
                      </div>
                      <div className="text-center">
                        <h4 className="text-sm font-bold text-gray-800 mb-0">
                          Drag and drop your candidate file here
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 mb-0">
                          Supports <span className="font-semibold text-gray-700">.XLSX, .XLS, .CSV, .PDF</span> (up to 50MB)
                        </p>
                      </div>
                      <button
                        type="button"
                        className="mt-2 px-4 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
                      >
                        Browse Computer
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Sample Templates Download Row */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-[13px] font-bold text-gray-900 mb-0">Need a sample format?</h4>
                  <p className="text-[12px] text-gray-500 mt-0.5 mb-0">
                    Download ready-to-fill sample Excel templates with standard headers.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate('naukri')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 hover:text-indigo-600 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Naukri Template
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate('foundit')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 hover:text-blue-600 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Foundit Template
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate('standard')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 hover:text-emerald-600 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Standard Template
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateExisting}
                    onChange={(e) => setUpdateExisting(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-[13px] font-semibold text-gray-800">
                      Update existing candidates if already registered
                    </span>
                    <p className="text-[12px] text-gray-500 mt-0.5 mb-0">
                      If unchecked, existing candidates (matched by email or phone) will be skipped as duplicates to avoid overwriting their current data.
                    </p>
                  </div>
                </label>
              </div>

            </div>
          )}

          {/* STEP 2: PREVIEW & MAPPING */}
          {step === 'preview' && previewData && (
            <div className="space-y-5">

              {/* Summary Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-indigo-50 border-1 border-indigo-100">
                  <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Detected Source</span>
                  <div className="text-base font-semibold text-indigo-900 mt-1 capitalize">
                    {previewData.source} Format
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-blue-50 border-1 border-blue-100">
                  <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Total Candidates</span>
                  <div className="text-xl font-semibold text-blue-900 mt-1">
                    {previewData.totalRows}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50 border-1 border-emerald-100">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">New to Import</span>
                  <div className="text-xl font-semibold text-emerald-900 mt-1">
                    {previewData.newCount}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-50 border-1 border-amber-100">
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Existing / Duplicates</span>
                  <div className="text-xl font-semibold text-amber-900 mt-1">
                    {previewData.duplicateCount}
                  </div>
                </div>
              </div>

              {previewData.duplicateCount > 0 && (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/70 border-1 border-amber-200 text-amber-800 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Found <strong className="font-bold">{previewData.duplicateCount}</strong> candidate(s) already in the database.
                      {updateExisting
                        ? ' Mode: These existing candidates will be updated with newer data.'
                        : ' Mode: These will be skipped automatically.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUpdateExisting(!updateExisting)}
                    className="font-bold underline text-amber-900 hover:text-amber-700 cursor-pointer ml-3 shrink-0"
                  >
                    {updateExisting ? 'Switch to Skip' : 'Switch to Update'}
                  </button>
                </div>
              )}

              {/* View Switcher: Candidate Table vs Database Tables Comparison */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('table')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${previewTab === 'table'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>Candidates Table Preview ({previewData.sampleCandidates.length} of {previewData.totalRows})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('db_tables')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${previewTab === 'db_tables'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>Compare with Database Tables (All Details)</span>
                  </button>
                </div>
                <span className="text-[11px] text-gray-500 font-medium hidden sm:inline">
                  Accounts created with Candidate Role (<code className="font-mono bg-gray-100 px-1 py-0.5 rounded">role_id: 2</code>)
                </span>
              </div>

              {/* VIEW 1: CANDIDATES TABLE PREVIEW */}
              {previewTab === 'table' && (
                <div>
                  <div className="border border-gray-200 rounded-2xl overflow-hidden max-h-[350px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                        <tr>
                          <th className="px-3.5 py-2.5 font-bold text-gray-600">#</th>
                          <th className="px-3.5 py-2.5 font-bold text-gray-600">Candidate</th>
                          <th className="px-3.5 py-2.5 font-bold text-gray-600">Contact Details</th>
                          <th className="px-3.5 py-2.5 font-bold text-gray-600">Experience / Loc</th>
                          <th className="px-3.5 py-2.5 font-bold text-gray-600">Education</th>
                          <th className="px-3.5 py-2.5 font-bold text-gray-600">Skills</th>
                          <th className="px-3.5 py-2.5 font-bold text-gray-600">Status</th>
                          <th className="px-3.5 py-2.5 font-bold text-gray-600 text-center">DB Record</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {previewData.sampleCandidates.map((c, i) => (
                          <tr key={i} className="hover:bg-gray-50/70 transition-colors">
                            <td className="px-3.5 py-2.5 font-mono text-gray-400">{c.index || i + 1}</td>
                            <td className="px-3.5 py-2.5">
                              <div className="font-bold text-gray-900">{c.full_name || `${c.first_name} ${c.last_name}`}</div>
                              {c.headline && (
                                <div className="text-[11px] text-gray-500 line-clamp-1 max-w-[200px]" title={c.headline}>
                                  {c.headline}
                                </div>
                              )}
                            </td>
                            <td className="px-3.5 py-2.5">
                              <div className="text-gray-800">{c.email || '—'}</div>
                              <div className="text-[11px] text-gray-500 font-mono">{c.phone ? `${c.phone_code || '+91'} ${c.phone}` : '—'}</div>
                            </td>
                            <td className="px-3.5 py-2.5">
                              <div className="font-medium text-gray-800">
                                {c.experince_type === 'Fresher' ? 'Fresher' : (c.total_years || 'Experienced')}
                              </div>
                              <div className="text-[11px] text-gray-500">{c.location || '—'}</div>
                            </td>
                            <td className="px-3.5 py-2.5">
                              <div className="font-medium text-gray-800">
                                {c.education?.course || c.education?.qualification || '—'}
                              </div>
                              {c.education?.college && (
                                <div className="text-[11px] text-gray-500 line-clamp-1 max-w-[150px]" title={c.education.college}>
                                  {c.education.college}
                                </div>
                              )}
                            </td>
                            <td className="px-3.5 py-2.5">
                              {c.skills && c.skills.length > 0 ? (
                                <div className="flex flex-wrap gap-1 max-w-[180px]">
                                  {c.skills.slice(0, 3).map((sk, idx) => (
                                    <span key={idx} className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px]">
                                      {sk}
                                    </span>
                                  ))}
                                  {c.skills.length > 3 && (
                                    <span className="text-[10px] text-gray-400 font-bold">+{c.skills.length - 3}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-3.5 py-2.5 whitespace-nowrap">
                              {c.isDuplicate ? (
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border-1 border-amber-200">
                                  {updateExisting ? 'Will Update' : 'Duplicate (Skip)'}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border-1 border-emerald-200">
                                  New Candidate
                                </span>
                              )}
                            </td>
                            <td className="px-3.5 py-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => setInspectingCandidate(c)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Inspect</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW 2: DATABASE TABLES COMPARISON (ALL DETAILS) */}
              {previewTab === 'db_tables' && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50/70 border-1 border-blue-200 rounded-2xl flex items-center gap-3 text-xs text-blue-900">
                    <Info className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <span>
                        Comparing parsed data from your file with the <strong>4 MySQL Database Tables</strong>.
                        Live sample values below are dynamically mapped from Candidate #1 ({sampleCandidate?.full_name || 'Sandhya Bandi'}):
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* TABLE 1: users */}
                    <div className="border border-indigo-200 bg-white rounded-2xl p-4 shadow-2xs">
                      <div className="flex items-center justify-between pb-2 mb-3 border-b border-indigo-100">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-indigo-600" />
                          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-0">
                            Table: <code className="text-indigo-600">users</code> (Candidate Profile)
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md">Primary Table</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        {[
                          { field: 'role_id', type: 'INT', val: '2 (CANDIDATE Role)', source: 'System Constant' },
                          { field: 'first_name', type: 'VARCHAR(50)', val: sampleCandidate?.first_name || 'Sandhya', source: 'Name / Candidate Name' },
                          { field: 'last_name', type: 'VARCHAR(50)', val: sampleCandidate?.last_name || 'Bandi', source: 'Name / Candidate Name' },
                          { field: 'email', type: 'VARCHAR(255)', val: sampleCandidate?.email || 'bandisandhya712@gmail.com', source: 'Email / Email ID' },
                          { field: 'phone_code', type: 'VARCHAR(7)', val: sampleCandidate?.phone_code || '+91', source: 'Extracted Country Code' },
                          { field: 'phone', type: 'VARCHAR(13)', val: sampleCandidate?.phone || '9392764704', source: 'Mobile / Contact No.' },
                          { field: 'headline', type: 'VARCHAR(500)', val: sampleCandidate?.headline || 'Enthusiastic...', source: 'Resume Title / Headline' },
                          { field: 'skills', type: 'LONGTEXT (JSON)', val: sampleCandidate?.skills ? JSON.stringify(sampleCandidate.skills.slice(0, 4)) + '...' : '[]', source: 'Key Skills / Technical Skills' },
                          { field: 'experince_type', type: 'VARCHAR(30)', val: sampleCandidate?.experince_type || 'Fresher', source: 'Work Exp / Exp. (Yrs)' },
                          { field: 'total_years', type: 'VARCHAR(20)', val: sampleCandidate?.total_years || '0', source: 'Exp. (Yrs) / Total Experience' },
                          { field: 'current_salary', type: 'VARCHAR(100)', val: sampleCandidate?.current_salary || '0', source: 'Current Annual Salary / CTC' },
                          { field: 'location', type: 'VARCHAR(100)', val: sampleCandidate?.location || 'Ongole', source: 'Current Location / City' },
                          { field: 'dob', type: 'DATE', val: sampleCandidate?.dob || '2003-11-14', source: 'Date of Birth / Age' },
                          { field: 'notice_period', type: 'VARCHAR(50)', val: sampleCandidate?.notice_period || 'Immediate', source: 'Notice Period' },
                          { field: 'user_type', type: 'VARCHAR(30)', val: sampleCandidate?.experince_type === 'Experience' ? 'Experienced' : 'Fresher', source: 'Derived from Experience' },
                          { field: 'password', type: 'VARCHAR(255)', val: '[Bcrypt Hash] CareerFast@2026', source: 'Default Secure Hash' },
                          { field: 'is_active', type: 'BIT(1)', val: '1 (Active)', source: 'Default Enabled' },
                          { field: 'is_email_verified', type: 'BIT(1)', val: '1 (Verified)', source: 'Auto Verified' },
                          { field: 'profile_completion', type: 'INT(11)', val: 'Dynamic (e.g. 75% - 85%)', source: 'UserModel Recalculated' },
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-start justify-between py-1 border-b border-gray-50 text-[11px]">
                            <div className="w-1/3">
                              <span className="font-mono font-bold text-gray-800">{item.field}</span>
                              <span className="text-[10px] text-gray-400 block">{item.type}</span>
                            </div>
                            <div className="w-1/3 text-gray-500 italic text-[11px] px-1">{item.source}</div>
                            <div className="w-1/3 font-semibold text-indigo-700 text-right truncate" title={item.val}>{item.val}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* TABLE 2: user_education */}
                      <div className="border border-emerald-200 bg-white rounded-2xl p-4 shadow-2xs">
                        <div className="flex items-center justify-between pb-2 mb-3 border-b border-emerald-100">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-emerald-600" />
                            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-0">
                              Table: <code className="text-emerald-600">user_education</code>
                            </h4>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md">Foreign Key: user_id</span>
                        </div>
                        <div className="space-y-2 text-xs">
                          {[
                            { field: 'user_id', type: 'INT', val: 'users.id (Auto Assigned)', source: 'Foreign Key' },
                            { field: 'qualification', type: 'VARCHAR(255)', val: sampleCandidate?.education?.qualification || 'Graduation', source: 'Degree level' },
                            { field: 'course', type: 'VARCHAR(255)', val: sampleCandidate?.education?.course || 'B.TECH', source: 'Education / UG Course' },
                            { field: 'specialization', type: 'VARCHAR(255)', val: sampleCandidate?.education?.specialization || 'Software / CS', source: 'Specialization / Major' },
                            { field: 'college', type: 'VARCHAR(255)', val: sampleCandidate?.education?.college || 'QIS College of Engineering', source: 'College / Institute Name' },
                            { field: 'is_deleted', type: 'BIT(1)', val: '0', source: 'System Default' },
                          ].map((item, idx) => (
                            <div key={idx} className="flex items-start justify-between py-1 border-b border-gray-50 text-[11px]">
                              <div className="w-1/3">
                                <span className="font-mono font-bold text-gray-800">{item.field}</span>
                                <span className="text-[10px] text-gray-400 block">{item.type}</span>
                              </div>
                              <div className="w-1/3 text-gray-500 italic text-[11px] px-1">{item.source}</div>
                              <div className="w-1/3 font-semibold text-emerald-700 text-right truncate" title={item.val}>{item.val}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* TABLE 3: user_professional */}
                      <div className="border border-blue-200 bg-white rounded-2xl p-4 shadow-2xs">
                        <div className="flex items-center justify-between pb-2 mb-3 border-b border-blue-100">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-blue-600" />
                            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-0">
                              Table: <code className="text-blue-600">user_professional</code>
                            </h4>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">Foreign Key: user_id</span>
                        </div>
                        <div className="space-y-2 text-xs">
                          {[
                            { field: 'user_id', type: 'INT', val: 'users.id (Auto Assigned)', source: 'Foreign Key' },
                            { field: 'job_title', type: 'VARCHAR(255)', val: sampleCandidate?.designation || sampleCandidate?.headline || 'Fresher', source: 'Designation / Title' },
                            { field: 'company_name', type: 'VARCHAR(255)', val: sampleCandidate?.company_name || '—', source: 'Current Employer / Company' },
                            { field: 'designation', type: 'VARCHAR(255)', val: sampleCandidate?.designation || '—', source: 'Current Designation' },
                            { field: 'currently_working', type: 'TINYINT(1)', val: sampleCandidate?.company_name ? '1' : '0', source: 'Status' },
                            { field: 'is_deleted', type: 'TINYINT(1)', val: '0', source: 'System Default' },
                          ].map((item, idx) => (
                            <div key={idx} className="flex items-start justify-between py-1 border-b border-gray-50 text-[11px]">
                              <div className="w-1/3">
                                <span className="font-mono font-bold text-gray-800">{item.field}</span>
                                <span className="text-[10px] text-gray-400 block">{item.type}</span>
                              </div>
                              <div className="w-1/3 text-gray-500 italic text-[11px] px-1">{item.source}</div>
                              <div className="w-1/3 font-semibold text-blue-700 text-right truncate" title={item.val}>{item.val}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* TABLE 4: user_address */}
                      <div className="border border-violet-200 bg-white rounded-2xl p-4 shadow-2xs">
                        <div className="flex items-center justify-between pb-2 mb-3 border-b border-violet-100">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-violet-600" />
                            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-0">
                              Table: <code className="text-violet-600">user_address</code>
                            </h4>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-violet-50 text-violet-700 rounded-md">Foreign Key: user_id</span>
                        </div>
                        <div className="space-y-2 text-xs">
                          {[
                            { field: 'user_id', type: 'INT', val: 'users.id (Auto Assigned)', source: 'Foreign Key' },
                            { field: 'city', type: 'VARCHAR(255)', val: sampleCandidate?.location || 'Ongole', source: 'Current Location / City' },
                            { field: 'created_date', type: 'DATETIME', val: 'NOW()', source: 'Timestamp' },
                            { field: 'is_deleted', type: 'BIT(1)', val: '0', source: 'System Default' },
                          ].map((item, idx) => (
                            <div key={idx} className="flex items-start justify-between py-1 border-b border-gray-50 text-[11px]">
                              <div className="w-1/3">
                                <span className="font-mono font-bold text-gray-800">{item.field}</span>
                                <span className="text-[10px] text-gray-400 block">{item.type}</span>
                              </div>
                              <div className="w-1/3 text-gray-500 italic text-[11px] px-1">{item.source}</div>
                              <div className="w-1/3 font-semibold text-violet-700 text-right truncate" title={item.val}>{item.val}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* STEP 3: UPLOADING PROGRESS */}
          {step === 'uploading' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/10 animate-pulse">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Importing Candidates to Database</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Creating candidate accounts, hashing credentials, inserting education and skills, and calculating profile completion...
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: SUMMARY & RESULTS */}
          {step === 'summary' && uploadResult && (
            <div className="space-y-6 py-4">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Bulk Upload Completed!</h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  Candidates have been processed and populated into the database. You can now view, search, and manage them immediately.
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-center">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Processed</span>
                  <div className="text-2xl font-extrabold text-gray-900 mt-1">{uploadResult.total}</div>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 border-1 border-emerald-200 text-center">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Created New</span>
                  <div className="text-2xl font-extrabold text-emerald-700 mt-1">{uploadResult.inserted}</div>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50 border-1 border-blue-200 text-center">
                  <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Updated</span>
                  <div className="text-2xl font-extrabold text-blue-700 mt-1">{uploadResult.updated}</div>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border-1 border-amber-200 text-center">
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Skipped</span>
                  <div className="text-2xl font-extrabold text-amber-700 mt-1">{uploadResult.skipped}</div>
                </div>
              </div>

              {uploadResult.errors > 0 && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  <div className="font-bold mb-1 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>{uploadResult.errors} candidate(s) could not be processed due to database constraints:</span>
                  </div>
                  <ul className="list-disc pl-5 mt-1 space-y-0.5">
                    {uploadResult.errorList?.map((err, i) => (
                      <li key={i}>
                        Row #{err.index} ({err.name}): {err.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-indigo-50/70 border-1 border-indigo-100 text-xs text-indigo-900 flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  Default login password for newly imported candidates is set to <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200">CareerFast@2026</strong>.
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          {step === 'upload' && (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!file || loadingPreview}
                onClick={handleProceedToPreview}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer ${!file || loadingPreview
                  ? 'bg-gray-300 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                  }`}
              >
                {loadingPreview ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing & Mapping Fields...</span>
                  </>
                ) : (
                  <>
                    <span>Preview & Match Fields</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          )}

          {step === 'preview' && (
            <>
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Back to File Selection
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleExecuteUpload}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>
                  Import {updateExisting ? previewData?.totalRows : previewData?.newCount} Candidates to Database
                </span>
              </button>
            </>
          )}

          {step === 'summary' && (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Done & Refresh Candidate List</span>
              </button>
            </div>
          )}
        </div>

        {/* CANDIDATE DB RECORD INSPECTOR DRAWER / SUB-MODAL */}
        {inspectingCandidate && (
          <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl border border-gray-100 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <Database className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-0">
                      Mapped Database Records for: {inspectingCandidate.full_name}
                    </h3>
                    <p className="text-[11px] text-gray-500 mb-0">
                      Exact records that will be written across the 4 MySQL database tables.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectingCandidate(null)}
                  className="w-7 h-7 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* 1. users */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                  <div className="font-bold text-xs text-indigo-900 mb-2 font-mono">1. Table: users</div>
                  <pre className="text-[11px] bg-white p-3 rounded-xl border border-indigo-100 font-mono text-gray-800 overflow-x-auto">
                    {JSON.stringify({
                      role_id: 2,
                      first_name: inspectingCandidate.first_name,
                      last_name: inspectingCandidate.last_name,
                      email: inspectingCandidate.email,
                      phone_code: inspectingCandidate.phone_code,
                      phone: inspectingCandidate.phone,
                      headline: inspectingCandidate.headline,
                      skills: inspectingCandidate.skills,
                      experince_type: inspectingCandidate.experince_type,
                      total_years: inspectingCandidate.total_years,
                      total_months: inspectingCandidate.total_months,
                      location: inspectingCandidate.location,
                      current_salary: inspectingCandidate.current_salary,
                      dob: inspectingCandidate.dob,
                      notice_period: inspectingCandidate.notice_period,
                      user_type: inspectingCandidate.experince_type === 'Experience' ? 'Experienced' : 'Fresher',
                      is_active: 1,
                      is_email_verified: 1
                    }, null, 2)}
                  </pre>
                </div>

                {/* 2. user_education */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <div className="font-bold text-xs text-emerald-900 mb-2 font-mono">2. Table: user_education</div>
                  <pre className="text-[11px] bg-white p-3 rounded-xl border border-emerald-100 font-mono text-gray-800 overflow-x-auto">
                    {JSON.stringify({
                      user_id: "[auto-assigned users.id]",
                      qualification: inspectingCandidate.education?.qualification || "Graduation",
                      course: inspectingCandidate.education?.course || "",
                      specialization: inspectingCandidate.education?.specialization || "",
                      college: inspectingCandidate.education?.college || "",
                      is_deleted: 0
                    }, null, 2)}
                  </pre>
                </div>

                {/* 3. user_professional */}
                <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100">
                  <div className="font-bold text-xs text-blue-900 mb-2 font-mono">3. Table: user_professional</div>
                  <pre className="text-[11px] bg-white p-3 rounded-xl border border-blue-100 font-mono text-gray-800 overflow-x-auto">
                    {JSON.stringify({
                      user_id: "[auto-assigned users.id]",
                      job_title: inspectingCandidate.designation || inspectingCandidate.headline || "Fresher",
                      company_name: inspectingCandidate.company_name || "",
                      designation: inspectingCandidate.designation || "",
                      currently_working: inspectingCandidate.company_name ? 1 : 0,
                      is_deleted: 0
                    }, null, 2)}
                  </pre>
                </div>

                {/* 4. user_address */}
                <div className="p-3.5 rounded-2xl bg-violet-50/50 border border-violet-100">
                  <div className="font-bold text-xs text-violet-900 mb-2 font-mono">4. Table: user_address</div>
                  <pre className="text-[11px] bg-white p-3 rounded-xl border border-violet-100 font-mono text-gray-800 overflow-x-auto">
                    {JSON.stringify({
                      user_id: "[auto-assigned users.id]",
                      city: inspectingCandidate.location || "",
                      created_date: "NOW()",
                      is_deleted: 0
                    }, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setInspectingCandidate(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
