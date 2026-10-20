/**
 * Utility functions for localizing dates, numbers, and deadline countdowns.
 */

const getLocaleTag = (lang = 'en') => {
  switch (lang) {
    case 'te':
      return 'te-IN';
    case 'hi':
      return 'hi-IN';
    default:
      return 'en-IN';
  }
};

export const formatLocalizedDate = (date, lang = 'en', options = {}) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };

  try {
    return d.toLocaleString(getLocaleTag(lang), defaultOptions);
  } catch (e) {
    return d.toLocaleString();
  }
};

export const formatLocalizedNumber = (num, lang = 'en') => {
  if (num === null || num === undefined) return '0';
  try {
    return new Intl.NumberFormat(getLocaleTag(lang)).format(num);
  } catch (e) {
    return String(num);
  }
};

export const calculateCountdown = (deadline, isResolved = false, lang = 'en') => {
  if (isResolved) {
    return {
      isResolved: true,
      status: 'resolved',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      labelKey: 'escalation.resolvedHalted',
      text: lang === 'te' ? 'పరిష్కరించబడింది — గడువు నిలిపివేయబడింది' : lang === 'hi' ? 'निवारित — समय-सीमा समाप्त' : 'Resolved — SLA Concluded',
    };
  }

  if (!deadline) {
    return {
      isResolved: false,
      status: 'none',
      badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
      text: lang === 'te' ? 'గడువు నిర్ణయించలేదు' : lang === 'hi' ? 'समय-सीमा अनिर्धारित' : 'No SLA set',
    };
  }

  const deadlineMs = new Date(deadline).getTime();
  const nowMs = Date.now();
  const diffMs = deadlineMs - nowMs;

  const absDiff = Math.abs(diffMs);
  const hours = Math.floor(absDiff / (3600 * 1000));
  const minutes = Math.floor((absDiff % (3600 * 1000)) / (60 * 1000));

  const timeStr = `${hours}h ${minutes}m`;

  if (diffMs < 0) {
    // Overdue
    const label =
      lang === 'te'
        ? `గడువు ముగిసి ${timeStr}`
        : lang === 'hi'
        ? `समय सीमा समाप्त हुए ${timeStr}`
        : `OVERDUE by ${timeStr}`;

    return {
      isOverdue: true,
      status: 'overdue',
      badgeClass: 'bg-red-100 text-red-800 border-red-300 animate-pulse font-semibold',
      hoursOverdue: hours,
      text: label,
    };
  }

  // Approaching deadline (< 4 hours)
  if (hours < 4) {
    const label =
      lang === 'te'
        ? `కేవలం ${timeStr} మాత్రమే మిగిలి ఉంది`
        : lang === 'hi'
        ? `केवल ${timeStr} शेष`
        : `${timeStr} remaining (Urgent)`;

    return {
      isApproaching: true,
      status: 'approaching',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-medium',
      hoursRemaining: hours,
      text: label,
    };
  }

  // On track
  const label =
    lang === 'te'
      ? `${timeStr} సమయం మిగిలి ఉంది`
      : lang === 'hi'
      ? `${timeStr} शेष समय`
      : `${timeStr} remaining`;

  return {
    isOnTrack: true,
    status: 'on_track',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium',
    hoursRemaining: hours,
    text: label,
  };
};
