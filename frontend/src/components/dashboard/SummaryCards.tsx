'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  TrendingUp,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import DashboardAPI from '@/services/dashboard.service';

interface SummaryCard {
  title: string;
  value: string | number;
  previousValue?: string | number;
  percentageChange?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

interface SummaryCardsProps {
  schoolId: string;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ schoolId }) => {
  const [cards, setCards] = useState<SummaryCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummaryCards();
  }, [schoolId]);

  const loadSummaryCards = async () => {
    try {
      setLoading(true);
      const response = await DashboardAPI.getSummaryCards(schoolId);
      
      // Map API response to card format
      const mappedCards: SummaryCard[] = response.map((card: any) => ({
        title: card.title,
        value: card.value,
        icon: getIconForCard(card.title),
        color: card.color || getColorForCard(card.title),
        trend: card.trend,
        percentageChange: card.percentageChange,
      }));

      setCards(mappedCards);
    } catch (error) {
      console.error('Error loading summary cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIconForCard = (title: string) => {
    switch (title) {
      case 'Admissions Today':
        return <Users className="h-6 w-6" />;
      case 'Fees Collected Today':
        return <DollarSign className="h-6 w-6" />;
      case 'Pending Enquiries':
        return <AlertCircle className="h-6 w-6" />;
      case 'Pending Fees':
        return <AlertCircle className="h-6 w-6" />;
      default:
        return <TrendingUp className="h-6 w-6" />;
    }
  };

  const getColorForCard = (title: string): string => {
    if (title.includes('Today')) return 'blue';
    if (title.includes('Fees Collected')) return 'green';
    if (title.includes('Pending')) return 'red';
    return 'blue';
  };

  const getCardBgClass = (color: string): string => {
    const colorMap: { [key: string]: string } = {
      blue: 'bg-blue-50 border-blue-200',
      green: 'bg-green-50 border-green-200',
      red: 'bg-red-50 border-red-200',
      orange: 'bg-orange-50 border-orange-200',
      purple: 'bg-purple-50 border-purple-200',
    };
    return colorMap[color] || colorMap.blue;
  };

  const getIconColorClass = (color: string): string => {
    const colorMap: { [key: string]: string } = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      red: 'text-red-600',
      orange: 'text-orange-600',
      purple: 'text-purple-600',
    };
    return colorMap[color] || colorMap.blue;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`rounded-lg border-2 p-6 transition-shadow hover:shadow-lg ${getCardBgClass(
            card.color,
          )}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {card.value}
              </p>
              {card.percentageChange && (
                <div className="mt-2 flex items-center text-sm">
                  <span
                    className={
                      card.percentageChange > 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    {card.percentageChange > 0 ? '+' : ''}
                    {card.percentageChange}%
                  </span>
                  <span className="ml-1 text-gray-500">from last period</span>
                </div>
              )}
            </div>
            <div
              className={`rounded-lg bg-white/50 p-3 ${getIconColorClass(
                card.color,
              )}`}
            >
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;
