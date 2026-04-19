import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, ReferenceLine, Cell
} from 'recharts';
import { MapPin, TrendingDown, TrendingUp, AlertTriangle, Zap, Info, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const parseDate = (d: any) => {
  if (!d) return new Date();
  if (d.seconds) return new Date(d.seconds * 1000);
  return new Date(d);
};

const formatMonth = (date: Date) => {
  return date.toLocaleString('sv-SE', { month: 'short' });
};

export const HotspotAnalysis = ({ cases }: { cases: any[] }) => {
  const [selectedLoc, setSelectedLoc] = useState<string | null>(null);

  const analysis = useMemo(() => {
    const locations: Record<string, { 
      name: string, 
      count: number, 
      cases: any[], 
      interventions: { date: Date, action: string }[] 
    }> = {};

    cases.forEach(c => {
      const loc = c.incidentLocation || c.location || 'Övrigt';
      if (!locations[loc]) {
        locations[loc] = { name: loc, count: 0, cases: [], interventions: [] };
      }
      locations[loc].count++;
      locations[loc].cases.push(c);
      
      if (c.structuralActions && c.structuralActions.trim().length > 0) {
        // Assume the intervention happened around the case's incident date or updatedAt
        const date = parseDate(c.updatedAt || c.incidentDate);
        locations[loc].interventions.push({
          date,
          action: c.structuralActions
        });
      }
    });

    const sorted = Object.values(locations).sort((a, b) => b.count - a.count);
    return sorted;
  }, [cases]);

  // Default to top hotspot
  React.useEffect(() => {
    if (!selectedLoc && analysis.length > 0) {
      setSelectedLoc(analysis[0].name);
    }
  }, [analysis, selectedLoc]);

  const hotspotChartData = useMemo(() => {
    return analysis.slice(0, 5).map(loc => ({
      name: loc.name,
      antal: loc.count,
    }));
  }, [analysis]);

  const trendData = useMemo(() => {
    if (!selectedLoc) return [];
    
    const locData = analysis.find(l => l.name === selectedLoc);
    if (!locData) return [];

    const months: Record<string, { month: string, count: number, timestamp: number }> = {};
    
    // Create last 6 months buckets
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mLabel = formatMonth(d);
      months[mLabel] = { month: mLabel, count: 0, timestamp: d.getTime() };
    }

    locData.cases.forEach(c => {
      const date = parseDate(c.incidentDate || c.createdAt);
      const mLabel = formatMonth(date);
      if (months[mLabel]) {
        months[mLabel].count++;
      }
    });

    return Object.values(months).sort((a, b) => a.timestamp - b.timestamp);
  }, [selectedLoc, analysis]);

  const interventions = useMemo(() => {
    if (!selectedLoc) return [];
    const locData = analysis.find(l => l.name === selectedLoc);
    return locData?.interventions || [];
  }, [selectedLoc, analysis]);

  const insight = useMemo(() => {
    if (!selectedLoc) return null;
    const locData = analysis.find(l => l.name === selectedLoc);
    if (!locData) return null;

    const hasIntervention = locData.interventions.length > 0;
    
    if (hasIntervention) {
      const firstIntervention = locData.interventions.sort((a, b) => a.date.getTime() - b.date.getTime())[0];
      const before = locData.cases.filter(c => parseDate(c.incidentDate).getTime() < firstIntervention.date.getTime()).length;
      const after = locData.cases.filter(c => parseDate(c.incidentDate).getTime() >= firstIntervention.date.getTime()).length;
      
      const change = before > 0 ? ((after - before) / before) * 100 : 0;
      
      return {
        type: change <= 0 ? 'success' : 'warning',
        text: `Sedan åtgärden "${firstIntervention.action.substring(0, 40)}..." infördes på ${selectedLoc}, har antalet incidenter ${change <= 0 ? 'minskat' : 'ökat'} med ${Math.abs(Math.round(change))}% jämfört med föregående period.`,
        change: Math.round(change)
      };
    } else if (locData.count > 5) {
      return {
        type: 'alert',
        text: `Hög frekvens av incidenter (${locData.count} st) noterad vid ${selectedLoc} – inga strukturella åtgärder har registrerats i systemet ännu. Utökad vuxennärvaro rekommenderas.`,
        change: null
      };
    }
    
    return {
      type: 'info',
      text: `Analys pågår för ${selectedLoc}. Fortsätt dokumentera händelser och åtgärder för att mäta effekt.`,
      change: null
    };
  }, [selectedLoc, analysis]);

  return (
    <div className="space-y-8 p-1 lg:p-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/5 rounded-[32px] p-6 border border-white/10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
                <MapPin size={14} className="text-visuera-green" /> Hotspot-fördelning
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">Topp 5 mest frekventa platser</p>
            </div>
            <div className="px-3 py-1 bg-visuera-green/10 text-visuera-green rounded-full text-[9px] font-black uppercase tracking-widest">
              Realtid
            </div>
          </div>
          
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hotspotChartData} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar 
                  dataKey="antal" 
                  radius={[0, 4, 4, 0]} 
                  onClick={(data) => setSelectedLoc(data.name)}
                  className="cursor-pointer"
                >
                  {hotspotChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={selectedLoc === entry.name ? '#10b981' : '#334155'} 
                      stroke={selectedLoc === entry.name ? '#34d399' : 'transparent'}
                      strokeWidth={2}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/5 rounded-[32px] p-6 border border-white/10 flex flex-col">
          <h3 className="text-white font-black uppercase tracking-widest text-xs flex items-center gap-2 mb-6">
            <TrendingDown size={14} className="text-blue-400" /> Strategisk Insikt
          </h3>
          
          <div className="flex-1 flex flex-col justify-center">
            {insight && (
              <motion.div 
                key={selectedLoc}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-2xl border ${
                  insight.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' :
                  insight.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20' :
                  insight.type === 'alert' ? 'bg-red-500/5 border-red-500/20' :
                  'bg-blue-500/5 border-blue-500/20'
                }`}
              >
                <div className="flex gap-4">
                  <div className={`mt-1 ${
                    insight.type === 'success' ? 'text-emerald-500' :
                    insight.type === 'warning' ? 'text-amber-500' :
                    insight.type === 'alert' ? 'text-red-500' :
                    'text-blue-500'
                  }`}>
                    {insight.type === 'success' ? <TrendingDown size={24} /> : 
                     insight.type === 'warning' ? <TrendingUp size={24} /> :
                     insight.type === 'alert' ? <AlertTriangle size={24} /> :
                     <Info size={24} />}
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-white leading-relaxed">
                      {insight.text}
                    </p>
                    {insight.change !== null && (
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                          insight.change <= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-500'
                        }`}>
                          {insight.change <= 0 ? 'Effekt: God' : 'Effekt: Behöver ses över'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          
          <div className="mt-6 pt-6 border-t border-white/5">
             <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-loose">
               Baserat på korrelation mellan händelsedata och registrerade strukturella åtgärder för {selectedLoc || 'vald plats'}.
             </p>
          </div>
        </div>
      </div>

      {/* Trend Analysis for Selected Hotspot */}
      <div className="bg-white/5 rounded-[32px] p-8 border border-white/10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-black uppercase tracking-widest text-sm">Trendanalys: {selectedLoc}</h3>
              <div className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[8px] font-black uppercase tracking-tighter">Frekvens & Åtgärder</div>
            </div>
            <p className="text-xs text-slate-400 font-bold">Visar händelseutveckling och insatta milstolpar (åtgärder)</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {interventions.length > 0 && (
              <div className="flex items-center gap-2 bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-xl border border-amber-500/20 text-[10px] font-bold uppercase">
                <Zap size={12} />
                {interventions.length} strukturella åtgärder genomförda
              </div>
            )}
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
              />
              
              {/* Interventions as Milestones */}
              {interventions.map((inv, idx) => {
                const mLabel = formatMonth(inv.date);
                return (
                  <ReferenceLine 
                    key={idx} 
                    x={mLabel} 
                    stroke="#f59e0b" 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                  >
                    {/* Recharts labels are tricky inside scrollable, handled via annotation usually */}
                  </ReferenceLine>
                );
              })}

              <Line 
                type="monotone" 
                dataKey="count" 
                name="Incidenter"
                stroke="#3B82F6" 
                strokeWidth={4} 
                dot={{ r: 6, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8, stroke: '#3B82F6', strokeWidth: 2, fill: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {interventions.slice(-3).map((inv, idx) => (
            <div key={idx} className="flex gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                <Zap size={16} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{formatMonth(inv.date)} {inv.date.getFullYear()}</span>
                  <span className="text-[8px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded-full font-bold uppercase tracking-tighter">Genomförd</span>
                </div>
                <p className="text-[10px] font-bold text-white leading-relaxed line-clamp-2">
                  {inv.action}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
