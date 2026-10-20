import React from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Building2,
  Landmark,
  ArrowRight,
  UserCheck,
  AlertOctagon,
  FileText,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { formatLocalizedDate, calculateCountdown } from '../../utils/formatters';

export const ComplaintEscalationTimeline = ({ complaint }) => {
  const { lang, t } = useLanguage();

  if (!complaint) return null;

  const currentLevel = complaint.escalationLevel || 1;
  const isResolved = ['COMPLETED', 'RESOLVED'].includes(complaint.status);
  const countdown = calculateCountdown(complaint.resolutionDeadline, isResolved, lang);

  const levels = [
    {
      level: 1,
      name: t('escalation.level1'),
      desc: t('escalation.level1Desc'),
      icon: Building2,
      authority: 'Municipal Administrator (Ward 1-4)',
      reached: true,
      active: currentLevel === 1 && !isResolved,
      passed: currentLevel > 1 || isResolved,
    },
    {
      level: 2,
      name: t('escalation.level2'),
      desc: t('escalation.level2Desc'),
      icon: Shield,
      authority: 'Higher Municipal Authority (Municipal Officer)',
      reached: currentLevel >= 2,
      active: currentLevel === 2 && !isResolved,
      passed: currentLevel > 2 || (currentLevel === 2 && isResolved),
    },
    {
      level: 3,
      name: t('escalation.level3'),
      desc: t('escalation.level3Desc'),
      icon: Landmark,
      authority: 'District Collector Office (IAS)',
      reached: currentLevel >= 3,
      active: currentLevel === 3 && !isResolved,
      passed: currentLevel === 3 && isResolved,
      simulated: true,
    },
  ];

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
      {/* Header and SLA Countdown Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
        <div>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-[#2E7D32]" />
            <h3 className="text-sm font-bold text-gray-900">
              {t('escalation.title')}
            </h3>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {t('escalation.subtitle')}
          </p>
        </div>

        {/* Live Countdown / Overdue Indicator */}
        <div className="flex items-center space-x-2">
          <span
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs border ${countdown.badgeClass}`}
          >
            {isResolved ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : countdown.isOverdue ? (
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            ) : (
              <Clock className="w-3.5 h-3.5" />
            )}
            <span>{countdown.text}</span>
          </span>
        </div>
      </div>

      {/* 3-Level Stepper */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        {levels.map((lvl) => {
          const Icon = lvl.icon;
          let containerClass = 'border-gray-200 bg-gray-50/70 text-gray-500';
          let iconClass = 'bg-gray-200 text-gray-600';
          let badgeText = 'Pending';
          let badgeClass = 'bg-gray-200 text-gray-700';

          if (lvl.active) {
            containerClass =
              lvl.level === 3
                ? 'border-red-300 bg-red-50/60 shadow-sm ring-2 ring-red-200'
                : 'border-amber-300 bg-amber-50/60 shadow-sm ring-2 ring-amber-200';
            iconClass = lvl.level === 3 ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-600 text-white';
            badgeText = lvl.level === 3 ? 'CRITICAL LEVEL 3' : 'ACTIVE LEVEL 2';
            badgeClass = lvl.level === 3 ? 'bg-red-600 text-white' : 'bg-amber-600 text-white';
          } else if (lvl.passed) {
            containerClass = 'border-emerald-200 bg-emerald-50/40 text-gray-800';
            iconClass = 'bg-emerald-600 text-white';
            badgeText = lvl.level === currentLevel && isResolved ? 'Resolved Here' : 'Processed';
            badgeClass = 'bg-emerald-100 text-emerald-800';
          }

          return (
            <div
              key={lvl.level}
              className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-2 ${containerClass}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-2 rounded-xl ${iconClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      Level {lvl.level}
                    </span>
                    <h4 className="text-xs font-bold text-gray-900 leading-tight">
                      {lvl.level === 1
                        ? 'Municipal Admin'
                        : lvl.level === 2
                        ? 'Higher Authority'
                        : 'District Collector'}
                    </h4>
                  </div>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
                  {badgeText}
                </span>
              </div>

              <p className="text-[11px] leading-relaxed text-gray-600">
                {lvl.desc}
              </p>

              {lvl.simulated && (
                <div className="text-[9px] bg-blue-50 text-blue-800 px-2 py-1 rounded-lg border border-blue-200 font-medium leading-tight">
                  🏛️ {t('simulatedWorkflowDisclaimer')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Collector Instructions or Officer Directives (if any) */}
      {complaint.collectorInstructions && (
        <div className="bg-red-50/80 border border-red-200 rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-red-900">
            <Landmark className="w-4 h-4 text-red-700" />
            <span>{t('escalation.instructions')} (District Collectorate)</span>
          </div>
          <p className="text-xs text-red-800 italic bg-white/80 p-2.5 rounded-xl border border-red-100 font-medium">
            "{complaint.collectorInstructions}"
          </p>
        </div>
      )}

      {complaint.officerNotes && !complaint.collectorInstructions && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 space-y-1">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900">
            <Shield className="w-4 h-4 text-amber-700" />
            <span>{t('escalation.officerNotes')}</span>
          </div>
          <p className="text-xs text-amber-900 bg-white/70 p-2 rounded-xl">
            {complaint.officerNotes}
          </p>
        </div>
      )}

      {/* Escalation Event Log Trail */}
      {complaint.escalationEvents && complaint.escalationEvents.length > 0 && (
        <div className="pt-2 space-y-2">
          <h4 className="text-xs font-bold text-gray-800 flex items-center space-x-1">
            <FileText className="w-3.5 h-3.5 text-gray-500" />
            <span>{t('escalation.actionHistory')}</span>
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {complaint.escalationEvents.map((evt) => (
              <div
                key={evt.id}
                className="bg-gray-50 rounded-xl p-2.5 border border-gray-100 text-xs space-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">
                    {evt.actionTaken}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {formatLocalizedDate(evt.createdAt, lang)}
                  </span>
                </div>
                <p className="text-[11px] text-gray-600">
                  {evt.reason}
                </p>
                {evt.notes && (
                  <p className="text-[11px] text-emerald-800 font-medium">
                    Notes: {evt.notes}
                  </p>
                )}
                {evt.actionBy && (
                  <p className="text-[10px] text-gray-400">
                    By: {evt.actionBy.fullName} ({evt.actionBy.role})
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
