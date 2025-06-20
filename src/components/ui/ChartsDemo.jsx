import React from 'react';
import ChartContainer from './ChartContainer';
import AnimatedBarChart from './AnimatedBarChart';
import AnimatedPieChart from './AnimatedPieChart';
import AnimatedLineChart from './AnimatedLineChart';

const ChartsDemo = () => {
  // Dados de exemplo para o gráfico de barras
  const barData = [
    { label: 'Jan', leads: 120, spend: 5000, impressions: 50000 },
    { label: 'Fev', leads: 180, spend: 7500, impressions: 75000 },
    { label: 'Mar', leads: 150, spend: 6000, impressions: 60000 },
    { label: 'Abr', leads: 220, spend: 9000, impressions: 90000 },
    { label: 'Mai', leads: 280, spend: 12000, impressions: 120000 },
    { label: 'Jun', leads: 320, spend: 15000, impressions: 150000 },
  ];

  // Dados de exemplo para o gráfico de pizza
  const pieData = [
    { id: 'Test Drive', label: 'Test Drive', value: 45 },
    { id: 'Financiamento', label: 'Financiamento', value: 25 },
    { id: 'Orçamento', label: 'Orçamento', value: 20 },
    { id: 'Outros', label: 'Outros', value: 10 },
  ];

  // Dados de exemplo para o gráfico de linha
  const lineData = [
    {
      id: 'Leads',
      color: '#8A2BE2',
      data: [
        { x: 'Seg', y: 12 },
        { x: 'Ter', y: 18 },
        { x: 'Qua', y: 15 },
        { x: 'Qui', y: 22 },
        { x: 'Sex', y: 28 },
        { x: 'Sáb', y: 25 },
        { x: 'Dom', y: 20 },
      ],
    },
    {
      id: 'Investimento',
      color: '#00BFFF',
      data: [
        { x: 'Seg', y: 500 },
        { x: 'Ter', y: 750 },
        { x: 'Qua', y: 600 },
        { x: 'Qui', y: 900 },
        { x: 'Sex', y: 1200 },
        { x: 'Sáb', y: 1000 },
        { x: 'Dom', y: 800 },
      ],
    },
  ];

  return (
    <div className="p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 font-satoshi">
          Gráficos Animados
        </h1>
        <p className="text-gray-300 font-satoshi">
          Demonstração dos gráficos interativos com tema Apple Vision Pro + Baremetrics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Barras */}
        <ChartContainer
          title="Performance Semanal"
          subtitle="Leads, Investimento e Impressões"
          height={400}
          delay={0.1}
        >
          <AnimatedBarChart
            data={barData}
            keys={['leads', 'spend', 'impressions']}
            indexBy="label"
            height={300}
          />
        </ChartContainer>

        {/* Gráfico de Pizza */}
        <ChartContainer
          title="Distribuição de Leads"
          subtitle="Por tipo de interesse"
          height={400}
          delay={0.2}
        >
          <AnimatedPieChart
            data={pieData}
            height={300}
          />
        </ChartContainer>

        {/* Gráfico de Linha */}
        <ChartContainer
          title="Tendência Semanal"
          subtitle="Leads vs Investimento"
          height={400}
          delay={0.3}
          className="lg:col-span-2"
        >
          <AnimatedLineChart
            data={lineData}
            height={300}
          />
        </ChartContainer>
      </div>

      {/* Informações sobre os gráficos */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-2 font-satoshi">
            Gráfico de Barras
          </h3>
          <p className="text-gray-300 text-sm font-satoshi">
            Animações de entrada suaves, tooltips interativos e cores do tema aplicadas.
          </p>
        </div>

        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-2 font-satoshi">
            Gráfico de Pizza
          </h3>
          <p className="text-gray-300 text-sm font-satoshi">
            Rotação suave, legendas interativas e efeito de destaque ao hover.
          </p>
        </div>

        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-2 font-satoshi">
            Gráfico de Linha
          </h3>
          <p className="text-gray-300 text-sm font-satoshi">
            Animação de desenho da linha, área preenchida e pontos interativos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChartsDemo; 