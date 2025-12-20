
import React, { useState, useEffect } from 'react';
import { Team, ManagerProfile, Fixture } from '../types';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Users, Building2, PieChart, Landmark, CreditCard, PiggyBank, ArrowRightLeft, Briefcase, Scale, AlertTriangle, CheckCircle, Save, AlertCircle, ArrowUpRight, ArrowDownRight, Coins, Calendar, ArrowUpDown } from 'lucide-react';

interface FinanceViewProps {
    team: Team;
    manager: ManagerProfile;
    onUpdateBudget: (newTransferBudget: number, newWageBudget: number) => void;
    fixtures?: Fixture[];
    currentWeek?: number;
    currentDate?: string; // Add current date for daily calculations
}

const FinanceView: React.FC<FinanceViewProps> = ({ team, manager, onUpdateBudget, fixtures, currentWeek, currentDate }) => {
    const [tab, setTab] = useState<'OVERVIEW' | 'INCOME' | 'EXPENSE' | 'WAGES' | 'FFP' | 'DEBT' | 'SPONSORS'>('OVERVIEW');
    
    // Fix: Calculate fines once on mount to prevent fluctuation
    const [fixedFines] = useState(() => Math.random() < 0.3 ? 0.05 : 0);

    // Sorting State for Income Tab
    const [incomeSortConfig, setIncomeSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'thisMonth', direction: 'desc' });
    
    // Sorting State for Expense Tab
    const [expenseSortConfig, setExpenseSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'thisMonth', direction: 'desc' });

    // Current Date Parsing
    const dateObj = currentDate ? new Date(currentDate) : new Date();
    const dayOfMonth = dateObj.getDate();
    const currentMonth = dateObj.getMonth();
    const currentYear = dateObj.getFullYear();
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // --- FINANCIAL CALCULATIONS (BASE ESTIMATES) ---
    const totalSquadValue = team.players.reduce((acc, p) => acc + p.value, 0);
    // Weekly Wages estimate: ~0.5% of value. Annual = Weekly * 52
    const estimatedWeeklyWages = totalSquadValue * 0.005;
    const estimatedAnnualWages = estimatedWeeklyWages * 52;
    const monthlyWages = estimatedAnnualWages / 12;

    // --- DETAILED MONTHLY BREAKDOWN CALCULATIONS ---
    // Multipliers based on Team Strength/Fanbase to simulate realism
    const strengthFactor = team.strength / 100;
    const fanFactor = team.fanBase / 1000000; // Millions

    // GELİRLER (Monthly - Used in Overview)
    
    // 1. SPONSOR INCOME (AccruES Daily)
    // Full monthly deal value
    const totalMonthlySponsorValue = ((team.championships * 2) + (fanFactor * 0.5)) / 12;
    // Current amount accrued this month (Day 1 = small, Day 30 = full)
    const inc_Sponsor = (totalMonthlySponsorValue / daysInCurrentMonth) * dayOfMonth;

    // 2. COMMERCIAL/MERCH (Random Fluctuation based on Month & Strength)
    // Seed using TeamID + Month + Year to keep it stable within the month but change next month
    const merchSeed = team.id.charCodeAt(0) + currentMonth + currentYear;
    // Generate pseudo-random fluctuation between 0.8 and 1.2
    // (seed % 40) gives 0-39. /100 gives 0.0-0.39. +0.8 gives 0.8-1.19.
    const merchFluctuation = 0.8 + ((merchSeed % 40) / 100);
    
    // Additional strength bonus for commercial (Better teams sell more)
    const strengthBonus = team.strength > 80 ? 1.2 : team.strength > 70 ? 1.05 : 1.0;
    
    // --- YILDIZ OYUNCU FORMA SATIŞ BONUSU ---
    // Kural: Gücü 86 ve üzeri olan her oyuncu için aylık +0.2 M€ (200.000 €) ekstra gelir.
    const starPlayerBonus = team.players.filter(p => p.skill >= 86).length * 0.2;

    const baseMerch = (fanFactor * 0.8) / 12;
    const inc_Merch = (baseMerch * merchFluctuation * strengthBonus) + starPlayerBonus;
    const inc_Trade = inc_Merch * 0.2; // Extra commercial trade linked to merch

    // 3. TV REVENUE (Based on Matches Played This Month)
    let matchesPlayedThisMonth = 0;
    if (fixtures) {
        matchesPlayedThisMonth = fixtures.filter(f => 
            f.played && 
            (f.homeTeamId === team.id || f.awayTeamId === team.id) &&
            new Date(f.date).getMonth() === currentMonth &&
            new Date(f.date).getFullYear() === currentYear
        ).length;
    }
    // Base TV per match + Strength bonus
    const tvPerMatch = 0.20 + (strengthFactor * 0.10); // e.g. 0.20 + 0.08 = 0.28M per match
    const inc_TV = matchesPlayedThisMonth * tvPerMatch;

    // 4. GATE RECEIPTS (Realized based on played matches if fixtures provided)
    const ticketIncomePerMatch = fanFactor * 0.01944444;
    let inc_GateReceipts = 0;
    let inc_GateReceiptsLastMonth = 0;
    
    if (fixtures && currentWeek) {
        // "This Month": Actual played home matches in current month
        const homeMatchesThisMonth = fixtures.filter(f => 
            f.homeTeamId === team.id && f.played &&
            new Date(f.date).getMonth() === currentMonth &&
            new Date(f.date).getFullYear() === currentYear
        );
        inc_GateReceipts = homeMatchesThisMonth.length * ticketIncomePerMatch;

        // "Last Month": Previous month
        const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
        const homeMatchesLastMonth = fixtures.filter(f => 
            f.homeTeamId === team.id && f.played &&
            new Date(f.date).getMonth() === prevMonthDate.getMonth() &&
            new Date(f.date).getFullYear() === prevMonthDate.getFullYear()
        );
        inc_GateReceiptsLastMonth = homeMatchesLastMonth.length * ticketIncomePerMatch;
    }

    const inc_Loca = inc_GateReceipts * 0.45; // VIP/Loca Income linked to gate
    
    // CHANGE: Prize money is strictly 0 as requested.
    const inc_Prizes = 0; 
    
    // DISABLED INTEREST & INVESTMENTS AS REQUESTED
    const inc_Investments = 0; 
    const inc_Interest = 0; 
    
    // UPDATED: Use monthly tracker for monthly view
    const inc_PlayerSales = manager.stats.transferIncomeThisMonth || 0;
    
    const totalMonthlyIncome = inc_GateReceipts + inc_Loca + inc_TV + inc_Merch + inc_Sponsor + inc_Prizes + inc_Investments + inc_Interest + inc_PlayerSales + inc_Trade;

    // GİDERLER (Monthly)
    // Pro-rate wages based on day of month for display accuracy? No, usually wages shown as monthly burden.
    // But to match "net flow", let's keep it as monthly liability.
    const exp_PlayerWages = monthlyWages;
    const exp_StaffWages = monthlyWages * 0.15; // Coaching/Medical staff
    const exp_DirectorWages = 0.05; // Board/Director salaries
    const exp_Bonuses = (manager.stats.wins * 0.1) / 4; // Match bonuses approx
    const exp_MatchDay = 0.15; // Hosting costs per month
    const exp_StadiumMaint = (team.stadiumCapacity / 100000) * 0.5; // Maintenance
    const exp_Academy = strengthFactor * 0.4; // Youth Academy investment
    const exp_Scouting = strengthFactor * 0.2; // Scouting network costs
    const exp_Travel = 0.1; // Travel expenses
    const exp_Fines = fixedFines; // Use stable state value
    const exp_DebtRepay = (totalSquadValue * 0.4) / 60; // Long term debt repayment (5 years / 60 months)
    
    // UPDATED: Use monthly tracker for monthly view
    const exp_Transfers = manager.stats.transferSpendThisMonth || 0; 

    const totalMonthlyExpense = exp_PlayerWages + exp_StaffWages + exp_DirectorWages + exp_Bonuses + exp_MatchDay + exp_StadiumMaint + exp_Academy + exp_Scouting + exp_Travel + exp_Fines + exp_DebtRepay + exp_Transfers;

    const monthlyNet = totalMonthlyIncome - totalMonthlyExpense;

    // --- SEASONAL DATA FROM FINANCIAL RECORDS ---
    const financialRecs = team.financialRecords;

    // Detailed Income Breakdown Data
    const incomeBreakdown = [
        { label: "Satılan Oyuncular", thisMonth: inc_PlayerSales, lastMonth: 0, season: financialRecs.income.transfers },
        { label: "TV & Yayın Gelirleri", thisMonth: inc_TV, lastMonth: inc_TV, season: financialRecs.income.tv },
        { label: "Ticaret & Pazarlama", thisMonth: inc_Trade + inc_Merch, lastMonth: (inc_Trade + inc_Merch) * 0.95, season: financialRecs.income.merch }, // Merch is handled separately usually, using accumulator for consistency? Actually no, merch isn't in financialRecords explicitly in handleNextDay yet, let's use estimate + accumulator or just fix useGameState. For now assuming simplified model in records.
        { label: "Loca & VIP Geliri", thisMonth: inc_Loca, lastMonth: inc_Loca * 1.05, season: financialRecs.income.loca },
        { label: "Gişe Hasılatları", thisMonth: inc_GateReceipts, lastMonth: inc_GateReceiptsLastMonth, season: financialRecs.income.gate },
        { label: "Sponsorluk Anlaşmaları", thisMonth: inc_Sponsor, lastMonth: totalMonthlySponsorValue, season: financialRecs.income.sponsor },
        { label: "Para Ödülleri", thisMonth: 0, lastMonth: 0, season: 0 },
        { label: "Faiz & Yatırım", thisMonth: 0, lastMonth: 0, season: 0 },
    ];

    // Detailed Expense Breakdown Data
    const expenseBreakdown = [
        { label: "Oyuncu Maaşları", thisMonth: exp_PlayerWages, lastMonth: exp_PlayerWages, season: financialRecs.expense.wages },
        { label: "Transfer Harcamaları", thisMonth: exp_Transfers, lastMonth: 0, season: financialRecs.expense.transfers },
        { label: "Personel Maaşları", thisMonth: exp_StaffWages, lastMonth: exp_StaffWages, season: financialRecs.expense.staff },
        { label: "Stadyum Bakım", thisMonth: exp_StadiumMaint, lastMonth: exp_StadiumMaint, season: financialRecs.expense.maint },
        { label: "Altyapı & Akademi", thisMonth: exp_Academy, lastMonth: exp_Academy, season: financialRecs.expense.academy },
        { label: "Borç Geri Ödemeleri", thisMonth: exp_DebtRepay, lastMonth: exp_DebtRepay, season: financialRecs.expense.debt },
        { label: "Maç Günü Giderleri", thisMonth: exp_MatchDay, lastMonth: exp_MatchDay, season: financialRecs.expense.matchDay },
        { label: "Seyahat & Konaklama", thisMonth: exp_Travel, lastMonth: exp_Travel, season: financialRecs.expense.travel },
        { label: "Gözlemcilik", thisMonth: exp_Scouting, lastMonth: exp_Scouting, season: financialRecs.expense.scouting },
        { label: "Yönetim Giderleri", thisMonth: exp_DirectorWages, lastMonth: exp_DirectorWages, season: financialRecs.expense.admin },
        { label: "Maç Başı Primler", thisMonth: exp_Bonuses, lastMonth: exp_Bonuses * 0.9, season: financialRecs.expense.bonus },
        { label: "Cezalar", thisMonth: exp_Fines, lastMonth: 0, season: financialRecs.expense.fines }
    ];

    // Sorting Logic Helper
    const sortData = (data: any[], config: {key: string, direction: 'asc'|'desc'}) => {
        return [...data].sort((a, b) => {
            const valA = a[config.key];
            const valB = b[config.key];

            if (typeof valA === 'string' && typeof valB === 'string') {
                return config.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            
            if (valA < valB) return config.direction === 'asc' ? -1 : 1;
            if (valA > valB) return config.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const sortedIncomeBreakdown = sortData(incomeBreakdown, incomeSortConfig);
    const sortedExpenseBreakdown = sortData(expenseBreakdown, expenseSortConfig);

    const handleIncomeSort = (key: string) => {
        setIncomeSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const handleExpenseSort = (key: string) => {
        setExpenseSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    // --- ARRAYS FOR OVERVIEW SORTING ---
    // Create arrays to sort items from highest to lowest amount
    const overviewIncomeItems = [
        { label: "Gişe Hasılatları", amount: inc_GateReceipts },
        { label: "Loca & VIP Geliri", amount: inc_Loca },
        { label: "Sponsorluk Anlaşmaları", amount: inc_Sponsor },
        { label: "TV & Yayın Gelirleri", amount: inc_TV },
        { label: "Ticari Faaliyetler (Mağaza)", amount: inc_Merch },
        { label: "Ticaret & Pazarlama", amount: inc_Trade },
        { label: "Para Ödülleri", amount: 0 }, // Explicitly 0
        { label: "Satılan Oyuncular", amount: inc_PlayerSales },
        { label: "Finansal Yatırımlar", amount: inc_Investments },
        { label: "Faiz Gelirleri", amount: inc_Interest }
    ].sort((a, b) => b.amount - a.amount);

    const overviewExpenseItems = [
        { label: "Oyuncu Maaşları", amount: exp_PlayerWages },
        { label: "Personel Maaşları", amount: exp_StaffWages },
        { label: "Direktör & Yönetim Gideri", amount: exp_DirectorWages },
        { label: "Maç Başı Primler", amount: exp_Bonuses },
        { label: "Transfer Harcamaları (Net)", amount: exp_Transfers },
        { label: "Maç Günü Giderleri", amount: exp_MatchDay },
        { label: "Stadyum Bakım Giderleri", amount: exp_StadiumMaint },
        { label: "Altyapı Maliyetleri", amount: exp_Academy },
        { label: "Gözlemcilik Ağı", amount: exp_Scouting },
        { label: "Lig Cezaları", amount: exp_Fines },
        { label: "Borç Geri Ödemeleri", amount: exp_DebtRepay },
        { label: "Seyahat & Konaklama", amount: exp_Travel }
    ].sort((a, b) => b.amount - a.amount);


    const totalIncomeThisMonth = incomeBreakdown.reduce((sum, item) => sum + item.thisMonth, 0);
    const totalIncomeLastMonth = incomeBreakdown.reduce((sum, item) => sum + item.lastMonth, 0);
    const totalIncomeSeason = incomeBreakdown.reduce((sum, item) => sum + item.season, 0);

    const totalExpenseThisMonth = expenseBreakdown.reduce((sum, item) => sum + item.thisMonth, 0);
    const totalExpenseLastMonth = expenseBreakdown.reduce((sum, item) => sum + item.lastMonth, 0);
    const totalExpenseSeason = expenseBreakdown.reduce((sum, item) => sum + item.season, 0);

    // --- BUDGET SLIDER STATE ---
    const currentAllocatedWageBudget = team.wageBudget || estimatedAnnualWages;
    const [transferBudget, setTransferBudget] = useState(team.budget);
    const [wageBudget, setWageBudget] = useState(currentAllocatedWageBudget);
    const totalBudgetPot = team.budget + currentAllocatedWageBudget;
    const minAllowedWageBudget = estimatedAnnualWages * 0.9;
    const maxTransferBudget = Math.max(0, totalBudgetPot - minAllowedWageBudget);
    const maxSliderPercentage = Math.floor((maxTransferBudget / totalBudgetPot) * 100);

    useEffect(() => {
        setTransferBudget(team.budget);
        setWageBudget(team.wageBudget || estimatedAnnualWages);
    }, [team.budget, team.wageBudget, estimatedAnnualWages]);

    const handleBudgetSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
        let percentage = parseInt(e.target.value);
        if (percentage > maxSliderPercentage) percentage = maxSliderPercentage;
        const newTransfer = (totalBudgetPot * percentage) / 100;
        const newWage = totalBudgetPot - newTransfer;
        setTransferBudget(newTransfer);
        setWageBudget(newWage);
    };

    const saveBudget = () => {
        onUpdateBudget(transferBudget, wageBudget);
    };

    const currentSliderValue = (transferBudget / totalBudgetPot) * 100;
    const topEarners = [...team.players].sort((a, b) => b.value - a.value).slice(0, 8);
    const formatMoney = (val: number) => `${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M€`;

    const tabs = [
        { id: 'OVERVIEW', label: 'Genel', icon: PieChart },
        { id: 'INCOME', label: 'Gelirler', icon: TrendingUp },
        { id: 'EXPENSE', label: 'Giderler', icon: TrendingDown },
        { id: 'WAGES', label: 'Maaşlar', icon: Users },
        { id: 'FFP', label: 'FFP & Lisans', icon: Scale },
        { id: 'DEBT', label: 'Borçlar', icon: CreditCard },
        { id: 'SPONSORS', label: 'Sponsorlar', icon: Briefcase }
    ];

    // Added optional key to props type to satisfy assignment checking in maps
    const RenderMoneyRow = ({ label, amount, type }: { label: string, amount: number, type: 'inc' | 'exp', key?: any }) => (
        <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0 text-sm">
            <span className="text-slate-600 dark:text-slate-400">{label}</span>
            <span className={`font-mono font-bold ${type === 'inc' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {type === 'inc' ? '+' : '-'}{formatMoney(amount)}
            </span>
        </div>
    );

    const SortableHeader = ({ label, sKey, currentConfig, onSort, align = 'right' }: { label: string, sKey: string, currentConfig: {key: string, direction: 'asc'|'desc'}, onSort: (key: string) => void, align?: string }) => (
        <th 
            className={`p-4 text-${align} cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition select-none group`}
            onClick={() => onSort(sKey)}
        >
            <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
                {label} 
                <ArrowUpDown size={12} className={`text-slate-400 ${currentConfig.key === sKey ? 'text-yellow-600 dark:text-yellow-500 opacity-100' : 'opacity-50'}`}/>
            </div>
        </th>
    );

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
            {/* Top Navigation */}
            <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700/50 px-2 overflow-x-auto no-scrollbar shrink-0 pt-2">
                {tabs.map((t) => {
                    const isActive = tab === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id as any)}
                            className={`flex items-center gap-2 px-4 md:px-6 py-3 text-sm md:text-base font-bold transition-all relative rounded-t-lg group whitespace-nowrap shrink-0 ${
                                isActive 
                                ? 'text-yellow-600 dark:text-yellow-400 bg-white dark:bg-slate-800' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/30'
                            }`}
                        >
                            {isActive && (
                                <div className="absolute top-0 left-0 right-0 h-[3px] bg-yellow-500 dark:bg-yellow-400 rounded-t-full shadow-[0_1px_8px_rgba(250,204,21,0.5)]"></div>
                            )}
                            <t.icon size={18} className={`${isActive ? "text-yellow-600 dark:text-yellow-400" : "text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"}`} />
                            <span>{t.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 pb-20">
                
                {/* --- OVERVIEW TAB --- */}
                {tab === 'OVERVIEW' && (
                    <div className="space-y-6">
                        
                        {/* 1. Budget Adjustment Card */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Coins className="text-yellow-500"/> Bütçe Planlaması
                                </h3>
                                <button 
                                    onClick={saveBudget}
                                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-green-900/20"
                                >
                                    <Save size={16}/> Dağılımı Onayla
                                </button>
                            </div>

                            <div className="flex items-center gap-4 mb-2">
                                <div className={`flex-1 p-4 rounded-lg border text-center transition-colors ${wageBudget < estimatedAnnualWages ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}>
                                    <div className={`text-xs uppercase font-bold mb-1 ${wageBudget < estimatedAnnualWages ? 'text-red-600 dark:text-red-400' : 'text-slate-500'}`}>Maaş Bütçesi (Yıllık)</div>
                                    <div className={`text-2xl font-mono font-bold ${wageBudget < estimatedAnnualWages ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>{formatMoney(wageBudget)}</div>
                                    <div className="text-xs text-slate-400 mt-1">Mevcut Gider: {formatMoney(estimatedAnnualWages)}</div>
                                </div>
                                <div className="flex-1 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 text-center">
                                    <div className="text-xs text-emerald-600 dark:text-emerald-400 uppercase font-bold mb-1">Transfer Bütçesi</div>
                                    <div className="text-3xl font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(transferBudget)}</div>
                                </div>
                            </div>

                            {wageBudget < estimatedAnnualWages && (
                                <div className="mb-4 bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-bold animate-pulse">
                                    <AlertCircle size={20} className="shrink-0"/>
                                    <div>
                                        DİKKAT: Maaş bütçesi mevcut giderlerin altında! <br/>
                                        <span className="text-xs font-normal opacity-90">
                                            {formatMoney(estimatedAnnualWages - wageBudget)} tutarında maaş ödemesi karşılanamıyor.
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="px-2">
                                <input 
                                    type="range" 
                                    min="0" 
                                    max={maxSliderPercentage} 
                                    step="1"
                                    value={currentSliderValue} 
                                    onChange={handleBudgetSlider}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-emerald-500"
                                />
                                <div className="flex justify-between text-xs font-bold text-slate-400 mt-2 uppercase">
                                    <span>← Maaşa Aktar</span>
                                    <span>Transfere Aktar (Max: %{maxSliderPercentage}) →</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. MONTHLY BALANCE SHEET */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-100 to-white dark:from-slate-900 dark:to-slate-800 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                        <Briefcase size={20} className="text-blue-600 dark:text-blue-400"/> Aylık Genel Durum
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {dayOfMonth}. Gün Raporu • {daysInCurrentMonth} Günlük Ay
                                    </p>
                                </div>
                                <div className={`text-right px-4 py-2 rounded-lg border ${monthlyNet >= 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                                    <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Net Aylık Akış</div>
                                    <div className={`text-xl font-black font-mono ${monthlyNet >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {monthlyNet >= 0 ? '+' : ''}{formatMoney(monthlyNet)}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-700">
                                
                                {/* INCOME COLUMN - SORTED */}
                                <div className="flex-1 p-4 md:p-6 bg-emerald-50/30 dark:bg-emerald-900/5">
                                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-emerald-200 dark:border-emerald-800/50">
                                        <div className="bg-emerald-100 dark:bg-emerald-900/50 p-1.5 rounded text-emerald-600 dark:text-emerald-400">
                                            <ArrowUpRight size={18}/>
                                        </div>
                                        <h4 className="font-bold text-emerald-800 dark:text-emerald-400 uppercase text-sm">Gelir Kalemleri</h4>
                                        <span className="ml-auto font-black text-emerald-600 dark:text-emerald-400">{formatMoney(totalMonthlyIncome)}</span>
                                    </div>
                                    <div className="space-y-1">
                                        {overviewIncomeItems.map((item, i) => (
                                            <RenderMoneyRow key={i} label={item.label} amount={item.amount} type="inc"/>
                                        ))}
                                    </div>
                                </div>

                                {/* EXPENSE COLUMN - SORTED */}
                                <div className="flex-1 p-4 md:p-6 bg-red-50/30 dark:bg-red-900/5">
                                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-red-200 dark:border-red-800/50">
                                        <div className="bg-red-100 dark:bg-red-900/50 p-1.5 rounded text-red-600 dark:text-red-400">
                                            <ArrowDownRight size={18}/>
                                        </div>
                                        <h4 className="font-bold text-red-800 dark:text-red-400 uppercase text-sm">Gider Kalemleri</h4>
                                        <span className="ml-auto font-black text-red-600 dark:text-red-400">-{formatMoney(totalMonthlyExpense)}</span>
                                    </div>
                                    <div className="space-y-1">
                                        {overviewExpenseItems.map((item, i) => (
                                            <RenderMoneyRow key={i} label={item.label} amount={item.amount} type="exp"/>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* --- INCOME TAB (REDESIGNED) --- */}
                {tab === 'INCOME' && (
                    <div className="space-y-6">
                        {/* Summary Header */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Bu Ay Toplam</div>
                                <div className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{formatMoney(totalIncomeThisMonth)}</div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center opacity-80">
                                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Geçen Ay</div>
                                <div className="text-xl md:text-2xl font-bold text-slate-700 dark:text-slate-300 font-mono">{formatMoney(totalIncomeLastMonth)}</div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center border-l-4 border-l-yellow-500">
                                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Bu Sezon (Toplam)</div>
                                <div className="text-xl md:text-2xl font-black text-yellow-600 dark:text-yellow-500 font-mono">{formatMoney(totalIncomeSeason)}</div>
                            </div>
                        </div>

                        {/* Income Breakdown Table */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2">
                                <TrendingUp className="text-emerald-600 dark:text-emerald-400" size={20} />
                                <h3 className="font-bold text-slate-900 dark:text-white">Gelir Dağılımı Detayı</h3>
                            </div>
                            
                            <table className="w-full text-sm">
                                <thead className="bg-slate-100 dark:bg-slate-900 text-xs font-bold text-slate-500 uppercase">
                                    <tr>
                                        <SortableHeader label="Gelir Kalemi" sKey="label" currentConfig={incomeSortConfig} onSort={handleIncomeSort} align="left"/>
                                        <SortableHeader label="Bu Ay" sKey="thisMonth" currentConfig={incomeSortConfig} onSort={handleIncomeSort}/>
                                        <SortableHeader label="Geçen Ay" sKey="lastMonth" currentConfig={incomeSortConfig} onSort={handleIncomeSort}/>
                                        <SortableHeader label="Bu Sezon" sKey="season" currentConfig={incomeSortConfig} onSort={handleIncomeSort}/>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {sortedIncomeBreakdown.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="p-4 font-bold text-slate-700 dark:text-slate-200">{item.label}</td>
                                            <td className={`p-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 ${incomeSortConfig.key === 'thisMonth' ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
                                                +{formatMoney(item.thisMonth)}
                                                {item.label === 'Sponsorluk Anlaşmaları' && (
                                                    <span className="block text-[9px] text-slate-400 font-normal">Günlük birikiyor</span>
                                                )}
                                                {item.label === 'TV & Yayın Gelirleri' && matchesPlayedThisMonth > 0 && (
                                                    <span className="block text-[9px] text-slate-400 font-normal">{matchesPlayedThisMonth} maç</span>
                                                )}
                                            </td>
                                            <td className={`p-4 text-right font-mono text-slate-500 dark:text-slate-400 hidden sm:table-cell ${incomeSortConfig.key === 'lastMonth' ? 'bg-slate-50 dark:bg-slate-800' : ''}`}>
                                                {formatMoney(item.lastMonth)}
                                            </td>
                                            <td className={`p-4 text-right font-mono font-bold text-slate-900 dark:text-white ${incomeSortConfig.key === 'season' ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>
                                                {formatMoney(item.season)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- EXPENSE TAB (REDESIGNED TO MATCH INCOME) --- */}
                {tab === 'EXPENSE' && (
                    <div className="space-y-6">
                        {/* Summary Header */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Bu Ay Toplam</div>
                                <div className="text-xl md:text-2xl font-black text-red-600 dark:text-red-400 font-mono">-{formatMoney(totalExpenseThisMonth)}</div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center opacity-80">
                                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Geçen Ay</div>
                                <div className="text-xl md:text-2xl font-bold text-slate-700 dark:text-slate-300 font-mono">-{formatMoney(totalExpenseLastMonth)}</div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center border-l-4 border-l-yellow-500">
                                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Bu Sezon (Toplam)</div>
                                <div className="text-xl md:text-2xl font-black text-yellow-600 dark:text-yellow-500 font-mono">-{formatMoney(totalExpenseSeason)}</div>
                            </div>
                        </div>

                        {/* Expense Breakdown Table */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2">
                                <TrendingDown className="text-red-600 dark:text-red-400" size={20} />
                                <h3 className="font-bold text-slate-900 dark:text-white">Gider Dağılımı Detayı</h3>
                            </div>
                            
                            <table className="w-full text-sm">
                                <thead className="bg-slate-100 dark:bg-slate-900 text-xs font-bold text-slate-500 uppercase">
                                    <tr>
                                        <SortableHeader label="Gider Kalemi" sKey="label" currentConfig={expenseSortConfig} onSort={handleExpenseSort} align="left"/>
                                        <SortableHeader label="Bu Ay" sKey="thisMonth" currentConfig={expenseSortConfig} onSort={handleExpenseSort}/>
                                        <SortableHeader label="Geçen Ay" sKey="lastMonth" currentConfig={expenseSortConfig} onSort={handleExpenseSort}/>
                                        <SortableHeader label="Bu Sezon" sKey="season" currentConfig={expenseSortConfig} onSort={handleExpenseSort}/>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {sortedExpenseBreakdown.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="p-4 font-bold text-slate-700 dark:text-slate-200">{item.label}</td>
                                            <td className={`p-4 text-right font-mono font-bold text-red-600 dark:text-red-400 ${expenseSortConfig.key === 'thisMonth' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                                                -{formatMoney(item.thisMonth)}
                                            </td>
                                            <td className={`p-4 text-right font-mono text-slate-500 dark:text-slate-400 hidden sm:table-cell ${expenseSortConfig.key === 'lastMonth' ? 'bg-slate-50 dark:bg-slate-800' : ''}`}>
                                                -{formatMoney(item.lastMonth)}
                                            </td>
                                            <td className={`p-4 text-right font-mono font-bold text-slate-900 dark:text-white ${expenseSortConfig.key === 'season' ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>
                                                {formatMoney(item.season)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- WAGES TAB --- */}
                {tab === 'WAGES' && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 dark:text-white">Maaş Bordrosu (En Yüksek)</h3>
                            <div className="text-xs font-bold text-slate-500">Yıllık Toplam: {formatMoney(estimatedAnnualWages)}</div>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-100 dark:bg-slate-900 text-xs text-slate-500 font-bold uppercase">
                                <tr>
                                    <th className="p-3">Oyuncu</th>
                                    <th className="p-3 text-center">Mevki</th>
                                    <th className="p-3 text-center">Durum</th>
                                    <th className="p-3 text-right">Yıllık Maaş (Tahmini)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {topEarners.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="p-3 font-bold text-slate-700 dark:text-slate-200">{p.name}</td>
                                        <td className="p-3 text-center">
                                            <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold">{p.position}</span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold">Sözleşmeli</span>
                                        </td>
                                        <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">{(p.value * 0.26).toFixed(2)} M€</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-4 text-center text-xs text-slate-500 italic">
                            * Maaşlar oyuncu piyasa değerine endeksli olarak gösterilmektedir.
                        </div>
                    </div>
                )}

                {/* --- FFP TAB --- */}
                {tab === 'FFP' && (
                    <div className="space-y-6">
                        <div className={`p-6 rounded-xl border-l-8 shadow-sm flex items-start gap-4 bg-white dark:bg-slate-800 ${monthlyNet > 0 ? 'border-green-500' : 'border-red-500'}`}>
                            <div className={`p-3 rounded-full ${monthlyNet > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                <Scale size={32} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                                    {monthlyNet > 0 ? 'FFP Kriterlerine Uygun' : 'FFP Riski Tespit Edildi'}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">
                                    {monthlyNet > 0 
                                    ? 'Kulüp mali yapısı UEFA Finansal Fair Play kriterleri ile uyumlu görünüyor. Gelirler giderleri karşılıyor.' 
                                    : 'Dikkat! Tahmini giderler gelirlerin üzerinde. Oyuncu satışı yaparak bütçeyi dengelemeniz gerekebilir.'}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                                <div className="text-xs text-slate-500 uppercase font-bold mb-2">3 Yıllık Zarar Limiti</div>
                                <div className="text-xl font-bold text-slate-900 dark:text-white">30.0 M€</div>
                            </div>
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                                <div className="text-xs text-slate-500 uppercase font-bold mb-2">Mevcut Durum</div>
                                <div className={`text-xl font-bold ${manager.stats.moneyEarned - manager.stats.moneySpent > -30 ? 'text-green-500' : 'text-red-500'}`}>
                                    {(manager.stats.moneyEarned - manager.stats.moneySpent).toFixed(1)} M€
                                </div>
                            </div>
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center flex flex-col items-center justify-center">
                                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Lisans Durumu</div>
                                {manager.stats.moneyEarned - manager.stats.moneySpent > -30 ? (
                                    <CheckCircle className="text-green-500" size={24}/>
                                ) : (
                                    <AlertTriangle className="text-red-500" size={24}/>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- DEBT TAB --- */}
                {tab === 'DEBT' && (
                    <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center p-8">
                        <CreditCard size={48} className="text-slate-300 mb-4"/>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Borç Yapılandırması</h3>
                        <p className="text-slate-500 max-w-md mt-2">
                            Kulübün şu anki net banka borcu: <span className="font-bold text-red-500">{(totalSquadValue * 0.4).toFixed(1)} M€</span>. 
                            <br/>Ödemeler 2030 yılına kadar yapılandırılmıştır.
                        </p>
                    </div>
                )}

                {/* --- SPONSORS TAB --- */}
                {tab === 'SPONSORS' && (
                    <div className="space-y-4">
                        <div className="bg-gradient-to-r from-blue-900 to-slate-900 p-6 rounded-xl text-white shadow-lg flex justify-between items-center relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="text-xs font-bold text-blue-300 uppercase mb-1">Ana Forma Sponsoru</div>
                                <div className="text-3xl font-black italic tracking-wider">HAYVANLAR HOLDING</div>
                                <div className="mt-2 text-sm opacity-80">
                                    Yıllık {formatMoney(totalMonthlySponsorValue * 12 * 0.6)} • Bitiş: 2028
                                    <br/>
                                    <span className="text-xs text-yellow-400">Bu Ay Kazanılan: {formatMoney(inc_Sponsor * 0.6)} ({dayOfMonth}. Gün)</span>
                                </div>
                            </div>
                            <Briefcase size={64} className="text-white opacity-10 absolute right-4"/>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div className="text-xs font-bold text-slate-500 uppercase mb-1">Stadyum İsim Hakkı</div>
                                <div className="text-lg font-bold text-slate-900 dark:text-white">{team.stadiumName}</div>
                                <div className="text-sm text-green-600 dark:text-green-400 font-mono mt-1">+{formatMoney(totalMonthlySponsorValue * 12 * 0.3)} / Yıl</div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div className="text-xs font-bold text-slate-500 uppercase mb-1">Kol Sponsoru</div>
                                <div className="text-lg font-bold text-slate-900 dark:text-white">Süper Toto</div>
                                <div className="text-sm text-green-600 dark:text-green-400 font-mono mt-1">+{formatMoney(totalMonthlySponsorValue * 12 * 0.1)} / Yıl</div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

// Icons helper
const TicketIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>
);

const TrophyIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55-.47.98-.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
);

export default FinanceView;
