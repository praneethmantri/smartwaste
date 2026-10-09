import React, { useState } from 'react';
import {
  FileText,
  Download,
  FileSpreadsheet,
  FileCheck2,
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { TopAppBar } from '../components/common/TopAppBar';
import { BottomNav } from '../components/common/BottomNav';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/client';

export const AdminReportsPage = () => {
  const { t } = useLanguage();
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadCsv = async () => {
    try {
      setDownloadingCsv(true);
      const token = localStorage.getItem('smartwaste_token');
      const response = await fetch('/api/admin/export/csv', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('CSV Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smartwaste-complaints-audit-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert(`Export error: ${err.message}`);
    } finally {
      setDownloadingCsv(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const token = localStorage.getItem('smartwaste_token');
      const response = await fetch('/api/admin/export/pdf', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('PDF Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smartwaste-municipal-report-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert(`Export error: ${err.message}`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8F5] pb-24">
      <TopAppBar title={t('auditReportsAndDataExport')} showBack={true} />

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#2E7D32] to-[#1976D2] rounded-3xl p-5 text-white shadow-md space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20">
            {t('adminAuditCompliance')}
          </span>
          <h2 className="text-xl font-bold">{t('officialRecordsExport')}</h2>
          <p className="text-xs text-green-100">
            {t('exportDescription')}
          </p>
        </div>

        {/* CSV Export Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{t('complaintsCsv')}</h3>
              <p className="text-xs text-gray-500">
                {t('complaintsCsvDesc')}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-2xl text-[11px] text-gray-600 space-y-1 border border-gray-100">
            <span className="font-semibold text-gray-700">{t('columnsIncluded')}</span>
            <p>
              {t('columnsList')}
            </p>
          </div>

          <button
            onClick={handleDownloadCsv}
            disabled={downloadingCsv}
            className="w-full py-3 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-semibold text-xs rounded-xl shadow transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingCsv ? t('generatingCsv') : t('downloadCsvDataset')}</span>
          </button>
        </div>

        {/* PDF Export Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1976D2] flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{t('municipalAuditReportPdf')}</h3>
              <p className="text-xs text-gray-500">
                {t('municipalAuditReportPdfDesc')}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-2xl text-[11px] text-gray-600 space-y-1 border border-gray-100">
            <span className="font-semibold text-gray-700">{t('reportContents')}</span>
            <p>
              {t('reportContentsDesc')}
            </p>
          </div>

          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="w-full py-3 bg-[#1976D2] hover:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingPdf ? t('compilingPdf') : t('downloadPdfAuditReport')}</span>
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};
