import React from 'react';
import {
  Apple,
  FileText,
  Package,
  Zap,
  AlertTriangle,
  HeartPulse,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { TopAppBar } from '../components/common/TopAppBar';
import { BottomNav } from '../components/common/BottomNav';

export const WasteGuidePage = () => {
  const { t } = useLanguage();

  const categories = [
    {
      title: t('wetWasteTitle'),
      color: 'bg-green-600',
      badge: t('greenBin'),
      icon: Apple,
      bgLight: 'bg-green-50',
      border: 'border-green-200',
      textDark: 'text-green-800',
      items: ['Vegetable peels & fruit skins', 'Leftover cooked food & tea bags', 'Garden leaves & plant trimmings', 'Eggshells & coffee grounds'],
      donts: ['Do not mix plastic wrappers or milk pouches', 'Do not wrap wet waste in polythene bags (use newspaper)'],
      treatment: t('wetWasteTreatment'),
    },
    {
      title: t('dryWasteTitle'),
      color: 'bg-blue-600',
      badge: t('blueBin'),
      icon: FileText,
      bgLight: 'bg-blue-50',
      border: 'border-blue-200',
      textDark: 'text-blue-800',
      items: ['Newspapers, magazines, and notebooks', 'Cardboard delivery cartons', 'Glass bottles and unbroken jars', 'Clean metal cans and aluminium foil'],
      donts: ['Ensure materials are dry and clean from food remnants', 'Do not break glass bottles inside bags'],
      treatment: t('dryWasteTreatment'),
    },
    {
      title: t('plasticWasteTitle'),
      color: 'bg-amber-600',
      badge: t('yellowBin'),
      icon: Package,
      bgLight: 'bg-amber-50',
      border: 'border-amber-200',
      textDark: 'text-amber-800',
      items: ['PET drinking water bottles', 'Milk and oil pouches (rinsed & dried)', 'Plastic containers and shampoo bottles', 'Packaging wrappers and polybags'],
      donts: ['Avoid single-use plastics where alternatives exist', 'Do not burn plastics under any circumstance'],
      treatment: t('plasticWasteTreatment'),
    },
    {
      title: t('eWasteTitle'),
      color: 'bg-indigo-600',
      badge: t('specialBin'),
      icon: Zap,
      bgLight: 'bg-indigo-50',
      border: 'border-indigo-200',
      textDark: 'text-indigo-800',
      items: ['Dead mobile phones & chargers', 'Used batteries (AA, AAA, lithium-ion)', 'Old computer wires, keyboards, mice', 'Fused LED bulbs & tube lights'],
      donts: ['Never discard batteries with regular household trash', 'Do not dismantle CRT monitors at home'],
      treatment: t('eWasteTreatment'),
    },
    {
      title: t('sanitaryWasteTitle'),
      color: 'bg-red-600',
      badge: t('redBinBadge'),
      icon: HeartPulse,
      bgLight: 'bg-red-50',
      border: 'border-red-200',
      textDark: 'text-red-800',
      items: ['Sanitary napkins & baby diapers', 'Used masks and medical cotton/bandages', 'Expired medicines & syringes', 'Paint cans, pesticides, floor cleaners'],
      donts: ['Always wrap diapers and sanitary pads in newspaper marked with red cross', 'Do not flush down commodes'],
      treatment: t('sanitaryWasteTreatment'),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F8F5] pb-24">
      <TopAppBar title={t('wasteGuide')} showBack={true} />

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#2E7D32] to-[#1B5E20] rounded-3xl p-5 text-white shadow-sm space-y-1">
          <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/20">
            {t('sourceSegregationStandard')}
          </span>
          <h2 className="text-xl font-bold">{t('sourceSegregationTitle')}</h2>
          <p className="text-xs text-green-100">
            {t('sourceSegregationDesc')}
          </p>
        </div>

        {/* Categories Accordion / Cards */}
        <div className="space-y-4">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={idx}
                className={`bg-white rounded-3xl p-5 shadow-sm border ${cat.border} space-y-3.5`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-2xl ${cat.color} text-white flex items-center justify-center shadow-sm`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{cat.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.bgLight} ${cat.textDark}`}>
                        {cat.badge}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items to include */}
                <div className="space-y-1 text-xs">
                  <span className="font-semibold text-gray-700 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    <span>{t('whatBelongsHere')}</span>
                  </span>
                  <ul className="list-disc list-inside text-gray-600 text-[11px] pl-1 space-y-0.5">
                    {cat.items.map((it, i) => (
                      <li key={i}>{it}</li>
                    ))}
                  </ul>
                </div>

                {/* Don'ts */}
                <div className="space-y-1 text-xs bg-red-50/50 p-2.5 rounded-xl border border-red-100">
                  <span className="font-semibold text-red-800 flex items-center space-x-1">
                    <XCircle className="w-3.5 h-3.5 text-red-600" />
                    <span>{t('commonMistakes')}</span>
                  </span>
                  <p className="text-[11px] text-red-700 pl-4">{cat.donts.join('. ')}</p>
                </div>

                {/* Municipal Treatment Route */}
                <div className="text-[11px] text-gray-500 pt-1 border-t border-gray-100 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span><strong>{t('processingCycle')}</strong> {cat.treatment}</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};
