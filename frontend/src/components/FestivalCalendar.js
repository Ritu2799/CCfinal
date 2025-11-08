import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, TrendingUp, Activity, Server, Sparkles } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

const FestivalCalendar = ({ selectedModel }) => {
  const [year, setYear] = useState('2025');
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFestival, setSelectedFestival] = useState(null);

  useEffect(() => {
    fetchFestivals(year);
  }, [year, selectedModel]);

  const fetchFestivals = async (yr) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/festivals/${yr}`, {
        params: { 
          model_name: selectedModel,
          include_predictions: false, // Fast mode - set to true for detailed 24h predictions
          summary_only: true // Ultra-fast mode - no predictions, just estimates from boost
        }
      });
      setFestivals(response.data.festivals || []);
    } catch (error) {
      console.error('Error fetching festivals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBoostColor = (boost) => {
    if (boost >= 4.0) return 'text-red-600 bg-red-50';
    if (boost >= 3.0) return 'text-orange-600 bg-orange-50';
    if (boost >= 2.5) return 'text-yellow-600 bg-yellow-50';
    return 'text-blue-600 bg-blue-50';
  };

  const getBoostLabel = (boost) => {
    if (boost >= 4.0) return 'Extreme Spike';
    if (boost >= 3.0) return 'High Spike';
    if (boost >= 2.5) return 'Medium Spike';
    return 'Normal Spike';
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card className="festival-calendar-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Festival Traffic Prediction Calendar
            </CardTitle>
            <CardDescription>
              Major Indian festivals with predicted traffic spikes
            </CardDescription>
          </div>
          <Tabs value={year} onValueChange={setYear}>
            <TabsList>
              <TabsTrigger value="2025">2025</TabsTrigger>
              <TabsTrigger value="2026">2026</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="spinner mx-auto mb-2"></div>
            <p className="text-gray-500">Loading festivals...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Festival Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {festivals.map((festival, idx) => (
                <Card
                  key={idx}
                  className={`festival-card cursor-pointer transition-all hover:shadow-lg ${
                    selectedFestival?.date === festival.date ? 'ring-2 ring-purple-500' : ''
                  }`}
                  onClick={() => setSelectedFestival(festival)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{festival.festival_name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(festival.date)}</span>
                          <Badge variant="outline" className="text-xs">{festival.day_of_week}</Badge>
                        </div>
                      </div>
                      <Badge className={`${getBoostColor(festival.boost)} border-0 font-semibold`}>
                        {festival.boost}x
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          Peak Load
                        </span>
                        <span className="font-bold text-red-600">{festival.peak_load}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Avg Load
                        </span>
                        <span className="font-semibold">{festival.avg_load}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Server className="h-3 w-3" />
                          Instances
                        </span>
                        <Badge variant="secondary">{festival.recommended_instances}</Badge>
                      </div>
                      
                      {festival.previous_year && (
                        <div className="pt-2 border-t">
                          <div className="text-xs text-gray-500 flex items-center justify-between">
                            <span>YoY Growth:</span>
                            <span className={`font-semibold ${
                              festival.previous_year.growth_rate > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {festival.previous_year.growth_rate > 0 ? '+' : ''}
                              {festival.previous_year.growth_rate}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <Badge className={`mt-3 w-full ${getBoostColor(festival.boost)} border-0 text-center`}>
                      {getBoostLabel(festival.boost)}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Selected Festival Details */}
            {selectedFestival && (
              <Card className="mt-6 border-purple-200 bg-purple-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      {selectedFestival.festival_name} - 24 Hour Traffic Pattern
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFestival(null)}
                    >
                      Close
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    {formatDate(selectedFestival.date)} • {selectedFestival.day_of_week} • {selectedFestival.boost}x Traffic Multiplier
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Peak Hour</div>
                      <div className="text-2xl font-bold text-purple-600">{selectedFestival.peak_hour}:00</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Peak Load</div>
                      <div className="text-2xl font-bold text-red-600">{selectedFestival.peak_load}</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Avg Load</div>
                      <div className="text-2xl font-bold text-blue-600">{selectedFestival.avg_load}</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Instances</div>
                      <div className="text-2xl font-bold text-green-600">{selectedFestival.recommended_instances}</div>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={selectedFestival.predictions.map((p, i) => ({
                      hour: `${p.hour}:00`,
                      load: Math.round(p.predicted_load)
                    }))}>
                      <defs>
                        <linearGradient id="festivalGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="hour" 
                        stroke="#6b7280"
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="load" 
                        stroke="#9333ea" 
                        strokeWidth={3}
                        fill="url(#festivalGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>

                  {selectedFestival.previous_year && (
                    <div className="mt-4 p-4 bg-white rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Year-over-Year Comparison
                      </h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Previous Year ({selectedFestival.previous_year.date})</div>
                          <div className="font-semibold">Peak: {selectedFestival.previous_year.peak_load}</div>
                          <div className="text-gray-600">Avg: {selectedFestival.previous_year.avg_load}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Current Year ({selectedFestival.date})</div>
                          <div className="font-semibold">Peak: {selectedFestival.peak_load}</div>
                          <div className="text-gray-600">Avg: {selectedFestival.avg_load}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Growth Rate</div>
                          <div className={`text-2xl font-bold ${
                            selectedFestival.previous_year.growth_rate > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {selectedFestival.previous_year.growth_rate > 0 ? '+' : ''}
                            {selectedFestival.previous_year.growth_rate}%
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FestivalCalendar;
